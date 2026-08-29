<?php
/**
 * Sözleşme metinlerini global_vars'a tohumlar.
 *
 * Neden gerekli: beş sözleşmenin de global_vars değeri BOŞTU. Bunun iki
 * görünür sonucu vardı:
 *   • Admin panelinde sözleşme sayfaları boş bir editörle açılıyordu.
 *   • Frontend'de içeriği API'den çeken popup'lar (gizlilik, kullanım,
 *     mesafeli satış, teslimat) bomboş bir modal gösteriyordu.
 *
 * Metinler daha önce JSX dosyalarına gömülüydü; scripts/extract ile HTML'e
 * çevrilip seed_contracts.json'a yazıldı. Bu dosya onu veritabanına aktarır.
 *
 * Güvenli: yalnızca BOŞ olan anahtarları doldurur. Admin panelinden girilmiş
 * bir metnin üzerine asla yazmaz. İstenirse --force ile tümü yenilenir.
 *
 * Kullanım:
 *   php api/database/seed_contracts.php            (kuru çalışma — ne yapacağını yazar)
 *   php api/database/seed_contracts.php --apply
 *   php api/database/seed_contracts.php --apply --force
 */

require_once __DIR__ . '/../src/autoload.php';

$apply = in_array('--apply', $argv, true);
$force = in_array('--force', $argv, true);

$jsonPath = __DIR__ . '/seed_contracts.json';
if (!is_file($jsonPath)) {
    fwrite(STDERR, "seed_contracts.json bulunamadı: $jsonPath\n");
    exit(1);
}

$seed = json_decode((string) file_get_contents($jsonPath), true);
if (!is_array($seed)) {
    fwrite(STDERR, "seed_contracts.json okunamadı veya geçersiz.\n");
    exit(1);
}

$db      = Database::getInstance();
$keys    = array_keys($seed);
$current = $db->getGlobalVars(...$keys) ?: [];

$planned = [];
foreach ($seed as $key => $html) {
    $existing = trim((string) ($current[$key] ?? ''));
    if ($existing !== '' && !$force) {
        printf("  [=] %-24s dolu (%d karakter) — atlandı\n", $key, strlen($existing));
        continue;
    }
    $planned[$key] = $html;
    printf("  [%s] %-24s %d karakter yazılacak\n", $apply ? '>' : ' ', $key, strlen($html));
}

if ($planned === []) {
    echo "\nYapılacak bir şey yok.\n";
    exit(0);
}

if (!$apply) {
    echo "\nKuru çalışma. Uygulamak için: php api/database/seed_contracts.php --apply\n";
    exit(0);
}

$conn = $db->getConnection();
$stmt = $conn->prepare(
    'INSERT INTO global_vars (var_key, var_value) VALUES (:k, :v)
     ON DUPLICATE KEY UPDATE var_value = VALUES(var_value)'
);

foreach ($planned as $key => $html) {
    $stmt->execute([':k' => $key, ':v' => $html]);
}

echo "\n" . count($planned) . " sözleşme yazıldı.\n";
