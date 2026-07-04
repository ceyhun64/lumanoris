<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();
    $table = $_POST['table'] ?? null;
    $data  = json_decode($_POST['data'],true) ?? null;

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

                // Dosyayı oku ve Base64'e çevir
                $fileContent = file_get_contents($file['tmp_name']);
                $base64 = "data:" . mime_content_type($file['tmp_name']) . ";base64," . base64_encode($fileContent);

                // DB’ye Base64 string yaz
                $data[$column] = $base64;
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