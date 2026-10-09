<?php
/**
 * Erişim / listeleme öz-testi (Faz 4, madde 10) — KALICI YAZMA YOK.
 *
 *   php api/database/access_selftest.php
 *
 * Senaryo verisi (ücretsiz herkese açık bot, pasif satıcı) tek bir
 * transaction içinde kurulur ve sonda ROLLBACK edilir.
 *
 * Kilitlenen kurallar (AUDIT.md, Faz 4 matrisi):
 *   • Özel bot: kimseye görünmez, kimse sohbet edemez (sahibi hariç).
 *   • Ücretsiz herkese açık: vitrinde, herkes sohbet eder; persona/eğitim
 *     ('full') kapalı.
 *   • Fiyatlı + aktif satıcı: vitrinde, abonelik olmadan sohbet YOK.
 *   • Fiyatlı + pasif satıcı: vitrinde değil, sohbet yok.
 *   • Persona (`style_prompt`) yalnızca sahibin getDetail yanıtında.
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

$db   = Database::getInstance();
$conn = $db->getConnection();
$repo = new ChatbotRepository();

$priced = $db->selectSingle(
    "c.id, c.author_user_id FROM chatbotlar c
     JOIN param_marketplace_sellers p ON p.user_id = c.author_user_id AND p.status = 'active'
     WHERE c.is_independent = 0 AND c.ucret_haftalik > 0 ORDER BY c.id LIMIT 1"
);
$private = $db->selectSingle('c.id, c.author_user_id FROM chatbotlar c WHERE c.is_independent = 1 ORDER BY c.id LIMIT 1');
if (!$priced || !$private) {
    echo "  (senaryo için gereken bot yok: fiyatlı+aktif satıcı ve özel bot gerekli — atlandı)\n";
    echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
    exit(0);
}
$freeCandidate = $db->selectSingle(
    "c.id, c.author_user_id FROM chatbotlar c
     LEFT JOIN param_marketplace_sellers p ON p.user_id = c.author_user_id AND p.status = 'active'
     WHERE c.is_independent = 1 AND p.user_id IS NULL AND c.id <> ? ORDER BY c.id LIMIT 1",
    [$private['id']]
);
$stranger = $db->selectSingle(
    "k.id FROM kullanicilar k
     WHERE k.id NOT IN (?, ?, ?)
       AND NOT EXISTS (SELECT 1 FROM user_subscriptions us WHERE us.user_id = k.id AND us.status = 1 AND us.expiry_date > NOW())
     ORDER BY k.id LIMIT 1",
    [$priced['author_user_id'], $private['author_user_id'], $freeCandidate['author_user_id'] ?? 0]
);
$U = (int) $stranger['id'];

$listed = function (int $id) use ($repo): bool {
    foreach ($repo->getPublished(['limit' => 200]) as $b) {
        if ((int) $b['id'] === $id) return true;
    }
    return false;
};
$persona = fn(?array $d) => $d !== null && array_key_exists('style_prompt', $d);

echo "\n=== Erişim matrisi (U = #$U: sahip değil, aboneliği yok) ===\n\n";

$conn->beginTransaction();
try {
    // Özel bot
    $id = (int) $private['id'];
    check("özel #$id: vitrinde değil", !$listed($id));
    check("özel #$id: U preview yok", !$repo->userHasAccess($id, $U, 'preview'));
    check("özel #$id: U sohbet yok", !$repo->userHasAccess($id, $U, 'chat'));
    check("özel #$id: U detay yok", $repo->getDetail($id, $U) === null);
    check("özel #$id: sahibi sohbet eder", $repo->userHasAccess($id, (int) $private['author_user_id'], 'chat'));

    // Ücretsiz herkese açık (yazarı satıcı değil)
    if ($freeCandidate) {
        $id = (int) $freeCandidate['id'];
        $db->execute('UPDATE chatbotlar SET is_independent = 0, ucret_haftalik = NULL, ucret_aylik = NULL WHERE id = ?', [$id]);
        check("ücretsiz #$id: vitrinde", $listed($id));
        check("ücretsiz #$id: U preview var", $repo->userHasAccess($id, $U, 'preview'));
        check("ücretsiz #$id: U sohbet eder", $repo->userHasAccess($id, $U, 'chat'));
        check("ücretsiz #$id: U full (persona/eğitim) YOK", !$repo->userHasAccess($id, $U, 'full'));
        $d = $repo->getDetail($id, $U);
        check("ücretsiz #$id: getDetail has_access", ($d['has_access'] ?? false) === true);
        check("ücretsiz #$id: getDetail persona YOK", !$persona($d));
        check("ücretsiz #$id: sahibine persona döner", $persona($repo->getDetail($id, (int) $freeCandidate['author_user_id'])));
        // N-24: istemci "Sepete Ekle"yi sahibe göstermemek için bunu okur.
        check("ücretsiz #$id: getDetail is_owner false (U)", ($d['is_owner'] ?? null) === false);
        check("ücretsiz #$id: getDetail is_owner true (sahip)", ($repo->getDetail($id, (int) $freeCandidate['author_user_id'])['is_owner'] ?? null) === true);
    } else {
        echo "  (satıcı olmayan yazarın özel botu yok — ücretsiz senaryo atlandı)\n";
    }

    // Fiyatlı + aktif satıcı
    $id = (int) $priced['id'];
    check("fiyatlı-aktif #$id: vitrinde", $listed($id));
    check("fiyatlı-aktif #$id: U preview var", $repo->userHasAccess($id, $U, 'preview'));
    check("fiyatlı-aktif #$id: U abonelik olmadan sohbet YOK", !$repo->userHasAccess($id, $U, 'chat'));
    $d = $repo->getDetail($id, $U);
    check("fiyatlı-aktif #$id: getDetail has_access false", ($d['has_access'] ?? null) === false);
    check("fiyatlı-aktif #$id: getDetail persona YOK", !$persona($d));
    check("fiyatlı-aktif #$id: getDetail is_owner false (U)", ($d['is_owner'] ?? null) === false);

    // N-27 — ana sayfa bot seçicisinin kilidi sohbet kuralıyla AYNI kaynaktan.
    if (!method_exists($repo, 'chatAccessibleIds')) {
        check('N-27: ChatbotRepository::chatAccessibleIds tanımlı', false, 'metot yok');
    } else {
        $ids = array_values(array_filter([$freeCandidate ? (int) $freeCandidate['id'] : 0, $id]));
        $got = $repo->chatAccessibleIds($ids, $U);
        $want = array_values(array_filter($ids, fn($x) => $repo->userHasAccess($x, $U, 'chat')));
        sort($got); sort($want);
        check('N-27: seçici erişimi = userHasAccess(chat) [' . implode(',', $ids) . ']', $got === $want, json_encode(['got' => $got, 'want' => $want]));
        if ($freeCandidate) check('N-27: ücretsiz herkese açık bot seçicide açık', in_array((int) $freeCandidate['id'], $got, true));
        check("N-27: fiyatlı #$id (abonelik yok) seçicide kilitli", !in_array($id, $got, true));
    }

    // Fiyatlı + pasif satıcı
    $other = $db->selectSingle(
        'c.id, c.author_user_id FROM chatbotlar c WHERE c.is_independent = 0 AND c.ucret_haftalik > 0 AND c.author_user_id <> ? ORDER BY c.id LIMIT 1',
        [$priced['author_user_id']]
    );
    if ($other) {
        $db->execute("UPDATE param_marketplace_sellers SET status = 'suspended' WHERE user_id = ?", [$other['author_user_id']]);
        $id = (int) $other['id'];
        check("fiyatlı-pasif #$id: vitrinde değil", !$listed($id));
        check("fiyatlı-pasif #$id: U preview yok", !$repo->userHasAccess($id, $U, 'preview'));
        check("fiyatlı-pasif #$id: U sohbet yok", !$repo->userHasAccess($id, $U, 'chat'));
    } else {
        echo "  (ayrı yazarlı ikinci fiyatlı bot yok — pasif satıcı senaryosu atlandı)\n";
    }
} finally {
    $conn->rollBack();
}

check('rollback sonrası senaryo verisi geri alındı',
    !$freeCandidate || (int) $db->selectSingle('is_independent FROM chatbotlar WHERE id = ?', [$freeCandidate['id']])['is_independent'] === 1);

echo "\n--- N-26: \"Daha Önce Satıldı\" yalnızca gerçek satış kaydıyla ---\n";
// Eskiden getPublished `1 AS durum` döndürüyordu; arayüz her bota rozet basıyordu.
$rows = $repo->getPublished(['limit' => 200, 'offset' => 0]);
$mismatch = [];
$withSales = 0;
foreach ($rows as $row) {
    if (!array_key_exists('has_sales', $row)) { $mismatch[] = "#{$row['id']} has_sales yok"; continue; }
    $real = (int) $db->selectSingle(
        '((SELECT COUNT(*) FROM user_subscriptions WHERE chatbot_id = ?) + (SELECT COUNT(*) FROM chatbot_purchase_credits WHERE chatbot_id = ?)) AS n',
        [$row['id'], $row['id']]
    )['n'] > 0;
    if ((bool) (int) $row['has_sales'] !== $real) $mismatch[] = "#{$row['id']} has_sales={$row['has_sales']} gerçek=" . (int) $real;
    $withSales += $real ? 1 : 0;
}
check('vitrin satırlarında has_sales gerçek satış kaydıyla aynı (' . count($rows) . " bot, $withSales satışlı)", $mismatch === [], implode('; ', array_slice($mismatch, 0, 5)));

// Olumlu durum: satış kaydı eklenince (rollback) rozet bayrağı açılır.
$probe = null;
foreach ($rows as $row) { if (!(int) ($row['has_sales'] ?? 0)) { $probe = (int) $row['id']; break; } }
if ($probe) {
    $conn->beginTransaction();
    try {
        $db->execute(
            'INSERT INTO user_subscriptions (user_id, chatbot_id, duration_weeks, expiry_date, status) VALUES (?, ?, 1, NOW() - INTERVAL 1 DAY, 0)',
            [$U, $probe]
        );
        $after = null;
        foreach ($repo->getPublished(['limit' => 200, 'offset' => 0]) as $row) { if ((int) $row['id'] === $probe) $after = $row; }
        check("satış kaydı eklenen #$probe: has_sales 1 (süresi dolmuş abonelik de satıştır)", (int) ($after['has_sales'] ?? 0) === 1);
    } finally {
        $conn->rollBack();
    }
}

echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
exit($fail > 0 ? 1 : 0);
