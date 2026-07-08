<?php
require '../../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Geçersiz istek metodu."]);
    exit;
}

// Tüm gelen POST verilerini filtrele
$updateData = [];
foreach ($_POST as $key => $value) {
    // CSRF token gibi özel alanları dışla
    if ($key === 'csrf_token') continue;
    $updateData[$key] = $value;
}

if (!empty($_FILES)) {
    $uploadDir = '../../assets/img/global/'; // Resimlerin kaydedileceği klasör
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowedImageExt = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

    foreach ($_FILES as $key => $file) {
        if ($file['error'] === UPLOAD_ERR_OK) {
            $fileName = time() . '_' . basename($file['name']);
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedImageExt)) {
                continue;
            }
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Veritabanına kaydedilecek dosya yolunu (string) diziye ekle
                // Burada veritabanındaki var_key değerinin HTML formundaki name ile aynı olması önemli
                $updateData[$key] = 'assets/img/global/' . $fileName;
            }
        }
    }
}

// Eğer güncellenecek veri yoksa hata ver
if (empty($updateData)) {
    echo json_encode(["status" => "error", "message" => "Güncellenecek veri bulunamadı."]);
    exit;
}

// updateGlobalVars fonksiyonunu çağır
$resultMessage = $database->updateGlobalVars($updateData);

// Yanıtı hazırla
if (strpos($resultMessage, 'başarılı') !== false) {
    echo json_encode([
        "status" => "success",
        "message" => "İçerikler başarıyla güncellendi!"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Güncelleme sırasında hata oluştu: " . $resultMessage
    ]);
}
?>