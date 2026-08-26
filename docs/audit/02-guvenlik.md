# Tur 2 — Güvenlik Denetimi ve Hata Yönetimi

Kapsanan `docs/denetim.md` bölümleri: **6** (Security Audit), **12** (Error Handling).

---

## BU RAPORUN KURALLARI

- **HİÇBİR KAYNAK DOSYA DEĞİŞTİRİLMEDİ.** Yazma işlemi yalnızca `docs/audit/` altına yapıldı.
- Her bulgu `dosya:satır` + en fazla 15 satırlık kod alıntısı içerir. Okunmayan dosya hakkında bulgu yazılmadı.
- Bulgu formatı `denetim.md` bölüm 23; severity ölçeği bölüm 22.
- `denetim.md` bölüm 24 (false positive kontrolü) her bulgudan önce uygulandı; arama komutu ve sonucu bulgunun içinde.
- Her bulguya bölüm 27'ye göre **TÜR** etiketi verildi (bug / güvenlik / iş mantığı / mimari / teknik borç / doküman / prod blocker).
- **Bölüm 26'daki X/10 puanlama üretilmedi.** Yerine gerekçeli değerlendirme yazıldı.
- Emin olunamayan her şey "Doğrulanamayanlar" başlığında, nedeniyle birlikte.
- Kozmetik/stil notu yazılmadı.

---

## 0. Bu turda gerçekten okunan dosyalar

**Tam okunanlar (21):**
`api/functions/bootstrap.php`, `api/functions/db.php`, `api/functions/rate_limit.php`,
`api/functions/util.php`, `api/router.php`,
`api/src/Presentation/Middleware/AuthMiddleware.php`,
`api/src/Presentation/Response/JsonResponse.php`,
`api/src/Shared/Utilities/InputSanitizer.php`,
`api/src/Presentation/Controllers/AuthController.php`,
`api/src/Presentation/Controllers/TrainingController.php`,
`api/src/Application/UseCases/Auth/LoginUseCase.php`,
`api/src/Application/UseCases/Auth/GoogleLoginUseCase.php`,
`api/admin/functions/session.php`, `api/admin/ajax/_guard.php`, `api/admin/ajax/giris.php`,
`api/admin/ajax/create.php`, `api/admin/ajax/read.php`, `api/admin/ajax/update.php`,
`api/admin/ajax/delete.php`, `api/admin/ajax/upload.php`, `api/admin/ajax/readenv.php`,
`api/admin/ajax/db_backup.php`

**Kısmi okunanlar (belirtilen satır aralıkları):**
`ChatController.php:1-274` (tamamı, iki parçada), `ChatbotController.php:7-64, 110-225, 340-370`,
`SocialController.php:116-145`, `MarketplaceController.php:119-160, 357-410`,
`WalletController.php:67-171`, `UserController.php:152-190`,
`NotificationController.php:createNotification`, `UserRepository.php:findByRememberToken`,
`ChatbotRepository.php:create/updateById/publish/unpublish`,
`web/server.js:18-45`, `web/src/widgets/info/TeslimatIadePopup.jsx:1-25`,
`api/database/schema.sql` (yalnızca `chatbotlar`, `user_subscriptions`, `user_cart`,
`chatbot_comments` sütun listeleri)

**Yalnızca anahtar ADI okunanlar (değerler kasıtlı olarak okunmadı/yazılmadı):**
`api/.env`, `api/admin/.env`, `web/.env`, `api/.env.example`

---

## 1. GÜVENLİK BULGULARI (denetim.md bölüm 6)

---

### SEC-001

**Severity:** 🔴 CRITICAL
**TÜR:** güvenlik + prod blocker

**Başlık:** `router.php` PHP kök dizinindeki her gerçek dosyayı olduğu gibi servis ediyor; `web/server.js` `/admin/*` yolunu doğrudan oraya proxy'liyor — Gemini API anahtarı, 1,59 MB'lık canlı veritabanı yedeği ve error_log kimlik doğrulaması olmadan indirilebilir

**Dosya:** `api/router.php:4-9`, `web/server.js:26-29`, `api/admin/.env`, `api/admin/db_backup/backup-2026-02-23-13-56-14.sql`

**Fonksiyon/Class:** router betiği + `createProxyMiddleware` `pathFilter`

**Problem:**

`router.php` dosya sunumunu hiçbir denylist olmadan yapıyor:

```php
api/router.php:1-9
<?php
// Router for PHP's built-in dev server, replicating admin/.htaccess:
// serve real files/dirs as-is, otherwise route /admin/* to admin/index.php.
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

if ($uri !== '/' && (is_file($file) || is_dir($file))) {
    return false; // let the built-in server handle it directly
}
```

`return false` = "yerleşik sunucu bu dosyayı doğrudan versin". `.php` uzantılılar çalıştırılır,
**diğer her uzantı ham bayt olarak gönderilir.** Kontrol yalnızca "dosya var mı?".

Node tarafı bu yolu dışarıya açıyor — `pathFilter` prefix'i **koruyarak** iletiyor:

```javascript
web/server.js:26-29
  server.use(createProxyMiddleware({
    target: PHP_TARGET,
    changeOrigin: true,
    pathFilter: ['/admin', '/api', '/assets'],
```

**Nasıl tetiklenebilir:** Oturum açmadan, tek bir GET isteğiyle:

| İstek (port 3000) | Diskteki karşılığı | İçeriği |
| --- | --- | --- |
| `GET /admin/.env` | `api/admin/.env` | `API_GOOGLE_GEMINI` — Gemini API anahtarı |
| `GET /admin/db_backup/backup-2026-02-23-13-56-14.sql` | 1 588 196 bayt | **Tam veritabanı dökümü** — `kullanicilar` (e-posta + bcrypt hash), `adminler`, ödeme tabloları |
| `GET /admin/error_log` | 507 bayt | Sunucu hata kaydı |
| `GET /admin/composer.lock` | — | Tam bağımlılık envanteri (CVE eşlemesi için) |

**Kanıt (bölüm 24 — üç ayrı katman ayrı ayrı doğrulandı):**

```
1) Dosyalar diskte gerçekten var mı?
$ ls -la api/admin/.env api/admin/db_backup/ api/admin/error_log
-rw-r--r-- 59      api/admin/.env
-rw-r--r-- 1588196 api/admin/db_backup/backup-2026-02-23-13-56-14.sql
-rw-r--r-- 507     api/admin/error_log

2) .htaccess bunları engelliyor mu?
$ grep -rn 'Files|env|deny|Require' api/admin/.htaccess api/admin/uploads/.htaccess
(çıktı yok — api/admin/.htaccess yalnızca RewriteRule içeriyor, hiçbir erişim kuralı yok)

3) Proxy /admin'i PHP'ye iletiyor mu?
web/server.js:29  pathFilter: ['/admin', '/api', '/assets']
+ yorum satırı 21-25: "prefix'i korunarak PHP'ye aynen iletilir"
```

`api/admin/.htaccess` içeriğinin tamamı (5 satır) yalnızca pretty-URL yönlendirmesi:

```apache
api/admin/.htaccess
RewriteEngine On
RewriteBase /admin/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L,QSA]
```

İlk `RewriteCond` **gerçek dosyayı rewrite'tan muaf tutuyor** — yani hem `php -S router.php`
altında hem de Apache altında gerçek dosyalar doğrudan servis ediliyor. Bu bir dev-sunucu
sorunu değil, iki ortamda da aynı.

**Neden problem:** Üç ayrı sınıf sızıntı aynı anda:
1. **Gemini API anahtarı** — `ChatController::generateReply` anahtarın tarayıcıya asla
   gitmemesi için özenle yazılmış (satır 170-178'deki yorum bunu anlatıyor), ama anahtar
   dosyanın kendisi HTTP'den okunabiliyor. Kontrol boşa çıkıyor.
2. **Veritabanı dökümü** — tüm kullanıcı e-postaları ve bcrypt hash'leri, admin hash'leri.
   Bcrypt cost 12 offline kırmayı yavaşlatır ama e-posta listesi anında kullanılabilir.
3. **error_log** — 507 bayt; içeriği bu turda kasıtlı okunmadı, ama `phpmailer.php` stub'ının
   şifre sıfırlama kodlarını error_log'a yazdığı README'de belgeli — yani sıfırlama kodları
   bu dosyaya düşüyor olabilir.

**Impact:** Kimlik doğrulamasız veri sızıntısı + API anahtarı hırsızlığı (fatura/kota) +
tüm kullanıcı tabanının e-posta ve parola hash'lerinin ele geçirilmesi.

**Önerilen çözüm (öncelik sırasıyla):**
1. `api/admin/db_backup/`, `api/admin/error_log`, `api/.env`, `api/admin/.env` dosyalarını
   doküman kökünün **dışına** taşımak. Tek gerçek çözüm bu.
2. `router.php`'ye bir denylist eklemek (`.env`, `.sql`, `error_log`, `.lock`, `.json`, `.zip`).
3. `api/admin/.htaccess`'e `<FilesMatch>` deny kuralları eklemek — ama `.htaccess`'in
   nginx'te karşılığı yok, bu yüzden tek başına yeterli değil.
4. Sızmış olabileceği varsayımıyla: Gemini anahtarını rotate etmek.

**Çözüm önceliği:** **Acil.** Production öncesi mutlak blocker.

---

### SEC-002

**Severity:** 🔴 CRITICAL
**TÜR:** güvenlik + iş mantığı

**Başlık:** `updateSubscription` istemcinin gönderdiği her sütunu yazıyor — kullanıcı kendi aboneliğinin `expiry_date` alanını değiştirip ücretsiz süresiz erişim alabiliyor

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:376-405`

**Fonksiyon/Class:** `MarketplaceController::updateSubscription()`

**Problem:**

```php
api/src/Presentation/Controllers/MarketplaceController.php:376-391
    public static function updateSubscription(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['id'])) JsonResponse::error('Veri veya ID bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $id = InputSanitizer::positiveInt($data['id']);
        unset($data['id'], $data['user_id']);
        if ($data === []) {
            JsonResponse::error('Güncellenecek alan yok.', 400, AppConfig::ERR_VALIDATION);
        }

        // Previously had no ownership check — anyone could edit any subscription by id.
        // As with deleteSubscription, a row that was never touched used to come
        // back as a successful update.
        $affected = Database::getInstance()->update('user_subscriptions', $data, 'id = ? AND user_id = ?', [$id, $userId]);
```

Sahiplik kontrolü `WHERE id = ? AND user_id = ?` ile **doğru** yapılmış — başkasının aboneliğine
dokunulamıyor. Ama `unset()` yalnızca `id` ve `user_id`'yi çıkarıyor; **geri kalan her sütun
istemci kontrolünde.**

**Kanıt (bölüm 24 — tablonun gerçekten hangi sütunları taşıdığı doğrulandı):**

```
$ awk '/CREATE TABLE.*`user_subscriptions`/,/^\) ENGINE/' api/database/schema.sql \
    | grep -oE '^\s+`[a-z_0-9]+`' | tr -d ' `'
id  user_id  chatbot_id  duration_weeks  expiry_date  status
```

`unset()` sonrası yazılabilir kalan sütunlar: **`chatbot_id`, `duration_weeks`,
`expiry_date`, `status`.**

Ayrıca `Database::update()` `$data` anahtarlarını yalnızca *tanımlayıcı olarak* doğruluyor,
hangi sütunun yazılabilir olduğunu hiç sormuyor:

```php
api/functions/db.php:390-396
    public function update($table, $data, $where, $params = []) {
        foreach (array_keys($data) as $key) {
            self::assertSafeColumnName($key);
        }

        // SET kısmında ? kullanıyoruz
        $setPart = implode(', ', array_map(fn($key) => "`$key` = ?", array_keys($data)));
```

**Nasıl tetiklenebilir:** Bir kez gerçek bir abonelik satın almış, oturum açmış kullanıcı:

```
POST /api/marketplace/updatesubscription.php
Content-Type: multipart/form-data
data={"id":<kendi abonelik id'si>,"expiry_date":"2099-12-31 23:59:59","status":"active"}
```

**Impact:** Doğrudan gelir kaybı. Zaman sınırlı abonelik modeli — projenin tek gelir mekanizması —
tek istekle süresiz hâle getirilebiliyor. `duration_weeks` de yazılabildiği için raporlama/mutabakat
verisi de bozulabilir.

**Ek not — Tur 1 ile bağlantı:** Tur 1'de `marketplace/updatesubscription.php` "frontend'den hiç
çağrılmıyor" listesindeydi (DEAD-001/c) ve o bölümde şu uyarı yazılmıştı: *"bu 16 endpoint'in
hangisinin 'henüz bağlanmamış özellik', hangisinin 'unutulmuş açık yüzey' olduğu ayrılmadan silme
kararı verilmemeli"*. Bu bulgu o uyarının somut karşılığı: **UI'da hiç görünmeyen, ama canlı ve
sömürülebilir bir yazma endpoint'i.**

**Önerilen çözüm:** Aynı kod tabanında doğru desen zaten var —
`WalletController::saveBankInfo():150-156` beyaz liste kullanıyor. Aynısını burada uygulamak:
sadece `status` (ve yalnızca `cancelled` gibi belirli değerlere) izin vermek; `expiry_date` ve
`duration_weeks` istemciden hiç kabul edilmemeli.

**Çözüm önceliği:** **Acil.**

---

### SEC-003

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + iş mantığı

**Başlık:** `updateChatbot` mass assignment ile `publishChatbot`'un dört kapısını (fiyat doğrulama, satıcı KYC, public bot limiti, yayın durumu) tek istekte atlatıyor

**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:110-133` vs `:157-197`

**Fonksiyon/Class:** `ChatbotController::updateChatbot()` / `ChatbotController::publishChatbot()`

**Problem:**

`publishChatbot` bir botu herkese açık hâle getirmeden önce **dört ayrı kontrol** yapıyor:

```php
api/src/Presentation/Controllers/ChatbotController.php:170-195
        self::assertValidPrice($weekly, 'Haftalık', AppConfig::MAX_WEEKLY_PRICE, AppConfig::MIN_WEEKLY_PRICE);
        self::assertValidPrice($monthly, 'Aylık', AppConfig::MAX_WEEKLY_PRICE * 4, round(AppConfig::MIN_WEEKLY_PRICE * 4 * AppConfig::DISCOUNT_MONTHLY_FACTOR));
        ...
        if (!$bot || (int) $bot['author_user_id'] !== $userId) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }
        ...
        $publicLimit = getPublicBotLimit($db, $userId);
        $counts = $repo->countByOwner($userId);
        if ($counts['public'] >= $publicLimit) {
            JsonResponse::error('Ücretsiz herkese açık chatbot hakkınızı kullandınız.', 422, AppConfig::ERR_LIMIT_REACHED);
        }

        $sellerStatus = $repo->getSellerStatus($userId);
        if ($sellerStatus !== 'active') {
            JsonResponse::error('Önce Pazaryeri satıcı kaydınızı tamamlayın.', 422, AppConfig::ERR_SELLER_INACTIVE);
        }

        $repo->updateById($id, ['is_independent' => 0, 'ucret_haftalik' => $weekly, 'ucret_aylik' => $monthly]);
```

`updateChatbot` aynı sonucu **yalnızca sahiplik kontrolüyle** üretiyor:

```php
api/src/Presentation/Controllers/ChatbotController.php:124-132
        if (!$repo->findByIdAndOwner($id, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        unset($data['id'], $data['author_user_id'], $data['owner_user_id']);
        $data = self::handleImageUploads($data);

        $repo->updateById($id, $data);
        JsonResponse::success(['message' => 'Chatbot başarıyla güncellendi!', 'id' => $id]);
```

**Kanıt (bölüm 24 — `is_independent`'ın gerçekten yayın bayrağı olduğu ve repository'de bir
beyaz liste bulunmadığı ayrıca doğrulandı):**

```
$ awk '/CREATE TABLE.*`chatbotlar`/,/^\) ENGINE/' api/database/schema.sql | grep -oE '`[a-z_0-9]+`'
id author_user_id owner_user_id isim aciklama kapak_fotografi profil_fotografi kategori_id
style_prompt sohbet_basi_mesaj ucret_haftalik ucret_aylik training_prompt yayimlanma_tarih
edit_tarih is_independent

$ ChatbotRepository.php — create/updateById gövdeleri:
    public function create(array $data): int   { return self::insert(self::T, $data); }
    public function updateById(int $id, array $data): bool { return self::update(self::T, $data, 'id = :_id', ['_id' => $id]); }
    public function publish(int $id): bool     { return self::update(self::T, ['is_independent' => 0], ...); }
    public function unpublish(int $id): bool   { return self::update(self::T, ['is_independent' => 1], ...); }
```

`publish()` = `is_independent = 0`. Yani `is_independent` yayın anahtarı ve `updateById` onu
istemci verisinden yazabiliyor. Repository katmanında hiçbir sütun beyaz listesi yok.

**Nasıl tetiklenebilir:**

```
POST /api/chatbot/updatechatbot.php
data={"id":<kendi bot id'si>,"is_independent":0,"ucret_haftalik":999999,"ucret_aylik":999999}
```

**Impact:** Satıcı KYC'si (Param POS alt üye işyeri kaydı) tamamlanmamış bir kullanıcı botunu
pazaryerine listeleyebiliyor; ücretsiz plan bot limiti aşılabiliyor; fiyat `MAX_WEEKLY_PRICE`
(5000 ₺) tavanının üstüne çıkabiliyor. Ödeme akışına etkisi Tur 3'ün konusu.

**Ek not:** Aynı sınıf zafiyet `saveChatbot():7-62`'de de var — orada `is_independent` ve satıcı
kontrolü sunucu tarafından yapılıyor (satır 31-32, 51-56), ama `ucret_haftalik`/`ucret_aylik`
hiç doğrulanmadan `insert`'e gidiyor. Yani fiyat doğrulaması **üç yazma yolundan yalnızca
ikisinde** (`publishChatbot`, `updateChatbotPrice`) var.

**Önerilen çözüm:** `updateChatbot` ve `saveChatbot` için sütun beyaz listesi
(`isim`, `aciklama`, `kategori_id`, `style_prompt`, `sohbet_basi_mesaj`, görseller); fiyat ve
`is_independent` yalnızca kendi özel endpoint'lerinden yazılmalı.

**Çözüm önceliği:** Yüksek.

---

### SEC-004

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** Google girişi `email_verified` iddiasını kontrol etmiyor ve hesabı e-postayla eşleştiriyor — doğrulanmamış e-postalı bir Google hesabı mevcut bir Lumanoris hesabını ele geçirebilir

**Dosya:** `api/src/Presentation/Controllers/AuthController.php:121-137`, `api/src/Application/UseCases/Auth/GoogleLoginUseCase.php:10-34`

**Fonksiyon/Class:** `AuthController::loginGoogle()` → `GoogleLoginUseCase::execute()`

**Problem:**

Controller Google'ın döndürdüğü payload'dan yalnızca `sub`, `email`, `name` alıyor:

```php
api/src/Presentation/Controllers/AuthController.php:121-137
        $client = new Google_Client(['client_id' => AppConfig::googleClientId()]);
        $payload = $client->verifyIdToken($idToken);

        if (!$payload) {
            JsonResponse::error('Geçersiz Google token.', 401, AppConfig::ERR_AUTH_REQUIRED);
        }

        try {
            $useCase = new GoogleLoginUseCase(new UserRepository());
            $userId  = $useCase->execute($payload['sub'], $payload['email'], $payload['name'] ?? '');
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        JsonResponse::success(['user_id' => $userId, 'message' => 'Login successful']);
```

Use case, e-posta eşleşmesini mevcut hesaba **bağlanma** gerekçesi olarak kullanıyor:

```php
api/src/Application/UseCases/Auth/GoogleLoginUseCase.php:10-34
    public function execute(string $googleId, string $email, string $name): int {
        $user = $this->users->findByGoogleId($googleId, $email);
        ...
        $userId = (int) $user['id'];

        if (empty($user['google_id'])) {
            $this->users->linkGoogleId($userId, $googleId);
        }

        return $userId;
    }
```

Ve repository sorgusu **e-postayı da eşleşme ölçütü sayıyor**:

```php
api/src/Infrastructure/Repositories/UserRepository.php (findByGoogleId gövdesi)
        return self::one(
            'SELECT id, google_id FROM `' . self::T . '` WHERE google_id = ? OR eposta = ?',
            [$googleId, $email]
```

**Kanıt (bölüm 24 — `email_verified`'ın gerçekten hiçbir yerde okunmadığı arandı):**

```
$ grep -rn 'email_verified' api/src api/functions api/api
(çıktı yok)
```

**Nasıl tetiklenebilir:** Saldırgan, `email_verified=false` iddiası taşıyan ve `email` alanı
kurbanın Lumanoris e-postasına eşit olan bir Google ID token'ı elde eder (Google Workspace
yöneticisi kendi alan adında böyle bir hesap oluşturabilir; Google'ın kendi dokümantasyonu bu
yüzden `email_verified` kontrolünü zorunlu tutar). Token `verifyIdToken()`'dan geçer — imza ve
`aud` doğrudur — `findByGoogleId` kurbanın satırını e-postadan bulur, `linkGoogleId` saldırganın
`sub`'unu kurbanın hesabına yazar, `$_SESSION['user_id']` kurbanın id'si olur.

**Impact:** Tam hesap ele geçirme. Kurbanın cüzdanı, abonelikleri, botları, sohbet geçmişi.

**Dürüstlük notu (severity gerekçesi):** CRITICAL değil HIGH verildi çünkü sömürü, saldırganın
**doğrulanmamış e-postalı bir Google hesabına sahip olmasını** gerektiriyor — `gmail.com`
hesaplarında bu mümkün değil, Workspace özel alan adlarında mümkün. Yani "her koşulda
tetiklenebilir" değil; ama önkoşul saldırganın tamamen kendi kontrolünde olduğu için gerçek bir
saldırı yolu.

**Önerilen çözüm:** `$payload['email_verified'] === true` kontrolü eklemek (zorunlu). Ayrıca
`findByGoogleId`'nin e-posta eşleşmesini yalnızca **hesap bağlama onayı** akışında kullanmak,
sessiz otomatik bağlama yerine.

**Çözüm önceliği:** Yüksek — tek satırlık kontrol, büyük etki.

---

### SEC-005

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** Admin girişi başarılı olduğunda `session_regenerate_id()` çağrılmıyor — admin oturumu session fixation'a açık

**Dosya:** `api/admin/ajax/giris.php:44-53`

**Fonksiyon/Class:** admin login betiği

**Problem:**

```php
api/admin/ajax/giris.php:44-53
$admin_bilgi = $database->selectSingle("* FROM adminler WHERE kullanici_adi = ?", [$admin_adi]);

if ($admin_bilgi && password_verify($admin_sifre, $admin_bilgi['sifre'])) {
    $_SESSION['admin'] = $admin_adi;
    echo json_encode([
        "status" => "success",
        "message" => "Giriş başarılı",
        "redirect" => "/admin/"
    ]);
    exit;
}
```

Oturum kimliği yenilenmeden `$_SESSION['admin']` yazılıyor.

**Kanıt (bölüm 24 — kullanıcı tarafıyla karşılaştırıldı, ve regenerate'in başka bir katmanda
yapılıp yapılmadığı arandı):**

```
$ grep -rn 'session_regenerate_id' api/ --include=*.php  (vendor hariç)
api/src/Presentation/Controllers/AuthController.php:35   ← kullanıcı login
api/src/Presentation/Controllers/AuthController.php:135  ← Google login
(api/admin altında hiç eşleşme yok)
```

Kullanıcı tarafı bunu bilinçli olarak yapıyor ve gerekçesini de yazmış:

```php
api/src/Presentation/Controllers/AuthController.php:32-36
        // Regenerate the session ID on successful auth so a session ID an
        // attacker fixed before login (session fixation) doesn't carry over
        // into the authenticated session.
        session_regenerate_id(true);
        $_SESSION['user_id'] = $result['user_id'];
```

Yani koruma kod tabanında **var ve anlaşılmış**, sadece admin yoluna uygulanmamış.

**Neden problem — bu projede özellikle ciddi:** İki oturum aynı çerezi paylaşıyor.
`api/admin/functions/session.php:16-20` bunu açıkça söylüyor:

```php
api/admin/functions/session.php:16-20
 * Note: the admin and user sessions still share one cookie. They cannot simply
 * be split by cookie path, because SellerController exposes five /api
 * endpoints that authorise through AuthMiddleware::requireAdmin() and so need
 * the admin session outside /admin. Separating them is a design change, not a
 * cookie-flag fix.
```

Dolayısıyla saldırganın sabitlemesi gereken oturum, **kendi normal kullanıcı oturumu** olabilir:
saldırgan kendi PHPSESSID'sini bilir; onu kurban admin'in tarayıcısına yerleştirebilirse
(alt alan adı çerez enjeksiyonu, herhangi bir XSS, paylaşılan cihaz), admin giriş yaptığı anda
saldırganın elindeki oturum kimliği admin yetkisi kazanır.

**Impact:** Admin paneli ele geçirme → `db_backup.php?mode=restore` (canlı DB üzerine yazma),
`delete.php`, `updateenv.php`, `readenv.php` (API anahtarları).

**Önerilen çözüm:** Satır 47'den önce `session_regenerate_id(true);`. Ayrıca CSRF token'ını da
giriş sonrası yenilemek (şu an yalnızca **başarısız** girişte yenileniyor — satır 24).

**Çözüm önceliği:** Yüksek — tek satır.

---

### SEC-006

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** Admin girişinde hiç rate limit yok — kullanıcı girişinde iki katmanlı limit varken admin parolası sınırsız denenebiliyor

**Dosya:** `api/admin/ajax/giris.php` (tamamı — 59 satır, hiç `checkRateLimit` yok)

**Problem:**

Kullanıcı tarafı bu saldırıyı iki ayrı sayaçla kapatıyor ve nedenini de yazmış:

```php
api/src/Presentation/Controllers/AuthController.php:15-23
        // Two limits, because one alone leaves a hole:
        //   per IP+identifier — stops password-guessing against one account;
        //   per IP            — stops credential stuffing and user enumeration,
        //                       which simply changed the e-mail each attempt and
        //                       reset the first counter every time.
        // The per-IP budget is deliberately looser so a shared NAT/office egress
        // does not lock out legitimate users at the same rate as an attacker.
        checkRateLimit(Database::getInstance(), 'login:' . $clientIp . ':' . $identifier, 8, 300);
        checkRateLimit(Database::getInstance(), 'login-ip:' . $clientIp, 30, 300);
```

**Kanıt (bölüm 24 — limitin `_guard.php` gibi başka bir katmanda olup olmadığı arandı):**

```
$ grep -rn 'checkRateLimit\|rate_limit' api/admin --include=*.php
(çıktı yok)

$ grep -c 'checkRateLimit' api/admin/ajax/giris.php
0
```

`giris.php` ayrıca `_guard.php`'yi de dahil etmiyor (etseydi zaten 403 verirdi — giriş
endpoint'i olduğu için doğru), yani üstünde hiçbir throttle katmanı yok.

**Nasıl tetiklenebilir:** `POST /admin/ajax/giris.php` — geçerli bir CSRF token (aynı oturumdan
`/admin/` sayfası çekilerek alınır) ile sınırsız sayıda `admin_sifre` denemesi.

**Impact:** `adminler` tablosundaki bcrypt hash'e karşı çevrimiçi kaba kuvvet. Bcrypt cost 12
denemeyi yavaşlatır (~100–250 ms/deneme) ama zayıf bir admin parolası gün mertebesinde bulunur.
Ele geçirme sonucu SEC-005 ile aynı: `db_backup.php?mode=restore`, `readenv.php`.

**Ek gözlem — kullanıcı adı enumerasyonu:** `password_verify` yalnızca kullanıcı bulunduğunda
çalışıyor (satır 46). Bulunmayan kullanıcıda yanıt anında dönüyor. Mesajlar aynı olsa da
zamanlama farkı (~200 ms vs ~1 ms) admin kullanıcı adlarını ayırt etmeye yeter.

**Önerilen çözüm:** `checkRateLimit(Database::getInstance(), 'adminlogin:' . $ip . ':' . $admin_adi, 5, 900);`
+ `'adminlogin-ip:' . $ip` ikinci sayacı. Zamanlama farkı için kullanıcı bulunmadığında da bir
sahte `password_verify` çalıştırmak.

**Çözüm önceliği:** Yüksek.

---

### SEC-007

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** `_guard.php` CSRF kontrolünü GET isteklerinden muaf tutuyor; `db_backup.php` yıkıcı `restore` işlemini GET ile kabul ediyor — admin'e gönderilen tek bir link canlı veritabanını üzerine yazıyor

**Dosya:** `api/admin/ajax/_guard.php:32-39`, `api/admin/ajax/db_backup.php:15-24`, `api/functions/db.php:463-479`

**Problem:**

Guard, CSRF doğrulamasını yalnızca durum değiştiren istekler için yapıyor — ve "durum değiştiren"i
"GET değil" olarak tanımlıyor:

```php
api/admin/ajax/_guard.php:32-39
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!csrf_check($token)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'status' => 'error', 'message' => 'Geçersiz CSRF token.']);
        exit;
    }
}
```

Ama `db_backup.php` modu `$_GET`'ten okuyor:

```php
api/admin/ajax/db_backup.php:15-24
try {
    if ($_GET['mode'] == 'backup') {
        $database->backup();
        $response = ["status" => "success", "message" => "Veritabanı başarıyla yedeklendi."];
    } elseif ($_GET['mode'] == 'restore') {
        $database->restore();
        $response = ["status" => "success", "message" => "Veritabanı başarıyla geri yüklendi."];
    } else {
        throw new Exception("Yanlış mod seçildi.");
    }
```

Ve `restore()` canlı veritabanını yedekle **değiştiriyor**:

```php
api/functions/db.php:463-478
    public function restore() {
        $backupDir = realpath(__DIR__ . '/../admin/db_backup');
        $backups = glob("$backupDir/*.sql");

        if (count($backups) === 1) {
            $backupFile = $backups[0];
        } elseif (count($backups) > 1) {
            $backupFile = end($backups);
        } else {
            die("Hata: Hiç yedek bulunamadı!");
        }
        ...
        $command = "mysql --user=$this->username $passwordSegment --host=" . explode(':', $this->host)[0] . " $portSegment $this->database < \"$backupFile\"";
        exec($command);
```

**Kanıt (bölüm 24 — çerez politikasının bu isteği taşıyıp taşımadığı ayrıca kontrol edildi):**

```
$ grep -n 'samesite' api/functions/bootstrap.php api/admin/functions/session.php
api/functions/bootstrap.php:21:        'samesite' => 'Lax',
api/admin/functions/session.php:33:        'samesite' => 'Lax',
```

`SameSite=Lax`, **üst düzey GET navigasyonlarında çerezi gönderir** (alt kaynak isteklerinde
göndermez). Yani `<img src=...>` çalışmaz, ama admin'in tıkladığı bir link, bir `window.open`
ya da bir yönlendirme çalışır.

**Nasıl tetiklenebilir:** Oturumu açık bir admin'e şu link gönderilir ve tıklatılır:

```
https://<site>/admin/ajax/db_backup.php?mode=restore
```

Guard 403 vermez (GET), CSRF token istenmez (GET), `restore()` çalışır, `glob()` ile bulunan en
son `.sql` dosyası canlı veritabanının üzerine yazılır.

**Impact:** Yıkıcı veri kaybı. Diskteki tek yedek 23.02.2026 tarihli — yani o tarihten sonraki
tüm kullanıcı, sohbet, abonelik ve ödeme verisi tek tıkla silinir. Geri dönüşü yok
(`exec()` sonucu kontrol bile edilmiyor, bkz. ERR-006).

**Önerilen çözüm:** `db_backup.php`'yi POST'a çevirmek (guard o zaman CSRF'i zorlar); ek olarak
`_guard.php`'deki muafiyeti "GET değil" yerine "durum değiştiren endpoint listesi" ile
tanımlamak. `restore` için ayrıca ikinci bir onay (yedek dosya adının açıkça gönderilmesi)
istemek — `glob()` + `end()` ile "en sonuncuyu al" davranışı zaten belirsiz.

**Çözüm önceliği:** Yüksek.

---

### SEC-008

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + prod blocker

**Başlık:** Veritabanı parolası kaynak kodda düz metin, git geçmişinde kayıtlı ve şu anki yapılandırmada **aktif olarak kullanılan** yol

**Dosya:** `api/functions/db.php:13-17, 62-68`

**Problem:**

```php
api/functions/db.php:13-17
    // Geliştirme (Dev) Ayarları
    private $host_dev = 'localhost:3306';
    private $username_dev = 'root';
    private $password_dev = '[REDACTED-DB-PASSWORD]';
    private $database_dev = 'lumanoris';
```

Bu değerler `DB_*` değişkenlerinin **hiçbiri** tanımlı değilse devreye giriyor:

```php
api/functions/db.php:62-68
        } else {
            // No DB_* variable set at all — local development.
            $this->host     = $this->host_dev;
            $this->username = $this->username_dev;
            $this->password = $this->password_dev;
            $this->database = $this->database_dev;
        }
```

**Kanıt (bölüm 24 — üç ayrı doğrulama):**

```
1) Mevcut ortamda gerçekten bu yol mu çalışıyor?
$ sed 's/=.*/=<gizlendi>/' api/.env
APP_DEBUG=<gizlendi>
GOOGLE_CLIENT_ID=<gizlendi>
   → DB_HOST/DB_USER/DB_PASS/DB_NAME tanımlı DEĞİL → $env === [] → dev dalı çalışıyor.

2) Git geçmişinde mi?
$ git log --oneline -S'[REDACTED-DB-PASSWORD]' -- api/functions/db.php
a77323c 4. commit
   → parola en az "4. commit"ten beri geçmişte.

3) Dosya takip ediliyor mu?
$ git ls-files api/functions/db.php
api/functions/db.php   → evet, takipli.
```

**Neden problem:** Üç ayrı katman:
1. **Geçmişte kalıcı.** Dosyadan silmek yetmez; blob `a77323c`'den itibaren object store'da.
   Repo bir kez paylaşıldıysa parola sızmış sayılmalı.
2. **Kullanıcı `root`.** Sadece parola değil, tam yetkili hesap. `Database::truncate()`,
   `backup()`, `restore()` ve `ensureTable`'ın DDL çağrıları bu yüzden çalışıyor.
3. **Sessiz fallback.** `.env` yanlış yüklenirse (dosya izni, farklı çalışma dizini) production
   sessizce dev kimlik bilgileriyle bağlanmayı dener. Kodun kendi yorumu (satır 24-29) bu tehlikeyi
   tanımış ve kısmi düzeltme yapmış (`!empty()` yerine "hiç verilmiş mi") — ama **hiç
   verilmediğinde** hâlâ hard-coded değerlere düşüyor.

**Impact:** Parola sızıntısı; `root` erişimi; production'ın yanlış veritabanına bağlanma riski.

**Önerilen çözüm:**
1. Parolayı **rotate etmek** (kod düzeltmesi tek başına yetmez).
2. `$*_dev` alanlarını tamamen kaldırıp `DB_*` yoksa istisna fırlatmak — sessiz fallback yerine
   gürültülü hata. Kodun kısmi yapılandırma için zaten yaptığı şey (satır 43-48) budur; aynı
   mantığı "hiç yapılandırma yok" durumuna da uygulamak tutarlı olur.
3. Uygulama için `root` yerine en az yetkili bir DB kullanıcısı.

**Çözüm önceliği:** Yüksek.

---

### SEC-009

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik

**Başlık:** Remember-me ile oturum geri yüklenirken `session_regenerate_id()` çağrılmıyor ve token kullanımda döndürülmüyor

**Dosya:** `api/src/Presentation/Middleware/AuthMiddleware.php:45-70`

**Fonksiyon/Class:** `AuthMiddleware::tryRememberMe()`

**Problem:**

```php
api/src/Presentation/Middleware/AuthMiddleware.php:55-69
        [$selector, $validator] = $parts;
        $repo = new UserRepository();
        $tokenData = $repo->findByRememberToken($selector);

        if (!$tokenData) {
            return null;
        }

        if (!hash_equals($tokenData['hashed_validator'], hash('sha256', $validator))) {
            return null;
        }

        $userId = (int) $tokenData['user_id'];
        $_SESSION['user_id'] = $userId;
        return $userId;
```

**Kanıt (bölüm 24 — iki olası "aslında güvenli" gerekçesi ayrı ayrı test edildi, biri doğrulandı
ve o kısım bulgudan çıkarıldı):**

```
1) Token süresi kontrol ediliyor mu?  → EVET, bulgu DEĞİL:
$ UserRepository::findByRememberToken gövdesi
  'SELECT user_id, hashed_validator FROM `user_tokens` WHERE selector = ? AND expiry > NOW()'
  → süre kontrolü SQL'de var. Bu yönde bulgu yazılmadı.

2) Regenerate başka bir katmanda mı yapılıyor?  → HAYIR:
$ grep -rn 'session_regenerate_id' api/ (vendor hariç)
  AuthController.php:35, AuthController.php:135   ← yalnızca iki login yolu
  (AuthMiddleware.php'de hiç yok)
```

**Neden problem:** Kimlik yükseltmesinin yapıldığı **üç** noktadan ikisi (`login`, `loginGoogle`)
oturum kimliğini yeniliyor, üçüncüsü (`tryRememberMe`) yenilemiyor. Aynı fixation senaryosu
buradan geçerli: saldırgan bir oturum kimliği sabitler, kurbanın tarayıcısındaki remember-me
çerezi herhangi bir korumalı endpoint'e ilk isteğinde o oturumu kimlik doğrulamış hâle getirir.

**Ek zayıflık — token rotasyonu yok:** Doğrulayıcı (validator) kullanıldığında yenilenmiyor.
Bir kez çalınan remember-me çerezi, DB satırı silinene veya 30 gün dolana kadar geçerli kalıyor
ve **hırsızlık tespit edilemiyor** (rotasyon olsaydı, aynı selector'ın eski validator'la ikinci
kez kullanılması hırsızlık sinyali olurdu).

**Impact:** Session fixation ile hesap ele geçirme; çalınan çerezin 30 güne kadar sessizce
kullanılabilmesi.

**Önerilen çözüm:** `$_SESSION['user_id'] = $userId;` satırından önce `session_regenerate_id(true)`;
ek olarak her başarılı `tryRememberMe`'de yeni bir validator üretip DB'yi ve çerezi güncellemek.

**Çözüm önceliği:** Orta-Yüksek.

---

### SEC-010

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik

**Başlık:** Parola sıfırlama mevcut oturumları ve remember-me token'larını iptal etmiyor — hesabını kurtaran kullanıcı saldırganı dışarı atamıyor

**Dosya:** `api/src/Presentation/Controllers/AuthController.php:243-247`

**Fonksiyon/Class:** `AuthController::updatePassword()`

**Problem:**

```php
api/src/Presentation/Controllers/AuthController.php:243-247
        $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $users->updateById($user['id'], ['sifre' => $hashed]);
        $db->delete('password_resets', 'user_id = ?', [$user['id']]);

        JsonResponse::success(['message' => 'Şifre güncellendi.']);
```

Yalnızca parola hash'i ve sıfırlama kodu güncelleniyor.

**Kanıt (bölüm 24 — iptal başka bir yerde yapılıyor mu diye arandı):**

```
$ grep -rn 'clearRememberToken' api/src
api/src/Presentation/Controllers/AuthController.php:83   ← yalnızca logout()
(updatePassword içinde YOK)
```

Karşılaştırma — `logout()` bu ihtiyacı tanımış ve gerekçesini de yazmış:

```php
api/src/Presentation/Controllers/AuthController.php:79-84
        // Session cookie alone isn't enough — a live remember-me token would
        // let sessionCheck() silently re-authenticate the user right after
        // logout via AuthMiddleware::optionalAuth()'s remember-me fallback.
        if ($userId) {
            (new UserRepository())->clearRememberToken((int) $userId);
        }
```

Aynı akıl yürütme parola sıfırlamaya uygulanmamış.

**Neden problem:** Parola sıfırlamanın birincil kullanım amacı **hesap kurtarma**. Kullanıcı
hesabının ele geçirildiğini fark edip parolasını sıfırladığında, saldırganın aktif PHP oturumu
ve varsa remember-me çerezi çalışmaya devam ediyor. Sıfırlama işlemi asıl işini yapmıyor.

**Impact:** Ele geçirilmiş hesap, parola değiştirildikten sonra da ele geçirilmiş kalıyor
(remember-me için 30 güne kadar).

**Önerilen çözüm:** `updateById`'den sonra `clearRememberToken($user['id'])` çağırmak. Tüm PHP
oturumlarını sonlandırmak için `kullanicilar` tablosuna bir `session_epoch` sütunu ekleyip
`AuthMiddleware`'de kontrol etmek (daha büyük değişiklik, ikinci aşama).

**Çözüm önceliği:** Orta.

---

### SEC-011

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik + iş mantığı

**Başlık:** Parola sıfırlama yolunda parola politikası hiç uygulanmıyor — kayıt sırasında zorunlu olan minimum uzunluk burada yok

**Dosya:** `api/src/Presentation/Controllers/AuthController.php:206-247`

**Problem:**

`updatePassword` parolaya dair yalnızca üç şey kontrol ediyor: boş değil, teyidi eşleşiyor:

```php
api/src/Presentation/Controllers/AuthController.php:210-221
        $password        = $_POST['password'] ?? null;
        $passwordConfirm = $_POST['password_confirm'] ?? null;
        ...
        if (!$password || !$passwordConfirm) {
            JsonResponse::error('Şifre ve doğrulama zorunludur!', 400, AppConfig::ERR_VALIDATION);
        }
        if ($password !== $passwordConfirm) {
            JsonResponse::error('Şifreler eşleşmiyor!', 400, AppConfig::ERR_VALIDATION);
        }
```

Uzunluk, karmaşıklık veya yaygın-parola kontrolü yok. Satır 243'te doğrudan hash'leniyor.

**Kanıt (bölüm 24 — politikanın gerçekten kayıt yolunda var olduğu doğrulandı; yoksa bu bir
"tutarsızlık" değil "hiç yok" bulgusu olurdu):**

```
$ grep -n 'strlen\|mb_strlen\|password' api/src/Application/UseCases/Auth/RegisterUseCase.php
   (RegisterUseCase.php okundu — 62 satır; minimum 8 karakter kontrolü orada)
```

**Not:** `RegisterUseCase.php`'nin tamamı bu turda okundu ancak bu raporda alıntılanmadı;
politikanın oradaki varlığı README:631-632'de de belgeli ("minimum 8 characters enforced in
`RegisterUseCase`"). Politikanın **kesin metni** için bkz. Doğrulanamayanlar.

**Neden problem:** Bir kullanıcı `sifre=a` ile parolasını sıfırlayabiliyor. Kayıt formunun
reddedeceği bir parola, sıfırlama formundan geçiyor. Bu tür asimetriler denetimde tekrar eden
bir kalıp bu kod tabanında (bkz. SEC-003, SEC-006, SEC-012) — doğru kontrol var, ama tüm
yollara uygulanmamış.

**Impact:** Zayıf parolalar; SEC-006'daki kaba kuvvet limitinin (kullanıcı tarafında var) değerini
düşürüyor.

**Önerilen çözüm:** Parola politikasını `RegisterUseCase`'den ortak bir doğrulayıcıya çıkarıp
her iki yolun da çağırması.

**Çözüm önceliği:** Orta.

---

### SEC-012

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik

**Başlık:** Parola sıfırlama isteği hesap enumerasyonuna açık, ve rate limit anahtarı e-postayı içerdiği için sayaç her yeni e-postada sıfırlanıyor

**Dosya:** `api/src/Presentation/Controllers/AuthController.php:155-161`

**Problem:**

```php
api/src/Presentation/Controllers/AuthController.php:155-161
        checkRateLimit(Database::getInstance(), 'passreset:' . ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . $email, 3, 600);

        $users = new UserRepository();
        $user  = $users->findByEmail($email);
        if (!$user) {
            JsonResponse::error('Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
        }
```

İki sorun iç içe:
1. Kayıtlı olmayan e-posta → `404` + "kayıtlı bir kullanıcı bulunamadı". Kayıtlı e-posta →
   `200`. Yanıt farkı doğrudan enumerasyon.
2. Rate limit anahtarı `'passreset:' . IP . ':' . $email` — **e-postayı içeriyor.** Saldırgan
   her denemede farklı e-posta gönderdiğinde her seferinde yeni bir anahtar, yani yeni bir
   3-istek bütçesi oluşuyor. Limit enumerasyonu hiç yavaşlatmıyor.

**Kanıt (bölüm 24 — aynı deliğin login'de kapatılmış olması, bunun bilinen bir kalıp olduğunu
gösteriyor):**

```
Login tarafı (AuthController.php:22-23) — İKİ sayaç:
    checkRateLimit(..., 'login:' . $clientIp . ':' . $identifier, 8, 300);
    checkRateLimit(..., 'login-ip:' . $clientIp, 30, 300);   ← kimlikten BAĞIMSIZ ikinci sayaç

Parola sıfırlama tarafı (AuthController.php:155) — TEK sayaç, e-posta içeriyor:
    checkRateLimit(..., 'passreset:' . IP . ':' . $email, 3, 600);
                                        ↑ ikinci, e-postadan bağımsız sayaç YOK
```

Login'deki yorum (satır 17-19) tam olarak bu deliği tarif ediyor: *"stops credential stuffing and
user enumeration, which simply changed the e-mail each attempt and reset the first counter every
time."* Aynı akıl yürütme parola sıfırlamaya uygulanmamış.

Ayrıca `LoginUseCase:18-27` enumerasyonu önlemek için mesajları özellikle aynılaştırmış —
yani proje bu tehdidi tanıyor. Sıfırlama endpoint'i o çabayı geçersiz kılıyor.

**Nasıl tetiklenebilir:** Tek IP'den, her istekte farklı e-posta ile
`POST /api/auth/passresetmail.php`; `404` vs `200` yanıtına bakarak hangi e-postaların kayıtlı
olduğu listelenir.

**Impact:** Kullanıcı tabanının e-posta listesinin doğrulanması; hedefli kimlik avı ve credential
stuffing için girdi.

**Önerilen çözüm:** Kullanıcı bulunsun bulunmasın aynı yanıt ("Kayıtlıysa bir kod gönderildi.",
200); ek olarak `'passreset-ip:' . $ip` biçiminde e-postadan bağımsız ikinci bir sayaç.

**Çözüm önceliği:** Orta.

---

### SEC-013

**Severity:** 🟡 MEDIUM
**TÜR:** bug + güvenlik

**Başlık:** Rate limiter'da üç ayrı kusur: SELECT→UPDATE yarış koşulu, 191 karakterlik anahtar sütununun taşabilmesi, ve hiç temizlenmeyen tablo

**Dosya:** `api/functions/rate_limit.php:8-33`

**Fonksiyon/Class:** `checkRateLimit()`

**Problem:**

```php
api/functions/rate_limit.php:9-32
    $db->ensureTable('rate_limits', "CREATE TABLE IF NOT EXISTS rate_limits (
            rkey VARCHAR(191) PRIMARY KEY,
            attempts INT NOT NULL,
            window_start DATETIME NOT NULL
        )");

    $row = $db->selectSingle('* FROM rate_limits WHERE rkey = ?', [$key]);

    if (!$row) {
        $db->insert('rate_limits', ['rkey' => $key, 'attempts' => 1, 'window_start' => date('Y-m-d H:i:s')]);
        return;
    }
    ...
    if ((int) $row['attempts'] >= $maxAttempts) {
        JsonResponse::error('Çok fazla deneme yapıldı. ...', 429, AppConfig::ERR_VALIDATION);
    }

    $db->update('rate_limits', ['attempts' => (int) $row['attempts'] + 1], 'rkey = ?', [$key]);
```

**(a) Yarış koşulu (TOCTOU).** Okuma (satır 15) ile yazma (satır 32) arasında kilit yok, transaction
yok. N eşzamanlı istek aynı `attempts` değerini okur, hepsi kontrolü geçer, hepsi aynı değeri +1
yapar. Paralel bir kaba kuvvet denemesi limiti önemli ölçüde aşabilir.

**Kanıt (bölüm 24 — aynı kod tabanında doğru desenin var olduğu doğrulandı):**

```
$ WalletController::withdraw():96-103 — aynı sınıf yarışı KİLİTLE çözmüş:
    $lockName = 'withdraw_user_' . $userId;
    $lockStmt = $conn->prepare('SELECT GET_LOCK(?, 10) AS locked');
    ...
    $conn->beginTransaction();
$ rate_limit.php içinde GET_LOCK / beginTransaction / FOR UPDATE:
$ grep -cE 'GET_LOCK|beginTransaction|FOR UPDATE' api/functions/rate_limit.php
0
```

Yani kilitleme deseni projede biliniyor ve para akışında uygulanmış; kaba kuvvet savunmasında
uygulanmamış.

**(b) Anahtar taşması.** `rkey VARCHAR(191)`. Login anahtarı `'login:' . $ip . ':' . $identifier`
ve identifier `InputSanitizer::string()`'den geçiyor — varsayılan üst sınır **1000 karakter**:

```php
api/src/Shared/Utilities/InputSanitizer.php:8-10
    public static function string(mixed $value, int $maxLen = 1000): string {
        return mb_substr(trim((string) $value), 0, $maxLen);
    }
```

```php
api/src/Presentation/Controllers/AuthController.php:9, 22
        $identifier = InputSanitizer::string($data['kullanici_adi'] ?? $data['eposta'] ?? '');
        checkRateLimit(Database::getInstance(), 'login:' . $clientIp . ':' . $identifier, 8, 300);
```

191'i aşan bir identifier: MySQL strict modda `SQLSTATE[22001] Data too long` → PDOException →
500 (yani kimlik doğrulama akışı çöker). Strict mod kapalıysa değer **kırpılır** → 191 karakterden
uzun tüm identifier'lar aynı satıra düşer, ortak bir bütçeyi paylaşır. Her iki davranış da hatalı.

**(c) Tablo hiç temizlenmiyor.** `rate_limits`'ten satır silen tek bir kod yok:

```
$ grep -rn "rate_limits" api/ --include=*.php | grep -iE 'delete|truncate|cleanup'
(çıktı yok)
```

Anahtarın bir bileşeni saldırgan kontrolünde (identifier) olduğu için, her farklı identifier kalıcı
bir satır bırakıyor. Süresi dolan pencereler bile satırı silmiyor, yalnızca sayacı sıfırlıyor
(satır 24).

**Impact:** (a) kaba kuvvet limitinin paralel isteklerle aşılması; (b) kimlik doğrulamanın 500
vermesi veya limitin yanlış paylaşılması; (c) sınırsız tablo büyümesi.

**Önerilen çözüm:** Tek atomik ifade —
`INSERT INTO rate_limits (rkey, attempts, window_start) VALUES (?,1,NOW())
 ON DUPLICATE KEY UPDATE attempts = IF(window_start < NOW() - INTERVAL ? SECOND, 1, attempts + 1),
 window_start = IF(...)` — sonra sonucu okuyup karar vermek. Anahtarı `hash('sha256', $key)`
(64 karakter, sabit) olarak saklamak. Süresi dolmuş satırlar için periyodik temizlik.

**Çözüm önceliği:** Orta.

---

### SEC-014

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik + iş mantığı

**Başlık:** Beş yazma endpoint'i istemcinin JSON'unu doğrudan `insert`/`update`'e veriyor (mass assignment) — sütun beyaz listesi yok

**Dosya:** `SocialController.php:116-125`, `ChatController.php:3-12`, `ChatController.php:26-42`,
`ChatbotController.php:7-62`, `MarketplaceController.php:132-144`

**Problem:** Ortak kalıp — `json_decode` sonucu doğrudan `Database::insert()`/`update()`'e gidiyor,
yalnızca `user_id` sunucu tarafından zorlanıyor:

```php
api/src/Presentation/Controllers/SocialController.php:116-125
    public static function addComment(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_comments', $data);
        JsonResponse::success(['message' => 'Yorum başarıyla eklendi', 'id' => $id]);
    }
```

```php
api/src/Presentation/Controllers/ChatController.php:3-12
    public static function addChat(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data) JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);

        $data['user_id'] = $userId;
        $id = Database::getInstance()->insert('chatbot_chats', $data);
        JsonResponse::success(['message' => 'Mesaj kaydedildi!', 'id' => $id]);
    }
```

**Kanıt (bölüm 24 — üç ayrı savunma katmanı olasılığı test edildi):**

```
1) Repository katmanında beyaz liste var mı?  → HAYIR
   ChatbotRepository::create():  return self::insert(self::T, $data);   (filtre yok)

2) Database::insert() sütunları doğruluyor mu?  → yalnızca SÖZDİZİMİ olarak
   api/functions/db.php:362-366
     private static function assertSafeColumnName($key) {
         if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', (string) $key)) {
             throw new Exception('Geçersiz sütun adı: ' . $key);
         }
     }
   → SQL enjeksiyonunu engelliyor, "bu sütun yazılabilir mi" sorusunu SORMUYOR.

3) InputSanitizer bu yollarda kullanılıyor mu?  → HAYIR
$ grep -rn 'InputSanitizer::text\|InputSanitizer::string' api/src/Presentation/Controllers/SocialController.php
SocialController.php:152:  $detail = InputSanitizer::text($data['report_detail'] ?? '', 2000);   ← yalnızca addReport
   → addComment'te hiç yok.
```

**Somut etkiler (sütun listeleri `schema.sql`'den doğrulandı):**

| Endpoint | Tablo | İstemcinin yazabildiği sütunlar | Etki |
| --- | --- | --- | --- |
| `addComment` | `chatbot_comments` (`id, user_id, chatbot_id, comment, commented_at`) | `chatbot_id`, `comment`, `commented_at` | Erişimi olmayan/özel bota yorum; `commented_at` ile sahte tarih; `comment` uzunluk sınırsız |
| `addChat` | `chatbot_chats` | `chatbot_id`, `message`, `sent_by`, `sent_time` | Erişim kontrolü olmadan herhangi bir bot id'sine mesaj yazma; `sent_by` ile asistan mesajı taklidi |
| `addConversation` | `chatbot_conversations` | `chatbot_id` ve diğerleri | Aynı |
| `saveChatbot` | `chatbotlar` | `ucret_haftalik`, `ucret_aylik` dâhil | Fiyat doğrulaması atlanıyor (bkz. SEC-003) |
| `updateCart` | `user_cart` (`id, user_id, chatbot_id, order_weeks`) | `chatbot_id`, `order_weeks` | Sepet kalemi manipülasyonu — fiyat etkisi **Tur 3** |

**Karşı örnek — doğru desen aynı kod tabanında var:**

```php
api/src/Presentation/Controllers/WalletController.php:150-157
        $allowed = [
            'user_id', 'account_type', 'full_name', 'authorized_first_name', 'authorized_last_name',
            'company_title', 'tax_number', 'tax_office', 'id_number', 'phone', 'iban', 'address',
            ...
        ];
        $filtered = array_intersect_key($data, array_flip($allowed));
        $filtered['user_id'] = $userId;
```

Yani sorun "nasıl yapılacağı bilinmiyor" değil, "tutarlı uygulanmıyor".

**Impact:** Erişim kontrolü atlatma (özel botlara yazma), veri bütünlüğü bozulması, fiyat/limit
doğrulaması atlatma.

**Önerilen çözüm:** `array_intersect_key` beyaz liste desenini bu beş endpoint'e de uygulamak;
`addComment`'te `InputSanitizer::text($data['comment'], 2000)` kullanmak (kardeşi `addReport`
zaten kullanıyor).

**Çözüm önceliği:** Orta.

---

### SEC-015

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı + güvenlik

**Başlık:** `generateReply` sistem talimatını tamamen istemciden alıyor ve hiçbir chatbot erişim kontrolü yapmıyor — uygulama genel amaçlı ücretsiz bir LLM proxy'si olarak kullanılabilir

**Dosya:** `api/src/Presentation/Controllers/ChatController.php:179-210`

**Problem:**

```php
api/src/Presentation/Controllers/ChatController.php:187-207
        $data              = json_decode($_POST['data'] ?? '', true) ?? null;
        $systemInstruction = $data['system_instruction'] ?? null;
        $message           = $data['message'] ?? null;
        if (!$data || $systemInstruction === null || $message === null) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }

        $apiKey = AppConfig::googleGeminiApiKey();
        ...
        $payload = json_encode([
            'contents' => [[
                'role'  => 'user',
                'parts' => [
                    ['text' => $systemInstruction],
                    ['text' => $message],
                ],
            ]],
        ]);
```

İstek gövdesinde `chatbot_id` hiç yok — dolayısıyla sunucunun "bu kullanıcı bu botla konuşabilir
mi" sorusunu sorması **mümkün değil**. Botun kişiliği/eğitim metni istemciden geliyor.

**Kanıt (bölüm 24 — sunucunun botu başka bir yoldan çözüp çözmediği arandı; ayrıca erişim
kontrolünün gerçekten mevcut olduğu ve burada kullanılmadığı doğrulandı):**

```
$ grep -n 'chatbot_id\|userHasAccess\|training_prompt' <ChatController::generateReply gövdesi>
(çıktı yok — generateReply hiçbirine dokunmuyor)

$ Karşılaştırma — TrainingController aynı veriyi okurken erişim kontrolü YAPIYOR:
api/src/Presentation/Controllers/TrainingController.php:57-59
        if (!(new ChatbotRepository())->userHasAccess($botId, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }
```

**Neden problem:** `getTrainingChunks` bir botun eğitim metnini okumayı `userHasAccess` ile
titizlikle koruyor (satır 39-49'daki yorum bunun bilinçli bir düzeltme olduğunu anlatıyor). Ama
`generateReply` sistem talimatını istemciden kabul ettiği için, o koruma **iş sonucu açısından
anlamsız kalıyor**: kullanıcı zaten istediği talimatı gönderebiliyor.

**Nasıl tetiklenebilir:** Oturum açmış herhangi bir kullanıcı:

```
POST /api/chat/generatereply.php
data={"system_instruction":"Sen bir Python kod üreticisisin.","message":"..."}
```

Uygulamanın Gemini kotası, kullanıcının kendi amaçları için kullanılır. Dakikada 20 istek
(`checkRateLimit(..., 'genreply:' . $userId, 20, 60)`) — hesap başına saatte 1200 istek,
hesap açmak ücretsiz.

**Impact:** Gemini fatura/kota istismarı; abonelik satın almadan bot işlevselliğine erişim
(coin/mesaj muhasebesi de ayrı bir endpoint olduğundan — kodun kendi yorumu satır 183-184'te
bunu kabul ediyor: *"consumeMessage's daily coin budget is a separate endpoint the client may
simply not call"*).

**Önerilen çözüm:** İstekten `chatbot_id` almak, `userHasAccess` ile doğrulamak, ve sistem
talimatını **sunucuda** botun `style_prompt` + `training_prompt` alanlarından kurmak. İstemcinin
gönderdiği `system_instruction` hiç kabul edilmemeli.

**Çözüm önceliği:** Orta. Coin/mesaj muhasebesiyle ilişkisi **Tur 3 (bölüm 8)**.

---

### SEC-016

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik

**Başlık:** `uploadProfilePhoto` avatar değerini hiç doğrulamadan saklıyor — sıkı yükleme yolu chatbot görselleri için var, kullanıcı avatarları için tamamen atlanıyor

**Dosya:** `api/src/Presentation/Controllers/UserController.php:152-171` (metot gövdesi)

**Problem:**

```php
api/src/Presentation/Controllers/UserController.php (uploadProfilePhoto gövdesi)
        $avatar = $data['avatar'] ?? null;

        // avatar === "" is a valid request meaning "remove my photo" — only a
        // truly missing key should be rejected.
        if ($avatar === null) {
            JsonResponse::error('Eksik alanlar!', 400, AppConfig::ERR_VALIDATION);
        }

        $ok = (new UserRepository())->updateById($userId, ['avatar' => $avatar]);
```

`$avatar` rastgele bir string; uzunluk sınırı, biçim kontrolü, MIME doğrulaması, `InputSanitizer`
çağrısı yok.

**Kanıt (bölüm 24 — aynı projede sıkı yolun var olduğu, ve avatar'ın istemcide nasıl
kullanıldığı doğrulandı):**

```
1) Sıkı yol var mı?  → EVET, chatbot görselleri için:
api/src/Presentation/Controllers/ChatbotController.php:347-357
        if ($file['size'] > AppConfig::MAX_UPLOAD_SIZE_BYTES) { ...5 MB... }
        $mime = InputSanitizer::detectMime($file['tmp_name']);
        if (!in_array($mime, AppConfig::ALLOWED_IMAGE_MIMES, true)) { ...reddet... }
        $ext = InputSanitizer::extensionForMime($mime);

2) avatar istemcide nasıl render ediliyor?
web/src/entities/user/ui/ProfileCard.jsx:320,412
    const avatarSrc = profile.image || resolveAvatarSrc(null).src;
    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
```

**Neden problem:** İki ayrı risk, ikisi de sınırlı ama gerçek:
1. **Boyut.** Sınır yok. `data:image/png;base64,...` biçiminde çok büyük bir string doğrudan
   `kullanicilar.avatar` sütununa yazılabilir — depolama şişmesi, ve bu sütun her
   `getuserheader.php` çağrısında okunuyor.
2. **İçerik.** Rastgele bir URL yazılabilir (harici izleme pikseli, karışık içerik uyarısı) veya
   `data:` URI yazılabilir.

**Dürüstlük notu — XSS DEĞİL:** `<img src>` içindeki `javascript:` URI'ları modern tarayıcılarda
çalışmaz ve `<img src>` ile gömülen SVG'de script yürütülmez. Yani buradan doğrudan XSS
çıkarılamıyor. Bulgu "doğrulama yokluğu ve depolama/içerik riski" olarak MEDIUM verildi;
"stored XSS" olarak raporlanmadı.

**Impact:** Depolama şişmesi; kontrolsüz harici kaynak yüklemesi.

**Önerilen çözüm:** Avatar'ı da `handleImageUploads` deseninden geçirmek (gerçek dosya yükleme),
ya da en azından uzunluk sınırı + izinli önek kontrolü (`assets/` ile başlamalı) uygulamak.

**Çözüm önceliği:** Orta.

---

### SEC-017

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik

**Başlık:** Altı bilgi popup'ı admin panelinden gelen HTML'i `dangerouslySetInnerHTML` ile ham olarak render ediyor — admin→kullanıcı stored XSS zinciri

**Dosya:** `web/src/widgets/info/{MesafeliSatisPopup,TeslimatIadePopup,PrivacyPolicy,PrivacyPolicy2,TermsOfUse,UsagePopup}.jsx`

**Problem:**

```
$ grep -rn 'dangerouslySetInnerHTML' web/src
web/src/widgets/info/MesafeliSatisPopup.jsx:36:   <div dangerouslySetInnerHTML={{ __html: info }} />
web/src/widgets/info/PrivacyPolicy.jsx:35:        <div dangerouslySetInnerHTML={{ __html: info }} />
web/src/widgets/info/PrivacyPolicy2.jsx:35:       dangerouslySetInnerHTML={{ __html: info }}
web/src/widgets/info/TermsOfUse.jsx:33:           dangerouslySetInnerHTML={{ __html: info }}
web/src/widgets/info/TeslimatIadePopup.jsx:164:  <div dangerouslySetInnerHTML={{ __html: info }} />
web/src/widgets/info/UsagePopup.jsx:35:          <div dangerouslySetInnerHTML={{ __html: info }} />
```

`info`'nun kaynağı API'den geliyor:

```javascript
web/src/widgets/info/TeslimatIadePopup.jsx:9-16
    useEffect(() => {
        async function fetchInfo() {
            try {
                const res = await fetch("/api/content/getdelivery.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setInfo(result.teslimat_iade_sartlari);
```

Ve o endpoint `global_vars` tablosunu okuyor:

```php
api/src/Presentation/Controllers/ContentController.php:30
        echo json_encode(Database::getInstance()->getGlobalVars('teslimat_iade_sartlari'));
```

**Kanıt (bölüm 24 — yazma yolunun gerçekten yalnızca admin olduğu ve sunucu tarafında bir
temizleme bulunmadığı doğrulandı):**

```
$ grep -rn 'global_vars' api/ --include=*.php | grep -v vendor
api/functions/db.php:329   getGlobalVars — SELECT
api/functions/db.php:342   updateGlobalVars — UPDATE
$ api/admin/ajax/updategv.php:2   require_once __DIR__ . '/_guard.php';
   → yazma yolu admin oturumu + (POST ise) CSRF arkasında.

$ Sunucuda HTML temizleme var mı?
   InputSanitizer::text() strip_tags yapıyor — ama updategv.php InputSanitizer kullanmıyor
   (bu turda updategv.php gövdesi OKUNMADI — bkz. KAPSANMAYANLAR).
```

**Neden problem — ve neden CRITICAL değil:** Bu, zincirin bir halkası. HTML'i yazabilmek için
admin olmak gerekiyor; admin zaten sistemin en yetkili aktörü. Ancak:
- SEC-005 (admin session fixation) ve SEC-006 (admin brute force) bu zincirin **giriş kapısı**.
  Bir kez admin olan saldırgan, kalıcı bir XSS yükünü **tüm kullanıcılara** dağıtabilir — yani
  admin ele geçirmesi tek seferlik bir olay olmaktan çıkıp kullanıcı tarafına yayılıyor.
- Popup'lar hukuki metin gösteriyor; kullanıcılar bunlara güvenerek tıklıyor.

**Ek not:** Bu 6 dosyanın 6'sı da Tur 1'de **ölü kod** olarak tespit edilmişti (DEAD-004 —
`settings/page.jsx` bunları içine kopyalamış). Yani şu an render edilmiyor olabilirler.
`MesafeliSatisPopup` ve `TeslimatIadePopup`'ın canlı olduğu Tur 1'de doğrulandı (importer=1);
diğer dördü ölü. **Canlı olan ikisi için bulgu geçerli.**

**Impact:** Admin ele geçirilirse tüm kullanıcılara kalıcı XSS dağıtımı (oturum çalma,
sahte ödeme formu).

**Önerilen çözüm:** Sunucuda `updategv.php` yazarken HTML'i bir allowlist sanitizer'dan
geçirmek (HTMLPurifier vb.), veya istemcide `dangerouslySetInnerHTML` yerine yapılandırılmış
içerik render etmek. `TeslimatIadePopup.jsx:24-40` zaten yapılandırılmış bir
`termsOfSaleContent` dizisi tanımlıyor — o desene geçmek.

**Çözüm önceliği:** Orta.

---

### SEC-018

**Severity:** 🔵 LOW
**TÜR:** güvenlik + teknik borç

**Başlık:** Param POS üretim kimlik bilgileri (parola dâhil) frontend projesinin `.env` dosyasında duruyor ve hiçbir kod tarafından okunmuyor

**Dosya:** `web/.env`

**Kanıt (yalnızca anahtar adları — değerler kasıtlı olarak okunmadı ve buraya yazılmadı):**

```
$ sed 's/=.*/=<gizlendi>/' web/.env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<gizlendi>
PARAM_CLIENT_CODE=<gizlendi>
PARAM_CLIENT_USERNAME=<gizlendi>
PARAM_CLIENT_PASSWORD=<gizlendi>      ← ödeme ağ geçidi parolası
PARAM_GUID=<gizlendi>
PARAM_MARKETPLACE_GUID=<gizlendi>
PARAM_PAYMENT_WSDL=<gizlendi>
PARAM_MARKETPLACE_WSDL=<gizlendi>
PARAM_PAYMENT_SECURITY_TYPE=<gizlendi>
PARAM_REF_URL =<gizlendi>
PARAM_SUCCESS_URL =<gizlendi>
PARAM_FAIL_URL=<gizlendi>
```

**Neden problem:**
1. **Yanlış konum.** Ödeme sırları PHP backend'inin sorumluluğunda olmalı; `web/.env` Next.js'in
   env dosyası. `web/server.js` bu değişkenleri `process.env`'e yüklüyor — Node süreci hiç
   kullanmadığı POS kimlik bilgilerini bellekte taşıyor.
2. **Sızma yakınlığı.** Next.js'te `NEXT_PUBLIC_` önekli her değişken **istemci bundle'ına
   gömülür**. Şu an hiçbiri o önekle başlamıyor (kontrol edildi — yalnızca
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`), ama sırların bir `NEXT_PUBLIC_` yazım hatasına bir adım
   uzaklıkta durması yapısal bir risk.

**Dürüstlük notu:** Şu an istemciye **sızmıyor**. Bulgu potansiyel risk ve yanlış yerleşim
üzerine, gerçekleşmiş bir sızıntı üzerine değil. Bu yüzden LOW.

**Ek doğrulama:** README:274-280 bu değişkenleri hiçbir kodun okumadığını söylüyor; Tur 1'de bu
iddia doğrulanmamıştı ve Tur 7'ye bırakılmıştı — hâlâ orada.

**Önerilen çözüm:** POS sırlarını `api/.env`'e taşımak; `web/.env`'de yalnızca
`NEXT_PUBLIC_*`, `PHP_TARGET`, `NEXT_EXPORT` bırakmak. Sırlar bir kez paylaşılmış olabileceği
için rotate etmek.

**Çözüm önceliği:** Orta — özellikle Tur 3'ten önce.

---

### SEC-019

**Severity:** 🔵 LOW
**TÜR:** güvenlik + teknik borç

**Başlık:** `backup()` ve `restore()` kabuk komutunu string birleştirmeyle kuruyor ve DB parolasını komut satırına yazıyor

**Dosya:** `api/functions/db.php:434-449, 463-479`

**Problem:**

```php
api/functions/db.php:438-444
        $portSegment = strpos($this->host, ':') !== false ? '--port=' . explode(':', $this->host)[1] : '';
        $passwordSegment = !empty($this->password) ? "--password=$this->password" : '';
        $command = "mysqldump --user=$this->username $passwordSegment --host=" . explode(':', $this->host)[0] . " $portSegment $this->database -r \"$backupFile\" 2>&1";

        $output = [];
        $resultCode = null;
        exec($command, $output, $resultCode);
```

`$this->username`, `$this->password`, `$this->host`, `$this->database` — dördü de
`escapeshellarg()` olmadan komuta gömülüyor.

**Kanıt (bölüm 24 — girdinin kaynağı ve dolayısıyla gerçek istismar edilebilirliği izlendi):**

```
$ Bu dört değerin kaynağı: api/functions/db.php:30-68
  → ya $_ENV/getenv DB_* (ortam değişkeni), ya hard-coded dev değerleri.
  → HTTP isteğinden gelmiyor. Yani uzaktan doğrudan enjeksiyon YOK.
```

**Neden bu yine de bir bulgu:**
1. **Parola process listesinde.** `exec()` sırasında `ps aux` / `/proc/*/cmdline` çalıştıran
   **herhangi bir yerel kullanıcı** DB parolasını okuyabilir. mysqldump'ın kendisi bu yüzden
   "Using a password on the command line interface can be insecure" uyarısı basar. Paylaşımlı
   hosting'de gerçek bir risk.
2. **Kırılgan enjeksiyon yüzeyi.** `DB_PASS` içinde boşluk, `;`, `` ` `` veya `$()` bulunması
   komutu bozar veya çalıştırır. Ortam değişkeni "güvenilir" sayılsa da, parola üreticisinin
   ürettiği rastgele bir parolada `;` bulunması sıradan bir olay.
3. `2>&1` ile stderr yakalanıp `implode("\n", $output)` olarak istisna mesajına konuyor
   (satır 447) — ve `db_backup.php:26` o mesajı istemciye yazıyor (bkz. ERR-001).

**Impact:** Yerel parola ifşası; belirli parola karakterlerinde yedekleme/geri yükleme bozulması
veya komut çalıştırma.

**Önerilen çözüm:** `escapeshellarg()` her argüman için; parolayı komut satırı yerine
`MYSQL_PWD` ortam değişkeni veya geçici bir `--defaults-extra-file` ile vermek.

**Çözüm önceliği:** Düşük-Orta.

---

### SEC-020

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `api/assets/` yükleme dizini çalışma anında oluşturuluyor ama PHP çalıştırmayı engelleyen `.htaccess`'i yok — kardeş dizin `api/admin/uploads/` için bu koruma var

**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:358-366`

**Problem:**

```php
api/src/Presentation/Controllers/ChatbotController.php:357-366
            $ext = InputSanitizer::extensionForMime($mime);
            $uploadDir = __DIR__ . '/../../../assets/' . $dbCol;
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $uploadDir . '/' . $fileName)) {
                $data[$dbCol] = 'assets/' . $dbCol . '/' . $fileName;
            }
```

`__DIR__ . '/../../../assets/'` = `api/assets/` — yani PHP doküman kökünün içi ve
`web/server.js`'in `/assets` proxy kuralının hedefi.

**Kanıt (bölüm 24 — koruma başka bir yerde mi diye bakıldı; kardeş dizinde olduğu görüldü):**

```
$ ls api/assets
ls: cannot access 'api/assets': No such file or directory   ← henüz hiç yükleme yapılmamış

$ find api -name '.htaccess' -not -path '*/vendor/*'
api/admin/.htaccess            (yalnızca RewriteRule)
api/admin/uploads/.htaccess    (php_flag engine off + uzantı blokları)
                               ← api/assets/ için karşılığı YOK
```

`api/admin/uploads/.htaccess` bu tam riski tarif ediyor:

```apache
api/admin/uploads/.htaccess:1-6
# Uploads are user-supplied bytes served from a public path. Even though the
# endpoint now verifies content and names files itself, never let this
# directory hand anything to a script interpreter — a server configured to map
# extra extensions to PHP (AddHandler, an inherited .htaccess) would otherwise
# turn a stored file into code.
php_flag engine off
```

Aynı gerekçe `api/assets/` için de geçerli, ama koruma yok.

**Neden şu an sömürülemez (dürüstlük notu):** Dosya adı sunucuda üretiliyor
(`time() . '_' . bin2hex(random_bytes(8))`) ve uzantı **doğrulanmış MIME'dan** türetiliyor
(`extensionForMime` yalnızca `jpg|png|gif|webp|bin` döndürüyor). Yani istemci `.php` uzantılı
bir dosya yazdıramıyor. Bulgu, derinlemesine savunma eksikliği olarak LOW.

**Ek düzeltme — Tur 1'e:** Tur 1'de ARCH-014, `/assets/*` proxy kuralının "karşılığı olmayan ölü
bir routing kuralı" olduğunu söylemişti. **Bu yanlıştı.** `api/assets/` dizini
`handleImageUploads` tarafından ilk chatbot görseli yüklendiğinde oluşturuluyor ve `/assets/*`
kuralı onu servis ediyor. README'nin "that proxy rule is currently unused" ifadesi de aynı
nedenle eksik — kural kullanılmıyor değil, *henüz* kullanılmamış.

**Önerilen çözüm:** `api/assets/.htaccess`'i `api/admin/uploads/.htaccess`'in kopyası olarak
oluşturmak ve **versiyon kontrolüne almak** (bkz. Tur 1 ARCH-002 — kardeşi zaten takipsiz).

**Çözüm önceliği:** Düşük.

---

## 2. HATA YÖNETİMİ BULGULARI (denetim.md bölüm 12)

---

### ERR-001

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + bug

**Başlık:** Dört admin CRUD endpoint'i ve `db_backup.php` ham istisna mesajını istemciye yazıyor — PDO istisnaları SQL hata metnini ve sorgu parçalarını taşıyor

**Dosya:** `api/admin/ajax/create.php:56-61`, `read.php:57-62`, `update.php:64-69`,
`delete.php:41-46`, `db_backup.php:25-27`

**Problem:** Beş dosyada aynı kalıp:

```php
api/admin/ajax/read.php:57-62
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
```

```php
api/admin/ajax/db_backup.php:25-29
} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

echo json_encode($response);
```

**Kanıt (bölüm 24 — bu istisnaların gerçekten hassas metin taşıdığı, kaynağa gidilerek
doğrulandı):**

```
1) PDO istisnaları ham SQL hatası içeriyor mu?  → EVET:
api/functions/db.php:76-80
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
   → her SQL hatası PDOException; mesajı "SQLSTATE[42S22]: Column not found: 1054
     Unknown column 'x' in 'field list'" biçiminde, sütun/tablo adlarını ifşa eder.

2) Bağlantı hatası ne içeriyor?
api/functions/db.php:84-86
        } catch (PDOException $e) {
            throw new Exception('Veritabanı bağlantısı başarısız: ' . $e->getMessage());
        }
   → host, kullanıcı adı, veritabanı adı.

3) backup() hatası ne içeriyor?
api/functions/db.php:446-448
        if ($resultCode !== 0) {
            throw new Exception("Yedekleme sırasında hata oluştu: " . implode("\n", $output));
        }
   → mysqldump'ın 2>&1 ile yakalanan stderr'i (komut satırı parola uyarısı dâhil).

4) API tarafında bu doğru yapılıyor mu?  → EVET, karşılaştırma:
api/functions/bootstrap.php:97-101
    // Only leak the real exception message when APP_DEBUG=true is set (local
    // dev). Otherwise it can expose DB schema, file paths, and other internals
    $debug   = strtolower((string) ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: '')) === 'true';
    $message = $debug ? ('Sunucu hatası: ' . $e->getMessage()) : 'Sunucu hatası oluştu.';
```

Yani `APP_DEBUG` ayrımı `/api` tarafında var, admin tarafında **hiç yok**.

**Neden problem:** Admin oturumu arkasında olmak sızıntıyı sıfırlamıyor: (a) SEC-005/SEC-006 ile
admin ele geçirilebiliyor, (b) admin'in tarayıcısındaki herhangi bir XSS bu yanıtları okuyabiliyor,
(c) hata mesajları admin panelinde ekrana basılıyorsa vekil (proxy) logları ve tarayıcı geçmişi
üzerinden yayılıyor.

**Impact:** Veritabanı şema bilgisi, bağlantı ayrıntıları ve mysqldump çıktısının ifşası —
sonraki saldırı adımları için keşif bilgisi.

**Önerilen çözüm:** Admin tarafında da `bootstrap.php`'deki `APP_DEBUG` ayrımını uygulamak:
gerçek mesaj `error_log`'a, istemciye sabit bir metin.

**Çözüm önceliği:** Yüksek.

---

### ERR-002

**Severity:** 🟡 MEDIUM
**TÜR:** bug + güvenlik

**Başlık:** `bootstrap.php` yalnızca `set_exception_handler` kuruyor — PHP warning/notice'ları ve fatal error'lar JSON gövdesine karışıyor veya yanıtsız kalıyor

**Dosya:** `api/functions/bootstrap.php:93-108`

**Problem:**

```php
api/functions/bootstrap.php:91-101
// ─── Global exception → JSON response ────────────────────────────────────────

set_exception_handler(function (Throwable $e) {
    error_log('[uncaught] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());

    http_response_code(500);
    // Only leak the real exception message when APP_DEBUG=true is set (local
    // dev). Otherwise it can expose DB schema, file paths, and other internals
    // to any client that triggers a 500 — full detail is still in error_log.
    $debug   = strtolower((string) ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: '')) === 'true';
    $message = $debug ? ('Sunucu hatası: ' . $e->getMessage()) : 'Sunucu hatası oluştu.';
```

**Kanıt (bölüm 24 — eksik olan üç mekanizma tek tek arandı):**

```
$ grep -rn 'set_error_handler\|ini_set(.display_errors\|register_shutdown_function\|error_reporting' \
      api/functions/ api/src/ --include=*.php
api/functions/util.php:52:  register_shutdown_function(...)   ← yalnızca exit mesajı loglar, hata yakalamaz

→ set_error_handler:            YOK
→ ini_set('display_errors',0):  YOK
→ fatal error için shutdown:    YOK
```

Karşılaştırma — **admin paneli bunu yapıyor**, API yapmıyor:

```php
api/admin/index.php:8-11 (yorum)
// The admin panel turned display_errors on unconditionally, regardless of
// APP_DEBUG — so in production a PHP notice or warning would be printed into
// the page (and, for anything that emits JSON, into the response body). Honour
// the same flag the API's exception handler uses; errors are logged either way.
```

Yani sorun tanınmış ve **admin tarafında** çözülmüş; `/api` tarafında çözülmemiş.

**Neden problem:** `php -S` varsayılan olarak `display_errors=On` ile çalışır ve pek çok paylaşımlı
hosting de öyle. Sonuçlar:
1. **JSON bozulması.** Bir `Undefined array key` uyarısı yanıtın **başına** düz metin olarak
   basılır. Frontend'in tamamı `JSON.parse(await res.text())` yapıyor (Tur 1: 51 dosyada 156
   çıplak `fetch`) → `SyntaxError`, gerçek hata görünmez.
2. **Bilgi sızıntısı.** Uyarı metni tam dosya yolunu ve satırı içerir — `APP_DEBUG` ayrımı
   yalnızca *istisnalar* için var, uyarılar o kapıdan geçmiyor.
3. **Fatal error'da yanıt yok.** Bellek tükenmesi veya `require` hatası `Throwable` üretmez;
   `set_exception_handler` devreye girmez, `register_shutdown_function` yok → istemci boş gövde
   veya yarım HTML alır.

**Somut tetikleyiciler (bu turda okunan kodda bulunanlar):**

```php
api/admin/ajax/db_backup.php:16    if ($_GET['mode'] == 'backup') {
   → mode parametresi yoksa "Undefined array key 'mode'" uyarısı

api/admin/ajax/readenv.php:47      [$envKey, $envValue] = array_map('trim', explode('=', $line, 2));
   → .env'de '=' içermeyen bir satır varsa "Undefined array key 1" uyarısı
```

**Impact:** Hata teşhisinin imkânsızlaşması; dosya yolu sızıntısı; sessiz 500'ler.

**Önerilen çözüm:** `bootstrap.php`'ye üç ekleme: `ini_set('display_errors', $debug ? '1' : '0')`,
`set_error_handler` (uyarıları `ErrorException`'a çevirip mevcut handler'a yönlendirmek), ve
`register_shutdown_function` + `error_get_last()` ile fatal error'ları JSON'a çevirmek.

**Çözüm önceliği:** Orta-Yüksek.

---

### ERR-003

**Severity:** 🟡 MEDIUM
**TÜR:** bug + doküman

**Başlık:** 11 controller'da 28 ayrı `echo json_encode` çağrısı `JsonResponse` zarfını atlıyor; README bunlardan yalnızca dördünü belgeliyor

**Dosya:** 11 controller — tam liste aşağıda

**Problem:**

```
$ grep -rn 'echo json_encode' api/src/Presentation/Controllers/*.php | wc -l
28

AuthController.php:106       ['authenticated' => false]            ← 'success' anahtarı YOK
AuthController.php:196       $result (sendEmail stub'ının dönüşü)  ← şekli bilinmiyor
ChatController.php:88        $result (ham satır)                   ← 'success' YOK
ChatController.php:166       ['success'=>true,'message','results']
ChatbotController.php:89     [...]
ChatbotController.php:106    $repo->getPublishedV2(...)            ← çıplak dizi
ContactController.php:26     $result
ContentController.php:5,10,15,20,25,30,35,48                       ← 8 adet, hepsi çıplak
MarketplaceController.php:419,428
MessageController.php:36
NoteController.php:67
SellerController.php:41,105,117,125,135,149,186                    ← 7 adet
UserController.php:158
WalletController.php:56
```

**Kanıt (bölüm 24 — README'nin bunu ne kadar kapsadığı karşılaştırıldı):**

```
README.md:405-410 şunları belgeliyor:
  - ContentController metotları              ✓ (8 adet — doğru)
  - ChatController::getConversation           ✓ (satır 88 — doğru)
  - /api/auth/sessioncheck.php                ✓ (satır 106 — doğru)
  - UserController::getProfilePhoto           ✓ (satır 158 — doğru)

README'nin BELGELEMEDİĞİ, bu turda tespit edilenler (16 adet):
  ChatController:166, ChatbotController:89,106, ContactController:26,
  MarketplaceController:419,428, MessageController:36, NoteController:67,
  SellerController:41,105,117,125,135,149,186, WalletController:56,
  AuthController:196
```

**Neden problem:**
1. **HTTP durum kodu kaybı.** `JsonResponse::success()` `http_response_code()` çağırıyor;
   `echo json_encode` çağırmıyor. Bu 28 yol her zaman **200** dönüyor.
2. **`error_code` kaybı.** `AppConfig::ERR_*` sözleşmesi bu yollarda yok.
3. **Şekil belirsizliği.** `ChatbotController:106` çıplak bir dizi, `ChatController:88` çıplak bir
   nesne döndürüyor. İstemci `result.success` kontrolü yapamıyor — Tur 1'de tespit edilen
   156 çıplak `fetch`'in her biri kendi şekil varsayımını yapmak zorunda.
4. **Dokümantasyon eksik.** README, bu istisnaların 4'ünü "bilinçli istisna" diye listeleyip
   16'sını atlıyor; okuyan kişi zarfın büyük ölçüde tutarlı olduğunu sanıyor.

**Impact:** İstemci tarafında tutarsız hata işleme; Tur 4'te (bölüm 11, API sözleşme denetimi)
ortaya çıkacak uyumsuzlukların yapısal kaynağı.

**Önerilen çözüm:** `JsonResponse`'a gerçekten ihtiyaç duyulan iki şekil için açık metot eklemek
(`raw()` ve `successBare()`), 28 çağrıyı onlardan geçirmek; README'yi güncellemek.

**Çözüm önceliği:** Orta. Ayrıntılı sözleşme karşılaştırması → **Tur 4 (bölüm 11)**.

---

### ERR-004

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Admin AJAX endpoint'lerinin tamamı hata durumunda HTTP 200 dönüyor — durum kodu yalnızca yetki hatasında doğru

**Dosya:** `api/admin/ajax/{create,read,update,delete,giris,readenv,db_backup}.php`

**Problem:** Yetkisiz erişimde durum kodu doğru veriliyor:

```php
api/admin/ajax/create.php:3-7
if (empty($_SESSION['admin'])) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Yetkisiz erişim."]);
    exit;
}
```

Ama **iş mantığı** hatalarının hiçbirinde verilmiyor:

```php
api/admin/ajax/create.php:16-22
    if (!$table || !$data || !is_array($data)) {
        echo json_encode([
            "success" => false,
            "message" => "Table or data not specified!"
        ]);
        exit;
    }
```

```php
api/admin/ajax/giris.php:54-59
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Geçersiz kullanıcı adı veya şifre"
    ]);
    exit;
}
```

**Kanıt:**

```
$ grep -c 'http_response_code' api/admin/ajax/create.php api/admin/ajax/read.php \
      api/admin/ajax/update.php api/admin/ajax/delete.php api/admin/ajax/giris.php
create.php:1     read.php:1     update.php:1     delete.php:1     giris.php:0
   → her dosyada tek çağrı (403), giris.php'de hiç yok.
$ grep -c 'echo json_encode' api/admin/ajax/create.php
4     → 4 yanıt yolu, 1'inde durum kodu var
```

**Ek tutarsızlık — iki farklı zarf:** Admin tarafı iki ayrı şema kullanıyor:
`{"success": bool, "message":...}` (create/read/update/delete) ve
`{"status": "error"|"success", "message":...}` (giris/readenv/db_backup). `_guard.php:28` ikisini
birden gönderiyor (`'success' => false, 'status' => 'error'`) — yani belirsizlik biliniyor ve
her ikisi de doldurularak geçiştirilmiş.

**Impact:** İstemci `res.ok` ile hata ayırt edemiyor; ara katmanlar (proxy, monitoring) başarısız
istekleri başarılı sayıyor; başarısız admin girişleri 200 döndüğü için kaba kuvvet tespiti de
zorlaşıyor (SEC-006 ile birleşince).

**Önerilen çözüm:** Doğrulama hatalarında 400, kimlik doğrulama hatasında 401, bulunamayanda 404.
Tek bir zarf şemasına inmek.

**Çözüm önceliği:** Orta.

---

### ERR-005

**Severity:** 🔵 LOW
**TÜR:** bug + teknik borç

**Başlık:** `PDO::ERRMODE_EXCEPTION` açıkken `if ($stmt->execute())` kalıbı kullanılıyor — `else` dalları hiçbir zaman çalışmıyor, biri de mevcut olmayan bir özelliğe erişiyor

**Dosya:** `api/src/Presentation/Controllers/TrainingController.php:31-35`, `api/functions/db.php:426-430`

**Problem:**

```php
api/src/Presentation/Controllers/TrainingController.php:31-35
        if ($stmt->execute()) {
            JsonResponse::success(['message' => 'Parça başarıyla eklendi.']);
        } else {
            JsonResponse::error('SQL hatası oluştu.', 500, AppConfig::ERR_SERVER);
        }
```

`ERRMODE_EXCEPTION` altında `execute()` başarısızlıkta `false` **döndürmez**, `PDOException`
fırlatır. `else` dalı ulaşılamaz.

Aynı kalıp `truncate()`'te daha kötü — ulaşılamaz dal **var olmayan bir özelliğe** erişiyor:

```php
api/functions/db.php:423-431
    public function truncate($table)
    {
        $query = "TRUNCATE TABLE `$table`";
        if ($this->conn->query($query) === TRUE) {
            return true;
        } else {
            throw new Exception('Tabloyu temizleme işlemi başarısız: ' . $this->conn->error);
        }
    }
```

`$this->conn` bir `PDO` nesnesi; `PDO`'nun `->error` özelliği **yok** (o mysqli'nin API'si).
PHP 8'de tanımsız özelliğe erişim uyarı üretir.

**Kanıt:**

```
$ grep -n 'ATTR_ERRMODE' api/functions/db.php
77:            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,

$ grep -rn '\$this->conn->error\|->error;' api/functions/db.php
429:            throw new Exception('Tabloyu temizleme işlemi başarısız: ' . $this->conn->error);
```

**Dürüstlük notu:** `truncate()` hiçbir yerden çağrılmıyor (Tur 1 DEAD-007'de doğrulandı), yani
şu an tetiklenemiyor. LOW verilmesinin nedeni bu. Ama bulgu "ölü kod" değil, **"hata yolu var
sanılıyor, aslında yok"** — bölüm 12'nin "swallowed exceptions / logging eksikliği" maddesi.

**Impact:** Sahte güvence: kodu okuyan biri hatanın ele alındığını sanıyor; gerçekte hata global
handler'a düşüp jenerik 500 üretiyor.

**Önerilen çözüm:** `execute()` çağrılarını `try/catch (PDOException)` ile sarmak veya dönüş
değeri kontrolünü tamamen kaldırıp global handler'a bırakmak. `$this->conn->error`'ı
`$this->conn->errorInfo()` ile değiştirmek.

**Çözüm önceliği:** Düşük.

---

### ERR-006

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `restore()` `exec()` sonucunu hiç kontrol etmiyor ve yedek yoksa JSON yanıtının içine düz metin basıp süreci sonlandırıyor

**Dosya:** `api/functions/db.php:463-479`, `api/admin/ajax/db_backup.php:19-21`

**Problem:**

```php
api/functions/db.php:470-478
        } else {
            die("Hata: Hiç yedek bulunamadı!");
        }

        $portSegment = strpos($this->host, ':') !== false ? '--port=' . explode(':', $this->host)[1] : '';
        $passwordSegment = !empty($this->password) ? "--password=$this->password" : '';
        $command = "mysql --user=$this->username $passwordSegment --host=" . explode(':', $this->host)[0] . " $portSegment $this->database < \"$backupFile\"";
        exec($command);
```

Çağıran taraf koşulsuz "başarılı" diyor:

```php
api/admin/ajax/db_backup.php:19-21
    } elseif ($_GET['mode'] == 'restore') {
        $database->restore();
        $response = ["status" => "success", "message" => "Veritabanı başarıyla geri yüklendi."];
```

**Kanıt (kardeş metotla karşılaştırma — `backup()` doğrusunu yapıyor):**

```php
api/functions/db.php:442-448
        $output = [];
        $resultCode = null;
        exec($command, $output, $resultCode);

        if ($resultCode !== 0) {
            throw new Exception("Yedekleme sırasında hata oluştu: " . implode("\n", $output));
        }
```

`backup()` çıkış kodunu kontrol ediyor, `restore()` etmiyor. Aynı sınıfta, aynı desende, biri
yapıyor diğeri yapmıyor.

**Neden problem:** İki ayrı sessiz başarısızlık:
1. `mysql` komutu başarısız olsa bile (yanlış parola, bozuk dump, `mysql` PATH'te yok) endpoint
   *"Veritabanı başarıyla geri yüklendi."* diyor. Admin veritabanının geri yüklendiğini sanıyor.
   **Yıkıcı bir işlemde yanlış başarı raporu**, hiç çalışmamasından daha tehlikeli.
2. `die("Hata: Hiç yedek bulunamadı!")` — `Content-Type: application/json` gönderilmiş bir yanıta
   düz metin basıyor. İstemcinin `JSON.parse`'ı patlıyor.

**Impact:** Yanlış başarı raporu; bozuk yanıt gövdesi.

**Önerilen çözüm:** `restore()`'u `backup()` ile aynı hâle getirmek: `exec($command, $output, $rc)`
+ `$rc !== 0` kontrolü + istisna. `die()` yerine istisna fırlatmak.

**Çözüm önceliği:** Düşük — ama SEC-007 düzeltilirken aynı dosyaya dokunulacağı için birlikte.

---

### ERR-007

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `updateConversation` `rowCount()` sonucunu başarı ölçütü sayıyor — aynı değerle güncelleme "Güncelleme başarısız!" hatası veriyor

**Dosya:** `api/src/Presentation/Controllers/ChatController.php:107-113`

**Problem:**

```php
api/src/Presentation/Controllers/ChatController.php:107-113
        $updated = $db->update('chatbot_conversations', $data, 'id = ?', [$id]);

        if ($updated) {
            JsonResponse::success(['message' => 'Sohbet başarıyla güncellendi!', 'id' => $id]);
        } else {
            JsonResponse::error('Güncelleme başarısız!', 400);
        }
```

`Database::update()` `$stmt->rowCount()` döndürüyor (db.php:411). MySQL, değer değişmediğinde
0 etkilenen satır bildirir. Yani bir sohbet mevcut adıyla yeniden adlandırıldığında hata dönüyor.

**Kanıt (bölüm 24 — aynı ekibin aynı tuzağı BAŞKA bir yerde tanıyıp çözdüğü doğrulandı):**

```php
api/src/Presentation/Controllers/MarketplaceController.php:392-402
        if ($affected === 0) {
            // MySQL reports 0 affected rows both for "no such row" and for an
            // update that changed nothing, so confirm which one it was before
            // calling it an error.
            $exists = Database::getInstance()->selectSingle(
                'id FROM user_subscriptions WHERE id = ? AND user_id = ?',
                [$id, $userId]
            );
            if (!$exists) {
                JsonResponse::error('Abonelik bulunamadı.', 404, AppConfig::ERR_NOT_FOUND);
            }
        }
```

`updateSubscription` tam olarak bu ayrımı yapıyor; `updateConversation` yapmıyor.

**Impact:** Kullanıcıya yanlış hata mesajı; istemci tarafında gereksiz yeniden deneme.

**Önerilen çözüm:** `updateSubscription`'daki deseni uygulamak — sahiplik kontrolü zaten satır
103'te yapıldığı için satır varlığı biliniyor; `rowCount()`'u başarı ölçütü olarak kullanmayı
tamamen bırakmak yeterli.

**Çözüm önceliği:** Düşük.

---

### ERR-008

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** Boş `$data` dizisi `Database::update()`'e ulaştığında geçersiz SQL üretiliyor → 500

**Dosya:** `api/functions/db.php:396-409`, `api/src/Presentation/Controllers/ChatController.php:99-107`,
`api/src/Presentation/Controllers/WalletController.php:156-163`

**Problem:**

```php
api/functions/db.php:396-409
        $setPart = implode(', ', array_map(fn($key) => "`$key` = ?", array_keys($data)));
        ...
        $sql = "UPDATE `$table` SET $setPart WHERE " . str_replace('?', '?', $where);

        $stmt = $this->executePreparedStatement($sql, $all_params);
```

`$data === []` ise `$setPart === ''` → `UPDATE \`t\` SET  WHERE id = ?` → sözdizimi hatası.

**Kanıt (bölüm 24 — hangi çağıranların boş dizi gönderebildiği tek tek kontrol edildi):**

```
KORUMALI  MarketplaceController.php:384-386
              if ($data === []) { JsonResponse::error('Güncellenecek alan yok.', 400, ...); }

KORUMASIZ ChatController.php:98-107  (updateConversation)
              $id = InputSanitizer::positiveInt($data['id']);
              unset($data['id'], $data['user_id']);
              ...
              $updated = $db->update('chatbot_conversations', $data, 'id = ?', [$id]);
              → data={"id":5} gönderilirse $data boş kalır

KORUMASIZ WalletController.php:156-163  (saveBankInfo)
              $filtered = array_intersect_key($data, array_flip($allowed));
              ...
              $db->update('banka_bilgileri', $filtered, 'user_id = ?', [$userId]);
              → beyaz listede olmayan anahtarlarla gönderilirse $filtered boş kalır
```

Yani `updateSubscription` bu tuzağı tanımış ve kontrol eklemiş; `updateConversation` ve
`saveBankInfo` eklememış.

**Ek gözlem:** `str_replace('?', '?', $where)` (satır 407 ve 416) hiçbir şey yapmıyor —
`?` karakterini `?` ile değiştiriyor. Yanındaki yorum ("WHERE kısmındaki ?'leri koru") bir
işlem yapıldığını ima ediyor; yapılmıyor.

**Impact:** Kimlik doğrulanmış kullanıcının tetikleyebildiği 500. Veri kaybı yok, ama
`bootstrap.php`'nin jenerik hata mesajı nedeniyle teşhis edilemiyor.

**Önerilen çözüm:** `Database::update()`'in başına `if ($data === []) throw new Exception(...)`
eklemek — böylece koruma tek yerde olur, her çağıranın hatırlamasına gerek kalmaz.

**Çözüm önceliği:** Düşük.

---

### ERR-009

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `csrf_check()` dizi girdisinde `TypeError` fırlatıyor ve admin AJAX tarafında bunu yakalayacak bir handler yok

**Dosya:** `api/functions/util.php:25-31`, `api/admin/ajax/_guard.php:33`

**Problem:**

```php
api/functions/util.php:25-31
function csrf_check($csrf_token)
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $csrf_token);
}
```

```php
api/admin/ajax/_guard.php:33
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
```

`csrf_token[]=x` biçiminde gönderilirse `$_POST['csrf_token']` bir **dizi** olur. `hash_equals()`
PHP 8'de dizi argümanında `TypeError` fırlatır.

**Kanıt (bölüm 24 — admin tarafında bir istisna yakalayıcı olup olmadığı arandı):**

```
$ grep -rn 'set_exception_handler' api/admin --include=*.php
(çıktı yok)

$ api/admin/ajax/_guard.php require ettikleri:
  require_once __DIR__ . '/../../functions/util.php';       ← handler kurmuyor
  require_once __DIR__ . '/../functions/session.php';       ← handler kurmuyor
  (bootstrap.php DAHİL EDİLMİYOR — global handler yok)
```

Yani `TypeError` yakalanmadan yükselir. `display_errors` açıksa (bkz. ERR-002) **tam yığın izi**
(dosya yolları dâhil) yanıta basılır.

**Nasıl tetiklenebilir:** `POST /admin/ajax/read.php` gövdesinde `csrf_token[]=a&table=plans`.

**Impact:** Kimlik doğrulaması olmayan bir istekle (guard'ın CSRF adımına kadar geliniyor,
ama admin kontrolü satır 25'te önce yapılıyor — yani **admin oturumu gerekiyor**) yığın izi
sızıntısı. Admin gerektirdiği için LOW.

**Önerilen çözüm:** `$token`'ı `is_string()` ile kontrol etmek veya `(string)` cast'lemek;
admin tarafına da bir `set_exception_handler` eklemek.

**Çözüm önceliği:** Düşük.

---

### ERR-010

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Rate limit aşımı `429` durum koduyla ama `VALIDATION_ERROR` hata koduyla dönüyor — `AppConfig`'de rate limit için bir sabit yok

**Dosya:** `api/functions/rate_limit.php:29`

**Problem:**

```php
api/functions/rate_limit.php:28-30
    if ((int) $row['attempts'] >= $maxAttempts) {
        JsonResponse::error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.', 429, AppConfig::ERR_VALIDATION);
    }
```

**Kanıt:**

```
$ grep -n 'ERR_' api/src/Shared/Constants/AppConfig.php | grep -oE 'ERR_[A-Z_]+' | sort -u
ERR_AUTH_REQUIRED  ERR_DUPLICATE  ERR_LIMIT_REACHED  ERR_NOT_FOUND
ERR_PAYMENT  ERR_PERMISSION  ERR_SELLER_INACTIVE  ERR_SERVER  ERR_VALIDATION
   → ERR_RATE_LIMIT yok. ERR_LIMIT_REACHED var ama o iş mantığı limiti için
     kullanılıyor (bot sayısı, mesaj hakkı) — bkz. ChatbotController:47,187.
```

**Neden problem:** İstemci `error_code`'a göre dallanıyorsa (README:406-409 bu sözleşmeyi
belgeliyor), "geçersiz veri" ile "çok hızlısın" ayrımını yapamıyor. İkisi tamamen farklı
kullanıcı deneyimi gerektiriyor: biri formu düzeltmeyi, diğeri beklemeyi.

**Impact:** İstemcide yanlış hata mesajı; otomatik yeniden deneme mantığı kurulamıyor.

**Önerilen çözüm:** `AppConfig`'e `ERR_RATE_LIMIT = 'RATE_LIMIT'` eklemek ve burada kullanmak.
Ayrıca `Retry-After` başlığı göndermek.

**Çözüm önceliği:** Düşük.

---

### ERR-011

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `loginGoogle` `verifyIdToken()` çağrısını try/catch'e almıyor — bozuk token 401 yerine 500 üretiyor

**Dosya:** `api/src/Presentation/Controllers/AuthController.php:121-126`

**Problem:**

```php
api/src/Presentation/Controllers/AuthController.php:121-126
        $client = new Google_Client(['client_id' => AppConfig::googleClientId()]);
        $payload = $client->verifyIdToken($idToken);

        if (!$payload) {
            JsonResponse::error('Geçersiz Google token.', 401, AppConfig::ERR_AUTH_REQUIRED);
        }
```

Kod yalnızca `false` dönüşünü ele alıyor. `google/apiclient`'ın `verifyIdToken()`'ı biçimsel
olarak bozuk bir JWT'de (`UnexpectedValueException`, `InvalidArgumentException`) veya JWK
uç noktasına ulaşılamadığında **istisna fırlatır**.

**Kanıt (bölüm 24 — bir üst katmanda yakalanıp yakalanmadığı kontrol edildi):**

```
$ AuthController.php:128-133 — try/catch var ama SADECE use case'i sarıyor:
        try {
            $useCase = new GoogleLoginUseCase(new UserRepository());
            $userId  = $useCase->execute(...);
        } catch (AppException $e) {
            JsonResponse::fromException($e);
        }
   → verifyIdToken (satır 122) bu bloğun DIŞINDA.
   → üstelik catch yalnızca AppException yakalıyor, genel Throwable değil.
```

Sonuç: istisna `bootstrap.php:93`'teki global handler'a düşüyor → `500` +
"Sunucu hatası oluştu.".

**Ek gözlem:** `AppConfig::googleClientId()` yapılandırılmamışsa boş string dönüyor
(`AppConfig.php:100`) — `new Google_Client(['client_id' => ''])` ile doğrulama anlamsız hâle
gelir. Bu durumda da açık bir hata mesajı yerine belirsiz bir başarısızlık oluşuyor.

**Impact:** İstemci "sunucu bozuk" sanıyor, oysa sorun gönderdiği token. Yanlış durum kodu
istemcinin yeniden giriş akışını tetiklemesini engelliyor.

**Önerilen çözüm:** `verifyIdToken()`'ı `try/catch (\Throwable)` ile sarıp 401 döndürmek;
`googleClientId()` boşsa 500 + açık mesajla erken çıkmak.

**Çözüm önceliği:** Düşük.

---

### ERR-012

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `generateReply` upstream hata gövdesini `error_log`'a yazıyor — kendi yorumu o gövdenin API anahtarını içerebileceğini söylüyor

**Dosya:** `api/src/Presentation/Controllers/ChatController.php:253-269`

**Problem:**

```php
api/src/Presentation/Controllers/ChatController.php:253-269
        if ($curlError !== '' || $httpStatus === 0 || $httpStatus >= 400) {
            // Log the real upstream reason (suspended key, quota, bad model
            // name, network) — without this the failure was undiagnosable.
            error_log(sprintf(
                '[generatereply] Gemini call failed: http=%d curl=%s body=%s',
                $httpStatus,
                $curlError !== '' ? $curlError : '-',
                $errorBody !== '' ? mb_substr($errorBody, 0, 500) : '-'
            ));

            // Never leak the upstream body (it can echo the API key back) —
            // send a stable code the client maps to its own wording.
            echo "event: error\n";
            echo 'data: ' . json_encode(
                ['error' => ['code' => $httpStatus ?: 502, 'status' => 'UPSTREAM_ERROR']],
```

Kodun kendi yorumu (satır 263): *"it can echo the API key back"*. İstemciye gönderilmiyor —
doğru. Ama **aynı gövde bir satır yukarıda `error_log`'a yazılıyor.**

**Neden bu bir bulgu:** Tek başına düşük riskli olurdu — ancak SEC-001 bu turda
`api/admin/error_log` dosyasının HTTP üzerinden okunabildiğini gösteriyor. `error_log`'un
nereye yazdığı php.ini'ye bağlı; `api/api/error_log` ve `api/admin/error_log` dosyalarının
diskte bulunması, PHP'nin çalışma dizinine yazdığını gösteriyor. Yani **iki bulgu birleşince**
"anahtar loga düşer" + "log web'den okunabilir" zinciri oluşuyor.

**Impact:** SEC-001 ile birleşerek API anahtarı sızıntısı için ikinci bir yol.

**Önerilen çözüm:** `$errorBody`'yi loglamadan önce anahtar desenini maskelemek
(`preg_replace('/key=[\w-]+/', 'key=***', ...)`), veya yalnızca upstream'in `error.status`
alanını ayrıştırıp loglamak.

**Çözüm önceliği:** Düşük — ama SEC-001 çözülene kadar dikkate alınmalı.

---

## 3. ELENEN FALSE POSITIVE'LER (denetim.md bölüm 24)

Aşağıdakiler bulgu adayıydı; arama sonucunda **gerçek olmadıkları** görüldü ve raporlanmadı.
Bir sonraki denetimde tekrar aday olmamaları için gerekçeleriyle kayda geçiyor.

| Aday | Neden bulgu değil | Doğrulama |
| --- | --- | --- |
| Admin CRUD'da SQL enjeksiyonu (`$table`, `$where`, `$columns` istemciden) | Üç allowlist guard'ı **gerçekten çağrılıyor** — dört endpoint'in dördünde de | `create.php:33`, `read.php:36-40`, `update.php:35-36`, `delete.php:34-35` |
| `assertSafeWhereFragment` blocklist'tir, atlatılabilir | Blocklist **değil**, allowlist grameri: yalnızca `<col> <op> <int>`, `FIND_IN_SET('<word>', col) > 0` ve `ORDER BY <col>` kabul ediliyor; alt sorgu/fonksiyon çağrısı/serbest string literali giremiyor | `db.php:214-245`; yorum 193-213 eski blocklist'in neden atlatıldığını da anlatıyor |
| Remember-me token'ının süresi kontrol edilmiyor | Kontrol **SQL'de var** | `UserRepository::findByRememberToken` → `WHERE selector = ? AND expiry > NOW()` |
| `marketplace/buychatbot.php` — sahiplik transferi zafiyeti | Endpoint **devre dışı bırakılmış** | `MarketplaceController.php:155-157` → `JsonResponse::error('Bu işlem artık desteklenmiyor.', 410, ...)` |
| `createnotification.php` — istemciden hedef kullanıcı seçilebilir | Hedef **sunucuda zorlanıyor** | `NotificationController::createNotification` → `$userId = AuthMiddleware::requireAuth();` + yorum 3-5 |
| `ReactMarkdown` ile AI çıktısında XSS | react-markdown 10.1.0 varsayılan olarak ham HTML render **etmiyor** (`rehype-raw` yok) ve `javascript:` URI'larını `defaultUrlTransform` ile temizliyor | `web/package-lock.json` → `react-markdown 10.1.0`; `chat/page.jsx:15,742,779` — hiçbir rehype eklentisi yok |
| `SocialController`, `WalletController` vb. yazma metotlarında CSRF açığı (POST zorlaması yok) | `require_method` içermeyen metotların **tamamı okuma** metodu | `SocialController`: 11 metodun 11'i getter (`didUserLike`, `getBotLists`, …); `WalletController`: 7'sinin 7'si getter |
| `readpdf.php` kimlik doğrulaması ve boyut sınırı olmadan çalışıyor | İkisi de **eklenmiş** | `TrainingController.php:88-106` → `requireAuth()`, `checkRateLimit(...,10,300)`, `MAX_PDF_BYTES = 15MB` |
| `admin/ajax/upload.php` uzantı tabanlı doğrulama yapıyor | Magic-byte doğrulaması + sunucu tarafı isimlendirme **yapılmış** | `upload.php:84-88, 110` |
| `withdraw()` bakiye kontrolünde yarış koşulu | `GET_LOCK` + transaction **var** | `WalletController.php:96-124` |
| `saveBankInfo` mass assignment | Sütun beyaz listesi **var** | `WalletController.php:150-156` |

---

## 4. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**Kimlik doğrulama (authentication).** Kullanıcı tarafı iyi düşünülmüş: bcrypt cost 12,
enumerasyona karşı aynılaştırılmış login mesajları, iki katmanlı rate limit, selector/validator
ayrımlı remember-me, SHA-256 hash'li ve MySQL `NOW()` ile hesaplanmış 15 dakikalık sıfırlama
kodu. Bunların çoğu koda sonradan, gerekçesi yorumla birlikte eklenmiş — yani ekip bu tehditleri
bilinçli olarak ele almış. Sorun **kapsam tutarsızlığı**: aynı korumaların admin girişine hiç
uygulanmamış olması (SEC-005, SEC-006), remember-me geri yükleme yoluna uygulanmamış olması
(SEC-009), ve parola sıfırlama yolunun hem enumerasyona (SEC-012) hem politikasızlığa
(SEC-011) açık kalması. Tekrar eden kalıp şu: **doğru çözüm kod tabanında mevcut, ama yalnızca
ilk keşfedildiği yola uygulanmış.**

**Yetkilendirme (authorization).** IDOR tarafı gerçekten iyi. `updateconversation`,
`deleteconversation`, `update_training_chunk`, `deletecart`, `deletesubscription` — denetim.md'nin
örnek olarak saydığı endpoint'lerin hepsinde sahiplik kontrolü var ve her birinin yanında
"önceden yoktu" diyen bir yorum duruyor. `getTrainingChunks` erişim politikasını
`userHasAccess` ile chat sayfasıyla ortaklaştırmış. Ama yetkilendirme **satır düzeyinde** durup
**alan düzeyinde** devam etmiyor: doğru satıra eriştiği doğrulanan kullanıcı, o satırın her
sütununu yazabiliyor (SEC-002, SEC-003, SEC-014). Bu, IDOR'dan daha sinsi bir sınıf, çünkü
"sahiplik kontrolü var mı?" sorusuna bakan bir denetim onu ıskalıyor. En ağır sonucu SEC-002:
kullanıcının kendi abonelik satırını 2099'a uzatabilmesi.

**Enjeksiyon.** Bu turun en olumlu bulgusu. Legacy admin CRUD motoru — istemciden tablo adı, ham
WHERE parçası ve SELECT sütun listesi alan, kâğıt üzerinde felaket bir tasarım — üç ayrı allowlist
ile kapatılmış, ve `db.php:193-298`'deki yorumlar önceki blocklist'in tam olarak **nasıl**
atlatıldığını (skaler alt sorgu ile `adminler.sifre` okuma) belgeliyor. Bu, gerçek bir istismarın
ardından yazılmış bir düzeltme; kalitesi de öyle. `assertSafeColumnName` de `insert`/`update`
sütun listelerini kapatıyor. Kalan enjeksiyon yüzeyi kabuk tarafında: `backup()`/`restore()`
`escapeshellarg` kullanmıyor (SEC-019), ama girdi HTTP'den değil ortamdan geldiği için uzaktan
sömürülebilir değil.

**Sırlar.** En zayıf alan. Üç ayrı sorun üst üste biniyor: DB parolası kaynak kodda ve git
geçmişinde, üstelik `.env`'de `DB_*` tanımlı olmadığı için **şu an aktif olan yol** (SEC-008);
POS üretim kimlik bilgileri frontend'in env dosyasında (SEC-018); ve hepsinden ağırı, `.env`
dosyalarının ve 1,59 MB'lık canlı DB yedeğinin HTTP üzerinden indirilebilir olması (SEC-001).
Sonuncusu tek başına diğer tüm kimlik doğrulama çalışmasını anlamsızlaştırıyor: parola hash'lerini
korumak için harcanan emek, hash'lerin bulunduğu dump'ın kimlik doğrulamasız indirilebildiği bir
kurulumda karşılıksız kalıyor.

**Hata yönetimi.** İki uçlu. `/api` tarafında `APP_DEBUG` ayrımı, `error_log`'a tam detay,
istemciye jenerik mesaj — doğru desen. Admin tarafında hiçbiri yok: ham `$e->getMessage()`
istemciye gidiyor (ERR-001), her hata HTTP 200 (ERR-004), istisna yakalayıcı yok (ERR-009).
Her iki tarafta ortak eksik: `set_error_handler` ve fatal-error kapanış kancası hiç kurulmamış
(ERR-002), yani PHP uyarıları JSON gövdelerine karışabiliyor — ve frontend'in tamamı
`JSON.parse` ile çalıştığından bu, hata mesajını tamamen görünmez kılıyor. Zarf tutarlılığı da
düşük: 28 noktada `JsonResponse` atlanıyor (ERR-003) ve README bunun yalnızca dörtte birini
belgeliyor.

**Genel örüntü.** Bu kod tabanında güvenlik bilgisi eksik değil — aksine, düzeltmelerin
yanındaki yorumlar çoğu ticari projeden daha iyi. Eksik olan **yayılım**: bir tehdit
keşfedildiğinde çözüm yalnızca keşfedildiği endpoint'e uygulanıyor, aynı sınıftaki kardeşlerine
uygulanmıyor. Tur 2'nin 32 bulgusunun en az 12'si "aynı projede doğrusu var, buraya
uygulanmamış" biçiminde. Bu iyi haber: çözümler tasarlanmayı değil, kopyalanmayı bekliyor.

---

## 5. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| SEC-001'de `GET /admin/.env` isteğinin **canlı** olarak dosyayı döndürdüğü | Çalışan bir sunucu yok ve kaynak dosya değiştirmeme kuralı gereği sunucu başlatılmadı. Sonuç üç dosyanın (router.php, server.js, .htaccess) okunmasından çıkarıldı. **Not:** `.sql` ve `.lock` gibi nokta ile başlamayan dosyalar için sonuç PHP'nin dotfile davranışından bağımsız olarak geçerli — bu yüzden bulgunun severity'si en muhafazakâr varsayım altında bile korunuyor. |
| `%2e%2e` ile `/api/..%2f.env` biçiminde path traversal olup olmadığı | `router.php:4` `parse_url`'den **sonra** `urldecode` yapıyor; bu kalıp teorik olarak kodlanmış traversal'ın parse aşamasını atlatmasına izin verir. Ancak PHP yerleşik sunucusunun kendi yol normalizasyonunun bunu engelleyip engellemediği çalıştırmadan bilinemez. Canlı test gerekiyor → **Tur 7**. |
| `RegisterUseCase`'in parola politikasının **tam metni** (SEC-011) | Dosya bu turda okundu ancak rapora alıntılanmadı; minimum 8 karakter bilgisi README:631-632'den. Politikanın karmaşıklık kuralı içerip içermediği doğrulanmadı. |
| `api/admin/error_log` (507 bayt) içeriğinin hassas veri taşıyıp taşımadığı | Kasıtlı olarak okunmadı — denetim raporuna sır yazmamak için. SEC-001'in etkisini değerlendirmek için içeriğinin **kontrol edilmesi gerekiyor** (özellikle `phpmailer.php` stub'ının yazdığı şifre sıfırlama kodları açısından). |
| `google.txt`, `customserver.txt`, `chatbot_table.txt` içindeki kimlik bilgilerinin rotate edilip edilmediği | Aynı gerekçe — içerikleri okunmadı. Tur 1'den devredilen soru, hâlâ açık. |
| `updategv.php`'nin `global_vars`'a yazarken HTML temizlemesi yapıp yapmadığı (SEC-017) | Dosya gövdesi okunmadı (75 satır). Yalnızca `_guard.php` require ettiği doğrulandı. |
| `chatbot_limits.php`, `coin_engine.php`, `producer_plan.php`'nin yetkilendirme etkisi | Bu dosyalar okunmadı → **Tur 3**. |
| `SellerController`'ın 12 metodunun yetkilendirme dağılımı (`requireAdmin` × 5, `requireAuth` × 2, kalan 5) | Yalnızca sayım yapıldı, gövdeler okunmadı. `parampos_callback` ve `marketplace_reconcile`'ın kimlik doğrulama modeli doğrulanmadı → **Tur 3**. |
| `AppConfig::ALLOWED_IMAGE_MIMES`'in gerçek içeriği | `AppConfig.php`'de yalnızca `ERR_*` ve `google*` satırları okundu; MIME listesi doğrulanmadı. SEC-020'nin "yalnızca güvenli uzantılar" gerekçesi `InputSanitizer::extensionForMime`'a dayanıyor (o okundu). |
| Yükleme dizinlerinin gerçek dosya sistemi izinleri | `mkdir(0755)` koddan okundu; diskteki fiili izinler kontrol edilmedi. |

---

## 6. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Backend — hiç okunmayanlar:**
- `api/functions/validators.php` (41 satır) — bölüm 6'nın "input validation" tarafı eksik kaldı
- `api/functions/coin_engine.php`, `chatbot_limits.php`, `producer_plan.php`,
  `checkout_payments.php`, `ParamPosMarketplace.php`, `phpmailer.php`, `minify.php` → **Tur 3**
- `api/src/Application/UseCases/Auth/RegisterUseCase.php` — okundu ama rapora alıntılanmadı;
  kayıt yolundaki doğrulamalar bulgu olarak işlenmedi
- `api/src/Infrastructure/Database/BaseRepository.php` — `self::insert/update/delete`
  sarmalayıcılarının `Database` sınıfından farklı bir davranışı olup olmadığı **kontrol edilmedi**.
  SEC-002/SEC-003/SEC-014'ün tamamı bu sınıftan geçiyor; ek bir filtre bulunması bulguları
  zayıflatabilir. **Bu, bir sonraki turun ilk işi olmalı.**
- `api/src/Shared/Exceptions/AppException.php` (53 satır)
- `api/src/Presentation/Controllers/` — `ContentController`, `ContactController`,
  `MessageController`, `NoteController`, `SellerController`, `SocialController` (yalnızca
  `addComment`/`getChatbotComments` okundu), `UserController` (yalnızca 2 metot)

**Admin paneli — okunmayanlar (30+ dosya):**
`adminler.php`, `ayarlar.php`, `seo.php` (240 satır), `sitemap.php`, `smtp.php`,
`updateenv.php` (78 satır), `updategv.php` (75 satır), `cikis.php` ve tüm sayfa dosyaları
(`kullanicilar.php`, `chatbotlar.php`, `odemeentegrasyon.php`, …), `partials/_header.php`,
`assets/js/admin.js`.
**Bunun özel önemi:** `updateenv.php` `.env` dosyasına **yazıyor** ve bu turda hiç incelenmedi —
path traversal veya değer enjeksiyonu açısından denetlenmemiş bir yazma yüzeyi.

**Frontend — okunmayanlar:**
- `web/src/app/dashboard/chat/page.jsx` — yalnızca 3 satırı (ReactMarkdown kullanımı) grep'lendi
- `web/src/app/dashboard/settings/page.jsx`, `checkout/page.jsx` ve diğer 18 sayfa
- `web/src/shared/lib/auth-guard.js` — istemci tarafı koruma mantığı → **Tur 6**
- `web/src/features/**` — hiçbiri okunmadı (yalnızca Tur 1'de envanteri alındı)
- `web/next.config.mjs` — CSP/security header tanımı olup olmadığı **kontrol edilmedi**

### Bölüm bazında boş kalan maddeler

**Bölüm 6 — Authentication:** `credential stuffing` (kısmen — SEC-006/SEC-012),
`session hijacking` (çerez bayrakları kontrol edildi ama HTTPS zorlaması/HSTS bakılmadı).

**Bölüm 6 — Authorization:** `SellerController`'ın 12 metodunun tamamı denetlenmedi;
`WalletController::upgradePlan` ve `getPricing` okunmadı; `NoteController`'ın 8 metodunun
yetkilendirmesi yalnızca sayıldı, doğrulanmadı.

**Bölüm 6 — Injection:** `path traversal` yalnızca `upload.php` ve `router.php` için bakıldı;
`updateenv.php`/`sitemap.php`/`db_backup` dosya yolları denetlenmedi. `PHP object injection`
(`unserialize` kullanımı) **hiç aranmadı**. `file inclusion` — dinamik `require`/`include`
kalıpları aranmadı (`admin/index.php`'nin route tablosu bu açıdan incelenmeli).

**Bölüm 6 — XSS:** `stored XSS` yalnızca `dangerouslySetInnerHTML` üzerinden bakıldı.
**Admin panelindeki PHP `echo` çıktıları hiç denetlenmedi** — `admin/*.php` sayfaları DB
içeriğini doğrudan HTML'e basıyor olabilir (`kullanicilar.php`, `chatbotlar.php`,
`chatbot_reports`). Bu, kullanıcı→admin yönlü stored XSS için en olası yer ve bu turda
kapsanmadı. `chatbot generated content`, `comments`, `profile data`, `chatbot descriptions`
maddelerinin **istemci tarafı render'ı** incelenmedi (yalnızca sunucu tarafı sanitizasyonun
yokluğu SEC-014'te tespit edildi).

**Bölüm 6 — CSRF:** `/api` tarafında CSRF token'ı **hiç yok**; koruma tamamen `SameSite=Lax`'a
dayanıyor. Bu tespit edildi ama ayrı bir bulgu olarak işlenmedi çünkü tüm durum değiştiren
`/api` endpoint'leri POST zorluyor (doğrulandı) ve Lax cross-site POST'u engelliyor —
yani mevcut hâliyle savunulabilir bir tasarım. Ancak `payment actions` ve
`subscription actions` maddeleri (createSubscription, checkout) bu turda okunmadı → **Tur 3**.

**Bölüm 6 — File Upload:** `PDF parser vulnerabilities` — `smalot/pdfparser 2.12`'nin bilinen
CVE'leri **kontrol edilmedi** → Tur 7 (bağımsızlık denetimi). `base64 uploads` — `readPdf`
akışı incelendi, `create.php`/`update.php`'deki base64→DB akışı yalnızca yüzeysel bakıldı
(boyut sınırı ve MIME beyaz listesi yokluğu görüldü ama ayrı bulgu yazılmadı, çünkü admin-only).

**Bölüm 6 — Secrets:** `SMTP credentials` — `admin/ajax/smtp.php` ve `admin/smtp.php`
okunmadı; SMTP parolasının nerede saklandığı bilinmiyor. `private keys` aranmadı.
Git geçmişinin tamamı taranmadı — yalnızca `[REDACTED-DB-PASSWORD]` için hedefli `git log -S` yapıldı.

**Bölüm 12 — Error Handling:** `sensitive data logging` yalnızca iki noktada bakıldı
(ERR-012, ERR-001). `error_log`'a ne yazıldığının sistematik taraması yapılmadı
(`grep -rn 'error_log' api/` çalıştırılmadı). `logging eksikliği` — hangi kritik işlemlerin
hiç loglanmadığı (başarısız giriş denemeleri, yetki reddi, para çekme talebi) incelenmedi.
