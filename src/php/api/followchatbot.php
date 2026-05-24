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
            "id FROM chatbot_follows WHERE user_id = ? AND chatbot_id = ?",
            [$userId, $chatbotId]
        );

        if ($existing) {
            // 2. Varsa → unlike (sil)
            $deleted = $database->delete(
                "chatbot_follows",
                "id = ?",
                [$existing['id']]
            );

            echo json_encode([
                "success" => true,
                "action" => "unfollowed",
                "deleted" => $deleted,
                "message" => "Follow kaldırıldı."
            ]);
        } else {
            // 3. Yoksa → like (ekle)
            $insertedId = $database->insert("chatbot_follows", [
                "user_id" => $userId,
                "chatbot_id" => $chatbotId,
                "followed_at" => date("Y-m-d H:i:s")
            ]);
            

            echo json_encode([
                "success" => true,
                "action" => "follow",
                "inserted_id" => $insertedId,
                "message" => "Follow eklendi."
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