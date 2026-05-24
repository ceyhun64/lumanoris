<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require $_SERVER['DOCUMENT_ROOT'] . '/lumanoris/functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $table = $_POST['table'] ?? null;
    $columns = $_POST['columns'] ?? "*"; // İstenirse kolon listesi, yoksa *
    $where = $_POST['where'] ?? "";      // Opsiyonel koşul
    $limit = $_POST['limit'] ?? "";      // Opsiyonel limit

    if (!$table) {
        echo json_encode([
            "success" => false,
            "message" => "No table specified!"
        ]);
        exit;
    }

    try {
        // Sorgu oluştur
        $sql = "$columns FROM $table";
        if (!empty($where)) {
            $sql .= " WHERE $where";
        }
        if (!empty($limit)) {
            $sql .= " LIMIT " . intval($limit);
        }
        $result = $database->selectMulti($sql);

        echo json_encode([
            "success" => true,
            "message" => "Data fetched successfully.",
            "data"    => $result
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}
?>