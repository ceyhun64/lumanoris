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

    if (stripos($table, 'adminler') !== false) {
        echo json_encode([
            "success" => false,
            "message" => "Bu tabloya bu uç noktadan erişilemez."
        ]);
        exit;
    }

    try {
        Database::assertAllowedAdminTable($table);
        Database::assertSafeWhereFragment($where);

        // Buradaki `SELECT * FROM $table WHERE $where LIMIT 1` KALDIRILDI:
        // tek işlevi, yüklenen dosyanın base64'ünü mevcut sütun değeriyle
        // karşılaştırmaktı. Dosyalar artık base64 olarak saklanmadığı için
        // (G-14) karşılaştırılacak bir şey yok; sorgu her güncellemede tüm
        // satırı — bcrypt hash'ler ve base64 avatarlar dahil — belleğe
        // okuyordu.

        // G-14 — bkz. admin/functions/upload_guard.php: base64'ü sütuna
        // yazmak yerine dosya diske yazılıyor ve `assets/...` göreli yolu
        // saklanıyor (uygulamanın geri kalanının beklediği biçim).
        $data = admin_store_uploads($_FILES, $data);

        $newDataId = $database->update($table, $data, $where);

        echo json_encode([
            "success" => true,
            "message" => "Güncelleme işlemi başarılı!",
            "id" => $newDataId
        ]);
    } catch (Exception $e) {
        // G-12 ailesi: ham istisna mesajı istemciye sızıyordu.
        error_log('[admin/update] ' . $e->getMessage());
        echo json_encode([
            "success" => false,
            "message" => "Güncelleme yapılamadı."
        ]);
    }
}
?>