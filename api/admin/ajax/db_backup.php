<?php
/**
 * SEC-007: bu uç nokta eskiden `GET ?mode=restore` ile tüm veritabanının
 * üzerine son yedeği yazıyordu. GET olduğu için tarayıcı ön-yüklemesi, bir
 * link, bir <img src> ya da bir arama botu tek başına tetikleyebiliyordu ve
 * hiçbir onay adımı yoktu.
 *
 * Artık: _guard.php POST + CSRF zorunlu kılıyor; restore ayrıca açık bir
 * `confirm=RESTORE` alanı istiyor. Yedek dosyaları doküman kökünün dışına
 * taşındı (SEC-001), bu yüzden listeleme de buradan veriliyor.
 */
require_once __DIR__ . '/_guard.php';

require_once __DIR__ . '/../../functions/db.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$mode   = $_POST['mode'] ?? $_GET['mode'] ?? '';

// Salt-okunur listeleme GET ile kalabilir; durumu değiştiren iki mod POST.
if ($mode !== 'list' && $method !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode([
        'status'  => 'error',
        'success' => false,
        'message' => 'Bu işlem yalnızca POST ile yapılabilir.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $database = Database::getInstance();

    switch ($mode) {
        case 'list':
            $response = [
                'status'  => 'success',
                'success' => true,
                'backups' => $database->listBackups(),
            ];
            break;

        case 'backup':
            $file = $database->backup();
            $response = [
                'status'  => 'success',
                'success' => true,
                'message' => 'Veritabanı başarıyla yedeklendi.',
                'file'    => basename($file),
            ];
            break;

        case 'restore':
            // Yıkıcı işlem: yedek adına ek olarak açık onay şart.
            if (($_POST['confirm'] ?? '') !== 'RESTORE') {
                http_response_code(400);
                $response = [
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'Geri yükleme onaylanmadı. confirm=RESTORE gönderilmeli.',
                ];
                break;
            }
            $file = $database->restore($_POST['file'] ?? null);
            $response = [
                'status'  => 'success',
                'success' => true,
                'message' => 'Veritabanı başarıyla geri yüklendi.',
                'file'    => basename($file),
            ];
            break;

        default:
            http_response_code(400);
            $response = [
                'status'  => 'error',
                'success' => false,
                'message' => 'Yanlış mod seçildi (list, backup veya restore).',
            ];
    }
} catch (Throwable $e) {
    // G-12 — ham `$e->getMessage()` istemciye dönüyordu. Bu uç nokta
    // mysqldump/restore yolunda çalıştığı için mesaj dosya yollarını,
    // veritabanı adını ve bazı hâllerde bağlantı dizesini taşıyabiliyordu.
    // Gerçek neden zaten bir satır yukarıda log'a yazılıyor.
    error_log('[db_backup] ' . $e->getMessage());
    http_response_code(500);
    $response = [
        'status'  => 'error',
        'success' => false,
        'message' => 'İşlem tamamlanamadı. Ayrıntı için sunucu günlüğüne bakın.',
    ];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
