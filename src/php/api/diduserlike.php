<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['user_id']) || !isset($data['chatbot_id'])) {
        echo json_encode(["success" => false, "message" => "Eksik veri!"]);
        exit;
    }

    $userId = (int)$data['user_id'];
    $chatbotId = (int)$data['chatbot_id'];

    try {
        // 1. Like tablosunda kayıt var mı?
        $existingLike = $database->selectSingle(
            "id FROM chatbot_likes WHERE user_id = ? AND chatbot_id = ?",
            [$userId, $chatbotId]
        );

        $didLike = $existingLike ? true : false;

        echo json_encode([
            "success" => true,
            "didLike" => $didLike
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
}
?>