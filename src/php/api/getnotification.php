<?php
header('Content-Type: application/json');
require '../functions/db.php'; 

// Not: Session veya Auth mekanizmandan user_id aldığını varsayıyorum. 
// Eğer query string ile geliyorsa: $userId = $_GET['user_id'];
$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "Kullanıcı ID gerekli."]);
    exit;
}

try {
    $database = Database::getInstance();
    
    // En yeni bildirimler en üstte olacak şekilde çekiyoruz
    $notifications = $database->selectMulti(
        "* FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", 
        [$userId]
    );

    echo json_encode([
        "success" => true,
        "data" => $notifications
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}