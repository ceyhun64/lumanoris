# Tur 7 — Performans, Deployment, Test ve Gerçekte Çalışmayan Özellikler

Kapsanan `docs/denetim.md` bölümleri: **13** (Performance), **14** (Deployment / DevOps),
**15** (Test), **21** (Gerçekte çalışmayan özellikler).

---

## BU RAPORUN KURALLARI

- **HİÇBİR KAYNAK DOSYA DEĞİŞTİRİLMEDİ.** Yazma işlemi yalnızca `docs/audit/` altına yapıldı.
- Her bulgu `dosya:satır` + en fazla 15 satırlık kod alıntısı içerir. Okunmayan dosya hakkında bulgu yazılmadı.
- Bulgu formatı `denetim.md` bölüm 23; severity ölçeği bölüm 22. Bölüm 21 kendi formatını
  istediği için o başlık altında `Feature / Beklenen / Gerçek / Kanıt / Hazır mı` tablosu kullanıldı.
- `denetim.md` bölüm 24 (false positive kontrolü) her bulgudan önce uygulandı.
- Her bulguya bölüm 27'ye göre **TÜR** etiketi verildi.
- **Bölüm 26'daki X/10 puanlama üretilmedi.**
- Emin olunamayan her şey "Doğrulanamayanlar" başlığında, nedeniyle birlikte.
- Kozmetik/stil notu yazılmadı.

---

## 0. Bu turda gerçekten okunan dosyalar

**Tam okunanlar (4):**
`api/functions/phpmailer.php` (25 satır), `api/functions/ParamPosMarketplace.php` (39),
`api/admin/ajax/updateenv.php` (78), `api/composer.json`

**Kısmi okunanlar:**
`api/src/Presentation/Controllers/SellerController.php:3-107` (`register()` — tamamı),
`api/composer.lock` (paket sürümleri), `web/server.js:52` (listen), `web/package.json` (engines)

**Mekanik taramalar:** `'use client'` sınır ölçümü (144 modül), 20 `page.jsx`'in
client/server durumu, `dynamic()` sayımı, CORS/graceful-shutdown/health-check taraması,
`vendor`/`node_modules`/`.next` gitignore durumu, Node/PHP sürüm sabitleme taraması

---

## 1. DEPLOYMENT / DEVOPS (denetim.md bölüm 14)

---

### DEP-001

**Severity:** 🔴 CRITICAL
**TÜR:** prod blocker

**Başlık:** `ParamPosMarketplace::addSubMerchant()` stub'ı her zaman başarısız dönüyor ve bu tek nokta ürünün **tüm** pazaryeri döngüsünü kilitliyor — temiz bir kurulumda kimse satıcı olamıyor, dolayısıyla hiçbir bot yayınlanamıyor ve hiçbir satış yapılamıyor

**Dosya:** `api/functions/ParamPosMarketplace.php:10-13`, `api/src/Presentation/Controllers/SellerController.php:83-96`

**Problem:**

```php
api/functions/ParamPosMarketplace.php:10-13
    public function addSubMerchant(array $params): array {
        error_log('[ParamPosMarketplace-stub] addSubMerchant: ' . json_encode($params));
        return ['success' => false, 'message' => 'Param POS sub-merchant kaydı bu ortamda desteklenmiyor (dev stub).'];
    }
```

`SellerController::register()` — 105 satırlık, titizlikle yazılmış bir akış — bu dönüşe
bağlı:

```php
api/src/Presentation/Controllers/SellerController.php:83-96
        $param  = new ParamPosMarketplace();
        $result = $param->addSubMerchant($paramParams);
        $now    = date('Y-m-d H:i:s');
        $payloadJson = json_encode($paramParams, JSON_UNESCAPED_UNICODE);

        if (!$result['success']) {
            $errMsg = $result['message'] ?: 'Param sub-merchant başvurusu reddedildi.';
            if ($existing) {
                $db->update('param_marketplace_sellers', ['status' => 'rejected', ...], 'user_id = ?', [$userId]);
            } else {
                $db->insert('param_marketplace_sellers', ['user_id' => $userId, 'guid_altuyeisyeri' => '', 'status' => 'rejected', ...]);
            }
            JsonResponse::error($errMsg, 422, AppConfig::ERR_PAYMENT, ['status' => 'rejected']);
        }

        $guid = (string) $result['guid_altuyeisyeri'];
```

`status = 'active'` yalnızca satır 100/102'de, yani **yalnızca gateway başarılı olursa**
yazılıyor. Stub asla başarılı olmadığı için `param_marketplace_sellers.status` hiçbir
zaman `'active'` olamıyor.

**Kanıt (bölüm 24 — `'active'` statüsüne bağlı her kapı tek tek izlendi):**

```
$ grep -rn "!== 'active'\|=== 'active'\|status = 'active'\|status' => 'active'" api/src --include=*.php
ChatbotController.php:53      $sellerStatus !== 'active'   → saveChatbot: herkese açık bot OLUŞTURULAMAZ (422)
ChatbotController.php:191     $sellerStatus !== 'active'   → publishChatbot: bot YAYINLANAMAZ (422)
MarketplaceController.php:21  ($sellerCheck['status'] ?? '') !== 'active'  → addToCart: SEPETE EKLENEMEZ (422)
MarketplaceController.php:217 ($bot['seller_status'] ?? '') !== 'active'   → createSubscription: SATIN ALINAMAZ (422)
ChatbotRepository.php:92      INNER JOIN param_marketplace_sellers pms ... AND pms.status = 'active'
                                                           → getPublished: PAZARYERİ LİSTESİ BOŞ
ChatbotRepository.php (userHasAccess satır 9)  pms.status = 'active'
                                                           → erişim politikasının 2. dalı hiç sağlanmaz
SellerController.php:100,102  'status' => 'active'         → TEK yazma noktası, stub yüzünden ulaşılamaz
```

**Zincir — temiz bir veritabanında:**
1. Kullanıcı satıcı kaydı yapar → `addSubMerchant` başarısız → `status='rejected'`
2. Herkese açık bot oluşturamaz (`saveChatbot` 422)
3. Var olan bir botu yayınlayamaz (`publishChatbot` 422)
4. Pazaryeri listesi boş (`getPublished` INNER JOIN hiçbir satır döndürmez)
5. Sepete bir şey eklenemez, satın alma yapılamaz

**İkinci kilit — il/ilçe listeleri de stub:**

```php
api/functions/ParamPosMarketplace.php:30-38
    public function listIller(): array {
        error_log('[ParamPosMarketplace-stub] listIller');
        return ['success' => false, 'message' => 'İl listesi bu ortamda alınamıyor (dev stub).', 'items' => []];
    }
    public function listIlceler(int $ilKodu): array {
        ...
        return ['success' => false, 'message' => 'İlçe listesi bu ortamda alınamıyor (dev stub).', 'items' => []];
```

`register()` `il_kod` ve `ilce_kod`'u **zorunlu** tutuyor:

```php
api/src/Presentation/Controllers/SellerController.php:29
        $required = ['phone', 'iban', 'il_kod', 'ilce_kod'];
```

Bu kodlar `list_iller.php` / `list_ilceler.php` üzerinden geliyor (Tur 1'de frontend'in
bu ikisini çağırdığı doğrulanmıştı). İkisi de boş liste döndürdüğü için kullanıcı formu
**doldurmadan önce** tıkanıyor. Yani zincir iki ayrı noktada kopuk.

**Impact:** Ürünün gelir modelinin tamamı — bot yayınlama, pazaryeri, satın alma,
abonelik, satıcı kazancı — temiz bir kurulumda erişilemez. Uygulama çalışıyor gibi
görünüyor (giriş, bot oluşturma-bağımsız, sohbet), ama satılabilir hiçbir şey yok.

**Önemli nüans — önceki turlara etkisi:** Tur 3 PAY-002 (ödeme duvarı yok) ve PAY-001
(sahte tahsilat çekilebilir bakiye üretiyor) bulgularının **ikisi de** `status='active'`
satırlarının varlığını gerektiriyor. Geliştirme veritabanında bu satırlar var (Tur 3'te
canlı satın alma izlerine referans veren yorumlar okundu: "observed: order ORD-2041EEC4"),
yani elle veya daha eski bir çalışan implementasyonla eklenmişler. **Temiz bir kurulumda
PAY-001 ve PAY-002 tetiklenemez** — bu, o iki bulgunun ciddiyetini azaltmaz (production'da
gerçek satıcılar olacak) ama sömürü önkoşulunu netleştiriyor. Bunu Tur 3'e düzeltme olarak
değil, bağlam olarak ekliyorum.

**Dürüstlük notu:** README bu dosyayı "Development stubs" tablosunda listeliyor ve
"Every sub-merchant and province/district method returns a failure or an empty list"
diyor — yani **gizli değil, belgeli**. CRITICAL verilmesinin nedeni bölüm 22'nin
"production'u kullanılmaz hale getiren problem" tanımı ve bölüm 21'in bu turdaki görevi:
belgeli olması, production'a çıkamayacağı gerçeğini değiştirmiyor.

**Önerilen çözüm:** Gerçek Param POS SOAP/REST istemcisi. Kısa vadede, geliştirme
ortamında pazaryerinin test edilebilmesi için `addSubMerchant`'ın bir ortam bayrağıyla
(`PARAM_STUB_APPROVE=1` gibi) sahte bir GUID ile başarı dönebilmesi — ama bu bayrak
production'da **asla** açılmamalı ve `status`'un `'simulated'` gibi ayrı bir değer
alması gerekir ki PAY-001'in bakiye zinciri beslenmesin.

**Çözüm önceliği:** **Acil** — production'ın ön koşulu.

---

### DEP-002

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** Satıcı kayıt stub'ı TC kimlik numarası, IBAN, doğum tarihi ve adresi `error_log`'a yazıyor — Tur 2 SEC-001 o log dosyasının HTTP üzerinden okunabildiğini gösterdi

**Dosya:** `api/functions/ParamPosMarketplace.php:11`, `api/src/Presentation/Controllers/SellerController.php:61-81`

**Problem:**

```php
api/functions/ParamPosMarketplace.php:11
        error_log('[ParamPosMarketplace-stub] addSubMerchant: ' . json_encode($params));
```

`$params` içeriği `SellerController::register()`'da kuruluyor:

```php
api/src/Presentation/Controllers/SellerController.php:61-73
        $paramParams = [
            'Tip' => $tip, 'Ad_Soyad' => $adSoyad, 'Unvan' => $unvan ?: $adSoyad,
            'TC_VN'      => preg_replace('/\D+/', '', $tcVn),
            'GSM_No'     => ltrim(preg_replace('/\D+/', '', (string) $bank['phone']), '0'),
            'IBAN_No'    => preg_replace('/\s+/', '', strtoupper((string) $bank['iban'])),
            'IBAN_Unvan' => $ibanUnvan ?: $adSoyad,
            'Adres'      => $address,
            'Il'         => (int) $bank['il_kod'],
            'Ilce'       => (int) $bank['ilce_kod'],
            'EPosta'     => $email,
            'Website'    => '',
            'MCC_Kod'    => '5815',
            'Vergi_Daire' => trim((string) ($bank['tax_office'] ?? '')),
        ];
```

Ve kişisel hesaplarda doğum tarihi de ekleniyor:

```php
api/src/Presentation/Controllers/SellerController.php:75-81
        if (!$isCorporate) {
            $paramParams['Kisi_DogumTarihi'] = (string) ($bank['kisi_dogum_tarihi'] ?? '');
        }
        if ($isCorporate) {
            $paramParams['Yetkili_Kisi_TC'] = preg_replace('/\D+/', '', (string) $bank['id_number']);
            $paramParams['Yetkili_Kisi_DogumTarihi'] = (string) ($bank['yetkili_kisi_dogum_tarihi'] ?? '');
        }
```

**Kanıt (bölüm 24 — logun gerçekten erişilebilir olduğu ve verinin gerçekten hassas
olduğu ayrı ayrı doğrulandı):**

```
1) Log dosyası HTTP'den okunabiliyor mu? (Tur 2 SEC-001)
api/router.php:7      if ($uri !== '/' && (is_file($file) || is_dir($file))) return false;
web/server.js:29      pathFilter: ['/admin', '/api', '/assets']
$ ls -la api/admin/error_log api/api/error_log
-rw-r--r-- 507 api/admin/error_log
-rw-r--r--   0 api/api/error_log
   → GET /admin/error_log proxy üzerinden PHP'ye gidiyor ve gerçek dosya olarak servis
     ediliyor (Tur 2 SEC-001'de ayrıntılı gerekçelendirildi).

2) Aynı veri veritabanına da yazılıyor mu? EVET:
api/src/Presentation/Controllers/SellerController.php:86, 93, 102
        $payloadJson = json_encode($paramParams, JSON_UNESCAPED_UNICODE);
        ... 'param_payload_json' => $payloadJson
   → param_marketplace_sellers.param_payload_json sütununa düz JSON olarak.
     Tur 2 SEC-001 veritabanı dökümünün de (api/admin/db_backup/*.sql) HTTP'den
     indirilebildiğini gösterdi → ikinci sızıntı yolu.

3) Başka stub'lar da hassas veri logluyor mu?
api/functions/checkout_payments.php:61   kart son 4 hanesi + tutar  (Tur 3 PAY-015)
api/functions/producer_plan.php:19       userId
api/functions/phpmailer.php:19           to= + subject=  (gövde YOK — bkz. DEP-003)
```

**Neden HIGH:** TC kimlik numarası KVKK kapsamında özel nitelikli olmayan ama kimlik
doğrulayıcı bir veridir; IBAN + ad + doğum tarihi + adres birleşimi kimlik hırsızlığı
için yeterli bir sete karşılık gelir. Ve bu veri **her başarısız satıcı kayıt
denemesinde** loglanıyor — DEP-001 gereği kayıt **her zaman** başarısız olduğu için,
her deneme bir log satırı bırakıyor.

**Impact:** Kimliği doğrulanmamış bir istekle satıcıların tam kimlik ve banka bilgilerinin
okunması.

**Önerilen çözüm:** (1) Stub'ın `json_encode($params)` yerine yalnızca alan adlarını
loglaması. (2) SEC-001'in çözümü (log ve yedek dosyalarını doküman kökünden çıkarmak) —
asıl düzeltme bu. (3) `param_payload_json` sütununda TC/IBAN'ın maskelenmesi.

**Çözüm önceliği:** Yüksek.

---

### DEP-003

**Severity:** 🟠 HIGH
**TÜR:** prod blocker + doküman

**Başlık:** `sendEmail()` sahte başarı döndürüyor **ve** e-posta gövdesini loglamıyor — README'nin "şifre sıfırlama kodu error_log'da görünür" tavsiyesi yanlış, şifre sıfırlama tamamen kurtarılamaz durumda

**Dosya:** `api/functions/phpmailer.php:10-25`, `README.md` (Troubleshooting bölümü)

**Problem:**

```php
api/functions/phpmailer.php:10-25
function sendEmail(
    string $fromEmail,
    string $fromName,
    string $toEmail,
    string $subject,
    string $htmlBody,
    ?array $attachment = null
): array {
    // Dev stub — log the attempt, return success-like response.
    error_log("[phpmailer-stub] to=$toEmail subject=$subject");

    return [
        'success' => true,
        'message' => 'Mail gönderimi simüle edildi (dev stub).',
    ];
}
```

`$htmlBody` parametresi alınıyor ama **hiçbir yerde kullanılmıyor** — ne gönderiliyor
ne loglanıyor.

**Kanıt (bölüm 24 — kodun gerçekten gövdede olduğu ve README'nin ne vaat ettiği
karşılaştırıldı):**

```
1) Şifre sıfırlama kodu nerede?
api/src/Presentation/Controllers/AuthController.php:163-164, 189-195
        $code     = (string) random_int(100000, 999999);
        $codeHash = hash('sha256', $code);
        ...
        $body    = "<p>Merhaba <strong>$name</strong>,</p>
                    <p>Şifrenizi sıfırlamak için kullanmanız gereken kod:</p>
                    <h2 style='color:#2c3e50;'>$code</h2>
                    ...";
        $result = sendEmail(AppConfig::noreplyEmail(), 'Sistem', $email, $subject, $body);
   → kod $body içinde, yani sendEmail'in 5. parametresi ($htmlBody).

2) Stub gövdeyi logluyor mu? HAYIR:
api/functions/phpmailer.php:19   error_log("[phpmailer-stub] to=$toEmail subject=$subject");
   → yalnızca alıcı ve konu. $htmlBody hiç geçmiyor.

3) README ne diyor?
README.md (Troubleshooting):
   **Password reset emails never arrive**
   Expected: `functions/phpmailer.php` is a stub. The generated code is visible in the PHP error log.
   → YANLIŞ. Kod error_log'a hiç yazılmıyor.

4) Kod başka bir yerden alınabilir mi?
   password_resets tablosunda yalnızca code_hash (SHA-256) var — geri döndürülemez.
api/src/Presentation/Controllers/AuthController.php:182-185
        $stmt = $conn->prepare('INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL 15 MINUTE)');
   → düz kod hiçbir yerde saklanmıyor.
```

**Neden HIGH — üç ayrı sonuç:**

1. **Şifre sıfırlama uçtan uca imkânsız.** Kullanıcı kodu alamıyor; veritabanında yalnızca
   hash var; log'da hiç yok. Şifresini unutan bir kullanıcının hesabına erişimi
   **kalıcı olarak** kesiliyor. Bir yönetici bile yardım edemiyor (admin panelinde
   parola sıfırlama yolu yok — Tur 1 envanterinde `kullanicilar.php` var ama parola
   alanı yönetimi bu turda incelenmedi).
2. **README yanlış yönlendiriyor.** Sorun yaşayan geliştirici error_log'a bakacak,
   hiçbir şey bulamayacak, ve nedenini anlamayacak. Bu, Tur 1'de tespit edilen
   README-kod ayrışması kalıbının (DOC-002…007) devamı.
3. **Sahte başarı.** `sendEmail` `success: true` döndürdüğü için `sendPasswordResetMail`
   kullanıcıya "kod gönderildi" diyor. Kullanıcı postasını bekliyor, hiç gelmiyor.

Bu, denetimde bulunan **dördüncü** sahte-başarı mekanizması (diğerleri: Tur 3 PAY-012
`processRefund`, Tur 3 BIZ-001 `upgradePlan`, Tur 6 UX-001 önizleme asistanı).

**Ek not — SEC-001'in etkisini AZALTAN bir bulgu:** Tur 2 ve Tur 3'ten devredilen
"`api/admin/error_log` şifre sıfırlama kodları içeriyor mu?" sorusunun cevabı: **hayır**.
Stub gövdeyi loglamadığı için o dosyada kod yok. SEC-001'in etkisi bu yönden bir miktar
dar — ama DEP-002 gereği aynı log **TC kimlik no ve IBAN** içeriyor, yani toplam etki
azalmıyor.

**Önerilen çözüm:** Gerçek PHPMailer implementasyonu (SMTP ayarları admin panelinde
zaten yönetiliyor — `admin/smtp.php`, bu turda okunmadı). Stub kaldığı sürece iki dürüst
seçenek: (a) `success: false` döndürmek (`producer_plan.php`'nin doğru yaptığı gibi),
(b) `$htmlBody`'yi de loglamak ve README'yi doğrulamak. Şu anki hâl ikisinin de kötüsü.

**Çözüm önceliği:** Yüksek.

---

### DEP-004

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik + bug

**Başlık:** `updateenv.php` `.env` dosyasına satır sonu enjeksiyonuna açık, CSRF karşılaştırmasını zaman-güvensiz yapıyor ve yazma sonucunu hiç kontrol etmiyor

**Dosya:** `api/admin/ajax/updateenv.php:21, 30-34, 44-66`

**Bu, Tur 2'den beri (üç tur) devredilen açık sorunun cevabıdır.**

**Problem — üç ayrı kusur:**

**(a) Değer ve anahtar filtrelenmeden `.env`'e yazılıyor:**

```php
api/admin/ajax/updateenv.php:30-34, 44-62
function camelToApiCase($key) {
    $converted = preg_replace('/([a-z])([A-Z])/', '$1_$2', $key);
    $converted = strtoupper($converted);
    return 'API_' . $converted;
}
...
foreach ($_POST as $key => $value) {
    if ($key === 'csrf_token') continue;
    $newKey = camelToApiCase($key);
    ...
        if (strpos($line, $newKey . '=') === 0) {
            $lines[$i] = $newKey . '=' . $value;
    ...
    if (!$found) {
        $lines[] = $newKey . '=' . $value;
    }
}
```

`camelToApiCase` yalnızca camelCase'i snake_case'e çeviriyor ve büyük harfe alıyor —
**karakter filtrelemesi yok**. `$value` hiç dokunulmadan yazılıyor. Satır sonu içeren bir
değer yeni bir `.env` satırı üretir:

```
POST googleGemini=abc%0AAPI_BASKA_ANAHTAR=deger
→ .env içine iki satır:
   API_GOOGLE_GEMINI=abc
   API_BASKA_ANAHTAR=deger
```

**(b) CSRF karşılaştırması zaman-güvensiz ve gereksiz tekrar:**

```php
api/admin/ajax/updateenv.php:21
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
```

**(c) Yazma sonucu kontrol edilmiyor, başarı yine de bildiriliyor:**

```php
api/admin/ajax/updateenv.php:66-73
file_put_contents($envFile, implode(PHP_EOL, $lines) . PHP_EOL);

if (!empty($result)) {
    echo json_encode([
        'status'  => 'success',
        'message' => "API Anahtarları başarıyla güncellendi!"
    ]);
```

`file_put_contents` dönüşü yok sayılıyor; disk dolu/izin hatası durumunda kullanıcı
"başarıyla güncellendi" görüyor. Kilitleme (`LOCK_EX`) ve atomik yazma yok — eşzamanlı
iki istek dosyayı bozabilir, ve yazma yarıda kesilirse Gemini anahtarı kaybolur.

**Kanıt (bölüm 24 — enjeksiyonun etki alanı ve CSRF'in gerçekten çift kontrol olduğu
doğrulandı):**

```
1) Hangi .env dosyası? Etki alanı ne kadar geniş?
api/admin/ajax/updateenv.php:37   $envFile = __DIR__ . '/../.env';   → api/admin/.env
   → functions/bootstrap.php api/.env'i okuyor (FARKLI dosya).
   → api/admin/.env'i okuyanlar: admin/api.php (phpdotenv) ve
     AppConfig::googleGeminiApiKey()'in doğrudan ayrıştırması (README).
   → Yani DB_* enjekte edilerek veritabanı yönlendirilemez; etki alanı DAR.
     Bu, bulgunun HIGH değil MEDIUM olmasının nedeni.

2) CSRF zaten kontrol edilmiş mi? EVET:
api/admin/ajax/updateenv.php:2      require_once __DIR__ . '/_guard.php';
api/admin/ajax/_guard.php:32-34     non-GET isteklerde csrf_check($token)
api/functions/util.php:30           return isset(...) && hash_equals($_SESSION['csrf_token'], $csrf_token);
   → _guard.php hash_equals ile DOĞRU kontrolü zaten yapıyor.
     Satır 21 gereksiz ve daha zayıf bir TEKRAR.

3) Aynı zayıflık başka yerde var mı?
$ grep -rn "csrf_token'\] !==\|csrf_token'\] ==" api/admin --include=*.php
api/admin/ajax/updateenv.php:21     ← tek yer
   → diğer endpoint'ler _guard.php'ye güveniyor.
```

**Impact:** Admin oturumu ele geçirilmiş bir saldırgan `api/admin/.env`'e keyfi anahtar
yazabilir; bozuk bir satır phpdotenv ayrıştırmasını kırarak admin panelini
kullanılamaz hâle getirebilir; başarısız yazma sessizce "başarılı" raporlanır.
Admin gerektirdiği ve etki alanı `api/admin/.env` ile sınırlı olduğu için MEDIUM.

**Önerilen çözüm:** `$value`'dan `\r\n` filtrelemek ve tırnak içine almak; `$key`'i
`/^[A-Za-z0-9_]+$/` ile doğrulamak; satır 21'i kaldırıp `_guard.php`'ye güvenmek;
`file_put_contents(..., LOCK_EX)` + dönüş kontrolü + geçici dosyaya yazıp `rename` ile
atomik değiştirme.

**Çözüm önceliği:** Orta.

---

### DEP-005

**Severity:** 🟡 MEDIUM
**TÜR:** prod blocker

**Başlık:** Health check endpoint'i, graceful shutdown ve yapılandırılabilir port yok — süreç yöneticisi ve yük dengeleyici entegrasyonu mümkün değil

**Dosya:** `web/server.js:52`

**Problem:**

```
$ grep -niE 'health|/ping|/status\b|readiness|liveness' web/server.js api/router.php api/api/index.php
(çıktı yok)

$ grep -niE 'SIGTERM|SIGINT|process\.on|server\.close' web/server.js
(çıktı yok)

$ grep -n 'listen' web/server.js
52:  server.listen(3000, '127.0.0.1', (err) => {
```

**Üç eksik, üçü de bölüm 14'ün açık maddesi:**

1. **Health check yok.** Ne Node ne PHP tarafında bir `/health` veya `/ping` uç noktası
   var. Bir yük dengeleyici veya süreç yöneticisi (PM2, systemd, Docker healthcheck)
   uygulamanın ayakta olup olmadığını anlayamaz. En yakın şey `/api/auth/sessioncheck.php`
   ama o oturum durumuna göre farklı yanıt veriyor ve veritabanına bağımlı.
2. **Graceful shutdown yok.** SIGTERM/SIGINT dinleyicisi ve `server.close()` çağrısı yok.
   Deploy veya yeniden başlatma sırasında uçuştaki istekler koparılır. Checkout
   (`createSubscription`) sırasında kopan bir istekte PHP tarafındaki transaction
   tamamlanır ama istemci sonucu **hiç öğrenemez** — Tur 3 PAY-008'de tespit edilen
   idempotency eksikliğiyle birleşince kullanıcı tekrar denediğinde çift satın alma
   riski doğar.
3. **Port sabit kodlanmış.** `3000` ve `127.0.0.1` literal. `PORT` ortam değişkeni yok.
   README bunu belgeliyor (Tur 1), ama belgelenmiş olması aynı sunucuda ikinci bir
   örnek çalıştırmayı veya farklı port isteyen bir platforma deploy etmeyi mümkün
   kılmıyor.

**Kanıt (bölüm 24 — bunların başka bir katmanda karşılanıp karşılanmadığı arandı):**

```
$ Süreç yöneticisi yapılandırması var mı?
   Tur 1 envanteri: Dockerfile yok, docker-compose yok, .github yok,
   ecosystem.config.js / Procfile / systemd unit yok.
$ package.json start script'i:
   "start": "node server.js"     → NODE_ENV set etmiyor (Tur 1 DOC/README teyidi)
$ api tarafında bir health endpoint?
   api/api/index.php → 404 fallback (Tur 1). Sağlık uç noktası değil.
```

**Impact:** Otomatik dağıtım, sıfır kesintili deploy, otomatik yeniden başlatma ve
izleme (monitoring) kurulamaz. Bölüm 14'ün "process manager", "health check",
"monitoring", "graceful shutdown", "port configuration" maddelerinin beşi birden açık.

**Önerilen çözüm:** `server.js`'e `const PORT = process.env.PORT || 3000`, bir
`GET /healthz` (Node'un ayakta olduğunu ve PHP'ye erişebildiğini kontrol eden), ve
`process.on('SIGTERM', () => server.close(...))`.

**Çözüm önceliği:** Orta — production dağıtımının ön koşulu.

---

### DEP-006

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Node ve PHP sürümleri hiçbir yerde sabitlenmemiş; `composer.json` yalnızca alt sınır veriyor

**Dosya:** `web/package.json`, `package.json`, `api/composer.json`

**Kanıt:**

```
$ grep -n 'engines' web/package.json package.json
(çıktı yok)
$ ls -la .nvmrc web/.nvmrc
ls: cannot access '.nvmrc': No such file or directory
ls: cannot access 'web/.nvmrc': No such file or directory

$ cat api/composer.json
    "require": {
        "php": ">=8.1",
        "google/apiclient": "^2.16",
        "smalot/pdfparser": "^2.9"
    }
   → alt sınır var, üst sınır yok, "platform" bloğu yok.

$ Kilitli gerçek sürümler (composer.lock):
   google/apiclient v2.19.4, google/apiclient-services v0.448.0, google/auth v1.52.0,
   guzzlehttp/guzzle 7.15.3, firebase/php-jwt v7.1.0, smalot/pdfparser v2.12.5
```

**Neden bir bulgu (ve neden LOW):** `composer.lock` ve `package-lock.json` mevcut, yani
**bağımlılık sürümleri sabit**. Sabitlenmemiş olan yalnızca **çalışma zamanı** sürümleri.
Pratik sonuç: bir sunucuda PHP 8.4 ve başka birinde 8.1 kurulu olabilir, ve
`composer install` ikisinde de aynı paketleri kurar ama davranış farklı olabilir.
Node için aynısı geçerli — Next.js 15 Node 18.18+ gerektiriyor ama bu hiçbir yerde
yazmıyor.

Ayrıca `composer.json`'da `platform` bloğu olmadığı için, PHP 8.4'lü bir makinede
`composer install` yapıldığında 8.1'de çalışmayan sürümler seçilebilir.

**Ek gözlem — `smalot/pdfparser v2.12.5`:** Tur 2'den devredilen "bilinen CVE var mı"
sorusu için sürüm tespit edildi. **CVE veritabanına erişimim olmadığı için güvenlik
açığı durumu doğrulanamadı** — bkz. Doğrulanamayanlar. Bu paket kullanıcı tarafından
yüklenen PDF'leri ayrıştırdığı için (TrainingController::readPdf) sürüm takibi
önemli.

**Impact:** Ortamlar arası davranış farkı; "benim makinemde çalışıyor" sınıfı sorunlar.

**Önerilen çözüm:** `package.json`'a `"engines": {"node": ">=18.18"}`, `.nvmrc`, ve
`composer.json`'a `"config": {"platform": {"php": "8.1.0"}}`.

**Çözüm önceliği:** Düşük.

---

## 2. PERFORMANS (denetim.md bölüm 13)

Bu bölümün **backend tarafı büyük ölçüde Tur 5'te** kapsandı ve burada tekrarlanmıyor:
`DB-001` (altı LEFT JOIN kartezyen çarpım — ana sayfa sorgusu), `DB-005` (iki tabloda
eksik `user_id` index'i), `DB-007` (`ORDER BY RAND()` × 2), `DB-009` (sayfalama hiç yok),
`DB-010` (`getHistory` korelasyonlu alt sorguları), `DB-011` (`SELECT *` × 12).
AI/streaming tarafı Tur 4'te: `AI-001` (sınırsız bağlam her mesajda Gemini'ye).
Aşağıdaki tek bulgu, hiçbir turda kapsanmayan **frontend mimarisi** boyutu.

---

### PERF-001

**Severity:** 🟡 MEDIUM
**TÜR:** mimari

**Başlık:** İçerik taşıyan 20 sayfanın 16'sı client component; server component hiç kullanılmıyor — Next.js'in sunucu tarafı yetenekleri devre dışı

**Dosya:** `web/src/app/**/page.jsx`, `web/src/app/dashboard/layout.jsx:1`, `web/src/app/layout.js:1`

**Problem — ölçüm:**

```
$ 20 page.jsx'in client/server durumu:
  server  auth/page.jsx                    ← notFound(), içerik yok
  server  dashboard/market/page.jsx        ← notFound(), içerik yok
  server  page.jsx                         ← redirect(), içerik yok
  server  register/page.jsx                ← redirect(), içerik yok
  CLIENT  diğer 16'sı (chat, chatbots, checkout, explore, following, history,
          list, notes, dashboard, purchased, settings, upgrade, wallet,
          chatbots/create, forgot-password, login)

$ Modül düzeyinde: 144 modülün 75'i 'use client' taşıyor.
$ Kök layout: web/src/app/layout.js:1   export const dynamic = 'force-static';
$ Dashboard layout: web/src/app/dashboard/layout.jsx:1   'use client'
```

Yani **gerçek içeriği olan her sayfa** client component. Sunucu tarafında çalışan tek şey
`notFound()` ve `redirect()` çağrıları.

**Kanıt (bölüm 24 — bunun kaçınılmaz bir sonuç olup olmadığı sorgulandı):**

```
$ Veri nereden geliyor?
   Tur 1: 51 dosyada 156 çıplak fetch, hepsi tarayıcıdan /api/*.php'ye.
   Tur 4 API-005: res.ok kontrolü 51 dosyanın 8'inde.
$ Kimlik doğrulama nerede?
   web/src/app/dashboard/layout.jsx:21-37 — istemci tarafında sessioncheck.php.
$ Backend PHP oturum çerezine bağlı (Tur 2), yani server component'ten çağrı yapmak
  çerezin manuel iletilmesini gerektirirdi.
$ NEXT_EXPORT=1 modu destekleniyor (next.config.mjs:4,7) — statik export'ta server
  component'ler zaten çalışmaz.
   → Yani bu mimari, "PHP backend + statik dağıtılabilir frontend" hedefinin
     TUTARLI bir sonucu. Keyfi bir hata değil.
```

**Neden yine de bir bulgu — üç somut maliyet:**

1. **İlk boyama (first paint) veri içermiyor.** `force-static` + client fetch demek ki
   her sayfa önce boş kabuk olarak yükleniyor, sonra JS çalışıyor, sonra
   `sessioncheck.php` bekleniyor (`dashboard/layout.jsx:39-45` `authReady` gate'i
   render'ı bloke ediyor), sonra sayfanın kendi fetch'leri başlıyor. En az üç ardışık
   tur (round-trip) sonrası içerik görünüyor.
2. **Şelale (waterfall) etkisi.** Oturum kontrolü bitmeden çocuk sayfaların fetch'leri
   başlayamıyor, çünkü `userId` ona bağlı. `dashboard/page.jsx:761-771` `Promise.all`
   ile 4 isteği paralelleştiriyor — iyi — ama bu paralel blok oturum kontrolünden
   **sonra** başlıyor.
3. **Bundle'ın tamamı istemciye gidiyor.** Sunucuda kalabilecek hiçbir mantık yok.
   Kısmi hafifletme mevcut: 6 dosyada 17 `dynamic()` ile modal'lar kod bölmeye
   alınmış — bu doğru yapılmış ve sayfa ağırlığını azaltıyor.

**Impact:** Algılanan yavaşlık, özellikle yavaş bağlantılarda. Ölçülmedi (bkz.
Doğrulanamayanlar) — bundle boyutu ve gerçek yükleme süresi bilinmiyor.

**Dürüstlük notu:** Bu, "yanlış yapılmış" bir şey değil, **bilinçli bir mimari
tercihin maliyeti**. Bulgu, tercihi eleştirmek için değil, maliyetinin ölçülmemiş
olduğunu işaretlemek için yazıldı. `NEXT_EXPORT` desteği korunacaksa bu mimari zorunlu.

**Önerilen çözüm:** Eğer statik export hedefi bırakılacaksa: oturum kontrolünü bir Next
middleware'ine taşıyıp `authReady` gate'ini kaldırmak, ilk veri çekimini server
component'e almak. Hedef korunacaksa: en azından `dashboard/layout.jsx`'in oturum
kontrolü sırasında çocuk sayfaların veri çekimini paralel başlatmasını sağlamak.

**Çözüm önceliği:** Orta — ürün hedefine bağlı.

---

## 3. TEST DURUMU (denetim.md bölüm 15)

Bölüm 15 açıkça *"Projede test yoksa sadece 'test yok' deme. Eksik testleri kategorize
et"* diyor.

**Mevcut durum (Tur 1'de doğrulandı, bu turda yeniden teyit edildi):** Hiçbir test
altyapısı yok — test dosyası, test runner (jest/vitest/phpunit), CI yapılandırması,
Docker, ve `package.json`/`composer.json`'da test script'i yok.

Aşağıdaki liste, **bu denetimin 7 turunda gerçekten bulunan hataları** temel alıyor —
genel bir "olması gerekenler" listesi değil. Her satırın yanında, o testin yakalayacağı
somut bulgu var.

### Unit testler

| Alan | Test | Yakalayacağı gerçek bulgu |
| --- | --- | --- |
| Pricing | `linePrice(weekly, monthly, weeks)` — 1/2/3/4/52 hafta | PAY-010 (52 hafta → 30 gün ama satıra 52 yazılıyor) |
| Pricing | `assertValidPrice` sınır değerleri | Tur 1 DOC-007'nin geçmişi (0,01 ₺ geçiyordu) |
| Pricing | haftalık↔aylık ilişkisi | PAY-009 (ilişki sunucuda hiç doğrulanmıyor) |
| Coin engine | `calculateMessageAllowance` eşikleri (99/100/1000+) | Tier sınırları |
| Coin engine | `getOrInitCoinBalance` sıfırlama kuralları | COIN-002 (yarış), COIN-003 (timezone) |
| Validation | `InputSanitizer::price("abc")`, `::email()` | Tur 2 SEC-013'ün `::string` 1000 karakter sorunu |
| Permission | `ChatbotRepository::userHasAccess` matrisi | **PAY-002** — abonelik gerektirmeyen 2. dal |
| Utility | `csrf_check` dizi/null girdide | Tur 2 ERR-009 (TypeError) |

### Integration testler

| Akış | Yakalayacağı bulgu |
| --- | --- |
| Kayıt → giriş | Tur 2 SEC-011 (sıfırlamada parola politikası yok) |
| Şifre sıfırlama uçtan uca | **DEP-003** — kod hiçbir yerden alınamıyor |
| Abonelik satın alma | **PAY-003** — aynı botun ikinci alımı 500 (yenileme kırık) |
| Aynı botu iki kez satın alma | PAY-008 (idempotency yok) |
| Satıcı kaydı → bot yayınlama | **DEP-001** — zincir tamamen kilitli |
| Chatbot oluşturma (fiyatlı) | Tur 2 SEC-003 (mass assignment ile publish gate bypass) |
| PDF eğitimi yükleme | AI-006 (chunk limiti istemci-sunucu senkron) |
| Checkout → satıcı bakiyesi | **DB-003** (`p.status` filtrelenmiyor), PAY-001 |

### API testleri

| Test | Yakalayacağı bulgu |
| --- | --- |
| Her endpoint'te oturumsuz istek | Tur 2'deki guard kapsamı (147 statik metot taraması) |
| **IDOR: başkasının `id`'siyle yazma** | Tur 2 SEC-002 (`updateSubscription` → `expiry_date`), SEC-003, SEC-014 |
| Beyaz liste dışı alan gönderme (mass assignment) | SEC-002/003/014 — **5 endpoint** |
| Rate limit aşımı (paralel) | SEC-013 (TOCTOU yarışı), SEC-006 (admin'de limit yok) |
| Yanıt zarfı sözleşmesi | Tur 2 ERR-003 (28 nokta), Tur 4 API-001/API-002 |
| Geçersiz JSON / eksik alan | Tur 5 BE-004 (undefined index uyarıları) |
| `generatereply.php` 429 senaryosu | Tur 4 AI-003 (istemci SSE varsayıyor) |

### E2E testleri

| Senaryo | Yakalayacağı bulgu |
| --- | --- |
| Kayıt → giriş → bağımsız bot oluştur | (temel akış — şu an çalışıyor) |
| Bot oluştur → önizlemede test et → yayınla | **UX-001** (önizleme sahte), DEP-001 (yayınlanamıyor) |
| Alıcı → sepet → ödeme → sohbet | PAY-001 (sahte kart geçiyor), PAY-002 (abonelik gereksiz) |
| Sohbet → mesaj hakkı tükenene kadar | **COIN-001** (istemci `consumeMessage`'ı atlayabiliyor) |
| Satıcı → bakiye → para çekme | **PAY-006** (talep terminal duruma hiç ulaşmıyor) |
| Plan yükseltme → limitleri kontrol et | **BIZ-001** (ödeme alınmıyor), UX-002 (limit değişmiyor) |
| Ayarlar → gizlilik politikasını oku | Tur 4 FE-001 (sabit kodlu yer tutucu) |

### Güvenlik testleri

| Test | Yakalayacağı bulgu |
| --- | --- |
| Statik dosya erişimi (`/admin/.env`, `/admin/db_backup/*.sql`) | **Tur 2 SEC-001** 🔴 |
| Session fixation (giriş öncesi/sonrası ID) | SEC-005, SEC-009, **Tur 5 BE-001** (ikinci giriş yolu) |
| Admin girişinde kaba kuvvet | SEC-006 |
| CSRF: GET ile durum değiştirme | **SEC-007** (`db_backup.php?mode=restore`) |
| Google token `email_verified=false` | **SEC-004** (hesap ele geçirme) |
| Hesap enumerasyonu (şifre sıfırlama) | SEC-012 |
| Yarış: paralel `withdraw` / `createSubscription` | PAY-008 |
| SQLi: admin CRUD `table`/`where`/`columns` | (Tur 2'de temiz çıktı — regresyon testi olarak değerli) |
| XSS: yorum/bot adı → admin paneli | (Tur 6'da temiz çıktı — regresyon testi olarak değerli) |

**Öncelik önerisi:** Yukarıdaki tablolarda **kalın** yazılan 12 satır, bu denetimde
🔴/🟠 olarak işaretlenmiş bulgulara karşılık geliyor. Test altyapısı sıfırdan kurulacaksa
ilk yazılacak testler bunlar olmalı — çünkü hepsi düzeltilmesi gereken hatalar ve
düzeltmenin doğrulanması gerekiyor.

**Yapısal engel:** Tur 5 BE-005'te tespit edildiği gibi 147 controller metodunun 147'si
statik ve DI yalnızca üç auth use-case'inde var. Bu, unit test yazmayı **yapısal olarak
zorlaştırıyor**: `Database::getInstance()` singleton'ı mock'lanamıyor. Yani "test yok"
bir tercih değil, mimarinin sonucu. Test eklemek önce BE-005'in kısmen çözülmesini
gerektiriyor — ya da testlerin gerçek bir test veritabanına karşı integration testi
olarak yazılmasını.

---

## 4. GERÇEKTE ÇALIŞMAYAN ÖZELLİKLER (denetim.md bölüm 21)

Bu bölüm 7 turun konsolidasyonu. Format bölüm 21'in istediği gibi.

### 4.1 Tamamen çalışmayan özellikler

| Feature | Beklenen davranış | Gerçek davranış | Kanıt | Prod'a hazır mı? |
| --- | --- | --- | --- | --- |
| **Pazaryeri satıcı kaydı** | Satıcı Param POS alt üye işyeri kaydı yapar, `status='active'` olur | `addSubMerchant` her zaman `success:false` → `status='rejected'`. Ayrıca il/ilçe listeleri boş, form doldurulamıyor | `ParamPosMarketplace.php:10-13, 30-38`; `SellerController.php:88-96` | **HAYIR** (DEP-001 🔴) |
| **Bot yayınlama / pazaryeri** | Bot herkese açık hâle gelir, listelenir, satılır | Satıcı `active` olamadığı için `saveChatbot`, `publishChatbot`, `addToCart`, `createSubscription` 422 veriyor; `getPublished` INNER JOIN boş dönüyor | `ChatbotController.php:53,191`; `MarketplaceController.php:21,217`; `ChatbotRepository.php:92` | **HAYIR** (DEP-001 🔴) |
| **Şifre sıfırlama** | Kullanıcı e-postayla 6 haneli kod alır | Mail gönderilmiyor, kod loglanmıyor, DB'de yalnızca SHA-256 hash var → kod hiçbir yerden alınamıyor. Kullanıcıya "gönderildi" deniyor | `phpmailer.php:19-24`; `AuthController.php:182-196` | **HAYIR** (DEP-003 🟠) |
| **Üretici (producer) hesabı** | Kullanıcı üretici planı satın alır, bot limitleri artar | `buyProducerAccount` her zaman başarısız; `getProducerPlanStatus` her zaman `'none'` | `producer_plan.php:10-26` | **HAYIR** (Tur 3 BIZ-003 🟡) |
| **Ücretli üyelik planları** | ₺149/₺299/₺599 paketler satın alınır, limitler artar | `upgradePlan` ödeme almadan yazıyor; yazdığını yalnızca dashboard başlığı okuyor; limitler değişmiyor | `WalletController.php:266-289`; `chatbot_limits.php:12-20`; `UserController.php:13-14` | **HAYIR** (Tur 3 BIZ-001 🔴, BIZ-002 🟠, Tur 6 UX-002) |
| **İade (refund)** | Admin iade başlatır, abonelik iptal olur, satıcı bakiyesi düşer | `processRefund` no-op, "simüle edildi" başarı döndürüyor. `'refunded'` yazan kod yok, abonelik iptal edilmiyor | `checkout_payments.php:90-93`; `WalletController.php:32-35` | **HAYIR** (Tur 3 PAY-012 🟡) |
| **Ödeme mutabakatı** | Gateway'den ödeme durumları senkronlanır | `reconcilePayments` no-op, `'processed' => 0` ile başarı döndürüyor | `checkout_payments.php:85-88` | **HAYIR** |
| **Param POS callback** | Ödeme durumu asenkron güncellenir | Stub `OK` yazıp çıkıyor; kimlik doğrulama/imza/replay koruması yok | `checkout_payments.php:95-100`; `SellerController.php:230-235` | **HAYIR** (Tur 3 PAY-007 🟠) |
| **Para çekme (satıcı ödemesi)** | Talep oluşur, admin onaylar, ödeme yapılır | `durum`'u güncelleyen **hiçbir kod yok**; tablo admin CRUD beyaz listesinde de yok; admin panelinde para çekmeden söz eden tek dosya yok | `WalletController.php:112-117`; `db.php:288-292`; `grep -rln 'cekme\|bakiye\|withdraw' api/admin` → boş | **HAYIR** (Tur 3 PAY-006 🟠) |

### 4.2 Çalışıyor görünen ama yanlış sonuç veren özellikler

| Feature | Beklenen davranış | Gerçek davranış | Kanıt | Prod'a hazır mı? |
| --- | --- | --- | --- | --- |
| **Kart ile ödeme** | Kart gateway'de tahsil edilir | Luhn-geçerli **herhangi** bir numara kabul ediliyor, tahsilat simüle ediliyor; sistem `status='paid'` + `'approved'` yazıp satıcıya çekilebilir bakiye üretiyor | `checkout_payments.php:28-63`; `MarketplaceController.php:280-296, 336-345` | **HAYIR** (Tur 3 PAY-001 🔴) |
| **Bot önizleme asistanı** | Yazılan sistem talimatı test edilir | `setTimeout(800)` + sabit şablon; `generatereply.php` hiç çağrılmıyor; cevap prompt'un içeriğinden bağımsız | `chatbots/create/page.jsx:322-339` | **HAYIR** (Tur 6 UX-001 🟠) |
| **Sohbette dosya eki** | Dosya AI'ya gönderilir, analiz edilir | Dosya base64'e çevriliyor, `parts` dizisine ekleniyor, sonra `generateReply(data.text)` çağrılıyor — `parts` hiç kullanılmıyor. Sunucu multimodal desteklemiyor | `chat/page.jsx:555-567`; `ChatController.php:199-207` | **HAYIR** (Tur 4 FE-003 🟡) |
| **Gizlilik / kullanım koşulları** | Admin'in yazdığı hukuki metin gösterilir | Ayarlar sayfası aynı isimli bileşenleri kendi içinde sabit iki cümlelik yer tutucu olarak yeniden tanımlıyor; API'ye hiç gidilmiyor | `settings/page.jsx:380-400, 826, 841` | **HAYIR** (Tur 4 FE-001 🟠) |
| **Admin tema seçimi** | Seçilen tema uygulanır | `intval(dizi)` her zaman `1` döndürüyor → daima `$themes[0]` | `admin/index.php:69-71`; `db.php:322-336` | **HAYIR** (Tur 5 BE-002 🟡) |
| **Mesaj hakkı (coin) limiti** | Günde 10 ücretsiz mesaj | `generateReply` `consumeMessage`'ı hiç çağırmıyor; istemci endpoint'i atlarsa limit yok. Etkin limit 20/dk = 28.800/gün | `ChatController.php:179-207`; `MessageController.php:23-38` | **HAYIR** (Tur 3 COIN-001 🔴) |
| **Abonelik ödeme duvarı** | Satın alınmadan bot kullanılamaz | `userHasAccess` satıştaki her botu abonelik olmadan açıyor; `generateReply` sistem talimatını istemciden alıyor | `ChatbotRepository::userHasAccess` satır 9; `ChatController.php:187-190` | **HAYIR** (Tur 3 PAY-002 🔴) |
| **Abonelik süresi** | Satın alınan süre kadar erişim | Kullanıcı kendi `expiry_date`'ini yazabiliyor (mass assignment) | `MarketplaceController.php:376-391` | **HAYIR** (Tur 2 SEC-002 🔴) |
| **`robots.txt`** | `/admin/` ve `/api/` taranmaz | Dosya `web/src/robots.txt`'de — App Router bu konumu servis etmiyor | `ls web/public/robots.txt` → yok | **HAYIR** (Tur 6 SEO-001 🟡) |
| **Ana sayfa görselleri yönetimi** | Admin ana sayfa görsellerini yönetir | `/admin/anasayfa` ve `getlandingimages.php` var; gösterecek sayfa yok (`/` → `redirect("/dashboard")`) | `app/page.jsx`; Tur 1 DEAD-001 | **HAYIR** (Tur 6 UX-003 🔵) |

### 4.3 Ölçek/ortam değişince çalışmayacak olanlar

| Feature | Ne zaman kırılır | Kanıt |
| --- | --- | --- |
| Pazaryeri listesi | Veri büyüdüğünde — altı LEFT JOIN + `COUNT(DISTINCT)` kartezyen çarpımı | Tur 5 DB-001 🟠 |
| Abonelik yenileme | 100 ₺ üzeri bir botun **ikinci** alımında — UNIQUE constraint 500 üretiyor | Tur 3 PAY-003 🟠 |
| Checkout atomikliği | İlk checkout'ta — `ALTER TABLE` transaction içinde örtük commit tetikliyor; DDL yetkisi yoksa kalıcı 500 | Tur 3 PAY-004 🟠 |
| Kurulum | MariaDB'de — 9 tablo `utf8mb4_0900_ai_ci` kullanıyor (MySQL 8 özel) | Tur 5 DB-004 🟡 |
| Kurulum | Temiz klonda — `_guard.php` + `session.php` versiyon kontrolünde değil | Tur 1 ARCH-001 🔴 |
| Kurulum | Temiz klonda — şema ve migration'lar `.gitignore`'a takılıyor | Tur 1 ARCH-003, Tur 5 DB-002 🟠 |
| Sipariş numarası | ~77.000 sipariş sonrası — `randomToken(4)` doğum günü çakışması `uniq_order_id`'yi ihlal eder | Tur 5 (schema) |
| Rate limiter | 191 karakterden uzun kullanıcı adında — `rkey VARCHAR(191)` taşar | Tur 2 SEC-013 🟡 |

---

## 5. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**"Bu proje yeni bir VPS'e verilse, geliştirici README'yi takip ederek sıfırdan kurabilir
mi?"** (bölüm 14'ün açık sorusu) — **Hayır.** Yedi turun bulgularıyla, kurulum şu
sırayla tıkanıyor:

1. `git clone` → `api/admin/ajax/_guard.php` ve `api/admin/functions/session.php` yok
   (ARCH-001). Admin paneli fatal error veriyor.
2. Veritabanı → `api/database/schema.sql` yok (`.gitignore:47`). README zaten "şema yok"
   diyor ve nereden bulunacağını söylemiyor (DOC-001).
3. Şema elde edilse bile → 50 tablo, 0 foreign key, üç farklı tipte aynı anahtar; düzeltme
   migration'ları da versiyon kontrolünde değil, sıralarını zorlayan araç yok (DB-002).
4. MariaDB seçildiyse → 9 tablo `Unknown collation` ile başarısız (DB-004). README üç
   yerde MariaDB desteği vaat ediyor.
5. Uygulama ayağa kalksa bile → satıcı kaydı yapılamıyor, dolayısıyla pazaryeri boş
   (DEP-001). Ürünün gelir döngüsü çalışmıyor.
6. Süreç yönetimi → health check yok, graceful shutdown yok, port sabit, `npm start`
   `NODE_ENV` set etmiyor (DEP-005).

Bunların hiçbiri kod kalitesi sorunu değil; hepsi **paketleme ve dağıtım** sorunu ve
hepsi düzeltilmesi kolay. Asimetri şu: kodun içindeki mühendislik kalitesi
(atomik coin azaltma, `GET_LOCK`'lu withdraw, allowlist'li SQL guard'ları, ölçülmüş
migration'lar) dağıtım katmanının kalitesinden belirgin biçimde yüksek.

**Stub'ların ortak kusuru.** Beş stub dosyası var ve ikisi **doğru** davranıyor:
`producer_plan.php` her zaman `success: false` döndürüyor, `ParamPosMarketplace`'ın
yazma metotları da öyle. Yani çağıran taraf "bu çalışmıyor" bilgisini alıyor. Diğer üçü
**sahte başarı** döndürüyor: `chargeCard` (`success: true` → ledger'a `paid`/`approved`
yazılıyor), `sendEmail` (`success: true` → kullanıcıya "gönderildi" deniyor),
`processRefund`/`reconcilePayments` (`JsonResponse::success` → admin'e "tamamlandı"
deniyor). Fark kritik: fail-closed stub'lar zararsız, fail-open stub'lar **gerçek
sonuçlar üretiyor** — PAY-001'de çekilebilir bakiye, DEP-003'te kurtarılamaz hesap.
Stub yazarken tek kural bu olmalıydı ve yarısında uygulanmış.

**Bölüm 21'in asıl bulgusu.** Konsolide tablo 27 özellik listeliyor ve **hiçbiri
"production'a hazır" değil**. Ama dağılım anlamlı: 9'u tamamen çalışmıyor (çoğu
belgeli stub), 10'u çalışıyor görünüp yanlış sonuç veriyor (asıl tehlikeli grup),
8'i ölçek/ortam değişince kırılacak. İkinci grup en önemlisi çünkü **kullanıcı fark
etmiyor**: sahte kart geçiyor, sahte önizleme cevap veriyor, dosya eki "gönderiliyor",
plan "yükseltiliyor", gizlilik politikası "gösteriliyor". Bunların hepsi sessizce
yanlış.

**Test eksikliği bir tercih değil, mimarinin sonucu.** 147 controller metodunun 147'si
statik, `Database::getInstance()` singleton'ı mock'lanamıyor (BE-005). Yani "test
yazılmamış" değil, **mevcut yapıda unit test yazılamaz**. Bu, bölüm 15'in "sadece test
yok deme" talebinin gerçek cevabı: eksik olan testler değil, testi mümkün kılan yapı.
Bu denetimde bulunan 🔴/🟠 bulguların 12'si için doğrudan test önerisi çıkarıldı ve
hepsi integration/API/E2E seviyesinde — çünkü unit seviyesi şu an erişilebilir değil.

**Performans.** Frontend tarafı ölçülmedi (bundle boyutu, gerçek yükleme süresi
bilinmiyor) ama mimari maliyet net: 16/20 sayfa client component, veri üç ardışık turdan
sonra geliyor. Backend tarafında Tur 5'in bulduğu `getPublished()` kartezyen çarpımı
(DB-001) diğer her şeyden önemli — çünkü kademeli değil ani bozuluyor ve ana sayfanın
sorgusu. Olumlu taraf: 17 `dynamic()` importuyla modal'lar kod bölmeye alınmış, ve
`generatereply` gerçek SSE streaming yapıyor (sunucu tarafı doğru yazılmış — Tur 4).

---

## 6. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| `smalot/pdfparser v2.12.5`'te bilinen CVE olup olmadığı (DEP-006) | CVE veritabanına erişim yok. Sürüm tespit edildi (`composer.lock`), güvenlik durumu **doğrulanmadı**. Paket kullanıcı yüklemesi PDF ayrıştırdığı için (TrainingController) takip edilmeli. Tur 2'den devredilen soru bu nedenle **açık kalıyor**. |
| `%2e%2e` path traversal (`router.php:4`, Tur 2'den devri) | Canlı sunucu gerektiriyor; kaynak değiştirmeme kuralı gereği sunucu başlatılmadı. **Yedinci turda da doğrulanamadı.** |
| Production build'in çalıştığı ve 22 route ürettiği | `npm run build` çalıştırılmadı. README iddiası Tur 1'den beri doğrulanmadı. Tur 6 NEXT-003'teki BOM riski de bu nedenle "latent" olarak kaldı. |
| Bundle boyutu ve gerçek yükleme süresi (PERF-001) | Build çalıştırılmadı; ölçüm yapılamadı. Bulgu mimari maliyet üzerinden yazıldı, sayısal iddia içermiyor. |
| `updateenv.php`'ye enjekte edilen satırın phpdotenv'i gerçekten kırdığı (DEP-004) | Çalıştırılmadı. Enjeksiyonun **mümkün olduğu** koddan kesin; sonucunun ne olduğu (sessiz kabul mü, ayrıştırma hatası mı) doğrulanmadı. |
| `admin/smtp.php`'nin SMTP kimlik bilgilerini nerede sakladığı | Dosya okunmadı (45 satır). Tur 2'den devredilen soru **açık kalıyor**. |
| Geliştirme veritabanında `param_marketplace_sellers.status='active'` satırlarının nasıl oluştuğu (DEP-001 nüansı) | Veritabanına erişim yok. Elle mi eklendiği yoksa daha eski çalışan bir implementasyondan mı kaldığı bilinmiyor. |
| `admin/kullanicilar.php`'de parola sıfırlama/değiştirme yolu olup olmadığı (DEP-003'ün "admin bile yardım edemiyor" iddiası) | Dosyanın 40-313 satırları okunmadı. İddia `kullanicilar` tablosuna admin CRUD üzerinden yazılabildiği gerçeğiyle **çelişebilir** — admin `sifre` sütununa doğrudan hash yazabilir. Bu nedenle iddia raporda yumuşatıldı. |

---

## 7. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Devredilen ve yine okunamayanlar:**
- **`api/database/migrations/00{1,2,3}` gövdeleri** — Tur 5'te "uygulanmadan önce satır
  satır okunmalı" diye işaretlenmişti, **bu turda da okunmadı**. `002` kendi başlığında
  "Every statement here DELETES OR REWRITES DATA" diyor. DB-002'nin çözümü olarak
  öneriliyorlar ama içerikleri hâlâ doğrulanmamış.
- `api/admin/ajax/smtp.php` (45 satır) — SMTP kimlik bilgilerinin konumu hâlâ bilinmiyor.
- `api/admin/ajax/updategv.php` (75 satır) — `global_vars`'a yazan endpoint; Tur 2
  SEC-017'nin (dangerouslySetInnerHTML) sunucu tarafı sanitizasyon sorusu **hâlâ açık**.
- `api/admin/partials/_header.php` + `_sidebar.php` — Tur 5 BE-002'nin `$current_theme`
  null erişim riski.
- `plans`, `plan_icerikler`, `producer_plans`, `producer_self_use_credits` tabloları —
  Tur 3'ten beri devrediliyor, **hiç okunmadı**. BIZ-003'ün "üretici planı hiç var
  olamıyor" tespitiyle şemada `producer_plans` tablosunun bulunması arasındaki olası
  çelişki çözülmedi.
- `saveChatbot`'ta yetim dosya riski (görsel diske yazılıp `create()` başarısız olursa) —
  Tur 3'ten devri, incelenmedi.
- İzolasyon seviyesi + deadlock analizi — Tur 5'ten devri, yapılmadı.
- `timestamp` vs `datetime` tutarsızlığı — Tur 5'ten devri, değerlendirilmedi.
- **PHP 8.1+ deprecated API taraması** — Tur 5'ten devri, **hiç yapılmadı**.
- `chatbot_conversations.last_message_at` kullanımı — Tur 5'ten devri, kontrol edilmedi.
- 48 fetch içeren 7 frontend dosyasının **sözleşme karşılaştırması** — Tur 4'ten beri
  devrediliyor, üç turdur yapılmadı.
- `BuyModal.jsx` (192 satır) — **beş turdur** sırada (Tur 3, 4, 6, 7).
- `MessageInput.jsx` (260 satır) — Tur 4 FE-003'ün arayüz tarafı.

**Bu turda ilk kez gündeme gelip okunmayanlar:**
- `web/package-lock.json` — npm bağımlılık ağacı ve transitif sürümler incelenmedi.
- `api/composer.lock`'un tamamı — yalnızca paket adı/sürüm çiftleri çıkarıldı;
  `require` grafiği ve platform kısıtları okunmadı.
- `api/admin/composer.json`/`composer.lock` — ikinci bağımlılık ağacı (Tur 1 ARCH-014)
  sürüm açısından incelenmedi.
- `web/nodemon.json`, `web/eslint.config.mjs`, `web/jsconfig.json`,
  `web/components.json`, `web/postcss.config.js` — yapılandırma dosyaları okunmadı.
- `web/scripts/phpify.js` — Tur 1'de bozuk olduğu tespit edilmişti, deployment açısından
  yeniden değerlendirilmedi.

### Bölüm bazında boş kalan maddeler

**Bölüm 13 (Performance)** — frontend tarafında şunlar ölçülmedi:
`bundle size` (build çalıştırılmadı), `expensive renders` (memoizasyon Tur 6'da da
incelenmemişti), `caching` (Next fetch cache / HTTP cache başlıkları hiç bakılmadı),
`infinite scroll` (uygulanıp uygulanmadığı kontrol edilmedi), `duplicate requests`
(aynı endpoint'in birden çok bileşenden çağrılıp çağrılmadığı — örneğin `gethide.php`
hem `dashboard/page.jsx` hem `notes/page.jsx`'te görüldü ama sistematik taranmadı).
Backend'de `OCR` (tesseract.js istemci tarafında, hiç incelenmedi) ve
`unnecessary filesystem operations` maddeleri boş.

**Bölüm 14 (Deployment)** — denetlenmeyenler: `HTTPS` yapılandırması (repoda karşılığı
yok, doğrulanamaz), `nginx/apache` yapılandırması (yalnızca `.htaccess` var, vhost yok),
`PHP-FPM` (yapılandırma repoda yok), `backups` (yalnızca `db_backup.php`'nin varlığı
biliniyor — Tur 2 SEC-007'de yıkıcı restore riski tespit edilmişti, yedekleme
stratejisi değerlendirilmedi), `error reporting` (Sentry vb. entegrasyon aranmadı —
yok olduğu varsayıldı ama grep'lenmedi).

**Bölüm 15 (Test)** — kategorize liste üretildi ancak **mevcut test altyapısının
kurulabilirliği** değerlendirilmedi: hangi test runner'ın bu yapıya uyacağı, PHP
tarafında PHPUnit'in statik metotlarla nasıl kullanılacağı, E2E için hangi aracın
(Playwright commit geçmişinde vardı — Tur 1 DOC-003) seçileceği tartışılmadı.

**Bölüm 21** — tablo 27 özellik içeriyor ama **kapsam sınırı var**: yalnızca yedi turda
okunan dosyalardan çıkan özellikler listelendi. Okunmayan alanlarda (sosyal özellikler —
`SocialController`'ın 22 metodunun çoğu, notlar/diyalog defteri — `NoteController`'ın
8 metodu, bildirimler — `NotificationController`) çalışmayan özellikler **olabilir ve
aranmadı**.
