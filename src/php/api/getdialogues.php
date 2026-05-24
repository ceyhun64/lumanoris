<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results = $database->selectMulti("
    udb.*,
    cc.chatbot_id AS conversation_chatbot_id,
    c.owner_user_id,
    c.isim AS chatbot_isim,
    c.kategori_id AS chatbot_kategori_id,
    c.profil_fotografi AS chatbot_profil_fotografi,
    k.kullanici_adi AS owner_kullanici_adi
    FROM user_dialog_books udb
    LEFT JOIN chatbot_conversations cc ON udb.chatbot_id = cc.id
    LEFT JOIN chatbotlar c ON cc.chatbot_id = c.id
    LEFT JOIN kullanicilar k ON c.owner_user_id = k.id
    ORDER BY RAND()
    LIMIT 100;
    ");

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}