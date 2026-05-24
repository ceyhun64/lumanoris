<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results = $database->selectMulti("id, kapak_fotografi, profil_fotografi, isim, yayimlanma_tarih FROM chatbotlar WHERE id > 0 ORDER BY id DESC"); //id = 0 Lumanoris.AI (genel asistan)

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}