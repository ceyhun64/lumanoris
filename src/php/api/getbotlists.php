<?php
header('Content-Type: application/json');
require '../functions/db.php';

try {
    $database = Database::getInstance();
    $userId = $_GET['userId'];
    $botId = $_GET['botId'];

    // Kullanıcının tüm listelerini getir ve bu botun o listede olup olmadığını kontrol et
    $lists = $database->selectMulti("
        ul.id, ul.name, 
               (SELECT COUNT(*) FROM chatbot_in_list cil WHERE cil.list_id = ul.id AND cil.chatbot_id = ?) as is_in_list
        FROM user_lists ul
        WHERE ul.user_id = ?
    ", [$botId, $userId]);

    echo json_encode(["success" => true, "lists" => $lists]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}