<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // userId kontrolü
    if (!isset($_GET['userId']) || empty($_GET['userId'])) {
        throw new Exception("Kullanıcı kimliği eksik.");
    }

    $userId = (int)$_GET['userId'];

    // Sadece iban sütununu seçiyoruz
    $query = "iban FROM banka_bilgileri WHERE user_id = $userId";
    $result = $database->selectSingle($query);

    // Eğer kayıt varsa sadece string olarak IBAN'ı, yoksa null dönüyoruz
    echo json_encode($result ? $result['iban'] : null);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}