<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $data = json_decode($_POST['data'], true) ?? null;
    if (!$data || !isset($data['user_id'])) {
        echo json_encode(["success" => false, "message" => "Eksik veri!"]);
        exit;
    }

    $userId = (int)$data['user_id'];

    $results = $database->selectMulti("
        c.id,
        c.isim,
        c.aciklama,
        c.profil_fotografi
    FROM chatbot_follows f
    INNER JOIN chatbotlar c ON c.id = f.chatbot_id
    INNER JOIN param_marketplace_sellers pms
        ON pms.user_id = c.author_user_id AND pms.status = 'active'
    WHERE f.user_id = ?
    ORDER BY c.id DESC
    ", [$userId]);

    echo json_encode([
        "success" => true,
        "chatbots" => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>