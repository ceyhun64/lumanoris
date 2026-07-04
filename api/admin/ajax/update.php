<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $table = $_POST['table'] ?? null;
    $data  = json_decode($_POST['data'],true) ?? null;
    $where = $_POST['where'] ?? null;

    if (!$table || !$data || !is_array($data) || !$where) {
        echo json_encode([
            "success" => false,
            "message" => "Table, data or where condition not specified!"
        ]);
        exit;
    }

    try {
        // Mevcut veriyi çek
        $sql = "SELECT * FROM $table WHERE $where LIMIT 1";
        $stmt = $conn->query($sql);
        $currentRow = $stmt->fetch(PDO::FETCH_ASSOC);

        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                $column = str_replace('_file', '', $key);

                $fileContent = file_get_contents($file['tmp_name']);
                $base64 = "data:" . mime_content_type($file['tmp_name']) . ";base64," . base64_encode($fileContent);

                // Eğer mevcut değer farklıysa güncelle
                if (!isset($currentRow[$column]) || $currentRow[$column] !== $base64) {
                    $data[$column] = $base64;
                }
            }
        }

        $newDataId = $database->update($table, $data, $where);

        echo json_encode([
            "success" => true,
            "message" => "Güncelleme işlemi başarılı!",
            "id" => $newDataId
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}
?>