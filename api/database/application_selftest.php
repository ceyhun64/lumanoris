<?php
/**
 * Pazaryeri başvurusu öz-testi (Faz 5, madde 3) — KALICI YAZMA YOK.
 *
 *   php api/database/application_selftest.php
 *
 * A) Doğrulama (saf fonksiyon): GK-7 alanları, GK-8 hesap türleri, GK-24
 *    vergi no / MERSİS kuralı, IBAN mod97, 18 yaş, beyaz liste.
 * B) Gönderim akışı (transaction + ROLLBACK): ilk gönderim, rejected →
 *    yeniden gönderim, reviewed → 409 (GK-20, GK-21).
 * C) "Kaydı var" kuralı (GK-22): yeni tabloda submitted/reviewed VEYA eski
 *    tabloda active/suspended; eski pending/rejected ve yeni rejected SAYILMAZ.
 *
 * `api/database/` üç denylist tarafından da web'e kapalı.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../src/autoload.php';

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

$helper = __DIR__ . '/../functions/marketplace_application.php';
if (!is_file($helper)) {
    check('functions/marketplace_application.php mevcut', false, 'dosya yok');
    finish();
}
require_once $helper;

$need = ['validateMarketplaceApplication', 'submitMarketplaceApplication', 'getMarketplaceApplication',
         'hasMarketplaceRegistration', 'maskIban'];
$missing = array_values(array_filter($need, fn($f) => !function_exists($f)));
check('başvuru yardımcıları tanımlı', $missing === [], 'eksik: ' . implode(', ', $missing));
if ($missing !== []) finish();

$valid = [
    'account_type'          => 'kurumsal',
    'company_title'         => 'Örnek Yazılım Ltd. Şti.',
    'tax_number'            => '1234567890',
    'tax_office'            => 'Kadıköy',
    'mersis_no'             => '0123456789012345',
    'authorized_first_name' => 'Ayşe',
    'authorized_last_name'  => 'Yılmaz',
    'authorized_birth_date' => '1990-01-01',
    'iban'                  => 'TR33 0006 1005 1978 6457 8413 26',
    'il'                    => 'İstanbul',
    'ilce'                  => 'Kadıköy',
    'address'               => 'Örnek Mah. Deneme Sk. No:1',
];
$errorsOf = function (array $input): array {
    try { validateMarketplaceApplication($input); return []; }
    catch (ValidationException $e) { return $e->getErrors() ?: ['_' => $e->getMessage()]; }
};
$cleanOf = fn(array $input) => validateMarketplaceApplication($input);

echo "\n=== A) Doğrulama ===\n\n";

check('geçerli kurumsal başvuru kabul', $errorsOf($valid) === [], json_encode($errorsOf($valid), JSON_UNESCAPED_UNICODE));
$c = $cleanOf($valid);
check('IBAN normalize edilir (boşluksuz, büyük harf)', ($c['iban'] ?? '') === 'TR330006100519786457841326');
check('bilinmeyen alan reddedilir (beyaz liste)', isset($errorsOf($valid + ['status' => 'reviewed'])['_fields']));
check('bireysel hesap türü reddedilir (GK-8)', isset($errorsOf(['account_type' => 'bireysel'] + $valid)['account_type']));
check('kurumsalda 11 haneli vergi no reddedilir', isset($errorsOf(['tax_number' => '10000000146'] + $valid)['tax_number']));
check('kurumsalda MERSİS zorunlu (GK-24)', isset($errorsOf(['mersis_no' => ''] + $valid)['mersis_no']));
check('MERSİS 16 hane rakam', isset($errorsOf(['mersis_no' => '123'] + $valid)['mersis_no']));
$sahis = ['account_type' => 'sahis', 'tax_number' => '10000000146', 'mersis_no' => ''] + $valid;
check('şahısta TCKN + MERSİS boş kabul (GK-24)', $errorsOf($sahis) === [], json_encode($errorsOf($sahis), JSON_UNESCAPED_UNICODE));
check('şahısta VKN de kabul', $errorsOf(['tax_number' => '1234567890'] + $sahis) === []);
check('şahısta hatalı TCKN reddedilir', isset($errorsOf(['tax_number' => '12345678901'] + $sahis)['tax_number']));
check('geçersiz IBAN reddedilir', isset($errorsOf(['iban' => 'TR000006100519786457841326'] + $valid)['iban']));
$under = date('Y-m-d', strtotime('-17 years'));
check('18 yaş altı yetkili reddedilir', isset($errorsOf(['authorized_birth_date' => $under] + $valid)['authorized_birth_date']));
check('geçersiz tarih reddedilir', isset($errorsOf(['authorized_birth_date' => '1990-02-31'] + $valid)['authorized_birth_date']));
check('zorunlu alan boşsa reddedilir', isset($errorsOf(['company_title' => '  '] + $valid)['company_title']));
check('maskIban son 4 hane', maskIban('TR330006100519786457841326') === 'TR** **** **** **** **** **13 26'
    || str_ends_with(maskIban('TR330006100519786457841326'), '1326'), maskIban('TR330006100519786457841326'));

$db   = Database::getInstance();
$conn = $db->getConnection();

echo "\n=== B) Gönderim akışı (rollback) ===\n\n";

$user = $db->selectSingle(
    "k.id FROM kullanicilar k
     LEFT JOIN marketplace_applications m ON m.user_id = k.id
     LEFT JOIN param_marketplace_sellers p ON p.user_id = k.id
     WHERE m.id IS NULL AND p.user_id IS NULL ORDER BY k.id LIMIT 1"
);
if (!$user) {
    echo "  (başvurusu ve satıcı kaydı olmayan kullanıcı yok — B/C atlandı)\n";
    finish();
}
$uid = (int) $user['id'];

$conn->beginTransaction();
try {
    check('başvuru öncesi kayıt yok', !hasMarketplaceRegistration($db, $uid));
    $r = submitMarketplaceApplication($db, $uid, $cleanOf($valid));
    check('ilk gönderim → submitted', ($r['status'] ?? null) === 'submitted', json_encode($r, JSON_UNESCAPED_UNICODE));
    check('gönderilmiş başvuru "kaydı var" (GK-22)', hasMarketplaceRegistration($db, $uid));

    $db->execute("UPDATE marketplace_applications SET status = 'rejected', review_note = 'test' WHERE user_id = ?", [$uid]);
    check('rejected başvuru "kaydı var" SAYILMAZ', !hasMarketplaceRegistration($db, $uid));
    $r = submitMarketplaceApplication($db, $uid, $cleanOf(['company_title' => 'Yeni Unvan A.Ş.'] + $valid));
    $row = getMarketplaceApplication($db, $uid);
    check('rejected → yeniden gönderim submitted olur', ($row['status'] ?? null) === 'submitted');
    check('yeniden gönderim aynı satırı günceller (GK-20)',
        (int) $db->selectSingle('COUNT(*) AS c FROM marketplace_applications WHERE user_id = ?', [$uid])['c'] === 1
        && ($row['company_title'] ?? '') === 'Yeni Unvan A.Ş.');
    check('yeniden gönderim inceleme notunu temizler', ($row['review_note'] ?? null) === null);

    $db->execute("UPDATE marketplace_applications SET status = 'reviewed' WHERE user_id = ?", [$uid]);
    check('reviewed başvuru "kaydı var"', hasMarketplaceRegistration($db, $uid));
    $threw = null;
    try { submitMarketplaceApplication($db, $uid, $cleanOf($valid)); }
    catch (AppException $e) { $threw = $e; }
    check('reviewed başvuru değiştirilemez (GK-21, 409)', $threw !== null && $threw->getCode() === 409,
        $threw ? get_class($threw) . ' ' . $threw->getCode() : 'istisna yok');

    echo "\n=== C) Eski satıcı tablosu (GK-22) ===\n\n";
    // Yeni tablodaki başvuru sayılmayan duruma çekiliyor (silme yok), böylece
    // sonuç yalnızca eski tabloya bağlı kalıyor.
    $db->execute("UPDATE marketplace_applications SET status = 'rejected' WHERE user_id = ?", [$uid]);
    foreach (['pending' => false, 'rejected' => false, 'active' => true, 'suspended' => true] as $st => $expect) {
        $db->execute(
            "INSERT INTO param_marketplace_sellers (user_id, status) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status)",
            [$uid, $st]
        );
        check("eski tablo '$st' → kaydı var = " . ($expect ? 'evet' : 'hayır'), hasMarketplaceRegistration($db, $uid) === $expect);
    }
} finally {
    $conn->rollBack();
}
check('rollback sonrası test kullanıcısında başvuru yok', getMarketplaceApplication($db, $uid) === null);

finish();
