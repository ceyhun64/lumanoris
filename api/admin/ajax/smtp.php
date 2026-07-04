<?php
// Gerekli dosyaları dahil et
require '../../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

session_start();
header('Content-Type: application/json');

// POST isteği kontrolü
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Geçersiz istek metodu."]);
    exit;
}

$updateData = [
    'smtp_host' => $_POST['smtp_host'] ?? '',
    'smtp_email' => $_POST['smtp_email'] ?? '',
    'smtp_pass' => $_POST['smtp_pass'] ?? '',
    'smtp_name' => $_POST['smtp_name'] ?? ''
];

// updateGlobalVars fonksiyonunu çağır
// Fonksiyonun 'Güncelleme işlemi başarılı!' veya 'Güncelleme başarısız oldu: ...' şeklinde string döndürdüğünü varsayıyoruz.
$resultMessage = $database->updateGlobalVars($updateData);

// Yanıtı, fonksiyonun döndürdüğü stringe göre hazırla
if (strpos($resultMessage, 'başarılı') !== false) {
    echo json_encode([
        "status" => "success",
        "message" => "SMTP ayarları başarıyla güncellendi!" // UI için daha temiz bir mesaj
    ]);
} else {
    // Fonksiyonun hata mesajını döndür
    echo json_encode([
        "status" => "error",
        "message" => $resultMessage // Fonksiyondan gelen detaylı hata mesajı
    ]);
}
?>