<?php
require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';
require '../functions/checkout_payments.php';

$database = Database::getInstance();
$conn = $database->getConnection();
$param = new ParamPosMarketplace();

try {
    ensureParamMarketplaceTables($conn);

    $orderId = (string)($_POST['TURKPOS_RETVAL_Siparis_ID'] ?? $_GET['order_id'] ?? '');
    if ($orderId === '') {
        throw new Exception('Sipariş ID bulunamadı.');
    }

    $success = (int)($_POST['TURKPOS_RETVAL_Sonuc'] ?? 0) > 0
        && (int)($_POST['TURKPOS_RETVAL_Dekont_ID'] ?? 0) > 0;

    if (!$success) {
        $database->update('param_marketplace_payments', [
            'status' => 'failed',
            'callback_json' => json_encode($_POST, JSON_UNESCAPED_UNICODE),
        ], 'order_id = ?', [$orderId]);

        createMarketplaceAlert($database, 'payment_failed', 'warning', $orderId, null, null,
            'ParamPOS callback başarısız sonuç döndü.',
            ['hata_kod' => $_POST['TURKPOS_RETVAL_Hata_Kod'] ?? null, 'hata_msj' => $_POST['TURKPOS_RETVAL_Hata_Aciklama'] ?? null]
        );

        redirectCheckout('failed', $orderId,
            (string)($_POST['TURKPOS_RETVAL_Hata_Kod'] ?? ''),
            (string)($_POST['TURKPOS_RETVAL_Hata_Aciklama'] ?? '')
        );
    }

    if (!$param->verifyCallbackHash($_POST)) {
        $database->update('param_marketplace_payments', [
            'status' => 'hash_failed',
            'callback_json' => json_encode($_POST, JSON_UNESCAPED_UNICODE),
        ], 'order_id = ?', [$orderId]);

        createMarketplaceAlert($database, 'hash_failed', 'critical', $orderId, null, null,
            'Callback hash doğrulaması başarısız — ödeme alındı fakat abonelik oluşturulmadı. Manuel müdahale gerekiyor.',
            [
                'dekont_id' => $_POST['TURKPOS_RETVAL_Dekont_ID'] ?? null,
                'islem_id' => $_POST['TURKPOS_RETVAL_Islem_ID'] ?? null,
                'odeme_tutari' => $_POST['TURKPOS_RETVAL_Odeme_Tutari'] ?? null,
                'tahsilat_tutari' => $_POST['TURKPOS_RETVAL_Tahsilat_Tutari'] ?? null,
                'received_hash' => $_POST['TURKPOS_RETVAL_Hash'] ?? null,
            ]
        );

        redirectCheckout('hash_failed', $orderId, 'HASH_MISMATCH',
            'Güvenlik doğrulaması başarısız oldu.'
        );
    }

    $receiptId = (string)($_POST['TURKPOS_RETVAL_Dekont_ID'] ?? '');
    $islemId = (string)($_POST['TURKPOS_RETVAL_Islem_ID'] ?? '');
    $netAmount = parseParamAmount((string)($_POST['TURKPOS_RETVAL_Odeme_Tutari'] ?? $_POST['TURKPOS_RETVAL_Tahsilat_Tutari'] ?? '0'));

    finalizeSubscriptionPayment($database, $conn, $orderId, $receiptId, $islemId, $netAmount, $_POST);
    redirectCheckout('success', $orderId);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log('ParamPOS callback error: ' . $e->getMessage());
    redirectCheckout('error', $orderId ?? '', 'EXCEPTION', $e->getMessage());
}

function parseParamAmount(string $amount): float
{
    $normalized = str_replace('.', '', $amount);
    $normalized = str_replace(',', '.', $normalized);
    return round((float)$normalized, 2);
}

function redirectCheckout(string $status, string $orderId, string $code = '', string $msg = ''): void
{
    $target = '/payment-result.php?payment=' . urlencode($status);
    if ($orderId !== '') {
        $target .= '&order_id=' . urlencode($orderId);
    }
    if ($code !== '') {
        $target .= '&code=' . urlencode($code);
    }
    if ($msg !== '') {
        $clean = mb_substr(strip_tags($msg), 0, 200);
        $target .= '&msg=' . urlencode($clean);
    }

    header('Location: ' . $target, true, 302);
    exit;
}

?>
