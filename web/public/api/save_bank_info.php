<?php
header('Content-Type: application/json');
require '../../php/functions/db.php';

try {
    $database = Database::getInstance();
    
    $input = json_decode($_POST['data'] ?? '{}', true);
    $userId = $input['user_id'] ?? null;
    
    if (!$userId) {
        throw new Exception("User ID gerekli");
    }
    
    unset($input['user_id']); // Update'te kullanma
    
    $affected = $database->update(
        'kullanicilar',
        $input,
        'id = ?',
        [$userId]
    );
    
    echo json_encode([
        "success" => $affected > 0,
        "message" => $affected > 0 ? "Başarıyla güncellendi" : "Değişiklik yok",
        "affected" => $affected
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
