<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    $data = json_decode($_POST['data'], true) ?? null;

    // chatbot_ids'nin dizi olup olmadığını kontrol ediyoruz
    if (!$data || !isset($data['chatbot_ids']) || !is_array($data['chatbot_ids']) || !isset($data['user_id'])) {
        echo json_encode(["success" => false, "message" => "Geçersiz veri formatı veya eksik parametre!"]);
        exit;
    }

    try {
        $userId = (int)$data['user_id'];
        $chatbotIds = $data['chatbot_ids'];

        foreach ($chatbotIds as $id) {
            $botId = (int)$id;

            // 1. Botun sahibini güncelle
            $database->update('chatbotlar', ['owner_user_id' => $userId], "id = $botId");

            // 2. Satın alınan botu sepetten (DB) temizle
            $database->delete('user_cart', "chatbot_id = $botId AND user_id = $userId");
        }

        echo json_encode([
            "success" => true,
            "message" => "Tüm ürünler başarıyla satın alındı ve hesabınıza tanımlandı."
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "İşlem sırasında hata: " . $e->getMessage()
        ]);
    }
}
?>