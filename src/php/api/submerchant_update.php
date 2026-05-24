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
    $paramParams = ['GUID_AltUyeIsyeri' => $data['guid_altuyeisyeri']];

    $optionals = ['Ad_Soyad', 'GSM_No', 'IBAN_No', 'IBAN_Unvan', 'Adres', 'Il', 'Ilce', 'EPosta', 'Website', 'MCC_Kod', 'Vergi_Daire'];
    foreach ($optionals as $field) {
        $key = strtolower($field);
        if (!empty($data[$key])) {
            $paramParams[$field] = $data[$key];
        }
    }

    $param = new ParamPosMarketplace();
    $result = $param->updateSubMerchant($paramParams);

    if (!$result['success']) {
        throw new Exception('ParamPOS hatası: ' . $result['message']);
    }

    echo json_encode(['success' => true, 'message' => 'Alt üye işyeri güncellendi.'], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
