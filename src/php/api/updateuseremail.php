<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // id zorunlu
    $userId = $_POST['id'] ?? null;
    if (!$userId) {
        echo json_encode(["success" => false, "message" => "ID bulunamadı!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Yeni e-posta
    $newEmail = $_POST['email'] ?? null;
    if (!$newEmail) {
        echo json_encode(["success" => false, "message" => "Yeni e-posta adresi zorunludur!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Güncelleme
    $rowCount = $database->update(
        "kullanicilar",
        ["eposta" => $newEmail],
        "id = ?",
        [$userId]
    );

    if ($rowCount > 0) {
        echo json_encode(["success" => true, "message" => "E-posta güncellendi."], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["success" => false, "message" => "E-posta güncellenemedi veya kullanıcı bulunamadı."], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>