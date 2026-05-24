<?php
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../functions/db.php';
    $database = Database::getInstance();
    
    $results = $database->getGlobalVars('kullanim_kosullari');
    
    // ✅ Return wrapped structure
    echo json_encode([
        "success" => true,
        "data" => $results
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}