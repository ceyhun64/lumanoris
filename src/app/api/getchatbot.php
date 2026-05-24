<?php

header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results = $database->selectMulti("id, isim, owner_user_id, aciklama, kapak_fotografi, profil_fotografi, style_prompt, sohbet_basi_mesaj, ucret_haftalik, ucret_aylik FROM chatbotlar WHERE id = ?", [$_GET['id']]);

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}