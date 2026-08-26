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
        // ext-fileinfo is not guaranteed to be loaded — it is absent on the
        // audited environment — and calling finfo_open() without it is a fatal
        // error rather than a catchable one. That took down the *strict* upload
        // path (ChatbotController::handleImageUploads) while the legacy
        // extension-sniffing one kept working, i.e. the secure path was the one
        // that broke. Fall back to reading the header bytes instead, which is
        // still a content check.
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $tmpPath);
                finfo_close($finfo);
                if ($mime !== false) {
                    return $mime;
                }
            }
        }

        $info = @getimagesize($tmpPath);
        if ($info !== false && !empty($info['mime'])) {
            return $info['mime'];
        }

        return false;
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

    /**
     * Mass-assignment guard (SEC-002, SEC-003, SEC-014, BIZ-004).
     *
     * Beş yazma endpoint'i istemciden gelen diziyi olduğu gibi
     * Database::update()/insert()'e veriyordu. BaseRepository'de de sütun
     * doğrulaması yok, yani "istemci hangi anahtarı gönderirse o sütun
     * yazılır" davranışı gerçekti: `user_subscriptions.expiry_date` bu yolla
     * ücretsiz olarak süresiz uzatılabiliyordu.
     *
     * Bu yardımcı, izin verilen sütunların DIŞINDAKİ her anahtarı sessizce
     * atmak yerine — sessiz atma, saldırganın denemesini de gizler — açıkça
     * raporlar; çağıran taraf reddedip 400 döndürebilir.
     *
     * @param array<string,mixed> $data     istemciden gelen ham dizi
     * @param string[]            $allowed  yazılmasına izin verilen sütunlar
     * @return array{0: array<string,mixed>, 1: string[]}  [temiz veri, reddedilen anahtarlar]
     */
    public static function pickAllowed(array $data, array $allowed): array {
        $allowedMap = array_flip($allowed);
        $clean      = [];
        $rejected   = [];

        foreach ($data as $key => $value) {
            if (!is_string($key)) {
                $rejected[] = (string) $key;
                continue;
            }
            if (isset($allowedMap[$key])) {
                $clean[$key] = $value;
            } else {
                $rejected[] = $key;
            }
        }

        return [$clean, $rejected];
    }

    /**
     * Bir tanımlayıcının SQL'e gömülmesi güvenli mi? Sütun/tablo adları
     * parametrelenemediği için tek savunma budur. Beyaz liste grameri:
     * yalnızca harf, rakam ve alt çizgi; rakamla başlayamaz; en fazla 64 karakter
     * (MySQL sınırı).
     */
    public static function isSafeIdentifier(mixed $name): bool {
        return is_string($name)
            && $name !== ''
            && strlen($name) <= 64
            && preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name) === 1;
    }

    /**
     * SEC-011 🟡 — parola politikası yalnızca "en az 8 karakter"di ve iki
     * yoldan yalnızca birinde vardı: kayıt akışında kontrol ediliyordu, şifre
     * SIFIRLAMA akışında hiç yoktu. Yani bir kullanıcı kaydolurken 8 karakter
     * vermek zorundaydı, sıfırlarken "1" yazabiliyordu.
     *
     * Politika artık tek yerde ve iki yolda da uygulanıyor. Kural seti
     * bilinçli olarak sade: uzunluk gerçek koruma, karakter sınıfı zorlaması
     * ise kullanıcıyı tahmin edilebilir kalıplara ("Parola1!") itiyor. Bu
     * yüzden 10 karakter alt sınır + yaygın/bağlamsal parola reddi.
     *
     * @param array<string> $context kullanıcıya ait, parolada geçmemesi
     *                               gereken parçalar (e-posta, kullanıcı adı)
     * @return string|null null = geçerli, aksi halde kullanıcıya gösterilecek hata
     */
    public static function passwordPolicyError(string $password, array $context = []): ?string {
        $length = mb_strlen($password);

        if ($length < 10) {
            return 'Şifre en az 10 karakter olmalıdır.';
        }
        if ($length > 200) {
            // bcrypt zaten 72 bayttan sonrasını yok sayar; buradaki sınır
            // hash maliyetine karşı, güvenlik için değil.
            return 'Şifre en fazla 200 karakter olabilir.';
        }
        if (trim($password) === '') {
            return 'Şifre yalnızca boşluk olamaz.';
        }

        $lower = mb_strtolower($password);

        foreach ($context as $piece) {
            $piece = mb_strtolower(trim((string) $piece));
            // E-postanın yalnızca yerel kısmı anlamlı: "ali@gmail.com" için
            // "gmail" bir ipucu değil, "ali" ipucudur.
            if (str_contains($piece, '@')) {
                $piece = explode('@', $piece)[0];
            }
            if ($piece !== '' && mb_strlen($piece) >= 4 && str_contains($lower, $piece)) {
                return 'Şifreniz kullanıcı adınızı veya e-postanızı içeremez.';
            }
        }

        // En sık kullanılan parolalar — tam eşleşme yeter, alt dize araması
        // meşru uzun parolaları da reddederdi.
        $common = [
            '1234567890', '0123456789', 'qwertyuiop', 'password12', 'password123',
            'parola1234', 'sifre12345', '1234512345', 'qwerty12345', 'iloveyou12',
            'admin12345', 'welcome123', 'abc123abc1', '1111111111', 'aaaaaaaaaa',
        ];
        if (in_array($lower, $common, true)) {
            return 'Bu şifre çok yaygın kullanılıyor, lütfen farklı bir şifre seçin.';
        }

        // Tek karakterin tekrarı ("aaaaaaaaaa") uzunluk kontrolünü geçerdi.
        if (preg_match('/^(.)\1+$/u', $password)) {
            return 'Şifre tek bir karakterin tekrarı olamaz.';
        }

        return null;
    }
}
