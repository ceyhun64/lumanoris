<?php
header('Content-Type: application/json');

try {
    // Veritabanı bağlantısını dahil et
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // POST ile gelen ID'yi kontrol et
    if (!isset($_POST['id']) || empty($_POST['id'])) {
        throw new Exception("Silinecek chatbot ID'si belirtilmedi.");
    }

    $id = (int)$_POST['id'];
    $result = $database->delete('chatbotlar', "id = $id");

    echo json_encode([
        "success" => true,
        "message" => "Chatbot başarıyla silindi.",
        "deleted_id" => $id
    ]);

} catch (Exception $e) {
    // Hata durumunda 500 kodu ve hata mesajı döndür
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Silme işlemi sırasında hata oluştu: " . $e->getMessage()
    ]);
}
?>