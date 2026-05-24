<?php
header('Content-Type: application/json');

try {
    require '../functions/db.php';
    $database = Database::getInstance();
    $conn = $database->getConnection();

    $id = $_POST['id'] ?? null;
    $status = $_POST['status'] ?? null; // 0 veya 1
    $extraWeeks = $_POST['extra_weeks'] ?? null; // Ekstra hafta eklemek istenirse

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID gerekli!"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $fields = [];
    $params = [];

    if ($status !== null) {
        $fields[] = "status = ?";
        $params[] = $status;
    }

    // Eğer süre uzatılıyorsa mevcut expiry_date üzerine ekleme yap
    if ($extraWeeks) {
        $fields[] = "expiry_date = DATE_ADD(expiry_date, INTERVAL ? WEEK)";
        $params[] = $extraWeeks;
    }

    if (empty($fields)) {
        echo json_encode(["success" => false, "message" => "Güncellenecek veri yok."]);
        exit;
    }

    $params[] = $id;
    $sql = "UPDATE user_subscriptions SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    echo json_encode(["success" => true, "message" => "Abonelik güncellendi."], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>