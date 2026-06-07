<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';
require '../functions/checkout_payments.php';

$database = Database::getInstance();
$conn = $database->getConnection();
$data = json_decode($_POST['data'] ?? '', true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Eksik veri.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $orderId = trim((string)($data['order_id'] ?? ''));
    $detailId = isset($data['detail_id']) ? (int)$data['detail_id'] : 0;
    $requestedBy = isset($data['requested_by_user_id']) ? (int)$data['requested_by_user_id'] : null;
    $reason = trim((string)($data['reason'] ?? ''));

    if ($orderId === '') {
        throw new Exception('order_id zorunludur.');
    }

    $payment = $database->selectSingle('* FROM param_marketplace_payments WHERE order_id = ?', [$orderId]);
    if (!$payment) {
        throw new Exception('Ödeme kaydı bulunamadı.');
    }

    if ($payment['status'] !== 'paid') {
        throw new Exception('Sadece ödenmiş siparişler iade edilebilir. Mevcut durum: ' . $payment['status']);
    }

    if ($detailId > 0) {
        $details = $database->selectMulti(
            '* FROM param_marketplace_details WHERE id = ? AND payment_id = ?',
            [$detailId, (int)$payment['id']]
        );
    } else {
        $details = $database->selectMulti(
            '* FROM param_marketplace_details WHERE payment_id = ?',
            [(int)$payment['id']]
        );
    }

    if (empty($details)) {
        throw new Exception('İade edilecek detay kaydı bulunamadı.');
    }

    $param = new ParamPosMarketplace();
    $param->setOrderContext($orderId);

    // Param kuralı: aynı gün = IPTAL, farklı gün = IADE.
    $refundDurum = (date('Y-m-d') === date('Y-m-d', strtotime((string)$payment['created_at']))) ? 'IPTAL' : 'IADE';

    $results = [];
    $anyFailure = false;

    foreach ($details as $detail) {
        if ($detail['status'] === 'refunded' || $detail['status'] === 'cancelled') {
            $results[] = ['detail_id' => (int)$detail['id'], 'skipped' => true, 'reason' => 'Zaten iade edilmiş.'];
            continue;
        }

        if (empty($detail['pysiparis_guid'])) {
            $results[] = ['detail_id' => (int)$detail['id'], 'success' => false, 'message' => 'PYSiparis_GUID yok.'];
            $anyFailure = true;
            continue;
        }

        $cancel = $param->cancelOrRefund($detail['pysiparis_guid'], $orderId, $refundDurum);

        $refundStatus = $cancel['success'] ? 'completed' : 'failed';
        $database->insert('param_marketplace_refunds', [
            'payment_id' => (int)$payment['id'],
            'detail_id' => (int)$detail['id'],
            'pysiparis_guid' => $detail['pysiparis_guid'],
            'amount' => (float)$detail['payable_amount'],
            'reason' => $reason !== '' ? $reason : null,
            'requested_by_user_id' => $requestedBy,
            'status' => $refundStatus,
            'param_response_json' => json_encode($cancel['raw'] ?? [], JSON_UNESCAPED_UNICODE),
        ]);

        if ($cancel['success']) {
            $database->update('param_marketplace_details', [
                'status' => 'refunded',
                'refunded_at' => date('Y-m-d H:i:s'),
            ], 'id = ?', [(int)$detail['id']]);
        } else {
            $anyFailure = true;
            createMarketplaceAlert($database, 'refund_failed', 'critical', $orderId, (int)$payment['user_id'], (int)$detail['seller_user_id'],
                'İade başarısız: ' . ($cancel['message'] ?? ''),
                ['detail_id' => (int)$detail['id'], 'pysiparis_guid' => $detail['pysiparis_guid']]
            );
        }

        $results[] = [
            'detail_id' => (int)$detail['id'],
            'pysiparis_guid' => $detail['pysiparis_guid'],
            'success' => $cancel['success'],
            'message' => $cancel['message'],
        ];
    }

    $allRemaining = $database->selectMulti(
        'status FROM param_marketplace_details WHERE payment_id = ?',
        [(int)$payment['id']]
    );
    $allRefunded = !empty($allRemaining) && count(array_filter($allRemaining, fn($r) => in_array($r['status'], ['refunded', 'cancelled'], true))) === count($allRemaining);

    if ($allRefunded) {
        $database->update('param_marketplace_payments', ['status' => 'refunded'], 'order_id = ?', [$orderId]);
    } elseif (!$anyFailure && $detailId === 0) {
        $database->update('param_marketplace_payments', ['status' => 'partial_refund'], 'order_id = ?', [$orderId]);
    }

    echo json_encode([
        'success' => !$anyFailure,
        'message' => $anyFailure ? 'Bazı iadeler başarısız oldu.' : 'İade işlemi tamamlandı.',
        'results' => $results,
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
