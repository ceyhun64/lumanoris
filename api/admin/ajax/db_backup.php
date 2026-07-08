<?php
session_start();
if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Yetkisiz erişim."]);
    exit;
}

require '../../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

$response = [];

try {
    if ($_GET['mode'] == 'backup') {
        $database->backup();
        $response = ["status" => "success", "message" => "Veritabanı başarıyla yedeklendi."];
    } elseif ($_GET['mode'] == 'restore') {
        $database->restore();
        $response = ["status" => "success", "message" => "Veritabanı başarıyla geri yüklendi."];
    } else {
        throw new Exception("Yanlış mod seçildi.");
    }
} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

echo json_encode($response);
?>