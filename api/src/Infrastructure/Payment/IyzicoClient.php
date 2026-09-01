<?php
/**
 * iyzico (iyzipay) ödeme sağlayıcısı istemcisi.
 *
 * DEP-001 / PAY-001 — bu proje Param POS için tasarlanmıştı ama entegrasyon
 * hiç yazılmadı; `chargeCard()` bir stub'dı ve gerçek tahsilat yapmıyordu.
 * Sağlayıcı iyzico olarak değiştirildi. Şema tarafındaki `param_*` tablo ve
 * sütun adları BİLİNÇLİ OLARAK korunuyor: içlerinde canlı veri var ve
 * yeniden adlandırmak migration + tüm okuma yollarını değiştirmek demek.
 * Sütunların anlamı sağlayıcıdan bağımsız:
 *   param_transaction_id → iyzico paymentId
 *   param_receipt_id     → iyzico conversationId (bizim order_id'miz)
 *   param_net_amount     → iyzico'nun komisyon sonrası ödeyeceği net tutar
 *   param_response_json  → sağlayıcının ham yanıtı (maskelenmiş)
 *
 * Resmî `iyzipay` composer paketi yerine doğrudan HTTP kullanılıyor:
 * paket PHP 8.1'de deprecation üretiyor ve tek ihtiyacımız olan şey
 * IYZWSv2 imzası + JSON POST. Bağımlılık eklemeden aynı işi yapıyoruz.
 *
 * IYZWSv2 imza şeması (iyzico'nun kendi SDK'sıyla birebir aynı):
 *   payload   = randomKey + uriPath + requestBody
 *   signature = hex(hmac_sha256(payload, secretKey))
 *   authString= "apiKey:{k}&randomKey:{r}&signature:{s}"
 *   header    = "IYZWSv2 " + base64(authString)
 * Ayrıca `x-iyzi-rnd` başlığı imzadaki randomKey ile AYNI olmak zorunda.
 */
final class IyzicoClient
{
    /** iyzico bir isteğe bu süreden uzun yanıt vermezse tahsilat belirsizdir. */
    private const CONNECT_TIMEOUT = 10;
    private const TIMEOUT         = 40;

    private string $apiKey;
    private string $secretKey;
    private string $baseUrl;

    public function __construct(?string $apiKey = null, ?string $secretKey = null, ?string $baseUrl = null)
    {
        $this->apiKey    = $apiKey    ?? (string) env_get('IYZICO_API_KEY', '');
        $this->secretKey = $secretKey ?? (string) env_get('IYZICO_SECRET_KEY', '');
        // Varsayılan BİLİNÇLİ olarak sandbox. Yanlış yapılandırma sonucu
        // canlı karta gerçek para düşmesindense sandbox'a düşmesi yeğdir.
        $this->baseUrl = rtrim($baseUrl ?? (string) env_get('IYZICO_BASE_URL', 'https://sandbox-api.iyzipay.com'), '/');
    }

    /** Anahtarlar yoksa hiçbir çağrı denenmemeli — sessizce "başarılı" olmamalı. */
    public function isConfigured(): bool
    {
        return $this->apiKey !== '' && $this->secretKey !== '';
    }

    public function isSandbox(): bool
    {
        return str_contains($this->baseUrl, 'sandbox');
    }

    // ── Uç noktalar ──────────────────────────────────────────────────────

    /** 3D Secure'suz doğrudan tahsilat. */
    public function createPayment(array $payload): array
    {
        return $this->request('/payment/auth', $payload);
    }

    /** Ödeme durumunu sağlayıcıdan okur (mutabakat için). */
    public function retrievePayment(string $paymentId, string $conversationId): array
    {
        return $this->request('/payment/detail', [
            'locale'         => 'tr',
            'conversationId' => $conversationId,
            'paymentId'      => $paymentId,
        ]);
    }

    /**
     * Tahsilatın tamamını iptal eder. Yalnızca AYNI GÜN içinde ve tam tutar
     * için çalışır; sonrası için refund() gerekir. Tahsilat başarılı olup
     * ardından bizim tarafımızda bir şey patladığında telafi yolu budur.
     */
    public function cancelPayment(string $paymentId, string $ip, string $conversationId = ''): array
    {
        return $this->request('/payment/cancel', [
            'locale'         => 'tr',
            'conversationId' => $conversationId !== '' ? $conversationId : $paymentId,
            'paymentId'      => $paymentId,
            'ip'             => $ip,
        ]);
    }

    /**
     * Kısmi/tam iade. DİKKAT: iyzico iadeyi ödemenin tamamı üzerinden değil,
     * sepet kalemi başına üretilen `paymentTransactionId` üzerinden yapar —
     * bu yüzden çağıran taraf hangi kalemi iade ettiğini bilmek zorunda.
     */
    public function refund(string $paymentTransactionId, float $price, string $ip, string $currency = 'TRY', string $conversationId = ''): array
    {
        return $this->request('/payment/refund', [
            'locale'               => 'tr',
            'conversationId'       => $conversationId !== '' ? $conversationId : $paymentTransactionId,
            'paymentTransactionId' => $paymentTransactionId,
            'price'                => self::money($price),
            'ip'                   => $ip,
            'currency'             => $currency,
        ]);
    }

    // ── İmzalama ve taşıma ───────────────────────────────────────────────

    /**
     * @return array{status:string,errorCode?:string,errorMessage?:string,...}
     *         Her zaman bir dizi döner; ağ/parse hataları da iyzico'nun kendi
     *         hata biçimine ('status' => 'failure') çevrilir, böylece çağıran
     *         taraf tek bir şekli ele alır.
     */
    public function request(string $uri, array $payload): array
    {
        if (!$this->isConfigured()) {
            return [
                'status'       => 'failure',
                'errorCode'    => 'CONFIG_MISSING',
                'errorMessage' => 'Ödeme sağlayıcısı yapılandırılmamış.',
            ];
        }

        // İmza, gövdenin BAYT BAYT aynısı üzerinden hesaplanmak zorunda —
        // bu yüzden json_encode bir kez yapılıp hem imzaya hem gövdeye
        // aynı string veriliyor. Yeniden encode etmek imzayı bozar.
        // JSON_UNESCAPED_UNICODE/SLASHES kullanılmıyor: iyzico ASCII-escape'li
        // gövdeyi de kabul ediyor ve burada önemli olan tutarlılık.
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            return [
                'status'       => 'failure',
                'errorCode'    => 'ENCODE_FAILED',
                'errorMessage' => 'Ödeme isteği hazırlanamadı.',
            ];
        }

        $randomKey = $this->randomKey();
        $signature = hash_hmac('sha256', $randomKey . $uri . $body, $this->secretKey);
        $authString = 'apiKey:' . $this->apiKey . '&randomKey:' . $randomKey . '&signature:' . $signature;

        $ch = curl_init($this->baseUrl . $uri);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            // Ödeme trafiğinde sertifika doğrulaması kapatılamaz.
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: IYZWSv2 ' . base64_encode($authString),
                'x-iyzi-rnd: ' . $randomKey,
                'x-iyzi-client-version: lumanoris-php-1',
            ],
        ]);

        $raw      = curl_exec($ch);
        $curlErr  = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            // Zaman aşımı = tahsilatın yapılıp yapılmadığı BELİRSİZ. Çağıran
            // taraf bunu başarısızlık sayar (doğru olan), ama mutabakat
            // (reconcilePayments) aynı conversationId ile sorup gerçekten
            // çekilmiş bir ödeme varsa yakalayabilsin diye ayrı kodlanıyor.
            error_log('[iyzico] transport hatası ' . $uri . ': ' . $curlErr);
            return [
                'status'       => 'failure',
                'errorCode'    => 'TRANSPORT_ERROR',
                'errorMessage' => 'Ödeme sağlayıcısına ulaşılamadı.',
                'transport'    => $curlErr,
            ];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            error_log('[iyzico] JSON olmayan yanıt ' . $uri . ' http=' . $httpCode . ' body=' . substr($raw, 0, 500));
            return [
                'status'       => 'failure',
                'errorCode'    => 'BAD_RESPONSE',
                'errorMessage' => 'Ödeme sağlayıcısından geçersiz yanıt alındı.',
            ];
        }

        $decoded['httpCode'] = $httpCode;
        return $decoded;
    }

    /**
     * iyzico SDK'sı randomKey'i "timestamp + rastgele" olarak üretir. Tek
     * gereklilik istek başına benzersiz olması; aynı değer hem imzaya hem
     * `x-iyzi-rnd` başlığına gider.
     */
    private function randomKey(): string
    {
        return (string) (int) (microtime(true) * 1000) . bin2hex(random_bytes(8));
    }

    // ── Yardımcılar ──────────────────────────────────────────────────────

    /**
     * iyzico tutarları ondalık string bekler ve `price` ile sepet
     * kalemlerinin TOPLAMINI tam olarak karşılaştırır. Tek bir kuruşluk
     * yuvarlama farkı "errorCode 5 — sepet tutarı uyuşmuyor" ile isteği
     * reddettirir, o yüzden her tutar tek bir yerden geçiyor.
     */
    public static function money(float $value): string
    {
        return number_format(round($value, 2), 2, '.', '');
    }

    /** iyzico tarih biçimi: YYYY-MM-DD HH:mm:ss */
    public static function date(?string $value): string
    {
        $ts = $value ? strtotime($value) : false;
        return date('Y-m-d H:i:s', $ts !== false ? $ts : time());
    }

    /**
     * Sepet kalemlerinin toplamını istenen toplama tam olarak eşitler.
     * Kalem bazında yuvarlama, toplamla birkaç kuruş sapabilir; farkı SON
     * kaleme yazıyoruz. Kalem fiyatlarını serbest bırakıp toplamı
     * düzeltmek yerine tersini yapmak iyzico'nun eşitlik kontrolünü
     * deterministik biçimde geçmenin tek yolu.
     *
     * @param array<int,array<string,mixed>> $items 'price' anahtarı float
     * @return array<int,array<string,mixed>> 'price' anahtarı string
     */
    public static function balanceBasket(array $items, float $expectedTotal): array
    {
        if (empty($items)) {
            return [];
        }

        $running = 0.0;
        $last    = count($items) - 1;
        foreach ($items as $i => &$item) {
            if ($i === $last) {
                $item['price'] = self::money(round($expectedTotal - $running, 2));
            } else {
                $price         = round((float) $item['price'], 2);
                $item['price'] = self::money($price);
                $running       = round($running + $price, 2);
            }
        }
        unset($item);

        return $items;
    }

    /**
     * Ham sağlayıcı yanıtını saklamadan önce kart verisini temizler.
     * iyzico kart numarası döndürmez ama `binNumber`/`lastFourDigits` gibi
     * alanlar döner; asıl risk isteği loglarken oluşur, bu yüzden istek
     * tarafı da bu fonksiyondan geçiriliyor.
     */
    public static function redact(array $data): array
    {
        $secret = ['cardNumber', 'cvc', 'expireMonth', 'expireYear', 'cardHolderName',
                   'number', 'cvv', 'expiry', 'holder_name', 'identityNumber'];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::redact($value);
            } elseif (in_array($key, $secret, true)) {
                $data[$key] = '***';
            }
        }
        return $data;
    }
}
