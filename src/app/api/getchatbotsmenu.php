<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Sadece ID ve Türkçe isim çekiyoruz
    $results = $database->selectMulti("id, author_user_id, isim, kapak_fotografi, kategori_id FROM chatbotlar WHERE author_user_id = 1 OR owner_user_id = 1");

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>