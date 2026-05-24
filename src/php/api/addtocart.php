<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;
    
    if (!$data) {
        echo json_encode(["success" => false, "message" => "Veri bulunamadı!"]);
        exit;
    }

    try {
        $userId = $data['user_id'] ?? null;
        $chatbotId = $data['chatbot_id'] ?? null;
        $orderWeeks = $data['order_weeks'] ?? null;

        if (!$userId || !$chatbotId) {
            echo json_encode(["success" => false, "message" => "Eksik parametreler!"]);
            exit;
        }

        $sellerCheck = $database->selectSingle(
            "pms.status FROM param_marketplace_sellers pms
             JOIN chatbotlar c ON c.author_user_id = pms.user_id
             WHERE c.id = ?",
            [$chatbotId]
        );
        if (!$sellerCheck || ($sellerCheck['status'] ?? '') !== 'active') {
            echo json_encode([
                "success" => false,
                "code" => "SELLER_NOT_ACTIVE",
                "message" => "Bu chatbot şu anda satışa kapalı. Satıcısı henüz pazaryeri kaydını tamamlamamış."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $insertData = [
            'user_id' => $userId,
            'chatbot_id' => $chatbotId,
            'order_weeks' => $orderWeeks
        ];

        $insertedId = $database->insert('user_cart', $insertData);

        echo json_encode([
            "success" => true,
            "message" => "Ürün sepete eklendi",
            "id" => $insertedId
        ]);

    } catch (Exception $e) {
        // Eğer UNIQUE constraint (aynı ürünün tekrar eklenmesi) hatası alınırsa
        $message = (strpos($e->getMessage(), 'Duplicate entry') !== false) 
                   ? "Bu chatbot zaten sepetinizde bulunuyor." 
                   : "Hata: " . $e->getMessage();

        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $message
        ]);
    }
}
?>