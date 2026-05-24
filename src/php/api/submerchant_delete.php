<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Geçersiz istek yöntemi.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require '../functions/db.php';
require '../functions/ParamPosMarketplace.php';

$database = Database::getInstance();
$data = json_decode($_POST['data'] ?? '', true);

if (!$data || empty($data['guid_altuyeisyeri'])) {
    echo json_encode(['success' => false, 'message' => 'GUID_AltUyeIsyeri zorunludur.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $guid = $data['guid_altuyeisyeri'];

    $param = new ParamPosMarketplace();
    $result = $param->deleteSubMerchant($guid);

    if (!$result['success']) {
        throw new Exception('ParamPOS hatası: ' . $result['message']);
    }

    if (!empty($data['user_id'])) {
        $database->delete('param_marketplace_sellers', 'user_id = ?', [(int)$data['user_id']]);
    } else {
        $database->delete('param_marketplace_sellers', 'guid_altuyeisyeri = ?', [$guid]);
    }

    echo json_encode(['success' => true, 'message' => 'Alt üye işyeri silindi.'], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
