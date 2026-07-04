<?php
header('Content-Type: application/json');
require '../../php/functions/db.php';

try {
    $database = Database::getInstance();
    $userId = $_GET['userId'] ?? null;
    
    if (!$userId) {
        throw new Exception("User ID gerekli");
    }
    
    $user = $database->selectSingle(
        "account_type, full_name, authorized_first_name, authorized_last_name, company_title, tax_number, tax_office, id_number, phone, iban, mahalle, cadde, sokak, bina_no, kapi_no, posta_kodu, address, il, ilce FROM kullanicilar WHERE id = ?",
        [$userId]
    );
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(null);
        exit;
    }
    
    echo json_encode($user, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
