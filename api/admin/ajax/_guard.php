<?php
/**
 * Shared entry guard for the admin AJAX endpoints.
 *
 * Every file in this directory repeated the same session_start() + admin
 * check, but only giris.php and updateenv.php ever verified a CSRF token. The
 * admin session cookie carries no SameSite attribute, so a browser will send
 * it on a cross-site POST — meaning a page the admin merely visited could
 * drive update.php / delete.php / upload.php with the admin's own session.
 *
 * Include this as the first statement of any admin AJAX endpoint. It starts
 * the session, rejects non-admins with 403, and verifies the CSRF token on
 * every state-changing (non-GET) request.
 *
 * The token is accepted either as a `csrf_token` form field — which the older
 * inline admin forms already send — or as an `X-CSRF-Token` header, which the
 * shim in admin/partials/_header.php attaches to every same-origin fetch. That
 * dual source is why the existing callers keep working untouched.
 */
require_once __DIR__ . '/../../functions/logging.php';
configure_error_log();
require_once __DIR__ . '/../../functions/util.php';
require_once __DIR__ . '/../functions/session.php';

admin_session_start();

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'status' => 'error', 'message' => 'Yetkisiz erişim.']);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!csrf_check($token)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'status' => 'error', 'message' => 'Geçersiz CSRF token.']);
        exit;
    }
}
