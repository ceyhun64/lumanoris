<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $results = $database->selectMulti("
        cc.id,
        cc.chatbot_id,
        cc.conversation_name,
        cb.profil_fotografi,
        (
            SELECT
                bc_inner.message
            FROM
                chatbot_chats bc_inner
            WHERE
                bc_inner.chatbot_id = cc.id
            ORDER BY
                bc_inner.sent_time DESC
            LIMIT 1
        ) AS latest_message,
        (
            -- En son sent_time'ı getirir
            SELECT
                bc_inner.sent_time
            FROM
                chatbot_chats bc_inner
            WHERE
                bc_inner.chatbot_id = cc.id
            ORDER BY
                bc_inner.sent_time DESC
            LIMIT 1
        ) AS latest_sent_time
    FROM
        chatbot_conversations cc
    INNER JOIN
        chatbotlar cb ON cc.chatbot_id = cb.id
    WHERE
        cc.user_id = ? ORDER BY cc.id DESC;",[$_GET['user_id']]);

    echo json_encode([
        "success" => true,
        "message" => "ok",
        "results" => $results
    ]);
    //echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}