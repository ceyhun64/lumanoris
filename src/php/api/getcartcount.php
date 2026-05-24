<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    if (!isset($_GET['user_id'])) {
        throw new Exception("Kullanıcı ID belirtilmedi.");
    }

    $userId = (int)$_GET['user_id'];
    
    // Sadece count alıyoruz, selectSingle için SELECT kelimesini dışarıda bıraktım
    $query = "COUNT(*) as toplam FROM user_cart WHERE user_id = ?";
              
    $result = $database->selectSingle($query, [$userId]);

    echo json_encode([
        "success" => true,
        "count" => (int)($result['toplam'] ?? 0)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "count" => 0
    ]);
}
?>