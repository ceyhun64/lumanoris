<?php
/**
 * Shared bootstrap for all API endpoints.
 * Handles: JSON header, session, DB connection, error handler, response helpers.
 *
 * Usage at top of any endpoint:
 *   require __DIR__ . '/../functions/bootstrap.php';
 */

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load .env from api/ root if it exists (simple key=value parser, no library needed)
(static function (): void {
    $envFile = __DIR__ . '/../.env';
    if (!is_file($envFile)) return;
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $pos = strpos($line, '=');
        if ($pos === false) continue;
        $key   = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1), " \t\"'");
        if ($key === '' || isset($_ENV[$key])) continue;
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
})();

require_once __DIR__ . '/db.php';

$database = Database::getInstance();
$conn     = $database->getConnection();

// ─── Response helpers ─────────────────────────────────────────────────────────

function json_success(array $data = [], int $status = 200): void {
    http_response_code($status);
    echo json_encode(array_merge(['success' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400, array $extra = []): void {
    http_response_code($status);
    echo json_encode(array_merge(['success' => false, 'message' => $message], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        json_error('Method not allowed', 405);
    }
}

function require_auth(): int {
    if (!isset($_SESSION['user_id'])) {
        json_error('Oturum açmanız gerekiyor.', 401);
    }
    return (int) $_SESSION['user_id'];
}

function parse_post_data(): array {
    $data = null;
    if (isset($_POST['data'])) {
        $data = json_decode($_POST['data'], true);
    }
    if (!is_array($data)) {
        json_error('Geçersiz istek verisi.', 400);
    }
    return $data;
}

function parse_get_data(): array {
    return $_GET ?? [];
}

// ─── Global exception → JSON response ────────────────────────────────────────

set_exception_handler(function (Throwable $e) {
    error_log('[uncaught] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());

    http_response_code(500);
    // Only leak the real exception message when APP_DEBUG=true is set (local
    // dev). Otherwise it can expose DB schema, file paths, and other internals
    // to any client that triggers a 500 — full detail is still in error_log.
    $debug   = strtolower((string) ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: '')) === 'true';
    $message = $debug ? ('Sunucu hatası: ' . $e->getMessage()) : 'Sunucu hatası oluştu.';

    echo json_encode([
        'success' => false,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
});
