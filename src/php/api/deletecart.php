<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();

    if (!isset($_POST['id']) || empty($_POST['id'])) {
        throw new Exception("Silinecek sepet öğesi ID'si belirtilmedi.");
    }

    $id = (int)$_POST['id'];
    $result = $database->delete('user_cart', "id = $id");

    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Ürün sepetten kaldırıldı.",
            "deleted_id" => $id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Kayıt bulunamadı veya silinemedi."
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Silme işlemi sırasında hata oluştu: " . $e->getMessage()
    ]);
}
?>