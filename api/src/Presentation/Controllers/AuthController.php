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

        try {
            $useCase = new LoginUseCase(new UserRepository());
            $result  = $useCase->execute($identifier, $password, $rememberMe);
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

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

        try {
            $useCase = new RegisterUseCase(new UserRepository());
            $userId  = $useCase->execute($data);
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

        JsonResponse::success(['message' => 'Kayıt başarılı!', 'id' => $userId]);
    }

    public static function logout(): void {
        $_SESSION = [];
        session_unset();
        session_destroy();
        setcookie('PHPSESSID', '', time() - 3600, '/', '', true, true);
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

        $_SESSION['user_id'] = $userId;
        JsonResponse::success(['user_id' => $userId, 'message' => 'Login successful']);
    }

    public static function sendPasswordResetMail(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/phpmailer.php';

        $email     = InputSanitizer::email($_POST['email'] ?? '');
        $resetCode = InputSanitizer::string($_POST['resetCode'] ?? '', 20);

        if (!$email || !$resetCode) {
            JsonResponse::error('Email ve kod zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }

        $users = new UserRepository();
        $user  = $users->findByEmail($email);
        if (!$user) {
            JsonResponse::error('Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }

        $name    = htmlspecialchars($user['ad_soyad'] ?? '', ENT_QUOTES, 'UTF-8');
        $subject = 'Şifre Sıfırlama Kodu';
        $body    = "<p>Merhaba <strong>$name</strong>,</p>
                    <p>Şifrenizi sıfırlamak için kullanmanız gereken kod:</p>
                    <h2 style='color:#2c3e50;'>$resetCode</h2>
                    <p>Bu kodu şifre sıfırlama ekranına girerek yeni şifrenizi belirleyebilirsiniz.</p>
                    <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>";

        $result            = sendEmail(AppConfig::noreplyEmail(), 'Sistem', $email, $subject, $body);
        $result['user_id'] = $user['id'];
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function updatePassword(): void {
        require_method('POST');
        $userId          = InputSanitizer::positiveInt($_POST['id'] ?? 0);
        $password        = $_POST['password'] ?? null;
        $passwordConfirm = $_POST['password_confirm'] ?? null;

        if (!$userId) {
            JsonResponse::error('ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }
        if (!$password || !$passwordConfirm) {
            JsonResponse::error('Şifre ve doğrulama zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }
        if ($password !== $passwordConfirm) {
            JsonResponse::error('Şifreler eşleşmiyor!', 400, AppConfig::ERR_VALIDATION);
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $users  = new UserRepository();
        $ok     = $users->updateById($userId, ['sifre' => $hashed]);

        if ($ok) {
            JsonResponse::success(['message' => 'Şifre güncellendi.']);
        } else {
            JsonResponse::error('Şifre güncellenemedi veya kullanıcı bulunamadı.', 400);
        }
    }
}
