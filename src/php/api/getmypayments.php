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

    // Kullanıcının yaptığı ödemeler (alıcı). Sadece tamamlanmış / iade edilmiş kayıtlar.
    $rows = $database->selectMulti(
        "order_id, status, amount, product_amount, service_fee, items_json, created_at
         FROM param_marketplace_payments
         WHERE user_id = ? AND status IN ('paid', 'refunded', 'partial_refund')
         ORDER BY created_at DESC",
        [$userId]
    );

    $payments = [];
    foreach ($rows as $row) {
        $items = json_decode($row['items_json'] ?? '[]', true) ?: [];
        $titles = array_values(array_filter(array_map(static function ($i) {
            return $i['title'] ?? null;
        }, $items)));

        $payments[] = [
            'order_id'       => $row['order_id'],
            'status'         => $row['status'],
            'amount'         => (float)$row['amount'],
            'product_amount' => (float)$row['product_amount'],
            'service_fee'    => (float)$row['service_fee'],
            'created_at'     => $row['created_at'],
            'titles'         => $titles,
        ];
    }

    echo json_encode($payments);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
