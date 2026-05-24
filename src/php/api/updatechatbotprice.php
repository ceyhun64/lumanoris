<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['id'])) {
        echo json_encode(["success" => false, "message" => "Veri veya Chatbot ID bulunamadı!"]);
        exit;
    }

    try {
        $id = (int)$data['id'];
        
        // Sadece ilgili sütunları güncelleyecek bir dizi hazırlıyoruz
        // Frontend'den gelen anahtar isimlerinin ucret_haftalik ve ucret_aylik olduğunu varsayıyoruz
        $updateData = [
            'ucret_haftalik' => $data['ucret_haftalik'],
            'ucret_aylik'    => $data['ucret_aylik']
        ];

        // functions/db.php içindeki update metodunu kullanıyoruz
        // update($table, $data, $where)
        $updated = $database->update('chatbotlar', $updateData, "id = $id");

        if ($updated) {
            echo json_encode([
                "success" => true,
                "message" => "Fiyatlar başarıyla güncellendi!",
                "id" => $id
            ]);
        } else {
            // Eğer veriler aynıysa update false dönebilir, bunu da kontrol edebilirsin
            echo json_encode([
                "success" => false, 
                "message" => "Güncelleme başarısız veya değişiklik yapılmadı."
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