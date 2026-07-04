<?php
class AuthMiddleware {
    /**
     * Returns the authenticated user_id or aborts with 401.
     */
    public static function requireAuth(): int {
        if (isset($_SESSION['user_id'])) {
            return (int) $_SESSION['user_id'];
        }

        // Remember-me cookie fallback
        if (isset($_COOKIE['remember_me'])) {
            $parts = explode(':', $_COOKIE['remember_me']);
            if (count($parts) === 2) {
                [$selector, $validator] = $parts;
                $db        = Database::getInstance();
                $tokenData = $db->selectSingle(
                    'user_id, hashed_validator FROM user_tokens WHERE selector = ? AND expiry > NOW()',
                    [$selector]
                );
                if ($tokenData && hash_equals($tokenData['hashed_validator'], hash('sha256', $validator))) {
                    $_SESSION['user_id'] = $tokenData['user_id'];
                    return (int) $tokenData['user_id'];
                }
            }
        }

        json_error('Oturum açmanız gerekiyor.', 401);
    }

    /**
     * Soft check — returns user_id or 0 (no abort).
     */
    public static function optionalAuth(): int {
        return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
    }
}
