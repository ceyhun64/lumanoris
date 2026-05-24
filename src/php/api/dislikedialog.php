<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['user_id']) || !isset($data['dialog_id'])) {
        echo json_encode(["success" => false, "message" => "Eksik veri!"]);
        exit;
    }

    $userId = (int)$data['user_id'];
    $chatbotId = (int)$data['dialog_id'];

    try {
        // 1. Dislike tablosunda kayıt var mı?
        $existing = $database->selectSingle(
            "id FROM dialog_dislikes WHERE user_id = ? AND dialog_id = ?",
            [$userId, $chatbotId]
        );

        if ($existing) {
            // 2. Varsa → undislike (sil)
            $deleted = $database->delete(
                "dialog_dislikes",
                "id = ?",
                [$existing['id']]
            );

            echo json_encode([
                "success" => true,
                "action" => "undisliked",
                "deleted" => $deleted,
                "message" => "Dislike kaldırıldı."
            ]);
        } else {
            // 3. Yoksa → dislike (ekle)
            $insertedId = $database->insert("dialog_dislikes", [
                "user_id" => $userId,
                "dialog_id" => $chatbotId,
                "disliked_at" => date("Y-m-d H:i:s")
            ]);

            // 4. Eğer like tablosunda kayıt varsa → sil
            $database->delete(
                "dialog_likes",
                "user_id = ? AND dialog_id = ?",
                [$userId, $chatbotId]
            );

            echo json_encode([
                "success" => true,
                "action" => "disliked",
                "inserted_id" => $insertedId,
                "message" => "Dislike eklendi."
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