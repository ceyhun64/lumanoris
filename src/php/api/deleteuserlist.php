<?php
header('Content-Type: application/json');

try {
    // Veritabanı bağlantısını dahil et
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // POST ile gelen ID'yi kontrol et
    if (!isset($_POST['id']) || empty($_POST['id'])) {
        throw new Exception("Silinecek liste ID'si belirtilmedi.");
    }

    $id = (int)$_POST['id'];

    // Önce user_lists tablosundan sil
    $resultList = $database->delete('user_lists', "id = $id");

    // Ardından chatbot_in_list tablosundan bu listeye bağlı chatbotları sil
    $resultChatbots = $database->delete('chatbot_in_list', "list_id = $id");

    echo json_encode([
        "success" => true,
        "message" => "Liste ve bağlı chatbotlar başarıyla silindi.",
        "deleted_id" => $id,
        "deleted_chatbots" => $resultChatbots // kaç satır silindiğini gösterebilir
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