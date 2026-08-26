<?php
/**
 * Admin girişi (AJAX yolu).
 *
 * SEC-005/SEC-006 + BE-001: bu akışta ne `session_regenerate_id()` vardı ne de
 * rate limit. Aynı kimlik doğrulama ikinci kez `admin/partials/_login.php`
 * içinde de yazılmıştı ve orada da ikisi yoktu. Ortak parçalar artık
 * `admin_login_attempt()` içinde tek yerde duruyor; iki yol da onu çağırıyor.
 */
require_once __DIR__ . '/../../functions/logging.php';
configure_error_log();
require_once __DIR__ . '/../functions/session.php';
admin_session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../functions/util.php';
require_once __DIR__ . '/../../functions/db.php';
require_once __DIR__ . '/../functions/admin_login.php';

$database = Database::getInstance();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz istek'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!csrf_check($_POST['csrf_token'] ?? '')) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz istek (CSRF hatası)!'], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = admin_login_attempt(
    $database,
    (string) ($_POST['admin_adi'] ?? ''),
    (string) ($_POST['admin_sifre'] ?? '')
);

if (!$result['ok']) {
    http_response_code($result['status']);
    echo json_encode(['status' => 'error', 'message' => $result['message']], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'status'   => 'success',
    'message'  => 'Giriş başarılı',
    'redirect' => '/admin/',
], JSON_UNESCAPED_UNICODE);
