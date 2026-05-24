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

    $user = $database->selectSingle(
        "avatar FROM kullanicilar WHERE id = ?",
        [$userId]
    );

    $avatar = preg_replace('/\s+/', '', $user['avatar']);


    if ($user && !empty($user['avatar'])) {
        echo json_encode([
            "success" => true,
            "avatar" => $avatar
        ], JSON_UNESCAPED_SLASHES);
    } else {
        echo json_encode([
            "success" => true,
            "avatar" => null
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>