<?php
header('Content-Type: application/json; charset=utf-8');
set_time_limit(300);

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';
require '../functions/checkout_payments.php';

$cronSecret = $_ENV['PARAM_RECONCILE_SECRET'] ?? $_SERVER['PARAM_RECONCILE_SECRET'] ?? getenv('PARAM_RECONCILE_SECRET') ?: '';
$provided = $_GET['secret'] ?? $_POST['secret'] ?? $_SERVER['HTTP_X_RECONCILE_SECRET'] ?? '';

if ($cronSecret === '' || !hash_equals((string)$cronSecret, (string)$provided)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Yetkisiz.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$database = Database::getInstance();
$conn = $database->getConnection();

$maxAgeMinutes = (int)($_GET['min_age_minutes'] ?? 15);
$limit = (int)($_GET['limit'] ?? 50);
$limit = max(1, min(200, $limit));

try {
    $stalePayments = $database->selectMulti(
        '* FROM param_marketplace_payments
         WHERE status IN ("pending", "payment_started")
         AND created_at < (NOW() - INTERVAL ? MINUTE)
         ORDER BY created_at ASC
         LIMIT ' . $limit,
        [$maxAgeMinutes]
    );

    $param = new ParamPosMarketplace();
    $processed = [];

    foreach ($stalePayments as $payment) {
        $orderId = (string)$payment['order_id'];
        $param->setOrderContext($orderId);

        try {
            $query = $param->queryTransaction($orderId);
            $raw = $query['raw'] ?? [];

            $remoteStatus = strtolower((string)($raw['Islem_Durum'] ?? $raw['Durum'] ?? ''));
            $sonuc = (int)($raw['Sonuc'] ?? 0);
            $islemId = (string)($raw['Islem_ID'] ?? $payment['param_transaction_id'] ?? '');
            $dekontId = (string)($raw['Dekont_ID'] ?? '');
            $netAmount = isset($raw['Odeme_Tutari']) ? parseParamAmount((string)$raw['Odeme_Tutari']) : (float)$payment['amount'];

            $isPaidOnRemote = $sonuc > 0 && in_array($remoteStatus, ['onaylandi', 'basarili', 'success', 'paid', 'tamamlandi'], true);

            if ($isPaidOnRemote && $dekontId !== '') {
                finalizeSubscriptionPayment($database, $conn, $orderId, $dekontId, $islemId, $netAmount, ['reconciled' => true, 'remote' => $raw]);
                $processed[] = ['order_id' => $orderId, 'action' => 'finalized'];
                continue;
            }

            $ageMinutes = (int)((time() - strtotime($payment['created_at'])) / 60);
            if ($ageMinutes >= 60 && $sonuc <= 0) {
                $database->update('param_marketplace_payments', [
                    'status' => 'failed',
                    'callback_json' => json_encode(['reconciled_fail' => true, 'remote' => $raw], JSON_UNESCAPED_UNICODE),
                ], 'order_id = ?', [$orderId]);
                createMarketplaceAlert($database, 'reconcile_marked_failed', 'warning', $orderId, (int)$payment['user_id'], null,
                    'Sipariş 60dk+ pending, ParamPOS sorgusu başarı döndürmedi — failed olarak işaretlendi.',
                    ['remote' => $raw]
                );
                $processed[] = ['order_id' => $orderId, 'action' => 'marked_failed'];
                continue;
            }

            $processed[] = ['order_id' => $orderId, 'action' => 'still_pending', 'remote_status' => $remoteStatus, 'sonuc' => $sonuc];
        } catch (Throwable $e) {
            createMarketplaceAlert($database, 'reconcile_exception', 'warning', $orderId, null, null,
                'Reconcile sırasında istisna: ' . $e->getMessage(),
                ['payment_id' => (int)$payment['id']]
            );
            $processed[] = ['order_id' => $orderId, 'action' => 'error', 'message' => $e->getMessage()];
        }
    }

    echo json_encode([
        'success' => true,
        'scanned' => count($stalePayments),
        'processed' => $processed,
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

function parseParamAmount(string $amount): float
{
    $normalized = str_replace('.', '', $amount);
    $normalized = str_replace(',', '.', $normalized);
    return round((float)$normalized, 2);
}
