<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';

$database = Database::getInstance();

try {
    $rows = $database->selectMulti(
        'pms.id, pms.user_id, pms.guid_altuyeisyeri, pms.created_at, pms.updated_at,
         k.kullanici_adi, k.ad_soyad, k.eposta
         FROM param_marketplace_sellers pms
         LEFT JOIN kullanicilar k ON k.id = pms.user_id
         ORDER BY pms.created_at DESC',
        []
    );

    echo json_encode(['success' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
