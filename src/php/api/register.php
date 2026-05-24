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
        $username = $data['kullanici_adi'] ?? null;
        $email    = $data['eposta'] ?? null;

        // Önce kontrol yapıyoruz
        $existing = $database->selectSingle(
            "id FROM kullanicilar WHERE kullanici_adi = ? OR eposta = ?",
            [$username, $email]
        );

        if ($existing) {
            echo json_encode([
                "success" => false,
                "message" => "Bu kullanıcı adı veya e-posta zaten kayıtlı!"
            ]);
            exit;
        }

        // DB Tablo adı ve kayıt (insert fonksiyonunu kullanıyoruz)
        $insertedId = $database->insert('kullanicilar', $data);

        // Yeni tabloya da e-posta ekliyoruz
        $database->insert('user_emails', [
            'user_id' => $insertedId,
            'email'   => $email
        ]);

        $database->insert("chatbot_follows", [
                "user_id" => $insertedId,
                "chatbot_id" => 0,
                "followed_at" => date("Y-m-d H:i:s")
            ]);

        echo json_encode([
            "success" => true,
            "message" => "Kayıt başarılı!",
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