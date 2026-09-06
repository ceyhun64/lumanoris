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
        admin_session_enforce_timeout();
        return;
    }

    // Keep these identical to functions/bootstrap.php — a mismatch between the
    // two would reintroduce exactly the downgrade described above.
    //
    // J-02/F-04 — `secure` bayrağı `$_SERVER['HTTPS']`e bağlanamaz: PHP bu
    // mimaride her zaman proxy arkasında düz HTTP konuşuyor, yani o değişken
    // canlıda da BOŞ. `bootstrap.php` `RequestContext::isHttps()` kullanıyor;
    // bu dosyanın kendi yorumu "ikisi birebir aynı olmalı" dediği için burada
    // da aynısı. `RequestContext` admin tarafında autoload'a girmiyor,
    // doğrudan require ediliyor.
    require_once __DIR__ . '/../../src/Shared/Utilities/RequestContext.php';

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => RequestContext::isHttps(),
    ]);
    session_start();
    admin_session_enforce_timeout();
}

/** Boşta kalma süresi: bu kadar hareketsizlikten sonra oturum düşer. */
const ADMIN_SESSION_IDLE_SECONDS = 2 * 3600;
/** Mutlak süre: giriş üzerinden bu kadar geçtiyse, aktif olsa bile düşer. */
const ADMIN_SESSION_ABSOLUTE_SECONDS = 12 * 3600;

/**
 * G-09 — girişte `admin_login_at`, `admin_login_ip`, `admin_source` ve
 * `admin_id` oturuma yazılıyordu ama HİÇBİRİ hiçbir yerde OKUNMUYORDU.
 * `admin_login.php:209`'daki yorum bunları "oturum sabitleme + oturum çalma
 * karşısında ikinci bir bağ" diye tarif ediyordu; ortada öyle bir bağ yoktu.
 * Yani panel oturumu, tarayıcı açık kaldığı sürece süresiz geçerliydi.
 *
 * `admin_login_at` artık gerçekten bir bağ: hem boşta kalma hem de mutlak
 * zaman aşımı bu değerden hesaplanıyor. Süresi dolan oturum tamamen
 * yıkılıyor, böylece çağıranın kendi `empty($_SESSION['admin'])` kontrolü
 * doğal olarak 403/giriş ekranına düşüyor — ayrı bir yanıt yolu icat
 * etmeye gerek yok.
 *
 * `admin_login_ip` bilerek KULLANILMIYOR: mobil ağlarda ve CGNAT arkasında
 * IP oturum içinde değişir, IP'ye bağlamak meşru admin'i rastgele dışarı
 * atardı. Alan tanı amaçlı duruyor.
 */
function admin_session_enforce_timeout(): void {
    if (empty($_SESSION['admin'])) {
        return;
    }

    $loginAt = (int) ($_SESSION['admin_login_at'] ?? 0);
    $seenAt  = (int) ($_SESSION['admin_last_seen'] ?? $loginAt);
    $now     = time();

    // `admin_login_at` yoksa (bu yamadan önce açılmış oturum) şimdiyi
    // başlangıç kabul et — mevcut admin'leri anında dışarı atmamak için.
    if ($loginAt === 0) {
        $_SESSION['admin_login_at']  = $now;
        $_SESSION['admin_last_seen'] = $now;
        return;
    }

    $expired = ($now - $seenAt) > ADMIN_SESSION_IDLE_SECONDS
        || ($now - $loginAt) > ADMIN_SESSION_ABSOLUTE_SECONDS;

    if ($expired) {
        $_SESSION = [];
        session_unset();
        session_destroy();
        return;
    }

    $_SESSION['admin_last_seen'] = $now;
}
