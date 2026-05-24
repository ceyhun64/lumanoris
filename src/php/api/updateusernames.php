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

    // Güncellenecek alanlar
    $adSoyad = $_POST['ad_soyad'] ?? null;
    $kullaniciAdi = $_POST['kullanici_adi'] ?? null;

    if (!$adSoyad && !$kullaniciAdi) {
        echo json_encode(["success" => false, "message" => "Güncellenecek alan bulunamadı!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Dinamik SQL oluştur
    $fields = [];
    $params = [];

    if ($adSoyad) {
        $fields[] = "ad_soyad = ?";
        $params[] = $adSoyad;
    }
    if ($kullaniciAdi) {
        $fields[] = "kullanici_adi = ?";
        $params[] = $kullaniciAdi;
    }

    $params[] = $userId;

    $sql = "UPDATE kullanicilar SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true, "message" => "Kullanıcı güncellendi."], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>