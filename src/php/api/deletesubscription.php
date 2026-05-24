<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    $id = $_POST['id'] ?? null;
    if (!$id) {
        throw new Exception("Silinecek abonelik ID'si belirtilmedi.");
    }

    // Senin db sınıfındaki delete fonksiyonunu kullanıyoruz
    $result = $database->delete('user_subscriptions', "id = " . (int)$id);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Abonelik kaydı silindi."]);
    } else {
        echo json_encode(["success" => false, "message" => "Kayıt bulunamadı."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>