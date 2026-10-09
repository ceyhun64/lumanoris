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

echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
exit($fail > 0 ? 1 : 0);
