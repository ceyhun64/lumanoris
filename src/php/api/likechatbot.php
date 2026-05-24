<?php
header('Content-Type: application/json');

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
        $existing = $database->selectSingle(
            "id FROM chatbot_likes WHERE user_id = ? AND chatbot_id = ?",
            [$userId, $chatbotId]
        );

        if ($existing) {
            // 2. Varsa → unlike (sil)
            $deleted = $database->delete(
                "chatbot_likes",
                "id = ?",
                [$existing['id']]
            );

            echo json_encode([
                "success" => true,
                "action" => "unliked",
                "deleted" => $deleted,
                "message" => "Like kaldırıldı."
            ]);
        } else {
            // 3. Yoksa → like (ekle)
            $insertedId = $database->insert("chatbot_likes", [
                "user_id" => $userId,
                "chatbot_id" => $chatbotId,
                "liked_at" => date("Y-m-d H:i:s")
            ]);

            // 4. Eğer dislike tablosunda kayıt varsa → sil
            $database->delete(
                "chatbot_dislikes",
                "user_id = ? AND chatbot_id = ?",
                [$userId, $chatbotId]
            );

            echo json_encode([
                "success" => true,
                "action" => "liked",
                "inserted_id" => $insertedId,
                "message" => "Like eklendi."
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
}
?>