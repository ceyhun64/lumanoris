<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();

    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['id'])) {
        echo json_encode(["success" => false, "message" => "Veri veya ID bulunamadı!"]);
        exit;
    }

    try {
        $id = (int)$data['id'];
        
        // Güncellenecek veriler (user_id veya chatbot_id)
        $updateData = [];
        if(isset($data['user_id'])) $updateData['user_id'] = $data['user_id'];
        if(isset($data['chatbot_id'])) $updateData['chatbot_id'] = $data['chatbot_id'];
        if(isset($data['order_weeks'])) $updateData['order_weeks'] = $data['order_weeks'];

        $updated = $database->update('user_cart', $updateData, "id = $id");

        if ($updated) {
            echo json_encode([
                "success" => true,
                "message" => "Sepet başarıyla güncellendi!",
                "id" => $id
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Güncelleme başarısız veya değişiklik yok!"
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