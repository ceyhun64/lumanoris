<?php
/**
 * Tek bir admin kimlik doğrulama noktası.
 *
 * BE-001 🟠: admin girişi iki tamamen bağımsız yerde uygulanmıştı —
 * `admin/ajax/giris.php` (JS yolu) ve `admin/partials/_login.php` (JS'siz geri
 * düşüş). İkisinde de `session_regenerate_id()` yoktu (SEC-005: oturum
 * sabitleme — saldırgan kurbana kendi PHPSESSID'sini kabul ettirip giriş
 * yapmasını bekleyebilir) ve ikisinde de rate limit yoktu (SEC-006: kullanıcı
 * girişinde iki katmanlı limit var, admin girişinde hiç yoktu — üstelik
 * korunan hesap en yetkili olan).
 *
 * Her ikisi de artık bu fonksiyonu çağırıyor; düzeltme tek yerde yaşıyor.
 */
require_once __DIR__ . '/../../functions/db.php';
require_once __DIR__ . '/../../functions/rate_limit.php';
require_once __DIR__ . '/session.php';

if (!function_exists('admin_login_client_ip')) {
    function admin_login_client_ip(): string {
        // Proxy başlıklarına GÜVENMİYORUZ: istemci X-Forwarded-For'u serbestçe
        // uydurabilir ve her istekte farklı bir değer göndererek limiti
        // tamamen etkisizleştirebilirdi. REMOTE_ADDR ters proxy arkasında
        // tek bir değere düşer; bu durumda kullanıcı-adı bileşeni ayrımı
        // sağlıyor.
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }
}

/**
 * @return array{ok: bool, status: int, message: string}
 */
function admin_login_attempt(Database $database, string $username, string $password): array
{
    $username = trim($username);

    if ($username === '' || $password === '') {
        return ['ok' => false, 'status' => 400, 'message' => 'Kullanıcı adı ve şifre zorunludur'];
    }

    $ip = admin_login_client_ip();

    // İki katmanlı limit — kullanıcı tarafındaki girişle aynı model:
    // (1) tek hesaba yönelik parola denemesi, (2) tek IP'den hesap taraması.
    $perAccountKey = 'admin_login:acct:' . strtolower($username);
    $perIpKey      = 'admin_login:ip:' . $ip;

    if (!rateLimitHit($database, $perAccountKey, 5, 900)
        || !rateLimitHit($database, $perIpKey, 20, 900)) {
        error_log(sprintf('[admin_login] rate limited user=%s ip=%s', $username, $ip));
        return [
            'ok'      => false,
            'status'  => 429,
            'message' => 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
        ];
    }

    $admin = $database->selectSingle('* FROM adminler WHERE kullanici_adi = ?', [$username]);

    // Kullanıcı bulunamadığında da bir hash doğrulaması yapıyoruz: aksi halde
    // yanıt süresi "bu kullanıcı adı var mı?" sorusunu cevaplardı.
    $hash = $admin['sifre'] ?? '$2y$12$rb8SqYq0O1BIRIxGhSZ2oO4fLIHZO2eKr9IUxqHTlyBsbsif0x.OC';
    $valid = password_verify($password, $hash) && $admin !== false && $admin !== null;

    if (!$valid) {
        error_log(sprintf('[admin_login] failed user=%s ip=%s', $username, $ip));
        return ['ok' => false, 'status' => 401, 'message' => 'Geçersiz kullanıcı adı veya şifre'];
    }

    admin_session_start();

    // SEC-005: yetki yükselmesinden ÖNCE oturum kimliğini yenile. Eski
    // kimliği silmek (true) saldırganın elindeki id'yi kullanılamaz kılar.
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }

    $_SESSION['admin']            = $admin['kullanici_adi'];
    $_SESSION['admin_id']         = $admin['id'] ?? null;
    $_SESSION['admin_login_at']   = time();
    // Oturum sabitleme + oturum çalma karşısında ikinci bir bağ.
    $_SESSION['admin_login_ip']   = $ip;
    $_SESSION['csrf_token']       = bin2hex(random_bytes(32));

    // Doğru parolayı bilen admin, aynı IP'deki başarısız denemelerin cezasını
    // çekmesin.
    rateLimitReset($database, $perAccountKey);
    rateLimitReset($database, $perIpKey);

    return ['ok' => true, 'status' => 200, 'message' => 'Giriş başarılı'];
}
