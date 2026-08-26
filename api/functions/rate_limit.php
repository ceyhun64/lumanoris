<?php
/**
 * Minimal fixed-window rate limiter backed by a single DB table.
 * No external dependency (Redis etc.) — fine at this traffic scale, and
 * matches how every other cross-cutting concern in this codebase is done
 * (a plain function + Database, not a library).
 *
 * SEC-013: the previous implementation was SELECT-then-UPDATE, so N parallel
 * requests all read the same `attempts` and all passed — exactly the burst a
 * limiter exists to stop. It also stored the raw key, which for the login
 * paths is `login:<e-mail>:<ip>`: a DB dump (or the admin's table browser)
 * then doubled as a list of who logged in from where. And nothing ever
 * deleted expired rows.
 *
 * Now: one atomic INSERT … ON DUPLICATE KEY UPDATE decides both the window
 * roll-over and the increment, the stored key is a SHA-256 hash, and expired
 * rows are swept opportunistically.
 */

/**
 * Increment the counter and report whether the caller is still under the
 * limit. Never throws, never writes a response — for callers that render HTML
 * (the admin panel) or need custom handling.
 */
function rateLimitHit(Database $db, string $key, int $maxAttempts, int $windowSeconds): bool {
    $db->ensureTable('rate_limits', "CREATE TABLE IF NOT EXISTS rate_limits (
            rkey CHAR(64) PRIMARY KEY,
            attempts INT NOT NULL,
            window_start DATETIME NOT NULL
        )");

    // Kaba ama bedava temizlik: yaklaşık 100 istekte bir, penceresi çoktan
    // dolmuş satırları sil. Ayrı bir cron gerekmiyor.
    if (random_int(1, 100) === 1) {
        try {
            $db->execute(
                'DELETE FROM rate_limits WHERE window_start < (NOW() - INTERVAL ? SECOND)',
                [max($windowSeconds, 86400)]
            );
        } catch (Throwable $e) {
            // Temizlik başarısız olsa da limitleme çalışmaya devam etmeli.
            error_log('[rate_limit] cleanup failed: ' . $e->getMessage());
        }
    }

    // Ham anahtar (ör. "login:<e-posta>:<ip>") saklanmıyor.
    $hashed = hash('sha256', $key);

    // Tek ifade, tek satır kilidi: pencere dolduysa sayacı 1'e çek ve
    // pencereyi yeniden başlat, aksi halde artır. Okuma-sonra-yazma yarışı
    // burada yapısal olarak yok.
    $db->execute(
        'INSERT INTO rate_limits (rkey, attempts, window_start)
         VALUES (?, 1, NOW())
         ON DUPLICATE KEY UPDATE
             attempts = IF(window_start < (NOW() - INTERVAL ? SECOND), 1, attempts + 1),
             window_start = IF(window_start < (NOW() - INTERVAL ? SECOND), NOW(), window_start)',
        [$hashed, $windowSeconds, $windowSeconds]
    );

    $row = $db->selectSingle('attempts FROM rate_limits WHERE rkey = ?', [$hashed]);
    $attempts = (int) ($row['attempts'] ?? 1);

    return $attempts <= $maxAttempts;
}

/**
 * JSON API'ler için: limit aşıldıysa 429 ile isteği sonlandırır.
 */
function checkRateLimit(Database $db, string $key, int $maxAttempts, int $windowSeconds): void {
    if (!rateLimitHit($db, $key, $maxAttempts, $windowSeconds)) {
        JsonResponse::error(
            'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
            429,
            AppConfig::ERR_VALIDATION
        );
    }
}

/**
 * Başarılı bir girişten sonra sayacı sıfırla — doğru parolayı bilen kullanıcı
 * kendi IP'sindeki başarısız denemelerin cezasını çekmemeli.
 */
function rateLimitReset(Database $db, string $key): void {
    try {
        $db->execute('DELETE FROM rate_limits WHERE rkey = ?', [hash('sha256', $key)]);
    } catch (Throwable $e) {
        error_log('[rate_limit] reset failed: ' . $e->getMessage());
    }
}
