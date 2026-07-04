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
            return null;
        }

        $userId = (int) $tokenData['user_id'];
        $_SESSION['user_id'] = $userId;
        return $userId;
    }
}
