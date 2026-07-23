<?php
/**
 * Thin Auth controller — request → use case → response, nothing else.
 */
class AuthController {
    public static function login(): void {
        require_method('POST');
        $data       = parse_post_data();
        $identifier = InputSanitizer::string($data['kullanici_adi'] ?? $data['eposta'] ?? '');
        $password   = $data['sifre'] ?? '';
        $rememberMe = (bool) ($data['rememberMe'] ?? false);

        checkRateLimit(Database::getInstance(), 'login:' . ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . $identifier, 8, 300);

        try {
            $useCase = new LoginUseCase(new UserRepository());
            $result  = $useCase->execute($identifier, $password, $rememberMe);
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

        // Regenerate the session ID on successful auth so a session ID an
        // attacker fixed before login (session fixation) doesn't carry over
        // into the authenticated session.
        session_regenerate_id(true);
        $_SESSION['user_id'] = $result['user_id'];

        if ($rememberMe && isset($result['remember_selector'])) {
            setcookie('remember_me', $result['remember_selector'] . ':' . $result['remember_validator'], [
                'expires'  => $result['remember_expiry'],
                'path'     => '/',
                'httponly' => true,
                'secure'   => true,
                'samesite' => 'Strict',
            ]);
        }

        JsonResponse::success([
            'user_id' => $result['user_id'],
            'email'   => $result['email'],
            'message' => 'Giriş başarılı!',
        ]);
    }

    public static function register(): void {
        require_method('POST');
        $data = parse_post_data();

        checkRateLimit(Database::getInstance(), 'register:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 5, 600);

        try {
            $useCase = new RegisterUseCase(new UserRepository());
            $userId  = $useCase->execute($data);
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

        JsonResponse::success(['message' => 'Kayıt başarılı!', 'id' => $userId]);
    }

    public static function logout(): void {
        $userId = $_SESSION['user_id'] ?? null;

        $_SESSION = [];
        session_unset();
        session_destroy();
        setcookie('PHPSESSID', '', time() - 3600, '/', '', true, true);

        // Session cookie alone isn't enough — a live remember-me token would
        // let sessionCheck() silently re-authenticate the user right after
        // logout via AuthMiddleware::optionalAuth()'s remember-me fallback.
        if ($userId) {
            (new UserRepository())->clearRememberToken((int) $userId);
        }
        setcookie('remember_me', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'secure'   => true,
            'samesite' => 'Strict',
        ]);

        JsonResponse::success(['message' => 'Çıkış yapıldı.']);
    }

    public static function sessionCheck(): void {
        if (isset($_SESSION['user_id'])) {
            JsonResponse::success(['authenticated' => true, 'user_id' => (int) $_SESSION['user_id']]);
        }

        $userId = AuthMiddleware::optionalAuth();
        if ($userId > 0) {
            JsonResponse::success(['authenticated' => true, 'user_id' => $userId]);
        }

        echo json_encode(['authenticated' => false]);
        exit;
    }

    public static function loginGoogle(): void {
        require_once __DIR__ . '/../../../vendor/autoload.php';

        $jsonData = $_POST['data'] ?? null;
        $data     = $jsonData ? json_decode($jsonData, true) : null;
        $idToken  = $data['google_token'] ?? null;

        if (!$idToken) {
            JsonResponse::error('Token sağlanmadı.', 400, AppConfig::ERR_VALIDATION);
        }

        $client = new Google_Client(['client_id' => AppConfig::googleClientId()]);
        $payload = $client->verifyIdToken($idToken);

        if (!$payload) {
            JsonResponse::error('Geçersiz Google token.', 401, AppConfig::ERR_AUTH_REQUIRED);
        }

        try {
            $useCase = new GoogleLoginUseCase(new UserRepository());
            $userId  = $useCase->execute($payload['sub'], $payload['email'], $payload['name'] ?? '');
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        JsonResponse::success(['user_id' => $userId, 'message' => 'Login successful']);
    }

    /**
     * SECURITY: the reset code is generated and stored (hashed) here on the
     * server — it must never be accepted from the client. A client-supplied
     * code would let anyone request a "reset" for any email and just tell
     * the server what the "correct" code is, defeating verification entirely.
     */
    public static function sendPasswordResetMail(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/phpmailer.php';

        $email = InputSanitizer::email($_POST['email'] ?? '');
        if (!$email) {
            JsonResponse::error('Email zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }

        checkRateLimit(Database::getInstance(), 'passreset:' . ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . $email, 3, 600);

        $users = new UserRepository();
        $user  = $users->findByEmail($email);
        if (!$user) {
            JsonResponse::error('Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }

        $code     = (string) random_int(100000, 999999);
        $codeHash = hash('sha256', $code);

        $db   = Database::getInstance();
        $conn = $db->getConnection();
        $conn->exec(
            'CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code_hash VARCHAR(64) NOT NULL,
                expires_at DATETIME NOT NULL,
                INDEX (user_id)
            )'
        );
        // Only one active reset code per user at a time.
        $db->delete('password_resets', 'user_id = ?', [$user['id']]);
        // expires_at is computed by MySQL itself (NOW() + INTERVAL), not PHP's
        // date() — the app server and DB server can run in different
        // timezones (seen locally: PHP=UTC, MySQL=UTC+3), and comparing a
        // PHP-computed timestamp against MySQL's NOW() in a later query would
        // silently treat every code as already expired.
        $stmt = $conn->prepare(
            'INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL 15 MINUTE)'
        );
        $stmt->execute([$user['id'], $codeHash]);

        $name    = htmlspecialchars($user['ad_soyad'] ?? '', ENT_QUOTES, 'UTF-8');
        $subject = 'Şifre Sıfırlama Kodu';
        $body    = "<p>Merhaba <strong>$name</strong>,</p>
                    <p>Şifrenizi sıfırlamak için kullanmanız gereken kod:</p>
                    <h2 style='color:#2c3e50;'>$code</h2>
                    <p>Bu kod 15 dakika geçerlidir.</p>
                    <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>";

        $result = sendEmail(AppConfig::noreplyEmail(), 'Sistem', $email, $subject, $body);
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * SECURITY: identity is derived from a valid, unexpired (email, code)
     * pair — never from a client-supplied user id. Previously this endpoint
     * accepted an arbitrary `id` with no verification at all, allowing
     * anyone to overwrite any account's password.
     */
    public static function updatePassword(): void {
        require_method('POST');
        $email           = InputSanitizer::email($_POST['email'] ?? '');
        $code            = InputSanitizer::string($_POST['code'] ?? '', 10);
        $password        = $_POST['password'] ?? null;
        $passwordConfirm = $_POST['password_confirm'] ?? null;

        if (!$email || !$code) {
            JsonResponse::error('E-posta ve doğrulama kodu zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }
        if (!$password || !$passwordConfirm) {
            JsonResponse::error('Şifre ve doğrulama zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }
        if ($password !== $passwordConfirm) {
            JsonResponse::error('Şifreler eşleşmiyor!', 400, AppConfig::ERR_VALIDATION);
        }

        // The reset code is only 6 digits (1M combinations) — without this,
        // it's brute-forceable within the 15-minute expiry window.
        checkRateLimit(Database::getInstance(), 'resetcode:' . ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . $email, 10, 600);

        $users = new UserRepository();
        $user  = $users->findByEmail($email);
        if (!$user) {
            JsonResponse::error('Kod geçersiz veya süresi dolmuş.', 400, AppConfig::ERR_VALIDATION);
        }

        $db  = Database::getInstance();
        $row = $db->selectSingle(
            '* FROM password_resets WHERE user_id = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
            [$user['id']]
        );

        if (!$row || !hash_equals($row['code_hash'], hash('sha256', $code))) {
            JsonResponse::error('Kod geçersiz veya süresi dolmuş.', 400, AppConfig::ERR_VALIDATION);
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $users->updateById($user['id'], ['sifre' => $hashed]);
        $db->delete('password_resets', 'user_id = ?', [$user['id']]);

        JsonResponse::success(['message' => 'Şifre güncellendi.']);
    }
}
