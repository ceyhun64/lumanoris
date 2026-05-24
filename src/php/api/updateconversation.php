<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['id'])) {
        echo json_encode(["success" => false, "message" => "Veri veya ID bulunamadı!"]);
        exit;
    }

    try {
        
        $id = $data['id'];
        // Güncelleme işlemi (functions/db.php içindeki update fonksiyonunu kullanıyoruz)
        $updated = $database->update('chatbot_conversations', $data,"id = $id");

        if ($updated) {
            echo json_encode([
                "success" => true,
                "message" => "Sohbet başarıyla güncellendi!",
                "id" => $data['id']
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Güncelleme başarısız!"
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