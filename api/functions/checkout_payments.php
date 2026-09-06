<?php
/**
 * Ödeme işleme — iyzico (iyzipay) entegrasyonu.
 *
 * DEP-001 / PAY-001 / PAY-012 — bu dosya baştan sona stub'dı. `chargeCard()`
 * yalnızca kartın BİÇİMİNİ doğruluyor ve `['success' => true, 'simulated' =>
 * true]` dönüyordu; `reconcilePayments()` / `processRefund()` ise 503 ile
 * fail-closed reddediyordu. Artık üçü de gerçek sağlayıcıya gidiyor.
 *
 * Sağlayıcı Param POS değil **iyzico**. Şemadaki `param_*` adlar korunuyor
 * (içlerinde canlı veri var); anlamları IyzicoClient sınıf yorumunda.
 *
 * Fonksiyonlar:
 *   chargeCard()                  — kartı doğrular ve GERÇEKTEN tahsil eder.
 *   cancelCharge()                — tahsilat sonrası bizim tarafta bir şey
 *                                   patlarsa telafi (aynı gün tam iptal).
 *   reconcilePayments()           — belirsiz kalan ödemeleri sağlayıcıdan sorar.
 *   processRefund()               — iade.
 *   handleParamCallback()         — kullanılmıyor (iyzico 3DS'siz akışta
 *                                   asenkron bildirim göndermez).
 *   ensureParamMarketplaceTables()— tablolar migration ile oluşuyor.
 */

require_once __DIR__ . '/env.php';

/**
 * Kart bilgisini doğrular ve tutarı iyzico üzerinden tahsil eder.
 *
 * Biçim doğrulaması (Luhn, CVV, son kullanma) sağlayıcıya gitmeden ÖNCE
 * yapılıyor: `CartConfirm`/checkout sayfasının istemci tarafında uyguladığı
 * kuralların aynısı, böylece iki katman birbiriyle çelişmiyor ve bariz
 * hatalı kartlar için gereksiz ağ turu atılmıyor.
 *
 * @param array $card    number, expiry (MM/YY), cvv, holder_name
 * @param float $amount  Tahsil edilecek toplam (TRY)
 * @param array $context order_id, user, items, ip, payment_group
 *
 * @return array{
 *   success:bool, message:string, payment_id?:string, conversation_id?:string,
 *   net_amount?:float, item_transactions?:array, error_code?:string, raw?:array
 * }
 */
function chargeCard(array $card, float $amount, array $context = []): array {
    $number = preg_replace('/\D/', '', (string) ($card['number'] ?? ''));
    $expiry = trim((string) ($card['expiry'] ?? ''));
    $cvv    = preg_replace('/\D/', '', (string) ($card['cvv'] ?? ''));
    $holder = trim((string) ($card['holder_name'] ?? ''));

    if ($holder === '' || $number === '' || $expiry === '' || $cvv === '') {
        return ['success' => false, 'message' => 'Kart bilgileri eksik.'];
    }
    if (strlen($number) < 13 || strlen($number) > 19 || !luhnCheck($number)) {
        return ['success' => false, 'message' => 'Kart numarası geçersiz.'];
    }
    if (!preg_match('/^\d{3,4}$/', $cvv)) {
        return ['success' => false, 'message' => 'CVV geçersiz.'];
    }
    if (!preg_match('#^(\d{2})\s*/\s*(\d{2})$#', $expiry, $m)) {
        return ['success' => false, 'message' => 'Son kullanma tarihi geçersiz.'];
    }
    $month = (int) $m[1];
    $year  = (int) $m[2];
    if ($month < 1 || $month > 12) {
        return ['success' => false, 'message' => 'Son kullanma tarihi geçersiz.'];
    }
    $currentYear  = (int) date('y');
    $currentMonth = (int) date('n');
    if ($year < $currentYear || ($year === $currentYear && $month < $currentMonth)) {
        return ['success' => false, 'message' => 'Kartın son kullanma tarihi geçmiş.'];
    }

    // Sıfır ya da negatif tutar tahsil edilmez. Daha önce (float) null === 0.0
    // yoluyla 0,00 TL'lik "başarılı" satışlar yazılmıştı; sağlayıcı da bunu
    // reddeder, ama buraya kadar gelmesine hiç gerek yok.
    $amount = round($amount, 2);
    if ($amount <= 0) {
        return ['success' => false, 'message' => 'Geçersiz ödeme tutarı.'];
    }

    $client = new IyzicoClient();
    if (!$client->isConfigured()) {
        // Anahtar yoksa FAIL-CLOSED. Eski stub burada `success => true`
        // dönüyordu; sahte başarı, ödenmemiş bir siparişin "ödendi" olarak
        // yazılması demekti. Yapılandırma eksikliği kullanıcıya değil,
        // operatöre ait bir sorun — o yüzden loga tam sebep düşüyor.
        error_log('[iyzico] IYZICO_API_KEY / IYZICO_SECRET_KEY tanımlı değil — tahsilat reddedildi. api/.env dosyasına ekleyin (bkz. api/.env.example).');
        return [
            'success'    => false,
            'message'    => 'Ödeme altyapısı şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
            'error_code' => 'CONFIG_MISSING',
        ];
    }

    $orderId  = (string) ($context['order_id'] ?? ('ORD-' . strtoupper(bin2hex(random_bytes(4)))));
    $payload  = buildIyzicoPaymentPayload($card, $amount, $orderId, $context);
    $response = $client->createPayment($payload);

    if (($response['status'] ?? '') !== 'success') {
        // errorMessage sağlayıcıdan gelen Türkçe metin ("Kart limiti
        // yetersiz", "Geçersiz kart bilgisi"...) — kullanıcıya bunu
        // göstermek genel bir "ödeme başarısız"dan çok daha yararlı.
        error_log(sprintf(
            '[iyzico] tahsilat başarısız order=%s code=%s msg=%s',
            $orderId,
            (string) ($response['errorCode'] ?? '-'),
            (string) ($response['errorMessage'] ?? '-')
        ));
        return [
            'success'    => false,
            'message'    => (string) ($response['errorMessage'] ?? 'Ödeme işlemi tamamlanamadı.'),
            'error_code' => (string) ($response['errorCode'] ?? 'PAYMENT_FAILED'),
            'raw'        => IyzicoClient::redact($response),
        ];
    }

    // Sepet kalemi başına üretilen paymentTransactionId'ler İADE İÇİN
    // zorunlu: iyzico iadeyi ödemenin tamamı üzerinden değil kalem bazında
    // yapıyor. Saklamazsak sonradan iade edilemez hale gelir.
    $itemTransactions = [];
    foreach (($response['itemTransactions'] ?? []) as $tx) {
        $itemTransactions[] = [
            'itemId'               => (string) ($tx['itemId'] ?? ''),
            'paymentTransactionId' => (string) ($tx['paymentTransactionId'] ?? ''),
            'price'                => (float) ($tx['price'] ?? 0),
            'paidPrice'            => (float) ($tx['paidPrice'] ?? 0),
            'merchantPayoutAmount' => (float) ($tx['merchantPayoutAmount'] ?? 0),
        ];
    }

    error_log(sprintf(
        '[iyzico] tahsilat başarılı order=%s paymentId=%s tutar=%s kart=****%s',
        $orderId,
        (string) ($response['paymentId'] ?? '-'),
        IyzicoClient::money($amount),
        substr($number, -4)
    ));

    return [
        'success'           => true,
        'message'           => 'Ödeme alındı.',
        'payment_id'        => (string) ($response['paymentId'] ?? ''),
        'conversation_id'   => $orderId,
        'net_amount'        => isset($response['iyziCommissionRateAmount'])
            ? round($amount - (float) ($response['iyziCommissionRateAmount'] ?? 0) - (float) ($response['iyziCommissionFee'] ?? 0), 2)
            : null,
        'item_transactions' => $itemTransactions,
        'raw'               => IyzicoClient::redact($response),
    ];
}

/**
 * iyzico `/payment/auth` gövdesini kurar.
 *
 * İki nokta kritik:
 *   1. `price` ile sepet kalemlerinin toplamı BİREBİR eşit olmak zorunda —
 *      `IyzicoClient::balanceBasket()` yuvarlama farkını son kaleme yazarak
 *      bunu garanti ediyor.
 *   2. buyer'ın `registrationAddress`, `city`, `country`, `email`,
 *      `identityNumber`, `ip` alanları zorunlu; boş gönderilirse istek
 *      doğrulamadan döner. Dijital ürün sattığımız için gerçek bir teslimat
 *      adresi yok — sağlayıcının şeması gerektirdiği için kullanıcının
 *      hesabından türetilen tutarlı bir yer tutucu kullanılıyor.
 */
function buildIyzicoPaymentPayload(array $card, float $amount, string $orderId, array $context): array {
    $user = is_array($context['user'] ?? null) ? $context['user'] : [];

    $fullName = trim((string) ($user['ad_soyad'] ?? '')) ?: trim((string) ($user['kullanici_adi'] ?? '')) ?: 'Lumanoris Kullanıcısı';
    $parts    = preg_split('/\s+/', $fullName, -1, PREG_SPLIT_NO_EMPTY) ?: ['Lumanoris'];
    $surname  = count($parts) > 1 ? array_pop($parts) : 'Kullanıcı';
    $name     = implode(' ', $parts);

    // TCKN toplanmıyor. iyzico alanı zorunlu tutuyor ve dijital ürün
    // satışında doğrulamıyor; sabit yer tutucu sağlayıcının kendi
    // dokümantasyonundaki örnek değer.
    $identity = preg_replace('/\D/', '', (string) ($context['identity_number'] ?? '')) ?: '11111111111';

    $city    = trim((string) ($context['city'] ?? '')) ?: 'İstanbul';
    $country = trim((string) ($context['country'] ?? '')) ?: 'Türkiye';
    $address = trim((string) ($context['address'] ?? '')) ?: 'Dijital teslimat - fiziksel adres yok';
    $zip     = trim((string) ($context['zip_code'] ?? '')) ?: '34000';

    $buyer = [
        'id'                  => (string) ($user['id'] ?? ($context['user_id'] ?? '0')),
        'name'                => $name,
        'surname'             => $surname,
        'identityNumber'      => $identity,
        'email'               => (string) ($user['eposta'] ?? ($context['email'] ?? 'noreply@lumanoris.com')),
        'registrationAddress' => $address,
        'registrationDate'    => IyzicoClient::date($context['registration_date'] ?? null),
        'lastLoginDate'       => IyzicoClient::date(null),
        'city'                => $city,
        'country'             => $country,
        'zipCode'             => $zip,
        'ip'                  => (string) ($context['ip'] ?? '127.0.0.1'),
    ];

    // gsmNumber zorunlu değil; ancak GEÇERSİZ bir değer isteği tümden
    // reddettirir. Bu yüzden yalnızca +90XXXXXXXXXX biçimine
    // normalize edilebiliyorsa ekleniyor.
    $gsm = normalizeTurkishGsm((string) ($user['telefon'] ?? ''));
    if ($gsm !== null) {
        $buyer['gsmNumber'] = $gsm;
    }

    $addressBlock = [
        'contactName' => $fullName,
        'city'        => $city,
        'country'     => $country,
        'address'     => $address,
        'zipCode'     => $zip,
    ];

    $items = [];
    foreach (($context['items'] ?? []) as $item) {
        $items[] = [
            'id'        => (string) ($item['id'] ?? '0'),
            'name'      => mb_substr(trim((string) ($item['name'] ?? 'Ürün')) ?: 'Ürün', 0, 100),
            'category1' => mb_substr(trim((string) ($item['category'] ?? 'Dijital')) ?: 'Dijital', 0, 100),
            // Chatbot aboneliği ve üyelik paketi fiziksel ürün değil.
            'itemType'  => 'VIRTUAL',
            'price'     => (float) ($item['price'] ?? 0),
        ];
    }
    // Kalem listesi hiç gelmediyse tek kalemlik bir sepet kur — iyzico boş
    // basketItems kabul etmiyor.
    if (empty($items)) {
        $items[] = [
            'id'        => $orderId,
            'name'      => (string) ($context['description'] ?? 'Lumanoris Siparişi'),
            'category1' => 'Dijital',
            'itemType'  => 'VIRTUAL',
            'price'     => $amount,
        ];
    }

    return [
        'locale'         => 'tr',
        'conversationId' => $orderId,
        'price'          => IyzicoClient::money($amount),
        'paidPrice'      => IyzicoClient::money($amount),
        'currency'       => 'TRY',
        // Taksit yok: dijital abonelik tek çekim.
        'installment'    => 1,
        'basketId'       => $orderId,
        'paymentChannel' => 'WEB',
        'paymentGroup'   => (string) ($context['payment_group'] ?? 'PRODUCT'),
        'paymentCard'    => [
            'cardHolderName' => trim((string) $card['holder_name']),
            'cardNumber'     => preg_replace('/\D/', '', (string) $card['number']),
            'expireMonth'    => substr(preg_replace('/\D/', '', (string) $card['expiry']), 0, 2),
            // iyzico 4 haneli yıl bekliyor; form MM/YY topluyor.
            'expireYear'     => '20' . substr(preg_replace('/\D/', '', (string) $card['expiry']), 2, 2),
            'cvc'            => preg_replace('/\D/', '', (string) $card['cvv']),
            'registerCard'   => 0,
        ],
        'buyer'           => $buyer,
        'shippingAddress' => $addressBlock,
        'billingAddress'  => $addressBlock,
        'basketItems'     => IyzicoClient::balanceBasket($items, $amount),
    ];
}

/**
 * Alıcının gerçek IP'si — iyzico `buyer.ip` alanı için (dolandırıcılık
 * skorlamasında kullanıyor).
 *
 * Bu kurulumda PHP'ye istekler HER ZAMAN Node proxy'si (web/server.js)
 * üzerinden geliyor, yani `REMOTE_ADDR` daima 127.0.0.1. Ham `REMOTE_ADDR`
 * kullanmak her siparişi aynı IP'den gelmiş gibi göstererek sağlayıcının
 * fraud kontrolünü işlevsiz bırakırdı.
 *
 * X-Forwarded-For istemci tarafından uydurulabilir, bu yüzden YALNIZCA
 * doğrudan bağlantı yerel/özel bir adresten geliyorsa — yani gerçekten kendi
 * proxy'mizin arkasındaysak — dikkate alınıyor. İnternete doğrudan açık bir
 * kurulumda başlık yok sayılıp REMOTE_ADDR kullanılıyor.
 */
function clientIp(): string {
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $isBehindLocalProxy = $remote === '' || filter_var(
        $remote,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) === false;

    if ($isBehindLocalProxy && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // İlk giriş, zincirin en uzaktaki (gerçek istemci) adresi.
        $first = trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        if (filter_var($first, FILTER_VALIDATE_IP) !== false) {
            return $first;
        }
    }

    return filter_var($remote, FILTER_VALIDATE_IP) !== false ? $remote : '127.0.0.1';
}

/**
 * `+90XXXXXXXXXX` biçimine çevirir, çeviremezse null döner.
 * Geçersiz bir gsmNumber tüm ödemeyi reddettirdiği için "emin değilsen
 * gönderme" doğru davranış.
 */
function normalizeTurkishGsm(string $raw): ?string {
    $digits = preg_replace('/\D/', '', $raw);
    if ($digits === '') {
        return null;
    }
    $digits = ltrim($digits, '0');
    if (str_starts_with($digits, '90')) {
        $digits = substr($digits, 2);
    }
    // Türkiye cep numarası: 5 ile başlayan 10 hane.
    return preg_match('/^5\d{9}$/', $digits) ? '+90' . $digits : null;
}

/**
 * Tahsilat başarılı olduktan SONRA bizim tarafımızda bir şey patlarsa
 * (commit hatası, sonraki insert'in düşmesi) müşterinin parası çekilmiş ama
 * hiçbir şey teslim edilmemiş olur. Bu, o durumun telafisi.
 *
 * İptal başarısız olursa BİLİNÇLİ olarak sessiz kalmıyoruz: satır loga
 * düşüyor ki operatör elle iade edebilsin. Sessiz bir başarısızlık,
 * müşterinin parasının kaybolması demek.
 */
function cancelCharge(string $paymentId, string $ip, string $orderId = ''): bool {
    if ($paymentId === '') {
        return false;
    }
    $client = new IyzicoClient();
    if (!$client->isConfigured()) {
        return false;
    }

    $res = $client->cancelPayment($paymentId, $ip !== '' ? $ip : '127.0.0.1', $orderId);
    if (($res['status'] ?? '') === 'success') {
        error_log('[iyzico] tahsilat iptal edildi (telafi) paymentId=' . $paymentId . ' order=' . $orderId);
        return true;
    }

    error_log(sprintf(
        '[iyzico] KRİTİK: tahsilat iptal EDİLEMEDİ — müşteriden para çekildi, sipariş yazılamadı. '
        . 'ELLE İADE GEREKİYOR. paymentId=%s order=%s code=%s msg=%s',
        $paymentId,
        $orderId,
        (string) ($res['errorCode'] ?? '-'),
        (string) ($res['errorMessage'] ?? '-')
    ));
    return false;
}

function luhnCheck(string $digits): bool {
    $sum          = 0;
    $shouldDouble = false;
    for ($i = strlen($digits) - 1; $i >= 0; $i--) {
        $digit = (int) $digits[$i];
        if ($shouldDouble) {
            $digit *= 2;
            if ($digit > 9) $digit -= 9;
        }
        $sum += $digit;
        $shouldDouble = !$shouldDouble;
    }
    return $sum % 10 === 0;
}

function ensureParamMarketplaceTables(PDO $conn): void {
    // Tablolar database/schema.sql + migrations ile oluşuyor; burada DDL
    // çalıştırmak MySQL'de örtük COMMIT tetikler (PAY-004) — o yüzden
    // bilinçli olarak boş.
}

/**
 * Mutabakat — sağlayıcıdaki gerçek duruma göre yerel kayıtları düzeltir.
 *
 * PAY-012: bu fonksiyon eskiden 503 dönüyordu (öncesinde de fail-open bir
 * stub'dı). Asıl ihtiyacı doğuran senaryo şu: `chargeCard()` zaman aşımına
 * uğrarsa tahsilatın yapılıp yapılmadığını BİLEMEYİZ; ödeme satırı
 * `failed`/`pending` kalır ama para çekilmiş olabilir. iyzico'ya
 * `conversationId` ile sorarak gerçeği öğrenip kaydı düzeltiyoruz.
 */
function reconcilePayments(Database $db, PDO $conn): void {
    $client = new IyzicoClient();
    if (!$client->isConfigured()) {
        error_log('[iyzico] mutabakat: sağlayıcı yapılandırılmamış.');
        JsonResponse::error(
            'Mutabakat yapılamıyor: ödeme sağlayıcısı yapılandırılmamış.',
            503,
            AppConfig::ERR_UNAVAILABLE
        );
    }

    // Son 7 gün ve henüz kesinleşmemiş kayıtlar. Kesinleşmiş (`paid`,
    // `refunded`) satırlara dokunulmuyor — mutabakatın işi belirsizliği
    // çözmek, geçmişi yeniden yazmak değil.
    $rows = $db->selectMulti(
        "id, order_id, status, amount, param_transaction_id
         FROM param_marketplace_payments
         WHERE status IN ('pending', 'payment_started', 'failed', 'unknown')
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         ORDER BY id ASC
         LIMIT 200"
    );

    $checked = 0;
    $fixed   = 0;
    $errors  = 0;

    foreach ($rows as $row) {
        $checked++;
        $paymentId = (string) ($row['param_transaction_id'] ?? '');

        // paymentId yoksa (zaman aşımı senaryosu) conversationId ile sor.
        $query = $paymentId !== ''
            ? ['locale' => 'tr', 'conversationId' => $row['order_id'], 'paymentId' => $paymentId]
            : ['locale' => 'tr', 'conversationId' => $row['order_id'], 'paymentConversationId' => $row['order_id']];

        $res = $client->request('/payment/detail', $query);

        if (($res['status'] ?? '') !== 'success') {
            // "Ödeme bulunamadı" = gerçekten tahsil edilmemiş; kaydı
            // `failed` olarak kesinleştir. Diğer hatalar geçici olabilir,
            // satıra dokunma.
            $code = (string) ($res['errorCode'] ?? '');
            if (in_array($code, ['5088', '1000'], true) || str_contains(mb_strtolower((string) ($res['errorMessage'] ?? '')), 'bulunamadı')) {
                if ($row['status'] !== 'failed') {
                    $db->update('param_marketplace_payments', ['status' => 'failed'], 'id = ?', [$row['id']]);
                    $fixed++;
                }
            } else {
                $errors++;
                error_log('[iyzico] mutabakat sorgusu başarısız order=' . $row['order_id'] . ' code=' . $code);
            }
            continue;
        }

        $providerStatus = (string) ($res['paymentStatus'] ?? '');
        $newStatus = match ($providerStatus) {
            'SUCCESS'  => 'paid',
            'FAILURE'  => 'failed',
            'INIT_THREEDS', 'CALLBACK_THREEDS', 'BKM_POS_SELECTED' => 'payment_started',
            default    => null,
        };

        if ($newStatus === null || $newStatus === $row['status']) {
            continue;
        }

        $update = [
            'status'              => $newStatus,
            'param_response_json' => json_encode(IyzicoClient::redact($res), JSON_UNESCAPED_UNICODE),
        ];
        if (($res['paymentId'] ?? '') !== '') {
            $update['param_transaction_id'] = (string) $res['paymentId'];
        }
        $db->update('param_marketplace_payments', $update, 'id = ?', [$row['id']]);

        // Ödeme gerçekten alınmışsa satıcı payları da onaylanmalı; aksi
        // halde satıcının parası süresiz `pending_approval`da kalırdı.
        $db->update(
            'param_marketplace_details',
            ['status' => $newStatus === 'paid' ? 'approved' : 'cancelled'],
            'payment_id = ? AND status = ?',
            [$row['id'], 'pending_approval']
        );

        $fixed++;
        error_log(sprintf('[iyzico] mutabakat düzeltti order=%s %s -> %s', $row['order_id'], $row['status'], $newStatus));
    }

    JsonResponse::success([
        'message'   => 'Mutabakat tamamlandı.',
        'checked'   => $checked,
        'updated'   => $fixed,
        'errors'    => $errors,
    ]);
}

/**
 * İade — iyzico `/payment/refund`.
 *
 * DİKKAT: iyzico iadeyi ödemenin tamamı üzerinden değil, sepet kalemi başına
 * üretilen `paymentTransactionId` üzerinden yapıyor. `chargeCard()` bu
 * kimlikleri `param_response_json` içine yazıyor; buradaki döngü onları
 * kullanıyor. Kimlikler yoksa iade EDİLEMEZ ve bunu sessizce "başarılı"
 * saymıyoruz (PAY-012'nin asıl şikâyeti buydu).
 *
 * @param array $data payment_id (yerel satır id'si) veya order_id
 */
function processRefund(Database $db, PDO $conn, array $data): void {
    $client = new IyzicoClient();
    if (!$client->isConfigured()) {
        JsonResponse::error(
            'İade işlenemiyor: ödeme sağlayıcısı yapılandırılmamış. İade kaydı oluşturulmadı.',
            503,
            AppConfig::ERR_UNAVAILABLE
        );
    }

    $paymentRowId = (int) ($data['payment_id'] ?? 0);
    $orderId      = trim((string) ($data['order_id'] ?? ''));
    $reason       = mb_substr(trim((string) ($data['reason'] ?? '')), 0, 500);

    if (!$paymentRowId && $orderId === '') {
        JsonResponse::error('payment_id veya order_id gerekli.', 400, AppConfig::ERR_VALIDATION);
    }

    // İş kuralı: KISMİ / ORANSAL İADE YOK. İade her zaman siparişin tamamı
    // üzerinden yapılır. Fonksiyon zaten istekten tutar okumuyor — tutarlar
    // sağlayıcının kaydettiği `itemTransactions`'tan geliyor — ama tutar
    // gönderen bir çağıran sessizce yok sayılmak yerine açıkça
    // reddediliyor ki "kısmi iade istedim, tam iade oldu" sürprizi olmasın.
    if (isset($data['amount']) || isset($data['items']) || isset($data['partial'])) {
        JsonResponse::error(
            'Kısmi iade desteklenmiyor: iade her zaman siparişin tamamı üzerinden yapılır. '
            . 'Tutar/kalem göndermeyin.',
            422,
            AppConfig::ERR_VALIDATION
        );
    }

    $payment = $paymentRowId
        ? $db->selectSingle('* FROM param_marketplace_payments WHERE id = ?', [$paymentRowId])
        : $db->selectSingle('* FROM param_marketplace_payments WHERE order_id = ?', [$orderId]);

    if (!$payment) {
        JsonResponse::error('Ödeme kaydı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
    }
    $paymentRowId = (int) $payment['id'];

    /**
     * I-02 — bu fonksiyon transaction, kilit ve idempotency OLMADAN
     * çalışıyordu; `PDO $conn` parametresini alıp gövdesinde hiç
     * kullanmıyordu. İki admin (ya da bir çift tıklama) aynı ödemeyi aynı
     * anda iade ettiğinde ikisi de `status = 'paid'` görüp sağlayıcıya
     * AYNI `paymentTransactionId` için iki iade isteği gönderiyordu.
     *
     * `createSubscription()` ile aynı adlandırılmış kilit deseni. Kilit
     * ödeme satırı BAZINDA: farklı siparişlerin iadesi birbirini
     * beklemesin.
     */
    $lockName = 'refund_payment_' . $paymentRowId;
    $lockStmt = $conn->prepare('SELECT GET_LOCK(?, 10) AS locked');
    $lockStmt->execute([$lockName]);
    if ((int) ($lockStmt->fetch()['locked'] ?? 0) !== 1) {
        JsonResponse::error(
            'Bu ödeme için başka bir iade işlemi sürüyor. Lütfen birkaç saniye sonra tekrar deneyin.',
            409,
            AppConfig::ERR_VALIDATION
        );
    }
    $releaseLock = static function () use ($conn, $lockName): void {
        try { $conn->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]); } catch (Throwable $e) {}
    };

    // Kilit ALINDIKTAN SONRA yeniden oku: yarışı kaybeden istek, ilkinin
    // yazdığı güncel durumu görür. Yukarıdaki okuma yalnızca satırı
    // bulmak içindi.
    $payment       = $db->selectSingle('* FROM param_marketplace_payments WHERE id = ?', [$paymentRowId]);
    $statusBefore  = (string) ($payment['status'] ?? '');

    /** Denetim izi + kilidi bırakarak hata döndürmek için ortak çıkış. */
    $refundAbort = static function (string $message, int $http, string $code) use ($releaseLock): void {
        $releaseLock();
        JsonResponse::error($message, $http, $code);
    };

    if ($statusBefore === 'refunded') {
        refundAudit($payment, 'reddedildi', $statusBefore, $statusBefore, 'zaten iade edilmiş');
        $refundAbort('Bu ödeme zaten iade edilmiş.', 409, AppConfig::ERR_DUPLICATE);
    }
    if ($statusBefore !== 'paid' && $statusBefore !== 'partial_refund') {
        refundAudit($payment, 'reddedildi', $statusBefore, $statusBefore, 'tahsil edilmemiş ödeme');
        $refundAbort(
            'Yalnızca tahsil edilmiş ödemeler iade edilebilir. Mevcut durum: ' . $statusBefore,
            422,
            AppConfig::ERR_VALIDATION
        );
    }

    $raw          = json_decode((string) ($payment['param_response_json'] ?? ''), true);
    $transactions = is_array($raw['itemTransactions'] ?? null) ? $raw['itemTransactions'] : [];

    if (empty($transactions)) {
        error_log('[iyzico] iade edilemiyor: itemTransactions kaydı yok. order=' . $payment['order_id']);
        refundAudit($payment, 'reddedildi', $statusBefore, $statusBefore, 'itemTransactions kaydı yok');
        $refundAbort(
            'Bu ödeme için sağlayıcı işlem kimlikleri kayıtlı değil, otomatik iade yapılamıyor. '
            . 'İade iyzico panelinden elle yapılmalı.',
            422,
            AppConfig::ERR_VALIDATION
        );
    }

    $ip       = clientIp();
    $refunded = 0.0;
    $failures = [];
    $skipped  = 0;

    // I-02 — ZATEN İADE EDİLMİŞ kalemlerin kümesi (idempotency).
    //
    // Eskiden böyle bir kontrol yoktu: aynı ödemeye ikinci kez iade
    // çalıştırmak sağlayıcıya AYNI kalemler için ikinci bir iade isteği
    // gönderiyordu. Kısmi bir hatadan sonra admin'in tekrar denemesi
    // gereken durum tam olarak budur, yani nadir de değil.
    //
    // Anahtar `detail_id`: D-08 sonrası her kalem tek bir detay satırına
    // eşleniyor, dolayısıyla (payment_id, detail_id) kalem kimliğidir.
    $alreadyRefunded = [];
    foreach ($db->selectMulti(
        "detail_id FROM param_marketplace_refunds WHERE payment_id = ? AND status = 'completed'",
        [$paymentRowId]
    ) as $r) {
        $alreadyRefunded[(int) $r['detail_id']] = true;
    }

    /**
     * D-08 — kalem bazlı iade satırları HEPSİ ilk detay satırına
     * bağlanıyordu (`$firstDetailId`), hiç detay yoksa `0` yazılıyordu.
     * İki sonucu vardı: çok kalemli bir siparişte muhasebe kaydı hangi
     * satıcının kaleminin iade edildiğini gösteremiyordu, ve `detail_id`
     * NOT NULL + `param_marketplace_details`'e FK olduğu için `0` yazmak
     * sessizce değil FK ihlaliyle PATLIYORDU.
     *
     * Eşleme `chatbot_id` üzerinden: `createSubscription` iyzico'ya kalem
     * kimliği olarak `chatbot_id` gönderiyor (`'id' => $row['chatbot_id']`),
     * sağlayıcı da onu `itemTransactions[].itemId` olarak geri veriyor.
     * `param_marketplace_details.chatbot_id` sütunu migration 004 ile
     * geldi; yoksa (eski kurulum) tek detay satırına düşülüyor.
     */
    $detailRows = $db->selectMulti(
        'id, chatbot_id, seller_user_id FROM param_marketplace_details WHERE payment_id = ? ORDER BY id',
        [$paymentRowId]
    );

    $detailByChatbot = [];
    foreach ($detailRows as $d) {
        $cid = (int) ($d['chatbot_id'] ?? 0);
        if ($cid > 0) {
            $detailByChatbot[$cid] = (int) $d['id'];
        }
    }
    $firstDetailId = $detailRows ? (int) $detailRows[0]['id'] : 0;

    if ($firstDetailId === 0) {
        // `detail_id` NOT NULL ve FK'lı — bağlanacak satır olmadan iade
        // kaydı YAZILAMAZ. Sağlayıcıya para iadesi gönderip kaydını
        // tutamamaktansa hiç başlamamak doğru.
        error_log('[iyzico] iade edilemiyor: ödemeye bağlı detay satırı yok. order=' . $payment['order_id']);
        refundAudit($payment, 'reddedildi', $statusBefore, $statusBefore, 'detay satırı yok');
        $refundAbort(
            'Bu ödemenin kalem kayıtları eksik, otomatik iade yapılamıyor. '
            . 'İade iyzico panelinden elle yapılmalı.',
            422,
            AppConfig::ERR_VALIDATION
        );
    }

    foreach ($transactions as $tx) {
        $txId  = (string) ($tx['paymentTransactionId'] ?? '');
        $price = (float) ($tx['paidPrice'] ?? $tx['price'] ?? 0);
        if ($txId === '' || $price <= 0) {
            continue;
        }

        // D-08: kalemi kendi detay satırına bağla.
        $itemChatbotId = (int) ($tx['itemId'] ?? 0);
        $detailId      = $detailByChatbot[$itemChatbotId] ?? $firstDetailId;

        if ($detailId > 0 && isset($alreadyRefunded[$detailId])) {
            // Bu kalem daha önce başarıyla iade edilmiş — sağlayıcıya
            // ikinci kez gitme. Tutarı toplama DAHİL EDİYORUZ ki "tam iade
            // oldu mu" kararı doğru çıksın.
            $skipped++;
            $refunded = round($refunded + $price, 2);
            continue;
        }

        $res = $client->refund($txId, $price, $ip, 'TRY', $payment['order_id']);
        $ok  = ($res['status'] ?? '') === 'success';

        // Bu satır BİLEREK transaction dışında ve hemen yazılıyor: para
        // sağlayıcıda gerçekten hareket etti, kaydı hiçbir rollback
        // silmemeli. Aksi hâlde iade edilmiş bir tutarın izi kaybolur ve
        // ikinci denemede tekrar iade edilir.
        $db->insert('param_marketplace_refunds', [
            'payment_id'           => $paymentRowId,
            'detail_id'            => $detailId,
            'amount'               => $price,
            'reason'               => $reason,
            // NOT: sütunun FK'sı `kullanicilar`'a; admin ise `adminler`
            // tablosunda. Admin kimliği bu yüzden JSON'a yazılıyor.
            'requested_by_user_id' => (int) ($_SESSION['user_id'] ?? 0) ?: null,
            'status'               => $ok ? 'completed' : 'failed',
            'param_response_json'  => json_encode([
                'actor'                  => refundActor(),
                'attempted_at'           => date('c'),
                'payment_transaction_id' => $txId,
                'status_before'          => $statusBefore,
                'provider'               => IyzicoClient::redact($res),
            ], JSON_UNESCAPED_UNICODE),
        ]);

        if ($ok) {
            $refunded = round($refunded + $price, 2);
        } else {
            $failures[] = sprintf('%s: %s', $txId, (string) ($res['errorMessage'] ?? 'bilinmeyen hata'));
            error_log(sprintf(
                '[iyzico] kalem iadesi başarısız order=%s tx=%s admin=%s msg=%s',
                $payment['order_id'],
                $txId,
                refundActor(),
                (string) ($res['errorMessage'] ?? '-')
            ));
        }
    }

    if ($refunded <= 0) {
        refundAudit($payment, 'başarısız', $statusBefore, $statusBefore, implode(' | ', $failures));
        $refundAbort(
            'İade yapılamadı: ' . implode(' | ', $failures),
            422,
            AppConfig::ERR_PAYMENT
        );
    }

    $total       = (float) $payment['amount'];
    $fullyRefund = $refunded >= round($total, 2) - 0.01;
    $statusAfter = $fullyRefund ? 'refunded' : 'partial_refund';
    $revoked     = ['subscriptions' => 0, 'credits' => 0, 'ambiguous' => []];

    // I-02 — durum geçişi TEK bir transaction'da. Eskiden ödeme satırı ile
    // detay satırları ayrı ayrı güncelleniyordu: araya giren bir hata
    // "ödeme iade edildi ama satıcı payı hâlâ ödenebilir" gibi tutarsız bir
    // ara duruma yol açabiliyordu.
    //
    // Sağlayıcı çağrıları BİLEREK bu transaction'ın dışında kaldı: ağ
    // isteği süresince satır kilidi tutmak, ve bir rollback ile gerçekten
    // yapılmış iadelerin kaydını silmek istemiyoruz.
    $conn->beginTransaction();
    try {
        $db->update(
            'param_marketplace_payments',
            ['status' => $statusAfter],
            'id = ?',
            [$paymentRowId]
        );

        // İade edilen bir satışın satıcı payı ödenebilir kalmamalı.
        if ($fullyRefund) {
            $db->update(
                'param_marketplace_details',
                ['status' => 'refunded', 'refunded_at' => date('Y-m-d H:i:s')],
                'payment_id = ?',
                [$paymentRowId]
            );

            // D-03 — iade, satın alınan ERİŞİMİ de geri almalı.
            //
            // `processRefund()` yalnızca `param_marketplace_payments` ve
            // `param_marketplace_details` durumlarını güncelliyordu;
            // `user_subscriptions` ve `chatbot_purchase_credits` satırlarına
            // HİÇ dokunmuyordu. Yani parası iade edilen kullanıcı botu
            // kullanmaya süresi dolana kadar devam ediyordu.
            //
            // İş kuralı: iade tam tutar üzerinden yapılır, verilen süre ve
            // kredi tamamen geri alınır, kullanılmış kısım için oransal
            // hesap YAPILMAZ.
            $revoked = revokeRefundedAccess($db, (int) $payment['user_id'], $detailRows, $payment['order_id']);
        }

        $conn->commit();
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        // Para geri gitti ama durum yazılamadı — sessizce geçilemez.
        error_log(sprintf(
            '[iyzico] KRİTİK: iade yapıldı ama durum yazılamadı order=%s tutar=%s hata=%s',
            $payment['order_id'],
            (string) $refunded,
            $e->getMessage()
        ));
        $releaseLock();
        throw $e;
    }

    refundAudit($payment, $fullyRefund ? 'tamamlandı' : 'kısmi', $statusBefore, $statusAfter, sprintf(
        'tutar=%s atlanan=%d başarısız=%d abonelik_iptal=%d kredi_sıfırlandı=%d',
        (string) $refunded,
        $skipped,
        count($failures),
        $revoked['subscriptions'],
        $revoked['credits']
    ));

    $releaseLock();

    // I-04 — kısmi durum bir İŞ KURALI değil, sağlayıcı tarafında kalmış
    // bir arıza. Para bir kısmı için geri gitti ve geri alınamaz; erişim
    // ise HENÜZ kesilmiyor (müşteri parasının tamamını almadan hizmetini
    // kaybetmesin). Admin tekrar denediğinde iade edilmiş kalemler
    // atlanıp yalnızca kalanlar denenir; tamamlanınca erişim kesilir.
    $message = $fullyRefund
        ? 'İade tamamlandı; erişim ve krediler geri alındı.'
        : 'Kalemlerin bir kısmı iade EDİLEMEDİ. Erişim henüz kesilmedi — '
          . 'sorunu giderip iadeyi tekrar çalıştırın, iade edilmiş kalemler atlanacaktır.';

    JsonResponse::success([
        'message'         => $message,
        'refunded_amount' => $refunded,
        'full_refund'     => $fullyRefund,
        'skipped_items'   => $skipped,
        'failures'        => $failures,
        'revoked'         => $revoked,
        // Aynı (kullanıcı, bot) için birden fazla abonelik bulunduğunda
        // admin'in bilmesi gerekiyor: şema sipariş bağı tutmuyor.
        'warnings'        => $revoked['ambiguous'] === [] ? [] : [
            'Bu kullanıcının şu botlar için birden fazla satın alması var ve hepsi pasife alındı: '
            . implode(', ', $revoked['ambiguous']),
        ],
    ]);
}

/**
 * D-03 — tam iade edilen bir siparişin verdiği erişimi geri alır.
 *
 * İş kuralı: süre ve kredi TAMAMEN geri alınır; kullanılmış kısım için
 * oransal hesap yapılmaz.
 *
 * ⚠️ BİLİNEN SINIR — `user_subscriptions` ve `chatbot_purchase_credits`
 * tablolarında ödeme/sipariş bağı YOK; tek eşleşme (user_id, chatbot_id).
 * Aynı kullanıcı aynı botu iki kez satın aldıysa (I-01 düzeltmesinden
 * sonra yenileme mümkün) birinci siparişin iadesi ikinciyi de kapatır.
 * Bu durum sessiz geçilmiyor: tespit edilip log'a ve admin yanıtına
 * yazılıyor. Kalıcı çözüm `user_subscriptions`'a `payment_id` eklemek.
 *
 * @param array $detailRows param_marketplace_details satırları
 * @return array{subscriptions:int,credits:int,ambiguous:array}
 */
function revokeRefundedAccess(Database $db, int $buyerId, array $detailRows, string $orderId): array {
    $result = ['subscriptions' => 0, 'credits' => 0, 'ambiguous' => []];
    if ($buyerId <= 0) {
        return $result;
    }

    foreach ($detailRows as $d) {
        $chatbotId = (int) ($d['chatbot_id'] ?? 0);
        if ($chatbotId <= 0) {
            continue;
        }

        // Aynı (kullanıcı, bot) için birden fazla abonelik satırı varsa
        // hangisinin BU siparişe ait olduğunu şema söyleyemiyor.
        $rowCount = (int) ($db->selectSingle(
            'COUNT(*) AS c FROM user_subscriptions WHERE user_id = ? AND chatbot_id = ?',
            [$buyerId, $chatbotId]
        )['c'] ?? 0);
        if ($rowCount > 1) {
            $result['ambiguous'][] = $chatbotId;
            error_log(sprintf(
                '[refund-audit] UYARI: order=%s bot=%d için %d abonelik satırı var; '
                . 'sipariş bağı olmadığı için HEPSİ pasife alınıyor. user_id=%d',
                $orderId,
                $chatbotId,
                $rowCount,
                $buyerId
            ));
        }

        $result['subscriptions'] += $db->update(
            'user_subscriptions',
            ['status' => 0],
            'user_id = ? AND chatbot_id = ? AND status = 1',
            [$buyerId, $chatbotId]
        );

        // Bonus mesaj kredisi: kalan hak sıfırlanıyor. `credits_total`
        // muhasebe kaydı olarak DURUYOR — "ne kadar verilmişti" bilgisi
        // iade sonrasında da lazım.
        $result['credits'] += $db->update(
            'chatbot_purchase_credits',
            ['credits_remaining' => 0],
            'user_id = ? AND chatbot_id = ? AND credits_remaining > 0',
            [$buyerId, $chatbotId]
        );
    }

    return $result;
}

/**
 * İade denemesini tetikleyen kişi. İade uç noktası `requireAdmin()`
 * arkasında, yani normalde `$_SESSION['admin']` doludur.
 */
function refundActor(): string {
    return (string) ($_SESSION['admin'] ?? ($_SESSION['user_id'] ?? 'bilinmiyor'));
}

/**
 * I-02 — her iade DENEMESİNİN denetim kaydı: kim, ne zaman, hangi işlem,
 * önceki ve sonraki durum.
 *
 * Başarılı denemeler `param_marketplace_refunds`'a satır yazıyor; ama
 * reddedilen denemeler (zaten iade edilmiş, tahsil edilmemiş, sağlayıcı
 * kimliği yok) hiçbir iz bırakmıyordu. Para hareketiyle ilgili her
 * teşebbüs görünür olmalı.
 */
function refundAudit(array $payment, string $outcome, string $before, string $after, string $detail = ''): void {
    error_log(sprintf(
        '[refund-audit] order=%s payment_id=%s sonuc=%s durum=%s->%s admin=%s ip=%s%s',
        (string) ($payment['order_id'] ?? '-'),
        (string) ($payment['id'] ?? '-'),
        $outcome,
        $before,
        $after,
        refundActor(),
        clientIp(),
        $detail !== '' ? ' detay=' . $detail : ''
    ));
}

/**
 * Param POS'un asenkron bildirim uç noktası. iyzico'nun 3DS'siz akışında
 * asenkron bildirim YOK — tahsilat `/payment/auth` yanıtıyla senkron olarak
 * kesinleşiyor. Uç nokta (SellerController::paramposCallback) hâlâ
 * yönlendirilebilir durumda olduğu için fonksiyon duruyor ama bilinçli
 * olarak hiçbir şey işlemiyor: sahte bir "ödendi" satırı üretmiyor.
 */
function handleParamCallback(Database $db, PDO $conn, array $post): void {
    error_log('[iyzico] paramposCallback çağrıldı — sağlayıcı iyzico, asenkron bildirim kullanılmıyor. Yok sayıldı.');
    http_response_code(200);
    echo 'OK';
    exit;
}
