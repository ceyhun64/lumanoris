<?php
/**
 * Minimal fixed-window rate limiter backed by a single DB table.
 * No external dependency (Redis etc.) — fine at this traffic scale, and
 * matches how every other cross-cutting concern in this codebase is done
 * (a plain function + Database, not a library).
 */
function checkRateLimit(Database $db, string $key, int $maxAttempts, int $windowSeconds): void {
    $db->getConnection()->exec(
        "CREATE TABLE IF NOT EXISTS rate_limits (
            rkey VARCHAR(191) PRIMARY KEY,
            attempts INT NOT NULL,
            window_start DATETIME NOT NULL
        )"
    );

    $row = $db->selectSingle('* FROM rate_limits WHERE rkey = ?', [$key]);

    if (!$row) {
        $db->insert('rate_limits', ['rkey' => $key, 'attempts' => 1, 'window_start' => date('Y-m-d H:i:s')]);
        return;
    }

    $elapsed = time() - strtotime($row['window_start']);
    if ($elapsed > $windowSeconds) {
        $db->update('rate_limits', ['attempts' => 1, 'window_start' => date('Y-m-d H:i:s')], 'rkey = ?', [$key]);
        return;
    }

    if ((int) $row['attempts'] >= $maxAttempts) {
        JsonResponse::error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.', 429, AppConfig::ERR_VALIDATION);
    }

    $db->update('rate_limits', ['attempts' => (int) $row['attempts'] + 1], 'rkey = ?', [$key]);
}
