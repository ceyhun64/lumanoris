<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;
    
    if (!$data) {
        echo json_encode(["success" => false, "message" => "Veri bulunamadı!"]);
        exit;
    }

    try {
        // DB Tablo adı ve kayıt (verdiğin fonksiyonu kullanıyoruz)
        $insertedId = $database->insert('chatbot_conversations', $data);

        echo json_encode([
            "success" => true,
            "message" => "Yeni sohbet başarıyla başlatıldı!",
            "id" => $insertedId
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