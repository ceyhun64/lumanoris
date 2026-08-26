<?php
/**
 * Shared .env loader.
 *
 * bootstrap.php used to carry the only .env parser, which meant anything that
 * required db.php directly — every file in api/admin/ajax/, admin/index.php,
 * the admin pages — got no environment at all and silently fell through to the
 * hard-coded development credentials in db.php (SEC-008). Both entry paths now
 * go through this one loader, so making db.php fail-loud is safe.
 *
 * Deliberately not a library: the format is `KEY=value`, `#` comments, optional
 * surrounding quotes. Values already present in the real environment win, so a
 * container's env vars are never overwritten by a stale file.
 */

function env_load(?string $file = null): void
{
    static $loaded = [];

    $file = $file ?? __DIR__ . '/../.env';
    $real = is_file($file) ? (realpath($file) ?: $file) : null;
    if ($real === null || isset($loaded[$real])) {
        return;
    }
    $loaded[$real] = true;

    $lines = @file($real, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }
        $key = trim(substr($line, 0, $pos));
        if ($key === '' || array_key_exists($key, $_ENV) || getenv($key) !== false) {
            continue;
        }
        $value = trim(substr($line, $pos + 1));
        // Strip one matching pair of surrounding quotes, nothing else.
        $len = strlen($value);
        if ($len >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[$len - 1] === $value[0]) {
            $value = substr($value, 1, -1);
        }
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

/**
 * Read a configuration value. Returns $default when the key was never set;
 * an explicitly empty value is returned as "" and is NOT treated as absent —
 * that distinction is what DB_PASS= (a password-less user) depends on.
 */
function env_get(string $key, ?string $default = null): ?string
{
    if (array_key_exists($key, $_ENV)) {
        return (string) $_ENV[$key];
    }
    $value = getenv($key);
    return $value === false ? $default : (string) $value;
}

function env_bool(string $key, bool $default = false): bool
{
    $value = env_get($key);
    if ($value === null) {
        return $default;
    }
    return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
}
