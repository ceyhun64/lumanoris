<?php
/**
 * Migration checksum öz-testi (N-25) — salt okunur.
 *
 *   php api/database/migrate_selftest.php
 *
 * N-25: migrate.php checksum'ı dosyanın ham baytlarından alıyordu. Windows'ta
 * `core.autocrlf=true` ile alınmış bir kopyada (CRLF) uygulanmış 17 migration'ın
 * hepsi "UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ" görünüyordu; içerik aynıydı.
 *
 * A) migrationChecksum() CRLF / LF / CR farkından bağımsız.
 * B) schema_migrations'taki HER kayıt, dosyanın hem LF hem CRLF halinde yeni
 *    checksum'la eşleşiyor — yani değişiklik mevcut kayıtları "değişmiş"
 *    göstermiyor (veritabanına yazılmaz).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../functions/env.php';
require_once __DIR__ . '/../functions/db.php';

$pass = 0;
$fail = 0;
function check(string $label, bool $ok, string $detail = ''): void {
    global $pass, $fail;
    if ($ok) { $pass++; echo "  [OK]   $label\n"; }
    else     { $fail++; echo "  [FAIL] $label" . ($detail !== '' ? " — $detail" : '') . "\n"; }
}
function finish(): void {
    global $pass, $fail;
    echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
    exit($fail > 0 ? 1 : 0);
}

$lib = __DIR__ . '/migration_lib.php';
if (is_file($lib)) {
    require_once $lib;
}
if (!function_exists('migrationChecksum')) {
    check('migrationChecksum tanımlı (migration_lib.php)', false, 'fonksiyon yok');
    finish();
}

echo "\n=== A) Satır sonu bağımsızlığı ===\n\n";
$lf = "CREATE TABLE x (\n  id int\n);\n";
check('LF ile CRLF aynı checksum', migrationChecksum($lf) === migrationChecksum(str_replace("\n", "\r\n", $lf)));
check('LF ile tek CR aynı checksum', migrationChecksum($lf) === migrationChecksum(str_replace("\n", "\r", $lf)));
check('LF metnin checksum\'ı eski (ham sha256) ile aynı', migrationChecksum($lf) === hash('sha256', $lf));
check('içerik farkı hâlâ yakalanıyor', migrationChecksum($lf) !== migrationChecksum(str_replace('int', 'bigint', $lf)));

echo "\n=== B) Uygulanmış kayıtlar (salt okunur) ===\n\n";
$conn = Database::getInstance()->getConnection();
$rows = $conn->query('SELECT filename, checksum FROM schema_migrations ORDER BY filename')->fetchAll(PDO::FETCH_ASSOC);
if ($rows === []) {
    echo "  (schema_migrations boş — B atlandı)\n";
}
foreach ($rows as $row) {
    $file = __DIR__ . '/migrations/' . $row['filename'];
    if (!is_file($file)) {
        echo "  (dosya yok: {$row['filename']} — atlandı)\n";
        continue;
    }
    $raw    = (string) file_get_contents($file);
    $asLf   = str_replace(["\r\n", "\r"], "\n", $raw);
    $asCrlf = str_replace("\n", "\r\n", $asLf);
    check("{$row['filename']}: LF ve CRLF hali kayıtlı checksum'la eşleşiyor",
        migrationChecksum($asLf) === $row['checksum'] && migrationChecksum($asCrlf) === $row['checksum']);
}

finish();
