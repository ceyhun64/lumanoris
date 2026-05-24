<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $bot_count = $database->selectMulti(
        "COUNT(*) FROM chatbot_in_list WHERE list_id = ?",
        [$_GET['list_id']]
    )[0]['COUNT(*)'];

    $bot_ids = $database->selectMulti(
        "chatbot_id FROM chatbot_in_list WHERE list_id = ?",
        [$_GET['list_id']]
    );

    $bots = [];
    $totalChats = 0;

    foreach ($bot_ids as $bot_id) {
        $bot_id = $bot_id['chatbot_id'];
        $results = $database->selectMulti("
            c.id,
            c.profil_fotografi,
            COUNT(cc.id) AS toplam_chats
        FROM chatbotlar c
        INNER JOIN param_marketplace_sellers pms
            ON pms.user_id = c.author_user_id AND pms.status = 'active'
        LEFT JOIN chatbot_chats cc ON cc.chatbot_id = c.id
        WHERE c.id = ?
        GROUP BY c.id
        ORDER BY c.id DESC
        ", [$bot_id]);

        if (empty($results)) {
            continue;
        }

        $bots[] = [
            'id' => $results[0]['id'],
            'profil_fotografi' => $results[0]['profil_fotografi']
        ];

        $totalChats += (int)$results[0]['toplam_chats'];
    }

    echo json_encode([
        'bot_count' => $bot_count,
        'bots' => $bots,
        'total_chats' => $totalChats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}