<?php
header('Content-Type: application/json');
require '../functions/db.php';

try {
    $database = Database::getInstance();
    $userId = $_GET['user_id'] ?? null;
    $chatbotId = $_GET['chatbot_id'] ?? null;

    if (!$userId || !$chatbotId) {
        echo json_encode(["success" => false, "message" => "Eksik parametre."]);
        exit;
    }

    // Aktif ve süresi dolmamış bir abonelik var mı?
    $sub = $database->selectSingle(
        "id, expiry_date FROM user_subscriptions 
         WHERE user_id = ? AND chatbot_id = ? AND status = 1 AND expiry_date > NOW() 
         ORDER BY expiry_date DESC LIMIT 1",
        [$userId, $chatbotId]
    );

    if ($sub) {
        echo json_encode([
            "success" => true,
            "has_active_sub" => true,
            "expiry_date" => $sub['expiry_date']
        ]);
    } else {
        echo json_encode(["success" => true, "has_active_sub" => false]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}