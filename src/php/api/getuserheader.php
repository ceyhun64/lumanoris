<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        echo json_encode(["success" => false, "message" => "ID bulunamadı!"]);
        exit;
    }

    // Kullanıcı bilgilerini al
    $user = $database->selectSingle(
        "id, ad_soyad, kullanici_adi FROM kullanicilar WHERE id = ?",
        [$userId]
    );

    if (!$user) {
        echo json_encode(["success" => false, "message" => "Kullanıcı bulunamadı!"]);
        exit;
    }

    // Chatbot sayısını al
    $chatbotCount = $database->selectSingle(
        "COUNT(*) as total FROM chatbotlar WHERE author_user_id = ?",
        [$userId]
    );

    // JSON çıktısı
    echo json_encode([
        "success" => true,
        "id" => $user['id'],
        "fullname" => $user['ad_soyad'],
        "username" => $user['kullanici_adi'],
        "chatbotCount" => $chatbotCount['total']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>