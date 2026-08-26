<?php
/**
 * HTTP authentication middleware.
 * Checks the active PHP session and the remember-me cookie.
 * All token lookups use parameterized queries via UserRepository.
 */
class AuthMiddleware {
    public static function requireAuth(): int {
        if (isset($_SESSION['user_id'])) {
            return (int) $_SESSION['user_id'];
        }

        $userId = self::tryRememberMe();
        if ($userId) {
            return $userId;
        }

        JsonResponse::error('Oturum açmanız gerekiyor.', 401, AppConfig::ERR_AUTH_REQUIRED);
        exit; // unreachable but satisfies static analysis
    }

    public static function optionalAuth(): int {
        if (isset($_SESSION['user_id'])) {
            return (int) $_SESSION['user_id'];
        }
        return self::tryRememberMe() ?? 0;
    }

    /**
     * Admins are a separate identity from regular users — the legacy admin
     * panel (api/admin/ajax/giris.php) authenticates against the `adminler`
     * table and sets $_SESSION['admin'], not $_SESSION['user_id']. Reuses
     * that same session (same cookie, same session_start()) rather than
     * inventing a parallel role system.
     */
    public static function requireAdmin(): string {
        if (isset($_SESSION['admin'])) {
            return (string) $_SESSION['admin'];
        }

        JsonResponse::error('Yönetici girişi gerekiyor.', 403, AppConfig::ERR_PERMISSION);
        exit; // unreachable but satisfies static analysis
    }

    /**
     * SEC-009 🟡 — remember-me ile oturum açarken iki şey eksikti.
     *
     * 1) `session_regenerate_id()` çağrılmıyordu. Normal giriş ve Google
     *    girişi bunu yapıyor; remember-me yolu yapmıyordu. Yani saldırgan
     *    kurbana kendi PHPSESSID'sini kabul ettirip, kurban "beni hatırla"
     *    ile geri döndüğünde aynı oturumu paylaşabiliyordu (oturum sabitleme).
     *
     * 2) Token rotasyonu yoktu. Aynı (selector, validator) çifti kalıcı
     *    süresi boyunca tekrar tekrar kullanılabiliyordu; çalınan bir çerez
     *    30 gün boyunca geçerli kalıyor ve kullanımı hiçbir iz bırakmıyordu.
     *    Artık her başarılı kullanımda çift yenileniyor — çalınan çerez ilk
     *    meşru kullanımdan sonra geçersizleşir ve kullanıcı (beklenmedik
     *    şekilde çıkış yaptığında) durumu fark edebilir.
     */
    private static function tryRememberMe(): ?int {
        if (!isset($_COOKIE['remember_me'])) {
            return null;
        }

        $parts = explode(':', $_COOKIE['remember_me'], 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$selector, $validator] = $parts;
        $repo = new UserRepository();
        $tokenData = $repo->findByRememberToken($selector);

        if (!$tokenData) {
            return null;
        }

        if (!hash_equals($tokenData['hashed_validator'], hash('sha256', $validator))) {
            // Geçerli bir selector ama yanlış validator: ya çerez bozulmuş ya
            // da biri deniyor. Her iki hâlde de bu selector'ı yakıyoruz.
            $repo->deleteRememberTokenBySelector($selector);
            self::clearRememberCookie();
            return null;
        }

        $userId = (int) $tokenData['user_id'];

        // (1) Yetki yükselmesinden önce oturum kimliğini yenile.
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        // (2) Tek kullanımlık token: eskisini sil, yenisini ver.
        $newSelector  = InputSanitizer::randomToken(6);
        $newValidator = InputSanitizer::randomToken(32);
        $expirySeconds = 86400 * AppConfig::REMEMBER_ME_DAYS;

        try {
            $repo->deleteRememberTokenBySelector($selector);
            $repo->setRememberToken(
                $userId,
                $newSelector,
                hash('sha256', $newValidator),
                date('Y-m-d H:i:s', time() + $expirySeconds)
            );

            setcookie('remember_me', $newSelector . ':' . $newValidator, [
                'expires'  => time() + $expirySeconds,
                'path'     => '/',
                'httponly' => true,
                'secure'   => !empty($_SERVER['HTTPS']),
                'samesite' => 'Strict',
            ]);
        } catch (Throwable $e) {
            // Rotasyon başarısız olduysa kullanıcıyı dışarı atmıyoruz; oturum
            // zaten kuruldu. Ama eski token silinmiş olabileceği için çerezi
            // temizliyoruz: bir sonraki ziyarette normal giriş istenir.
            error_log('[remember-me] rotasyon başarısız: ' . $e->getMessage());
            self::clearRememberCookie();
        }

        $_SESSION['user_id'] = $userId;
        return $userId;
    }

    private static function clearRememberCookie(): void {
        setcookie('remember_me', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'secure'   => !empty($_SERVER['HTTPS']),
            'samesite' => 'Strict',
        ]);
    }
}
