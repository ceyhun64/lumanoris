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
 *
 * ── Admin hesabının kaynağı ─────────────────────────────────────────────
 * api/.env içinde ADMIN_USERNAME tanımlıysa admin hesabı ORADAN okunur ve
 * `adminler` tablosuna hiç bakılmaz. Böylece en yetkili hesap DB'ye yazabilen
 * hiçbir yoldan (admin panelindeki CRUD, bir SQL injection, elle atılan bir
 * INSERT) oluşturulamaz; parola hash'i sunucudaki dosyada, versiyon
 * kontrolünün dışında durur.
 *
 * ADMIN_USERNAME tanımlı değilse eski davranış aynen sürer: `adminler` tablosu.
 */
require_once __DIR__ . '/../../functions/env.php';
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
 * Değer bir password_hash() çıktısı mı? (bcrypt / argon2)
 */
function admin_password_looks_hashed(string $value): bool
{
    return (bool) preg_match('/^\$(2[aby]?|argon2(id|i|d))\$/', $value);
}

/**
 * api/.env dosyasında tanımlı admin hesabı.
 *
 * @return array{kullanici_adi: string, plain: ?string, hash: ?string}|null
 *   null → ADMIN_USERNAME tanımlı değil; env modu kapalı, DB kullanılacak.
 *   plain ve hash ikisi de null ise ADMIN_USERNAME var ama parola
 *   tanımlanmamış (yapılandırma hatası): giriş kapalıdır, sessizce DB'ye
 *   DÜŞMEZ.
 *
 * Parola iki şekilde verilebilir — ikisi de geçerli, hangisi tanımlıysa o
 * kullanılır:
 *   ADMIN_PASSWORD      → düz metin. En basit yol; hash üretmeye gerek yok,
 *                         .env dosyasına doğrudan yazılır.
 *   ADMIN_PASSWORD_HASH → password_hash() çıktısı. .env dosyasını okuyabilen
 *                         birinin parolayı da öğrenmesini istemiyorsanız.
 *
 * ADMIN_PASSWORD'e yanlışlıkla bir hash yapıştırılırsa hash olarak algılanır,
 * düz metin sanılıp karşılaştırılmaz.
 */
function admin_env_account(): ?array
{
    static $resolved = false;
    static $account  = null;

    if ($resolved) {
        return $account;
    }
    $resolved = true;

    // db.php da çağırıyor; bu fonksiyon DB'siz de kullanılabilsin diye burada
    // da yüklüyoruz. env_load() idempotent ve gerçek ortam değişkenlerini
    // asla ezmiyor.
    env_load();

    $username = env_get('ADMIN_USERNAME');
    if ($username === null || trim($username) === '') {
        return $account = null;
    }

    $plain = null;
    $hash  = null;

    $configuredHash = env_get('ADMIN_PASSWORD_HASH');
    if ($configuredHash !== null && trim($configuredHash) !== '') {
        $hash = trim($configuredHash);
    } else {
        $configuredPlain = env_get('ADMIN_PASSWORD');
        if ($configuredPlain !== null && $configuredPlain !== '') {
            if (admin_password_looks_hashed($configuredPlain)) {
                $hash = $configuredPlain;
            } else {
                $plain = $configuredPlain;
            }
        }
    }

    return $account = [
        'kullanici_adi' => trim($username),
        'plain'         => $plain,
        'hash'          => $hash,
    ];
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

    // Hesap bulunamadığında da bir hash doğrulaması yapıyoruz: aksi halde
    // yanıt süresi "bu kullanıcı adı var mı?" sorusunu cevaplardı.
    $dummyHash = '$2y$12$rb8SqYq0O1BIRIxGhSZ2oO4fLIHZO2eKr9IUxqHTlyBsbsif0x.OC';

    $envAccount = admin_env_account();

    if ($envAccount !== null) {
        // ── .env modu ───────────────────────────────────────────────────
        // `adminler` tablosu HİÇ okunmuyor: tabloda kalmış eski (ya da
        // sonradan eklenmiş) bir satırın giriş yapabilmesi, hesabı env'e
        // taşımanın bütün anlamını yok ederdi.
        if ($envAccount['plain'] === null && $envAccount['hash'] === null) {
            error_log('[admin_login] ADMIN_USERNAME tanımlı ama ADMIN_PASSWORD/ADMIN_PASSWORD_HASH yok');
            return [
                'ok'      => false,
                'status'  => 500,
                'message' => 'Admin girişi yapılandırılmamış: api/.env dosyasına ADMIN_PASSWORD ekleyin.',
            ];
        }

        // MySQL'in varsayılan karşılaştırması büyük/küçük harfe duyarsızdı;
        // env moduna geçerken bu davranışı değiştirmiyoruz.
        $nameOk = hash_equals(
            strtolower($envAccount['kullanici_adi']),
            strtolower($username)
        );

        if ($envAccount['plain'] !== null) {
            // Düz metin parola: hiç hash'lemiyoruz. hash_equals sabit zamanda
            // karşılaştırır — `===` uzunluk/ilk-fark üzerinden sızdırabilirdi.
            $passOk = hash_equals($envAccount['plain'], $password);
        } else {
            // Kullanıcı adı tutmasa da bir doğrulama koşturuyoruz (zamanlama).
            $passOk = password_verify($password, $nameOk ? $envAccount['hash'] : $dummyHash);
        }

        $valid = $nameOk && $passOk;

        $adminName   = $envAccount['kullanici_adi'];
        $adminId     = null;
        $adminSource = 'env';
    } else {
        // ── Geriye dönük uyumluluk: `adminler` tablosu ──────────────────
        $admin = $database->selectSingle('* FROM adminler WHERE kullanici_adi = ?', [$username]);

        $hash  = $admin['sifre'] ?? $dummyHash;
        $valid = password_verify($password, $hash) && $admin !== false && $admin !== null;

        $adminName   = $admin['kullanici_adi'] ?? $username;
        $adminId     = $admin['id'] ?? null;
        $adminSource = 'db';
    }

    if (!$valid) {
        error_log(sprintf('[admin_login] failed user=%s ip=%s source=%s', $username, $ip, $adminSource));
        return ['ok' => false, 'status' => 401, 'message' => 'Geçersiz kullanıcı adı veya şifre'];
    }

    admin_session_start();

    // SEC-005: yetki yükselmesinden ÖNCE oturum kimliğini yenile. Eski
    // kimliği silmek (true) saldırganın elindeki id'yi kullanılamaz kılar.
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }

    $_SESSION['admin']            = $adminName;
    $_SESSION['admin_id']         = $adminId;
    $_SESSION['admin_source']     = $adminSource;
    // G-09 — bu iki alan artık gerçekten okunuyor:
    // `admin_session_enforce_timeout()` boşta kalma ve mutlak zaman aşımını
    // buradan hesaplıyor (functions/session.php). Eskiden yazılıp hiç
    // okunmuyorlardı, yani panel oturumu süresizdi.
    $_SESSION['admin_login_at']   = time();
    $_SESSION['admin_last_seen']  = time();
    // Yalnızca tanı amaçlı: IP oturum içinde meşru olarak değişebildiği için
    // (mobil ağ, CGNAT) yetkilendirme kararında KULLANILMIYOR.
    $_SESSION['admin_login_ip']   = $ip;
    $_SESSION['csrf_token']       = bin2hex(random_bytes(32));

    // Doğru parolayı bilen admin, aynı IP'deki başarısız denemelerin cezasını
    // çekmesin.
    rateLimitReset($database, $perAccountKey);
    rateLimitReset($database, $perIpKey);

    return ['ok' => true, 'status' => 200, 'message' => 'Giriş başarılı'];
}
