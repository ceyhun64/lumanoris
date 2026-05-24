<?php
header('Content-Type: application/json');

// Gerekli kütüphaneyi dahil et
require '../functions/db.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $database = Database::getInstance();
    
    // Frontend'den gelen JSON string'i çözüyoruz (Örnekteki gibi $_POST['data'] varsayımıyla)
    $data = json_decode($_POST['data'], true) ?? null;
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Veri bulunamadı veya geçersiz formatta!"]);
        exit;
    }

    // Gerekli alanların kontrolü (Basit bir kontrol)
    if (!isset($data['user_id'], $data['type'], $data['title_tr'], $data['title_en'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Zorunlu alanlar eksik: user_id, type, title_tr, title_en"]);
        exit;
    }

    // Varsayılan değerleri ekleyelim (Eğer frontend göndermiyorsa)
    $data['is_read'] = $data['is_read'] ?? false; // Boolean olarak ayarla

    try {
        // DB Tablo adı: 'notifications'
        // $data içindeki anahtarların tablo sütun isimleriyle eşleştiğini varsayıyoruz.
        $insertedId = $database->insert('notifications', $data);

        if ($insertedId) {
            http_response_code(201); // Created
            echo json_encode([
                "success" => true,
                "message" => "Bildirim başarıyla oluşturuldu.",
                "id" => $insertedId
            ]);
        } else {
             http_response_code(500);
             echo json_encode(["success" => false, "message" => "Veritabanı kaydı başarısız oldu."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Sadece POST metodu kabul edilir."]);
}
?>
