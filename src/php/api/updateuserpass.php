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

    // Şifre girdileri
    $password        = $_POST['password'] ?? null;
    $passwordConfirm = $_POST['password_confirm'] ?? null;

    if (!$password || !$passwordConfirm) {
        echo json_encode(["success" => false, "message" => "Şifre ve doğrulama zorunludur!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($password !== $passwordConfirm) {
        echo json_encode(["success" => false, "message" => "Şifreler eşleşmiyor!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Şifreyi hashle (BCRYPT, cost=10)
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ["cost" => 10]);

    // Güncelleme
    $rowCount = $database->update(
        "kullanicilar",
        ["sifre" => $hashedPassword],
        "id = ?",
        [$userId]
    );

    if ($rowCount > 0) {
        echo json_encode(["success" => true, "message" => "Şifre güncellendi."], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["success" => false, "message" => "Şifre güncellenemedi veya kullanıcı bulunamadı."], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>