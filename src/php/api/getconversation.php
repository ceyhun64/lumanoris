<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    if(isset($_GET['convId']))
    {
        $results = $database->selectSingle("id, conversation_name FROM chatbot_conversations WHERE id = ?",[$_GET['convId']]);
        if(empty($results)) {
            $results = $database->selectSingle(
                "id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
                [$_GET['chatbot_id'], $_GET['user_id']]
            );
            if (empty($results)) {
                $results = [
                    [
                        "id" => 0,
                        "conversation_name" => "Yeni Sohbet"
                    ]
                ];
            }
        }
    }
    else
    {
        $results = $database->selectSingle(
                "id, chatbot_id, conversation_name FROM chatbot_conversations WHERE chatbot_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
                [$_GET['chatbot_id'], $_GET['user_id']]
            );
            if (empty($results)) {
                $results = [
                    [
                        "id" => 0,
                        "conversation_name" => "Yeni Sohbet"
                    ]
                ];
            }
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}