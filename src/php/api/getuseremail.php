<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // id zorunlu
    $userId = $_GET['id'] ?? null;
    if (!$userId) {
        echo json_encode(["success" => false, "message" => "ID bulunamadı!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Kullanıcı bilgisi
    $user = $database->selectSingle(
        "id, eposta FROM kullanicilar WHERE id = ?",
        [$userId]
    );

    if ($user) {
        echo json_encode([
            "success" => true,
            "id"      => $user['id'],
            "email"   => $user['eposta']
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["success" => false, "message" => "Kullanıcı bulunamadı."], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>