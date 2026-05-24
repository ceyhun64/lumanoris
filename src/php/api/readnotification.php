<?php
header('Content-Type: application/json');

require '../functions/db.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $database = Database::getInstance();
    
    // Gelen veriler: notification_id (zorunlu) ve user_id (güvenlik için)
    $data = json_decode($_POST['data'], true) ?? null;
    
    if (!$data || !isset($data['notification_id']) || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "notification_id ve user_id gereklidir."]);
        exit;
    }

    $notificationId = (int)$data['notification_id'];
    $userId = (int)$data['user_id'];
    
    try {
        // Güncelleme için tablo ve yeni değerler
        $updateData = [
            'is_read' => true
        ];

        // WHERE koşulları (Güvenlik için kullanıcının kendi bildirimini güncellediğinden emin olalım)
        $where = [
            'id' => $notificationId,
            'user_id' => $userId
        ];
        
        // Varsayalım ki Database sınıfınızda bir update metodu var:
        // $updatedRows = $database->update('notifications', $updateData, $where);
        
        // Eğer update metodu yoksa, doğrudan bir PDO sorgusu çalıştırmanız gerekebilir.
        // Örnekte, sizin insert'e benzeyen yapınızı kullanarak bir metot varsayıyorum:
        
        // Basitlik adına, eğer update metodunuz yoksa bu kısmı kendi DB sınıfınıza göre uyarlayın.
        // Aşağıdaki kısım, varsayımsal bir update metodunu kullanır.
        $updatedRows = $database->update('notifications', $updateData, $where); 

        if ($updatedRows > 0) {
            http_response_code(200);
            echo json_encode(["success" => true, "message" => "Bildirim durumu başarıyla güncellendi."]);
        } else {
             http_response_code(404);
             echo json_encode(["success" => false, "message" => "Bildirim bulunamadı veya zaten okunmuş durumda."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Sadece POST metodu kabul edilir."]);
}