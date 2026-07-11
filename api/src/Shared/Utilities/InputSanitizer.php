<?php
/**
 * Centralized input sanitization.
 * All raw user input must pass through here before use.
 * Never used for output escaping — that is PDO's job via parameterized queries.
 */
final class InputSanitizer {
    public static function string(mixed $value, int $maxLen = 1000): string {
        return mb_substr(trim((string) $value), 0, $maxLen);
    }

    public static function int(mixed $value): int {
        return (int) $value;
    }

    public static function float(mixed $value): float {
        return (float) $value;
    }

    public static function bool(mixed $value): bool {
        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes'], true);
        }
        return (bool) $value;
    }

    public static function email(mixed $value): string {
        $sanitized = filter_var(trim((string) $value), FILTER_SANITIZE_EMAIL);
        return $sanitized !== false ? $sanitized : '';
    }

    public static function positiveInt(mixed $value): int {
        $int = (int) $value;
        return $int > 0 ? $int : 0;
    }

    /** Strip HTML tags — use when storing user-provided text that may be rendered. */
    public static function text(mixed $value, int $maxLen = 5000): string {
        return mb_substr(strip_tags(trim((string) $value)), 0, $maxLen);
    }

    /** Validate and return a float price, ensuring it is non-negative. */
    public static function price(mixed $value): float {
        $f = (float) $value;
        return $f >= 0 ? round($f, 2) : 0.0;
    }

    /** Safe array extraction from raw request data. */
    public static function fromArray(array $data, string $key, mixed $default = null): mixed {
        return $data[$key] ?? $default;
    }

    /** Sniff the real MIME type from file content (magic bytes), not the client-supplied name. */
    public static function detectMime(string $tmpPath): string|false {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $tmpPath);
        finfo_close($finfo);
        return $mime;
    }

    /** Validate MIME type against allowed list. Returns true if safe. */
    public static function isAllowedMime(string $tmpPath, array $allowedMimes): bool {
        return in_array(self::detectMime($tmpPath), $allowedMimes, true);
    }

    /**
     * Extension for a verified MIME type — used to name saved uploads so the
     * file extension always matches the sniffed content type, never the
     * client-supplied filename (a polyglot file with a real image header but
     * a ".php" client filename would otherwise be saved as executable PHP).
     */
    public static function extensionForMime(string $mime): string {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            'image/webp' => 'webp',
            default      => 'bin',
        };
    }

    /** Generate a cryptographically safe random token. */
    public static function randomToken(int $bytes = 32): string {
        return bin2hex(random_bytes($bytes));
    }
}
