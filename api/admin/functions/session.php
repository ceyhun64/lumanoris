<?php
/**
 * Session starter for the admin panel.
 *
 * The API side (functions/bootstrap.php) configures the session cookie with
 * HttpOnly, SameSite=Lax and a conditional Secure flag. The admin panel called
 * a bare session_start() instead, which falls back to the php.ini defaults —
 * no HttpOnly, no SameSite. Both sides share one PHPSESSID on path "/", so
 * whichever started the session first decided the cookie's flags: opening the
 * admin panel downgraded the cookie for the entire application, and the
 * missing SameSite is what makes the admin endpoints reachable by a cross-site
 * POST at all.
 *
 * Call this instead of session_start() anywhere in api/admin.
 *
 * Note: the admin and user sessions still share one cookie. They cannot simply
 * be split by cookie path, because SellerController exposes five /api
 * endpoints that authorise through AuthMiddleware::requireAdmin() and so need
 * the admin session outside /admin. Separating them is a design change, not a
 * cookie-flag fix.
 */
function admin_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // Keep these identical to functions/bootstrap.php — a mismatch between the
    // two would reintroduce exactly the downgrade described above.
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
}
