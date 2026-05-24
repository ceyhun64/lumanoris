<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require '../../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $table = $_POST['table'];
    $where = $_POST['where'];

    try {
        $database->delete($table, $where);
        echo json_encode([
            "success" => true,
            "message" => "Kayıt başarıyla silindi!"
        ]);
    } catch(Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}
?>