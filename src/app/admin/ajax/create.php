<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require $_SERVER['DOCUMENT_ROOT'] . '/lumanoris/functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();
    $table = $_POST['table'] ?? null;
    $data  = json_decode($_POST['data'], true) ?? null;

    if (!$table || !$data || !is_array($data)) {
        echo json_encode([
            "success" => false,
            "message" => "Table or data not specified!"
        ]);
        exit;
    }

    try {
        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                // "kapak_fotografi_file" -> "kapak_fotografi"
                $column = str_replace('_file', '', $key);

                // Her kolon için ayrı klasör
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . "/lumanoris/assets/" . $column;
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                // Dosya adını güvenli hale getir
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $fileName  = time() . "_" . uniqid() . "." . $extension;
                $targetPath = $uploadDir . "/" . $fileName;

                // Dosyayı assets/column/ içine taşı
                if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                    // DB’ye göreceli yol yaz
                    $data[$column] = "assets/" . $column . "/" . $fileName;
                } else {
                    throw new Exception("Dosya yüklenemedi!");
                }
            }
        }

        $id = $database->insert($table, $data);

        echo json_encode([
            "success" => true,
            "message" => "Veri başarıyla kaydedildi!",
            "id" => $id
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}
?>