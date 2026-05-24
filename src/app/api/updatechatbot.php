<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Frontend'den gelen JSON string'i çözüyoruz
    $data = json_decode($_POST['data'], true) ?? null;

    if (!$data || !isset($data['id'])) {
        echo json_encode(["success" => false, "message" => "Veri veya ID bulunamadı!"]);
        exit;
    }

    try {
        $data['owner_user_id'] = $data['author_user_id'] ?? $data['owner_user_id'] ?? null;

        // Resim Dosyalarını İşleme
        $fileFields = [
            'coverImage_file' => 'kapak_fotografi',
            'profileImage_file' => 'profil_fotografi'
        ];

        foreach ($fileFields as $postKey => $dbColumn) {
            if (isset($_FILES[$postKey]) && $_FILES[$postKey]['error'] === UPLOAD_ERR_OK) {
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . "/lumanoris/assets/" . $column;
                //$uploadDir = __DIR__ . "/../../assets/" . $dbColumn;
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $extension = pathinfo($_FILES[$postKey]['name'], PATHINFO_EXTENSION);
                $fileName = time() . "_" . uniqid() . "." . $extension;
                $targetPath = $uploadDir . "/" . $fileName;

                if (move_uploaded_file($_FILES[$postKey]['tmp_name'], $targetPath)) {
                    // DB'ye kaydedilecek göreceli yol
                    $data[$dbColumn] = "assets/" . $dbColumn . "/" . $fileName;
                }
            }
        }
        $id = $data['id'];
        // Güncelleme işlemi (functions/db.php içindeki update fonksiyonunu kullanıyoruz)
        $updated = $database->update('chatbotlar', $data,"id = $id");

        if ($updated) {
            echo json_encode([
                "success" => true,
                "message" => "Chatbot başarıyla güncellendi!",
                "id" => $data['id']
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Güncelleme başarısız!"
            ]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Hata: " . $e->getMessage()
        ]);
    }
}
?>