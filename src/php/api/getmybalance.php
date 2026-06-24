<?php
header('Content-Type: application/json');
require '../functions/db.php';

try {
    $database = Database::getInstance();
    $userId = (int)($_GET['user_id'] ?? 0);

    if ($userId <= 0) {
        echo json_encode(["success" => false, "message" => "Eksik parametre."]);
        exit;
    }

    // Satıcı geliri: onaylanmış / iade edilmiş alt üye sipariş detayları.
    $incomeRows = $database->selectMulti(
        "d.payable_amount, d.status, d.created_at, p.order_id
         FROM param_marketplace_details d
         JOIN param_marketplace_payments p ON p.id = d.payment_id
         WHERE d.seller_user_id = ?
         ORDER BY d.created_at DESC",
        [$userId]
    );

    // Para çekme talepleri. Tablo kolon şeması garanti değil → SELECT *.
    // Tablo yoksa/kolon farklıysa gelir verisini düşürme; çekimleri boş geç.
    $withdrawRows = [];
    try {
        $withdrawRows = $database->selectMulti(
            "* FROM para_cekme_talepleri WHERE user_id = ? ORDER BY id DESC",
            [$userId]
        );
    } catch (Exception $we) {
        error_log('[getmybalance] para_cekme_talepleri okunamadı: ' . $we->getMessage());
    }

    $transactions = [];
    $balance = 0.0;

    foreach ($incomeRows as $r) {
        $amount = (float)$r['payable_amount'];
        if ($r['status'] === 'approved') {
            $balance += $amount;
            $transactions[] = [
                'amount'      => $amount,
                'type'        => 'income',
                'status'      => $r['status'],
                'created_at'  => $r['created_at'],
                'description' => 'Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı. #' . $r['order_id'],
            ];
        } elseif ($r['status'] === 'refunded') {
            $balance -= $amount;
            $transactions[] = [
                'amount'      => -$amount,
                'type'        => 'refund',
                'status'      => $r['status'],
                'created_at'  => $r['created_at'],
                'description' => 'Satış iadesi işlendi. #' . $r['order_id'],
            ];
        }
    }

    foreach ($withdrawRows as $w) {
        $amount = (float)($w['miktar'] ?? 0);
        $durum = (string)($w['durum'] ?? '');
        // Reddedilmeyen çekimler kullanılabilir bakiyeden düşülür.
        if ($durum !== 'reddedildi' && $durum !== 'iptal') {
            $balance -= $amount;
        }
        $transactions[] = [
            'amount'      => -$amount,
            'type'        => 'withdrawal',
            'status'      => $durum,
            'created_at'  => $w['created_at'] ?? null,
            'description' => 'Para çekme talebi (' . ($durum !== '' ? $durum : 'beklemede') . ')',
        ];
    }

    // En yeni işlem en üstte.
    usort($transactions, static function ($a, $b) {
        return strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });

    echo json_encode([
        'success'      => true,
        'balance'      => round($balance, 2),
        'transactions' => $transactions,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
