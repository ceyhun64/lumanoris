<?php
header('Content-Type: application/json');
require '../functions/db.php';

try {
    $database = Database::getInstance();
    $userId = (int)$_GET['userId'];

    $result = $database->selectSingle("* FROM banka_bilgileri WHERE user_id = $userId");
    
    // Eğer kayıt varsa ilk satırı döndür, yoksa boş obje
    echo json_encode($result ? $result : null);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}