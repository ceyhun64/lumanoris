<?php
header('Content-Type: application/json');
require '../functions/db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $database = Database::getInstance();
    $data = json_decode($_POST['data'], true);
    
    if (!$data || !isset($data['user_id'])) {
        echo json_encode(["success" => false, "message" => "Eksik veri!"]);
        exit;
    }

    try {
        $userId = (int)$data['user_id'];
        // Mevcut kayıt var mı kontrol et
        $exists = $database->selectSingle("user_id FROM banka_bilgileri WHERE user_id = $userId");

        if ($exists) {
            // Güncelleme
            $database->update('banka_bilgileri', $data, "user_id = $userId");
            $message = "Bilgiler güncellendi";
        } else {
            // Yeni Kayıt
            $database->insert('banka_bilgileri', $data);
            $message = "Bilgiler kaydedildi";
        }

        echo json_encode(["success" => true, "message" => $message]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}