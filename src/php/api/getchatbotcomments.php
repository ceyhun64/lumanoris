<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    $chatbotId = (int) $_GET['chatbot_id'];

    // Yorumları çekiyoruz
    $comments = $database->selectMulti("
        cc.id,
        cc.chatbot_id,
        cc.user_id,
        cc.comment,
        cc.commented_at,
        u.kullanici_adi
    FROM chatbot_comments cc
    JOIN kullanicilar u ON u.id = cc.user_id
    WHERE cc.chatbot_id = ?
    ORDER BY cc.id DESC
    ", [$chatbotId]);

    $commentCount = count($comments);

    // JSON olarak döndür
    $response = [
        "count" => $commentCount,
        "list" => $comments
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>