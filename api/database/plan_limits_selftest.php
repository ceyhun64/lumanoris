<?php
/**
 * Plan / kota öz-testi — SALT OKUNUR (veritabanına yazmaz).
 *
 *   php api/database/plan_limits_selftest.php
 *
 * Faz 3 test kuralı (docs/prompts/11-pazaryeri-revizyon.md):
 *
 *   A) REGRESYON — bugün DOĞRU olan davranış: ücretsiz plan 1 bağımsız /
 *      2 herkese açık bot / günlük 10 coin. Hem AppConfig geri düşüşü hem
 *      `plans` tablosu yolu. Bu bölüm her zaman yeşil kalmalı.
 *
 *   B) MÜŞTERİ PAKET TABLOSU (AUDIT.md, Faz 3) — bugün YANLIŞ olan
 *      davranış: `plans` seed'i (007) Altın'ı 10/15/200, Elmas'ı 599 ₺
 *      tutuyor. Bu bölüm paket verisi migration'ı uygulanana kadar
 *      KIRMIZIDIR; yanlış değerleri kilitlemiyor, doğrusunu tarif ediyor.
 *      "Sınırsız" ve yayından kaldırma hakkı şema kararına bağlı olduğu
 *      için burada henüz test edilmiyor.
 *
 * Bu dosya `api/database/` altında: üç denylist de (`api/.htaccess`,
 * `api/admin/.htaccess`, `api/router.php`) bu dizini web'den kapatıyor.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../src/autoload.php';
require_once __DIR__ . '/../functions/chatbot_limits.php';

$pass = 0;
$fail = 0;

function check(string $label, bool $ok, string $detail = ''): void {
    global $pass, $fail;
    if ($ok) { $pass++; echo "  [OK]   $label\n"; }
    else     { $fail++; echo "  [FAIL] $label" . ($detail !== '' ? " — $detail" : '') . "\n"; }
}

echo "\n=== A) REGRESYON — ücretsiz plan 1 / 2 / 10 ===\n\n";

check('AppConfig::FREE_INDEPENDENT_BOT_LIMIT = 1', AppConfig::FREE_INDEPENDENT_BOT_LIMIT === 1);
check('AppConfig::FREE_PUBLIC_BOT_LIMIT = 2', AppConfig::FREE_PUBLIC_BOT_LIMIT === 2);
check('AppConfig::DAILY_FREE_MESSAGES = 10', AppConfig::DAILY_FREE_MESSAGES === 10);

$fb = fallbackPlan();
check('fallbackPlan adı FREE_PLAN_NAME', $fb['name_tr'] === AppConfig::FREE_PLAN_NAME);
check('fallbackPlan 1 bağımsız', (int) $fb['independent_bot_limit'] === 1);
check('fallbackPlan 2 herkese açık', (int) $fb['public_bot_limit'] === 2);
check('fallbackPlan 10 günlük mesaj', (int) $fb['daily_message_limit'] === 10);

try {
    $db = Database::getInstance();
} catch (Throwable $e) {
    echo "\n  (veritabanı yok — tablo yolu atlandı: {$e->getMessage()})\n";
    echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
    exit($fail > 0 ? 1 : 0);
}

// Plan seçmemiş (ya da süresi dolmuş) bir kullanıcı varsayılan plana düşer.
$noPlanUser = $db->selectSingle(
    'k.id FROM kullanicilar k
     LEFT JOIN user_plan_selection s ON s.user_id = k.id
     WHERE s.user_id IS NULL
     ORDER BY k.id LIMIT 1'
);

if (!$noPlanUser) {
    echo "  (plan seçmemiş kullanıcı bulunamadı — kullanıcı yolu atlandı)\n";
} else {
    $uid = (int) $noPlanUser['id'];
    check('plansız kullanıcı: plan adı Ücretsiz', getUserPlanName($db, $uid) === AppConfig::FREE_PLAN_NAME,
        getUserPlanName($db, $uid));
    check('plansız kullanıcı: 1 bağımsız bot', getIndependentBotLimit($db, $uid) === 1,
        (string) getIndependentBotLimit($db, $uid));
    check('plansız kullanıcı: 2 herkese açık bot', getPublicBotLimit($db, $uid) === 2,
        (string) getPublicBotLimit($db, $uid));
    check('plansız kullanıcı: günlük 10 mesaj', getDailyMessageLimit($db, $uid) === 10,
        (string) getDailyMessageLimit($db, $uid));
}

echo "\n=== B) MÜŞTERİ PAKET TABLOSU — paket migration'ı uygulanana kadar KIRMIZI ===\n\n";

$catalog = [];
foreach (getPlanCatalog($db) as $p) {
    $catalog[$p['name_tr']] = $p;
}

// name => [aylık fiyat, günlük coin, bağımsız, herkese açık] — null = bu
// bölümde test edilmiyor (sınırsız; şema kararı bekliyor).
$expected = [
    'Ücretsiz' => [0.0,   10,  1,    2],
    'Gümüş'    => [149.0, 50,  3,    5],
    'Altın'    => [299.0, 100, 5,    10],
    'Elmas'    => [849.0, 200, null, null],
];

foreach ($expected as $name => [$price, $coin, $indep, $public]) {
    if (!isset($catalog[$name])) {
        check("$name planı katalogda var", false, 'plans tablosunda yok');
        continue;
    }
    $p = $catalog[$name];
    check("$name: aylık $price ₺", abs((float) $p['monthly_price'] - $price) < 0.001, (string) $p['monthly_price']);
    check("$name: günlük $coin coin", (int) $p['daily_message_limit'] === $coin, (string) $p['daily_message_limit']);
    if ($indep !== null) {
        check("$name: $indep bağımsız", (int) $p['independent_bot_limit'] === $indep, (string) $p['independent_bot_limit']);
    }
    if ($public !== null) {
        check("$name: $public herkese açık", (int) $p['public_bot_limit'] === $public, (string) $p['public_bot_limit']);
    }
}

echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
exit($fail > 0 ? 1 : 0);
