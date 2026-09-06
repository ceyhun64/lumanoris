<?php
require_once __DIR__ . '/_guard.php';
if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Yetkisiz erişim."]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    require_once __DIR__ . '/../../functions/db.php';
    require_once __DIR__ . '/../functions/upload_guard.php';
    require_once __DIR__ . '/../functions/crud_guard.php';
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

    if (stripos($table, 'adminler') !== false) {
        echo json_encode([
            "success" => false,
            "message" => "Bu tabloya bu uç noktadan erişilemez."
        ]);
        exit;
    }

    try {
        Database::assertAllowedAdminTable($table);
        // G-05: tablo beyaz listesi HANGİ TABLO sorusunu yanıtlıyor; bu da
        // hangi SÜTUNLARIN bu genel uçtan yazılamayacağını.
        admin_assert_no_sensitive_columns($table, $data);

        $data = admin_store_uploads($_FILES, $data);

        $id = $database->insert($table, $data);

        echo json_encode([
            "success" => true,
            "message" => "Veri başarıyla kaydedildi!",
            "id" => $id
        ]);
    } catch (Exception $e) {
        // G-12 ailesi: ham istisna mesajı istemciye sızıyordu (tablo/sütun
        // adları, SQLSTATE kodları).
        error_log('[admin/create] ' . $e->getMessage());
        echo json_encode([
            "success" => false,
            "message" => "Kayıt oluşturulamadı."
        ]);
    }
}
?>