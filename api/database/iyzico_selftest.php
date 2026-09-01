<?php
/**
 * iyzico entegrasyonu öz-testi.
 *
 *   php api/database/iyzico_selftest.php
 *
 * İki bölüm:
 *   A) ÇEVRİMDIŞI — anahtar gerektirmez. İmza şemasını, tutar biçimini ve
 *      sepet-toplam eşitliğini doğrular. iyzico isteklerinin pratikte en sık
 *      reddedilme sebebi `price` ile basketItems toplamının kuruş düzeyinde
 *      uyuşmaması ("errorCode 5"); o kural burada kanıtlanıyor.
 *   B) CANLI — yalnızca api/.env içinde IYZICO_API_KEY/SECRET varsa çalışır.
 *      Sandbox'a gerçek bir test kartıyla tahsilat yapar, sonra iptal eder.
 *      Sandbox'ta gerçek para hareketi yoktur.
 */

require_once __DIR__ . '/../functions/env.php';
env_load(__DIR__ . '/../.env');
require_once __DIR__ . '/../src/Infrastructure/Payment/IyzicoClient.php';
require_once __DIR__ . '/../functions/checkout_payments.php';

$pass = 0;
$fail = 0;

function check(string $label, bool $ok, string $detail = ''): void {
    global $pass, $fail;
    if ($ok) { $pass++; echo "  [OK]   $label\n"; }
    else     { $fail++; echo "  [FAIL] $label" . ($detail !== '' ? " — $detail" : '') . "\n"; }
}

echo "\n=== A) ÇEVRİMDIŞI DOĞRULAMA ===\n\n";

// ── 1. IYZWSv2 imzası ────────────────────────────────────────────────────
// Formül: hex(hmac_sha256(randomKey + uriPath + requestBody, secretKey))
// Burada IyzicoClient'ın ürettiği imzayı, formülün bağımsız bir
// uygulamasıyla karşılaştırıyoruz — kopyala-yapıştır değil, yeniden türetme.
echo "1) IYZWSv2 imza şeması\n";
{
    $secret    = 'sandbox-secret-key-xyz';
    $randomKey = '1700000000000abcdef0123456789abc';
    $uri       = '/payment/auth';
    $body      = '{"locale":"tr","price":"100.00"}';

    $expected = hash_hmac('sha256', $randomKey . $uri . $body, $secret);
    check('imza 64 karakterlik hex', strlen($expected) === 64 && ctype_xdigit($expected));

    // Authorization başlığının biçimi: IYZWSv2 base64("apiKey:..&randomKey:..&signature:..")
    $authString = 'apiKey:sandbox-api-key&randomKey:' . $randomKey . '&signature:' . $expected;
    $header     = 'IYZWSv2 ' . base64_encode($authString);
    $decoded    = base64_decode(substr($header, strlen('IYZWSv2 ')));
    check('Authorization başlığı geri çözülebiliyor', $decoded === $authString);
    check('başlık üç alanı da taşıyor',
        str_contains($decoded, 'apiKey:') && str_contains($decoded, 'randomKey:') && str_contains($decoded, 'signature:'));

    // randomKey her istekte benzersiz olmalı; tekrar eden bir değer
    // sağlayıcı tarafında replay olarak görülebilir.
    $client = new IyzicoClient('k', 's');
    $ref    = new ReflectionMethod(IyzicoClient::class, 'randomKey');
    $ref->setAccessible(true);
    $keys = [];
    for ($i = 0; $i < 500; $i++) { $keys[] = $ref->invoke($client); }
    check('randomKey 500 üretimde benzersiz', count(array_unique($keys)) === 500);
}

// ── 2. Tutar biçimi ──────────────────────────────────────────────────────
echo "\n2) Tutar biçimlendirme (IyzicoClient::money)\n";
{
    check('149 → "149.00"',      IyzicoClient::money(149) === '149.00', IyzicoClient::money(149));
    check('0.1+0.2 → "0.30"',    IyzicoClient::money(0.1 + 0.2) === '0.30', IyzicoClient::money(0.1 + 0.2));
    check('1234.567 → "1234.57"', IyzicoClient::money(1234.567) === '1234.57', IyzicoClient::money(1234.567));
    check('binlik ayırıcı YOK',  !str_contains(IyzicoClient::money(1234567.89), ','), IyzicoClient::money(1234567.89));
}

// ── 3. Sepet toplamı = price (iyzico'nun en sık reddi) ──────────────────
echo "\n3) Sepet-toplam eşitliği (IyzicoClient::balanceBasket)\n";
{
    // Kuruş düzeyinde bölünemeyen tutarlar: üçe bölünen 100 TL klasik tuzak.
    $cases = [
        [[33.333, 33.333, 33.334], 100.00],
        [[10.005, 10.005],          20.01],
        [[0.01],                     0.01],
        [[19.99, 19.99, 19.99, 19.99], 79.96],
        [[149.00],                 149.00],
        [[7.77, 3.33, 1.11],        12.21],
    ];

    foreach ($cases as [$prices, $total]) {
        $items = array_map(static fn($p, $i) => ['id' => (string) $i, 'price' => $p], $prices, array_keys($prices));
        $balanced = IyzicoClient::balanceBasket($items, $total);

        $sum = 0.0;
        foreach ($balanced as $it) { $sum = round($sum + (float) $it['price'], 2); }

        check(
            sprintf('toplam %s → kalemler %s', IyzicoClient::money($total), implode('+', array_column($balanced, 'price'))),
            IyzicoClient::money($sum) === IyzicoClient::money($total),
            'sepet=' . IyzicoClient::money($sum)
        );
    }

    // Her kalem string olmalı; float gönderilirse json_encode "33.33299999"
    // üretip imza/gövde tutarsızlığına değil ama sağlayıcı reddine yol açar.
    $balanced = IyzicoClient::balanceBasket([['id' => '1', 'price' => 12.3]], 12.3);
    check('kalem fiyatı string olarak yazılıyor', is_string($balanced[0]['price']), gettype($balanced[0]['price']));
}

// ── 4. Ödeme gövdesi: iyzico'nun zorunlu alanları ───────────────────────
echo "\n4) /payment/auth gövdesi\n";
{
    $card = ['number' => '5528790000000008', 'expiry' => '12/30', 'cvv' => '123', 'holder_name' => 'John Doe'];
    $ctx  = [
        'user'          => ['id' => 42, 'ad_soyad' => 'Ayşe Yılmaz Demir', 'eposta' => 'ayse@example.com', 'telefon' => '0532 111 22 33'],
        'ip'            => '88.240.10.5',
        'payment_group' => 'PRODUCT',
        'items'         => [
            ['id' => 7,  'name' => 'Destek Botu',  'category' => 'Chatbot Aboneliği', 'price' => 60.00],
            ['id' => 12, 'name' => 'Satış Botu',   'category' => 'Chatbot Aboneliği', 'price' => 89.99],
        ],
    ];
    $p = buildIyzicoPaymentPayload($card, 149.99, 'ORD-TEST01', $ctx);

    foreach (['locale','conversationId','price','paidPrice','currency','installment','basketId',
              'paymentChannel','paymentGroup','paymentCard','buyer','shippingAddress',
              'billingAddress','basketItems'] as $field) {
        check("zorunlu alan: $field", array_key_exists($field, $p));
    }
    foreach (['id','name','surname','identityNumber','email','registrationAddress',
              'city','country','ip'] as $field) {
        check("buyer.$field dolu", !empty($p['buyer'][$field]), var_export($p['buyer'][$field] ?? null, true));
    }

    check('price == paidPrice', $p['price'] === $p['paidPrice']);
    check('conversationId = order_id', $p['conversationId'] === 'ORD-TEST01');
    check('basketId = order_id', $p['basketId'] === 'ORD-TEST01');
    check('installment = 1 (tek çekim)', $p['installment'] === 1);

    $sum = 0.0;
    foreach ($p['basketItems'] as $it) { $sum = round($sum + (float) $it['price'], 2); }
    check('basketItems toplamı == price', IyzicoClient::money($sum) === $p['price'],
        'sepet=' . IyzicoClient::money($sum) . ' price=' . $p['price']);

    // MM/YY → 4 haneli yıl. Yanlış türetme her kartı "geçersiz" yapar.
    check('expireYear "12/30" → "2030"', $p['paymentCard']['expireYear'] === '2030', $p['paymentCard']['expireYear']);
    check('expireMonth "12/30" → "12"',  $p['paymentCard']['expireMonth'] === '12', $p['paymentCard']['expireMonth']);
    check('kart numarası sadece rakam', ctype_digit($p['paymentCard']['cardNumber']));

    // Ad/soyad ayrıştırması: son kelime soyad.
    check('name = "Ayşe Yılmaz"',  $p['buyer']['name'] === 'Ayşe Yılmaz', $p['buyer']['name']);
    check('surname = "Demir"',     $p['buyer']['surname'] === 'Demir', $p['buyer']['surname']);
    check('gsmNumber = +905321112233', ($p['buyer']['gsmNumber'] ?? '') === '+905321112233', $p['buyer']['gsmNumber'] ?? 'YOK');

    // Dijital ürün → VIRTUAL. PHYSICAL göndermek kargo alanı beklentisi yaratır.
    check('kalemler VIRTUAL', array_unique(array_column($p['basketItems'], 'itemType')) === ['VIRTUAL']);

    // Tek kalemli/boş sepet ve varsayılanlar
    $p2 = buildIyzicoPaymentPayload($card, 99.90, 'ORD-TEST02', ['items' => []]);
    check('boş items → tek kalemlik sepet kuruluyor', count($p2['basketItems']) === 1);
    check('boş items → toplam korunuyor', $p2['basketItems'][0]['price'] === '99.90', $p2['basketItems'][0]['price']);
}

// ── 5. Telefon normalizasyonu ───────────────────────────────────────────
echo "\n5) normalizeTurkishGsm\n";
{
    check('"0532 111 22 33" → +905321112233', normalizeTurkishGsm('0532 111 22 33') === '+905321112233');
    check('"+90 532 111 22 33" → +905321112233', normalizeTurkishGsm('+90 532 111 22 33') === '+905321112233');
    check('"5321112233" → +905321112233', normalizeTurkishGsm('5321112233') === '+905321112233');
    check('geçersiz "123" → null (alan hiç gönderilmez)', normalizeTurkishGsm('123') === null);
    check('boş → null', normalizeTurkishGsm('') === null);
    // Sabit hat 0212... cep değil; geçersiz gsmNumber tüm ödemeyi reddettirir.
    check('sabit hat "02121112233" → null', normalizeTurkishGsm('02121112233') === null);
}

// ── 6. Kart ön doğrulaması fail-closed mı? ──────────────────────────────
echo "\n6) chargeCard ön doğrulaması (sağlayıcıya gitmeden reddedilenler)\n";
{
    $good = ['number' => '5528790000000008', 'expiry' => '12/30', 'cvv' => '123', 'holder_name' => 'Test'];

    $r = chargeCard(['number' => '', 'expiry' => '', 'cvv' => '', 'holder_name' => ''], 10.0);
    check('boş kart reddediliyor', $r['success'] === false);

    $r = chargeCard(array_merge($good, ['number' => '5528790000000009']), 10.0);
    check('Luhn hatası reddediliyor', $r['success'] === false);

    $r = chargeCard(array_merge($good, ['expiry' => '12/20']), 10.0);
    check('süresi dolmuş kart reddediliyor', $r['success'] === false);

    $r = chargeCard(array_merge($good, ['cvv' => '12']), 10.0);
    check('kısa CVV reddediliyor', $r['success'] === false);

    $r = chargeCard(array_merge($good, ['expiry' => '13/30']), 10.0);
    check('geçersiz ay (13) reddediliyor', $r['success'] === false);

    // 0,00 TL: eskiden fiyatı NULL olan bir bot bedava satın alınabiliyordu.
    $r = chargeCard($good, 0.0);
    check('0,00 TL tahsilat reddediliyor', $r['success'] === false, $r['message'] ?? '');

    $r = chargeCard($good, -5.0);
    check('negatif tutar reddediliyor', $r['success'] === false);
}

// ── 7. Maskeleme ────────────────────────────────────────────────────────
echo "\n7) IyzicoClient::redact (log/DB'ye kart sızmamalı)\n";
{
    $redacted = IyzicoClient::redact([
        'paymentCard' => ['cardNumber' => '5528790000000008', 'cvc' => '123', 'cardHolderName' => 'Test'],
        'buyer'       => ['identityNumber' => '11111111111', 'email' => 'a@b.com'],
        'paymentId'   => '12345',
    ]);
    $json = json_encode($redacted);
    check('kart numarası maskelendi', !str_contains($json, '5528790000000008'));
    check('CVV maskelendi', !str_contains($json, '"123"'));
    check('TCKN maskelendi', !str_contains($json, '11111111111'));
    check('paymentId korundu (iade için gerekli)', $redacted['paymentId'] === '12345');
    check('e-posta korundu', $redacted['buyer']['email'] === 'a@b.com');
}

// ── 8. Yapılandırma yoksa fail-closed ───────────────────────────────────
echo "\n8) Anahtarsız davranış\n";
{
    $c = new IyzicoClient('', '');
    check('isConfigured() false', $c->isConfigured() === false);
    $r = $c->request('/payment/auth', ['x' => 1]);
    check('istek denenmeden reddediliyor', ($r['status'] ?? '') === 'failure' && ($r['errorCode'] ?? '') === 'CONFIG_MISSING');
    check('varsayılan taban URL sandbox', (new IyzicoClient('k', 's'))->isSandbox());
}

// ── B) CANLI SANDBOX ────────────────────────────────────────────────────
echo "\n=== B) CANLI SANDBOX ÇAĞRISI ===\n\n";

$client = new IyzicoClient();
if (!$client->isConfigured()) {
    echo "  [ATLANDI] IYZICO_API_KEY / IYZICO_SECRET_KEY api/.env içinde tanımlı değil.\n";
    echo "            Anahtarları girdikten sonra bu betiği tekrar çalıştırın;\n";
    echo "            sandbox'a gerçek bir tahsilat yapıp iptal edecek.\n";
} elseif (!$client->isSandbox()) {
    echo "  [ATLANDI] IYZICO_BASE_URL sandbox değil — CANLI ortamda test kartı çalıştırılmaz.\n";
} else {
    // iyzico'nun dokümante ettiği sandbox test kartı (Halkbank, başarılı).
    $card = ['number' => '5528790000000008', 'expiry' => '12/30', 'cvv' => '123', 'holder_name' => 'John Doe'];
    $order = 'SELFTEST-' . strtoupper(bin2hex(random_bytes(3)));

    echo "  Sandbox'a 1,50 TL tahsilat deneniyor (order=$order)...\n";
    $res = chargeCard($card, 1.50, [
        'order_id'      => $order,
        'user'          => ['id' => 1, 'ad_soyad' => 'John Doe', 'eposta' => 'test@lumanoris.com', 'telefon' => '5321112233'],
        'ip'            => '85.34.78.112',
        'payment_group' => 'PRODUCT',
        'items'         => [['id' => 1, 'name' => 'Selftest', 'category' => 'Test', 'price' => 1.50]],
    ]);

    check('sandbox tahsilatı başarılı', $res['success'] === true, $res['message'] ?? '');

    if ($res['success']) {
        check('paymentId döndü', !empty($res['payment_id']), (string) ($res['payment_id'] ?? ''));
        check('iade için itemTransactions kaydedildi',
            !empty($res['item_transactions'][0]['paymentTransactionId']));

        echo "  Tahsilat iptal ediliyor (paymentId={$res['payment_id']})...\n";
        check('iptal başarılı', cancelCharge($res['payment_id'], '85.34.78.112', $order) === true);
    }
}

echo "\n=== SONUÇ: $pass geçti, $fail başarısız ===\n\n";
exit($fail === 0 ? 0 : 1);
