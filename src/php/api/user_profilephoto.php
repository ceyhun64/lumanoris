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
        $userId = $data['id'] ?? null;
        $avatar = $data['avatar'] ?? null; // base64 string

        if (!$userId || !$avatar) {
            echo json_encode(["success" => false, "message" => "Eksik alanlar!"]);
            exit;
        }

        // Update işlemi
        $affectedRows = $database->update(
            'kullanicilar',
            ['avatar' => $avatar],
            "id = ?",
            [$userId]
        );

        if ($affectedRows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Profil fotoğrafı güncellendi.",
                "user_id" => $userId
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Güncelleme yapılamadı veya değişiklik yok."
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