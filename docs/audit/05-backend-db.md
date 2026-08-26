# Tur 5 — Backend / PHP ve Veritabanı Denetimi

Kapsanan `docs/denetim.md` bölümleri: **5** (Backend / PHP Audit), **10** (Database Audit).

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

## 0. ÖNCEKİ TURLARA DÜZELTMELER

Bu turda okunan dosyalar, önceki iki turda yazdığım iki bulguyu değiştiriyor. İkisini de
açıkça düzeltiyorum.

### Düzeltme 1 — Tur 2 SEC-005 ve SEC-006 eksik hedef gösteriyordu

Tur 2'de admin girişinde `session_regenerate_id` ve rate limit eksikliğini **yalnızca**
`api/admin/ajax/giris.php` için raporladım. Bu turda ikinci, tamamen bağımsız bir admin
kimlik doğrulama implementasyonu buldum: `api/admin/partials/_login.php:1-26`. İkisi de
aynı iki eksikliği taşıyor. Ayrıntı **BE-001**'de; SEC-005/SEC-006'nın kapsamı iki dosyaya
çıkıyor ve `_login.php` yolu **kimlik doğrulaması olmadan** erişilebilir olduğu için
Tur 2 ERR-009'un ("`csrf_check` dizi girdide TypeError, ama admin oturumu gerekiyor,
bu yüzden LOW") severity gerekçesi de geçersiz kalıyor.

### Düzeltme 2 — Tur 3 PAY-011 kısmen yanlıştı

Tur 3 PAY-011'de "kalem başına brüt tutar geri hesaplanamıyor" dedim ve bu iddiayı
`param_marketplace_payments`'ın `items_json` sütununun **yokluğu varsayımına** dayandırıp
Doğrulanamayanlar'a koydum. Bu turda tabloyu okudum: sütun **var**.

```
$ awk '/CREATE TABLE.*`param_marketplace_payments`/,/^\) ENGINE/' api/database/schema.sql
  `product_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `items_json` longtext,
  `seller_splits_json` longtext,
  `param_response_json` longtext,
  `callback_json` longtext,
```

Yani `createSubscription`'ın koşullu olarak yazdığı üç sütun (`product_amount`,
`items_json`, `seller_splits_json`) gerçekten mevcut ve `items_json` kalem başına
`unit_price` + `line_total` + `billing_period` kaydediyor. **PAY-011'in "veri kayıp"
kısmı yanlıştı.** Ayakta kalan kısım:
- `param_marketplace_details.gross_amount == payable_amount` (ikisine aynı değer yazılıyor)
  → ilişkisel sütun düzeyinde brüt yok, yalnızca JSON blob'unda.
- Uygulanan komisyon oranı hiçbir yere yazılmıyor.
- `service_fee` sütunu var, hiç yazılmıyor (`SERVICE_FEE_PERCENT` sabiti de hiç okunmuyor).

Yani PAY-011 🟡 olarak geçerli kalıyor ama gerekçesi daralıyor: sorun "veri yok" değil,
"veri sorgulanamaz bir blob'da ve ilişkisel sütunlar yanlış dolduruluyor".

---

## 1. Bu turda gerçekten okunan dosyalar

**Tam okunanlar (2):**
`api/admin/partials/_login.php:1-40` (auth bloğu + form/head), `api/functions/chatbot_limits.php`
(Tur 3'te okunmuştu, burada yeniden referans verildi)

**Kısmi okunanlar:**
`api/admin/index.php:18-95` (route tablosu, tema seçimi, include akışı),
`api/src/Infrastructure/Repositories/ChatbotRepository.php:76-140, 169-190`
(`getPublished`, `getPublishedV2`, `getSuggested`'ın limit/sıralama kısmı),
`api/src/Presentation/Controllers/WalletController.php:8-16` (gelir sorgusu)

**`api/database/schema.sql` — yapısal envanter:**
50 tablonun ENGINE/CHARSET/COLLATE dağılımı; FOREIGN KEY sayımı; tüm `decimal`/`float`
sütunları; `param_marketplace_payments`, `chatbot_chats`, `chatbot_conversations`,
`chatbot_likes`, `chatbot_hide`, `chatbot_uninterested`, `user_coin_balance`,
`kullanicilar`, `chatbotlar` tablolarının sütun + index tanımları

**`api/database/migrations/` — yalnızca başlık yorumları okundu:**
`001_align_key_types.sql:1-14`, `002_clean_orphan_rows.sql:1-10`,
`003_add_foreign_keys.sql:1-20` + kısıt sayımı

**Mekanik taramalar:** `unserialize`/`eval`/dinamik include araması; döngü içi sorgu taraması;
`SELECT *` kullanımı; `ORDER BY $değişken` taraması; `DEFAULT_PAGE_LIMIT` kullanımı;
`login.js` referansları

---

## 2. BACKEND / PHP (denetim.md bölüm 5)

---

### BE-001

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** Admin panelinde ikinci, tamamen bağımsız bir kimlik doğrulama implementasyonu var — oturum yenileme ve rate limit ikisinde de yok, ve bu yol kimlik doğrulaması olmadan erişilebiliyor

**Dosya:** `api/admin/partials/_login.php:1-26`, `api/admin/index.php:65-66`

**Fonksiyon/Class:** `_login.php`'nin dosya kapsamındaki POST işleyicisi

**Problem:**

```php
api/admin/partials/_login.php:1-26
<?php
if ($_SERVER["REQUEST_METHOD"] == "POST")
{
    if(!csrf_check($_POST['csrf_token']))
    {
        echo '<script>alert("Geçersiz istek (CSRF hatası)!");</script>';
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        exit();
    }
    if(!isset($_SESSION['admin']))
    {
        $admin_adi = $_POST['admin_adi'];
        $admin_sifre = $_POST['admin_sifre'];
        $admin_bilgi = $database->selectSingle("* FROM adminler WHERE kullanici_adi = ?", [$admin_adi]);
        if($admin_bilgi && password_verify($admin_sifre, $admin_bilgi['sifre']))
        {
            $_SESSION['admin'] = $admin_adi;
            header("Location: /admin/");
            exit();
        }
```

`admin/index.php` bu dosyayı oturum yokken dahil ediyor:

```php
api/admin/index.php:65-66
<?php if (!isset($_SESSION['admin'])): ?>
  <?php include("./partials/_login.php"); ?>
```

**Kanıt (bölüm 24 — bu yolun gerçekten erişilebilir olduğu ve `giris.php`'nin tek yol
OLMADIĞI adım adım doğrulandı):**

```
1) Form nereye gidiyor?
api/admin/partials/_login.php:52     <form id="login-form" action="" method="POST" ...>
   → action="" = kendi URL'sine POST, yani /admin/ → index.php → _login.php:2 çalışır.

2) Ama bir JS kesici var:
api/admin/partials/_login.php:78-90
      const form = document.querySelector("#login-form");
      form.addEventListener("submit", async (e) => {
        const formData = new FormData(form);
        formData.append("csrf_token", csrfToken);
          const response = await fetch("/admin/ajax/giris.php", {
   → JS çalışıyorsa ajax/giris.php kullanılır (Tur 2'nin hedefi).
   → JS kapalıysa / fetch başarısızsa NATIVE form POST devreye girer → _login.php:2-26.
     Yani bu yol ölü değil, no-JS geri düşüş yolu.

3) İki implementasyonda da eksik olanlar:
$ grep -c 'session_regenerate_id' api/admin/partials/_login.php api/admin/ajax/giris.php
api/admin/partials/_login.php:0
api/admin/ajax/giris.php:0
$ grep -c 'checkRateLimit' api/admin/partials/_login.php api/admin/ajax/giris.php
api/admin/partials/_login.php:0
api/admin/ajax/giris.php:0
   → Tur 2 SEC-005 ve SEC-006, İKİ dosya için geçerli.
```

**Neden ayrı bir bulgu (Tur 2 SEC-005/006'nın tekrarı değil):** Üç ek gerçek var:

1. **Kimlik doğrulaması olmadan erişilebilir.** `_login.php` tam olarak oturum
   **yokken** dahil ediliyor. Tur 2 ERR-009'da (`csrf_check`'e dizi gönderilince
   `hash_equals` TypeError fırlatır) severity'yi "admin oturumu gerekiyor, bu yüzden LOW"
   diye gerekçelendirmiştim. Burada gerekmiyor: `POST /admin/` gövdesinde `csrf_token[]=x`
   göndermek yeterli. Ve `api/admin` altında `set_exception_handler` olmadığı
   (Tur 2'de doğrulandı) için `display_errors` açıkken **yığın izi** yanıta basılır.

2. **`$_POST` erişimleri korumasız.** Satır 4, 12, 13'te `??` yok. `POST /admin/` boş
   gövdeyle gönderildiğinde üç "Undefined array key" uyarısı üretilir (bkz. BE-004).

3. **İki implementasyonun davranışı farklı.** `giris.php` JSON döndürüyor;
   `_login.php` `<script>alert(...)</script>` echo ediyor ve başarıda `header("Location:")`
   ile yönlendiriyor. Yani aynı işlevin iki farklı hata/başarı sözleşmesi var. Birine
   yapılan bir güvenlik düzeltmesi diğerine geçmez — bu bulgunun asıl riski bu.

**Impact:** Session fixation ve sınırsız kaba kuvvet için **ikinci** bir yüzey; kimlik
doğrulaması gerektirmeyen bir TypeError/yığın izi yolu; ve gelecekteki düzeltmelerin
yarısının kaçırılması.

**Önerilen çözüm:** `_login.php`'deki auth bloğunu (satır 1-26) kaldırıp formu
`ajax/giris.php`'ye yönlendirmek (no-JS için `action="/admin/ajax/giris.php"`), ve
`giris.php`'ye Tur 2'nin SEC-005/SEC-006 düzeltmelerini uygulamak. Tek bir giriş yolu
kalmalı.

**Çözüm önceliği:** Yüksek.

---

### BE-002

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** `intval()` bir dizi üzerinde çağrılıyor — admin panelinin tema seçimi kalıcı olarak ilk temaya sabitlenmiş

**Dosya:** `api/admin/index.php:69-71`

**Problem:**

```php
api/admin/index.php:69-71
    $themes = $database->selectMulti("* FROM themes");
    $theme_index = intval($database->getGlobalVars('theme_index'));
    $current_theme = $themes[$theme_index - 1] ?? $themes[0];
```

`getGlobalVars()` bir **ilişkisel dizi** döndürüyor, skaler değil:

```php
api/functions/db.php:322-336 (kesit)
    public function getGlobalVars(...$var_keys) {
        ...
        $global_vars  = $this->selectMulti("var_key, var_value FROM global_vars WHERE var_key IN ($placeholders)", array_values($var_keys));

        $seo_data = [];
        foreach ($global_vars as $row) {
            $seo_data[$row['var_key']] = $row['var_value'];
        }

        return $seo_data;
    }
```

Yani dönüş `['theme_index' => '3']` biçiminde. PHP'de boş olmayan bir dizi üzerinde
`intval()` **her zaman `1`** döndürür (hata değil, sessiz dönüşüm). Dolayısıyla:
- `$theme_index = 1` (her zaman)
- `$themes[1 - 1]` = `$themes[0]` (her zaman ilk tema)

**Kanıt (bölüm 24 — doğru kullanımın aynı kod tabanında nasıl yapıldığı arandı):**

```
$ getGlobalVars'ın DOĞRU kullanım örnekleri (anahtarla erişim):
api/src/Presentation/Controllers/ContentController.php:30
        echo json_encode(Database::getInstance()->getGlobalVars('teslimat_iade_sartlari'));
   → istemci result.teslimat_iade_sartlari okuyor (Tur 4'te doğrulandı) — dizi olduğu
     biliniyor ve öyle kullanılıyor.

api/functions/db.php:342-343 (updateGlobalVars)
            foreach ($data as $var_key => $var_value) {
   → yine anahtar/değer çifti.

$ Skaler bekleyen tek kullanım:
$ grep -rn 'intval($database->getGlobalVars\|intval(.*getGlobalVars' api/ --include=*.php | grep -v vendor
api/admin/index.php:70
   → tek yer, ve yanlış.
```

**İkinci kusur — `$themes[0]` de güvensiz:** `themes` tablosu boşsa `$themes[0]` tanımsız
olur. `?? $themes[0]` operatörü sol taraf null olduğunda **sağ tarafı** değerlendirir, ama
sağ taraf da tanımsızsa `??` onu da null'a çevirir (uyarı üretmez) → `$current_theme = null`.
Sonra `$current_theme['text_color']` null üzerinde dizi erişimi → PHP 8'de uyarı + null.
Bu, satır 91-95'te yorumlanmış footer'da kullanılıyor ama `_header.php`/`_sidebar.php`
içinde de kullanılıyor olabilir (o dosyalar okunmadı — bkz. Doğrulanamayanlar).

**Impact:** Admin panelinin tema ayarı hiçbir etkiye sahip değil. `global_vars.theme_index`
değiştirilse bile panel her zaman ilk temayı gösteriyor. Kullanıcı verisi etkilenmiyor,
ama yönetim özelliği sessizce çalışmıyor — Tur 4 FE-001 ile aynı kalıp
(yönetilen ayar → arayüze ulaşmıyor).

**Önerilen çözüm:** `intval($database->getGlobalVars('theme_index')['theme_index'] ?? 1)`
ve `$themes` boşluk kontrolü.

**Çözüm önceliği:** Orta.

---

### BE-003

**Severity:** 🟡 MEDIUM
**TÜR:** güvenlik + teknik borç

**Başlık:** Admin kullanıcı listesi `SELECT *` ile tüm kullanıcıların bcrypt parola hash'i dâhil her sütununu çekiyor, sayfalama yok

**Dosya:** `api/admin/kullanicilar.php:2`

**Problem:**

```php
api/admin/kullanicilar.php:2
$kullanicilar = $database->selectMulti("* FROM kullanicilar");
```

Tek satır, iki sorun: sütun seçimi yok ve `WHERE`/`LIMIT` yok.

**Kanıt (bölüm 24 — `kullanicilar` tablosunun hangi hassas sütunları taşıdığı ve bunun
yaygın bir kalıp olup olmadığı kontrol edildi):**

```
$ kullanicilar tablosunun hassas sütunları (schema.sql):
  `id` int, `sifre` (bcrypt hash), `google_id`, `eposta`, `avatar`, `ad_soyad`,
  `kullanici_adi`, `telefon` ...
  (tam sütun listesi bu turda çıkarılmadı — yalnızca `id` tipi okundu)

$ Aynı kalıptaki diğer admin sayfaları:
$ grep -rnE "select(Single|Multi)\(\s*['\"]\*" api/admin --include=*.php | grep -v vendor
admin/abonelik.php:2              "* FROM plans"
admin/chatbotkategoriler.php:2    "* FROM chatbot_kategoriler"
admin/index.php:69                "* FROM themes"
admin/kullanicilar.php:2          "* FROM kullanicilar"          ← en hassas
admin/ajax/adminler.php:26, 48    "* FROM adminler WHERE ..."    ← admin hash'i
admin/ajax/giris.php:44           "* FROM adminler WHERE ..."    ← admin hash'i
admin/partials/_login.php:14      "* FROM adminler WHERE ..."    ← admin hash'i
   → 7 yer; ikisi kullanıcı/admin parola hash'i çekiyor.
```

**Neden problem — iki ayrı boyut:**

1. **Hash'ler PHP kapsamına giriyor.** `$kullanicilar` dizisinin her elemanı `sifre`
   alanını taşıyor. Sayfanın render kısmı bu diziyi döngüyle basıyor (satır 2'den sonrası
   bu turda **okunmadı**). Eğer bir yerde `print_r`, JSON gömme, `data-*` attribute veya
   debug çıktısı varsa hash'ler HTML'e düşer. Tur 2, admin sayfalarının `echo` çıktılarını
   hiç denetlemedi ve bunu Tur 6'ya bıraktı — bu bulgu o denetimin neden gerekli olduğunun
   somut gerekçesi.
   `giris.php`/`_login.php`/`adminler.php` için durum daha dar: tek satır çekiliyor ve
   yalnızca `password_verify` için kullanılıyor — ama gereksiz.

2. **Sayfalama yok.** Kullanıcı sayısı büyüdükçe her admin sayfası yüklemesi tüm tabloyu
   belleğe alıyor. `AppConfig::DEFAULT_PAGE_LIMIT = 20` tanımlı ve hiç kullanılmıyor
   (bkz. DB-009).

**Impact:** Parola hash'lerinin gereksiz yayılımı; admin panelinin kullanıcı sayısıyla
doğrusal olarak yavaşlaması ve bellek tüketmesi.

**Dürüstlük notu:** Hash'lerin HTML'e **gerçekten** düştüğünü doğrulamadım —
`kullanicilar.php`'nin yalnızca 2. satırını okudum. Bulgu "gereksiz olarak çekiliyor ve
sayfalama yok" tespitiyle sınırlı; sızıntı iddiası yapmıyorum.

**Önerilen çözüm:** Açık sütun listesi (`id, kullanici_adi, eposta, ad_soyad, ...`) ve
`LIMIT`/`OFFSET`. Kimlik doğrulama yollarında da `sifre, id` gibi minimum sütun seti.

**Çözüm önceliği:** Orta.

---

### BE-004

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Admin tarafında `$_POST`/`$_GET` erişimleri `??` olmadan yapılıyor — eksik parametre "Undefined array key" uyarısı üretiyor ve `display_errors` açıkken yanıta karışıyor

**Dosya:** `api/admin/partials/_login.php:4, 12, 13`, `api/admin/ajax/db_backup.php:16, 19`, `api/admin/ajax/readenv.php:47`

**Problem:**

```php
api/admin/partials/_login.php:4, 12-13
    if(!csrf_check($_POST['csrf_token']))
        ...
        $admin_adi = $_POST['admin_adi'];
        $admin_sifre = $_POST['admin_sifre'];
```

```php
api/admin/ajax/db_backup.php:16, 19
    if ($_GET['mode'] == 'backup') {
    ...
    } elseif ($_GET['mode'] == 'restore') {
```

```php
api/admin/ajax/readenv.php:47
    [$envKey, $envValue] = array_map('trim', explode('=', $line, 2));
```

Son satır ayrı bir tür: `explode('=', $line, 2)` bir `=` içermeyen satırda **tek elemanlı**
dizi döndürür, dolayısıyla `$envValue` için "Undefined array key 1" uyarısı çıkar.

**Kanıt (bölüm 24 — `/api` tarafının bu konuda tutarlı olduğu ve farkın admin'e özgü
olduğu doğrulandı):**

```
$ /api tarafı ?? kullanıyor mu?
api/src/Presentation/Controllers/ChatController.php:6      $data = json_decode($_POST['data'] ?? '', true) ?? null;
api/src/Presentation/Controllers/AuthController.php:150    $email = InputSanitizer::email($_POST['email'] ?? '');
api/src/Presentation/Controllers/MarketplaceController.php:191  $item['chatbot_id'] ?? 0
   → EVET, /api tarafında ?? tutarlı biçimde kullanılıyor.

$ admin tarafında ?? kullanan yerler de var:
api/admin/ajax/create.php:13      $table = $_POST['table'] ?? null;
api/admin/ajax/readenv.php:21     $key = $_POST['key'] ?? null;
api/admin/ajax/_guard.php:33      $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
   → yani admin tarafı da kısmen doğru yapıyor; tutarsızlık dosya bazında.
```

**Neden problem:** Tur 2 ERR-002'de `bootstrap.php`'nin `set_error_handler` kurmadığını ve
`display_errors`'ı ayarlamadığını raporladım. Admin tarafında ise `admin/index.php:8-11`
yorumunun anlattığına göre `display_errors` `APP_DEBUG`'a bağlanmış — ama `_login.php` ve
`db_backup.php` `index.php` üzerinden dahil edilmediklerinde (AJAX endpoint'leri
`_guard.php` üzerinden çalışıyor) o ayardan faydalanıp faydalanmadıkları belirsiz
(bkz. Doğrulanamayanlar).

Somut sonuç: uyarı metni JSON gövdesinin **önüne** basılır → istemcinin `JSON.parse`'ı
patlar (Tur 4 API-005: `res.ok` kontrolü 51 dosyanın 8'inde var, yani hata görünmez olur).

**Impact:** Bozuk yanıt gövdeleri; dosya yolu içeren uyarı metinlerinin sızması.

**Önerilen çözüm:** Üç dosyada `?? ''` / `?? null` eklemek; `readenv.php:47` için
`explode` sonucunu eleman sayısıyla kontrol etmek. Kalıcı çözüm ERR-002'nin
`set_error_handler`'ı.

**Çözüm önceliği:** Orta.

---

### BE-005

**Severity:** 🟡 MEDIUM
**TÜR:** mimari

**Başlık:** Global durum ve statik metotlar her katmanda: `$database`/`$conn` global değişkenleri, `Database` singleton'ı, 14 controller'ın tamamı statik — bağımlılık enjeksiyonu yalnızca üç auth use-case'inde var

**Dosya:** `api/functions/bootstrap.php:46-47`, tüm `api/src/Presentation/Controllers/*.php`, `api/functions/db.php:89-94`, `api/admin/partials/_login.php:14`

**Problem:**

Bootstrap her istekte iki global değişken kuruyor:

```php
api/functions/bootstrap.php:44-47
require_once __DIR__ . '/db.php';

$database = Database::getInstance();
$conn     = $database->getConnection();
```

Bu globaller admin tarafında **örtük bağımlılık** olarak kullanılıyor:

```php
api/admin/partials/_login.php:14
        $admin_bilgi = $database->selectSingle("* FROM adminler WHERE kullanici_adi = ?", [$admin_adi]);
```

`_login.php` `$database`'i hiç tanımlamıyor veya parametre olarak almıyor — dahil edildiği
dosyanın (`admin/index.php:6`) kapsamından miras alıyor. Dosya tek başına test edilemez ve
başka bir yerden dahil edilirse sessizce çöker.

**Kanıt (bölüm 24 — DI'ın gerçekten yalnızca auth'ta olduğu ve controller'ların statiklik
oranı ölçüldü):**

```
$ Constructor injection kullanan sınıflar:
$ grep -rn 'public function __construct' api/src --include=*.php
api/src/Application/UseCases/Auth/LoginUseCase.php:3        public function __construct(private UserRepository $users) {}
api/src/Application/UseCases/Auth/GoogleLoginUseCase.php:3  public function __construct(private UserRepository $users) {}
api/src/Application/UseCases/Auth/RegisterUseCase.php       (aynı desen)
api/functions/db.php:23                                     private function __construct()   ← singleton
   → DI yalnızca 3 auth use-case'inde. Diğer 11 controller'ın hiçbirinde yok.

$ Controller metotlarının statiklik oranı:
$ grep -c 'static function' api/src/Presentation/Controllers/*.php | awk -F: '{s+=$2} END {print s" statik metot"}'
147 statik metot
$ grep -c 'public function [a-z]' api/src/Presentation/Controllers/*.php | awk -F: '{s+=$2} END {print s}'
0
   → 147/147 statik. Tek bir örnek metot yok.

$ Repository'ler controller'larda nasıl kullanılıyor?
$ grep -rc 'new ChatbotRepository()\|new UserRepository()' api/src/Presentation/Controllers/*.php \
    | grep -v ':0' | awk -F: '{s+=$2} END {print s" adet yerinde new"}'
   → her kullanımda yeni örnek; enjeksiyon yok.
```

**Neden problem (bölüm 5'in açık sorusuna cevap):** denetim.md bölüm 5 şunu soruyor:
*"abstraction yalnızca görüntüde mi var?"* Ölçüm: evet, büyük ölçüde.
- 8 repository arayüzünün 6'sının implementasyonu yok (Tur 1 ARCH-007).
- 2 implementasyon var, ama controller'lar onları `new` ile örnekliyor — arayüz üzerinden
  değil, ve değiştirilebilir değil.
- 11 controller doğrudan `Database::getInstance()` çağırıyor, repository'yi atlıyor.
- Tümü statik olduğu için mock/stub imkânı yok; bu, projede hiç test olmamasının
  (Tur 1'de doğrulandı: Docker/CI/test yok) yapısal nedeni.

**Impact:** Test edilemezlik; `Database` singleton'ının süreç boyunca tek bağlantıya
kilitlenmesi (okuma replikası veya ikinci veritabanı eklenemez); `$database` globaline
bağlı dosyaların taşınamaz olması.

**Dürüstlük notu:** Bu, çalışan bir uygulamada **bug değil**. Statik + singleton, PHP'de
yaygın ve bu ölçekte işleyen bir desen. Bulgu, projenin **kendi beyan ettiği** Clean
Architecture hedefiyle (arayüzler, use-case klasörleri, `Domain/`, `Infrastructure/`)
gerçek yapısı arasındaki farkı ölçüyor.

**Önerilen çözüm:** Tur 1 ARCH-007'nin önerisiyle aynı: ya mimariyi gerçekten uygulamak
(en azından repository'leri arayüz üzerinden enjekte etmek), ya iddiayı kod yapısından
kaldırmak. `_login.php`'nin `$database` globaline bağımlılığı en azından açık parametre
hâline getirilmeli.

**Çözüm önceliği:** Orta — mimari karar.

---

### BE-006

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `declare(strict_types=1)` hiçbir PHP dosyasında yok — tip beyanları varken zorlayıcı tip kontrolü kapalı

**Dosya:** Tüm `api/**/*.php`

**Kanıt:**

```
$ grep -rn 'declare(strict_types' api/ --include=*.php | grep -v vendor
(çıktı yok)

$ Ama tip beyanları YAYGIN kullanılıyor:
api/src/Presentation/Response/JsonResponse.php:20-25
    public static function error(
        string $message,
        int    $status     = 400,
        string $errorCode  = '',
        array  $extra      = []
    ): void {
api/src/Shared/Utilities/InputSanitizer.php:8      public static function string(mixed $value, int $maxLen = 1000): string
api/src/Infrastructure/Database/BaseRepository.php:41   protected static function insert(string $table, array $data): int
```

**Neden problem:** `strict_types` olmadan PHP **zorlayıcı (coercive)** modda çalışır:
`int` bekleyen bir parametreye `"5abc"` verilirse `5`'e çevrilir (uyarıyla), `"abc"`
verilirse `TypeError` fırlatır. Yani tip beyanları kısmi koruma sağlıyor ama sessiz
dönüşümlere izin veriyor.

Somut örnek bu turda bulundu — BE-002'deki `intval(dizi)` → `1`. `strict_types` bunu
engellemezdi (`intval` bir dil fonksiyonu), ama aynı sınıf sessiz dönüşümler her yerde
mümkün.

Daha kritik bir örnek: `InputSanitizer::price(mixed $value): float` →
`(float) "abc"` = `0.0`. Yani geçersiz bir fiyat sessizce 0'a düşüyor.
Tur 3'te `createSubscription:231`'in `if ($price <= 0)` kontrolüyle bunun **yakalandığını**
doğrulamıştım — yani bu özel yol korunuyor. Ama koruma savunma katmanında, tip
sisteminde değil.

**Impact:** Tip hataları çalışma anına ertelenir ve sessiz dönüşümlerle maskelenir.

**Önerilen çözüm:** Dosya başlarına `declare(strict_types=1)` eklemek — ama bu **davranış
değiştirici** bir değişiklik: şu an sessizce dönüşen çağrılar `TypeError` fırlatmaya
başlar. Kademeli, dosya dosya ve test altında yapılmalı; test olmadığı için (Tur 1)
riskli.

**Çözüm önceliği:** Düşük — test altyapısı olmadan yapılmamalı.

---

### BE-007

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `api/admin/assets/js/login.js` hiçbir sayfa tarafından yüklenmiyor ve içindeki endpoint yolu hatalı

**Dosya:** `api/admin/assets/js/login.js:12`

**Problem:**

```javascript
api/admin/assets/js/login.js:12
      const response = await fetch("/ajax/giris.php", {
```

Doğru yol `/admin/ajax/giris.php`. `/ajax/giris.php` proxy'nin `pathFilter`'ıyla
(`['/admin','/api','/assets']` — Tur 2'de okundu) eşleşmediği için PHP'ye hiç gitmez;
Next.js'e düşer ve 404 döner.

**Kanıt (bölüm 24 — dosyanın gerçekten yüklenmediği doğrulandı):**

```
$ (Grep) login\.js    tüm repo, vendor hariç
project_tree.txt:245        ← yalnızca dosya ağacı listesi
.claude/settings.json:254   ← ilgisiz (stage1b_login.js)
   → hiçbir PHP dosyası <script src=".../login.js"> yüklemiyor.

$ _login.php hangi script'leri yüklüyor?
api/admin/partials/_login.php:37     <script src="/admin/assets/js/Notification.js"></script>
   → login.js DEĞİL. Giriş mantığı _login.php:78-90'daki satır içi script'te.
```

**Neden bir bulgu:** Tur 1 DEAD-007'de admin tarafındaki yetim dosyaları listelemiştim
(`tailmind.js`, `empty.png`) ama `login.js`'i kaçırdım — o turda yalnızca üç dosya adı
için hedefli arama yapmıştım. Bu, Tur 1'in ölü kod listesinin **tamamlanmamış** olduğunun
göstergesi: `api/admin/assets/` altındaki dosyaların hiçbiri sistematik olarak
taranmadı (`admin.css`, `notification.css`, `notifs.css`, `site.css`, `admin.js`,
`Notification.js`, `Inter.ttf`).

**Impact:** Ölü dosya + içinde çalışmayan bir yol. Yanlışlıkla yüklenirse giriş sessizce
bozulur.

**Önerilen çözüm:** Silmek. `api/admin/assets/` altındaki diğer 7 dosya için de aynı
taramayı yapmak.

**Çözüm önceliği:** Düşük.

---

### BE-008

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** Dinamik `include` ve autoloader'ın `require_once`'u incelendi — LFI/PHP object injection **yok**; `unserialize`/`eval`/`extract` hiçbir yerde kullanılmıyor

**Bu, Tur 2'nin devrettiği açık sorunun cevabıdır ve olumlu bir bulgudur.** Bölüm 27
"sadece sorun listesi çıkarma" gereği olumsuz sonuç da kayda geçiyor.

**Kanıt:**

```
$ (Grep) unserialize|eval\(|assert\(|extract\(|create_function|call_user_func|include +\$|require +\$
      tüm repo, vendor hariç
api/admin/index.php:86          include $adminRoutes[$routePath];
api/src/autoload.php:69         require_once $file;
   → yalnızca iki dinamik include. unserialize/eval/extract/create_function: SIFIR.
```

**Her iki dinamik include de güvenli:**

```php
api/admin/index.php:52-53, 80-87
$routePath  = strtok($currentPath, '?');
$routeKnown = array_key_exists($routePath, $adminRoutes);
...
        if (!$routeKnown) {
            echo '<div ...>Sayfa bulunamadı</div>';
        } elseif ($adminRoutes[$routePath] !== null) {
            include $adminRoutes[$routePath];
        }
```

`$routePath` istemci kontrollü (`$_SERVER['REQUEST_URI']`), ama `array_key_exists`
kontrolünden geçiyor ve include edilen değer **sabit kodlu 23 elemanlı bir tablodan**
(satır 26-50) geliyor. İstemcinin yol enjekte etme imkânı yok.

`autoload.php:69`'daki `$file = $dir . $class . '.php'` ise sınıf adından türüyor.
Riskli olurdu ancak:

```
$ class_exists / interface_exists ile kullanıcı girdisi kullanılıyor mu?
$ grep -rnE 'class_exists|interface_exists|enum_exists|new \$' api/src api/functions api/api --include=*.php
(çıktı yok)
   → autoloader'a istemci kontrollü bir "sınıf adı" geçirecek yol yok.
```

**Kalan (düşük) not:** `include $adminRoutes[$routePath]` **göreli** bir yol kullanıyor
(`'adminler.php'`), aynı şekilde satır 66/73/76'daki `include("./partials/...")` da
CWD-göreli. Tur 1 ARCH-008 bu kırılganlık sınıfını zaten raporladı; burada yalnızca
admin route katmanına da uzandığını not ediyorum. Yeni bir bulgu açmadım.

**Çözüm önceliği:** Yok — bulgu değil, olumlu doğrulama.

---

## 3. VERİTABANI (denetim.md bölüm 10)

---

### DB-001

**Severity:** 🟠 HIGH
**TÜR:** bug + prod blocker

**Başlık:** Pazaryeri listeleme sorgusu altı sınırsız alt tabloya LEFT JOIN yapıp `COUNT(DISTINCT)` alıyor — kartezyen çarpım üretiyor, sayfalama yok, ve bu ana sayfanın sorgusu

**Dosya:** `api/src/Infrastructure/Repositories/ChatbotRepository.php:85-102`

**Fonksiyon/Class:** `ChatbotRepository::getPublished()`

**Problem:**

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php:85-101
        return self::all(
            "SELECT c.id, c.kapak_fotografi, c.profil_fotografi, c.kategori_id, c.isim, c.aciklama,
                    c.ucret_haftalik, c.yayimlanma_tarih, 1 AS durum, u.kullanici_adi AS owner_name,
                    COUNT(DISTINCT cc.id)  AS toplam_chats,    COUNT(DISTINCT cf.id)  AS toplam_follows,
                    COUNT(DISTINCT cl.id)  AS toplam_lists,    COUNT(DISTINCT cli.id) AS toplam_likes,
                    COUNT(DISTINCT cdi.id) AS toplam_dislikes, COUNT(DISTINCT cm.id)  AS toplam_comments
             FROM `chatbotlar` c
             INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             LEFT JOIN chatbot_chats     cc  ON cc.chatbot_id  = c.id
             LEFT JOIN chatbot_follows   cf  ON cf.chatbot_id  = c.id
             LEFT JOIN chatbot_in_list   cl  ON cl.chatbot_id  = c.id
             LEFT JOIN chatbot_likes     cli ON cli.chatbot_id = c.id
             LEFT JOIN chatbot_dislikes  cdi ON cdi.chatbot_id = c.id
             LEFT JOIN chatbot_comments  cm  ON cm.chatbot_id  = c.id
             LEFT JOIN kullanicilar u ON u.id = c.owner_user_id
             $where GROUP BY c.id ORDER BY c.id DESC",
```

Altı LEFT JOIN'in her biri bir bot için N satır döndürüyor. MySQL bunları **çarparak**
birleştiriyor, sonra `COUNT(DISTINCT)` çarpımı geri katlıyor.

**Kanıt (bölüm 24 — üç şey doğrulandı: bu sorgunun canlı yol olduğu, sayfalama olmadığı,
ve `chatbot_chats`'in sınırsız büyüdüğü):**

```
1) Canlı yol mu?
web/src/app/dashboard/page.jsx:761        fetch(`/api/chatbot/getchatbots.php`)
api/src/Presentation/Controllers/ChatbotController.php:99
        JsonResponse::success(['bots' => $repo->getPublished([...])]);
   → EVET: /dashboard ana sayfası her yüklemede bu sorguyu çalıştırıyor.

2) Sayfalama var mı?
$ grep -n 'LIMIT' <getPublished gövdesi 76-103>
(çıktı yok)
$ grep -rn 'DEFAULT_PAGE_LIMIT' api/src --include=*.php
api/src/Shared/Constants/AppConfig.php:34    const DEFAULT_PAGE_LIMIT = 20;
   → tanımlı, HİÇ kullanılmıyor (bkz. DB-009).

3) chatbot_chats sınırsız mı büyüyor?
   Her sohbet mesajı bir satır (ChatController::addChat, kullanıcı + bot mesajı ayrı ayrı).
   Silme yolu yalnızca deleteConversation (Tur 2'de okundu) — botun tüm mesajlarını değil,
   o kullanıcının o botla mesajlarını siliyor.
$ awk '/CREATE TABLE.*`chatbot_chats`/,/^\) ENGINE/' api/database/schema.sql | grep KEY
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`,`user_id`)
   → JOIN indexli, ama satır çarpımı index'le çözülmüyor.
```

**Büyüklük tahmini:** Tek bir bot için 1.000 mesaj, 100 takip, 50 liste kaydı, 200 beğeni,
20 beğenmeme, 30 yorum varsayıldığında o botun ara satır sayısı
1000 × 100 × 50 × 200 × 20 × 30 ≈ **6 × 10¹²**. MySQL bu ara sonucu geçici tabloda
materyalize etmeye çalışır. Pratikte sorgu ya `tmp_table_size`/disk sınırına çarpar ya da
dakikalar sürer.

**Impact:** Pazaryeri/ana sayfa, veri büyüdükçe **kademeli değil ani** olarak çöker.
Küçük veriyle (geliştirme ortamı) sorun görünmez — bu yüzden fark edilmemiş. Ayrıca
`chatbot_chats`'in `LEFT JOIN` edilmesi, sohbet hacmi arttıkça ana sayfayı yavaşlatıyor:
kullanım arttıkça uygulama yavaşlıyor.

**Ek gözlemler (aynı sorguda):**
- `WHERE c.id > 0` — unsigned auto-increment PK üzerinde işlevsiz koşul.
- `1 AS durum` — sabit literal sütun; istemci `durum` alanını kullanıyorsa her zaman 1.
- `c.isim LIKE '%...%'` (satır 81-82) — önde joker olduğu için `isim` üzerinde index
  kullanılamaz; arama her zaman tam tarama.

**Önerilen çözüm:** Sayımları korelasyonlu skaler alt sorgulara veya önceden hesaplanmış
sayaç sütunlarına taşımak. Örnek:
`(SELECT COUNT(*) FROM chatbot_likes WHERE chatbot_id = c.id) AS toplam_likes` —
her biri kendi index'ini kullanır, çarpım olmaz. `toplam_chats` gibi pahalı sayımlar için
`chatbotlar`'a bir sayaç sütunu (trigger veya uygulama tarafından güncellenen) daha uygun.
Ve `LIMIT`/`OFFSET` eklemek.

**Çözüm önceliği:** Yüksek — production'da ilk performans arızası bu olacak.

---

### DB-002

**Severity:** 🟠 HIGH
**TÜR:** prod blocker + mimari

**Başlık:** `schema.sql`'de 50 tablo ve **sıfır** foreign key var; düzeltme üç migration dosyasında hazır ve ölçülmüş — ama hiçbiri versiyon kontrolünde değil

**Dosya:** `api/database/schema.sql`, `api/database/migrations/00{1,2,3}_*.sql`

**Problem:**

```
$ grep -c 'FOREIGN KEY' api/database/schema.sql
0
$ grep -oE 'ENGINE=[A-Za-z]+' api/database/schema.sql | sort | uniq -c
     50 ENGINE=InnoDB
```

50 tablonun tamamı InnoDB (yani FK **destekliyor**), hiçbirinde FK yok. Referans
bütünlüğü tamamen uygulama koduna bırakılmış.

Düzeltme **var** ve titizlikle yazılmış:

```sql
api/database/migrations/003_add_foreign_keys.sql:1-16
-- 003_add_foreign_keys.sql  (audit: RİSK-9)
--
-- All 50 tables, zero foreign keys. Referential integrity was left entirely
-- to application code, and it did not hold: rows outlived the users and
-- chatbots they pointed at (38 orphaned rows across 5 relationships when
-- measured).
--
-- RUN ORDER: 001 (types must match) then 002 (orphans must be gone), then
-- this file. Running it first will fail with errno 150 / 1452.
--
-- ON DELETE choices:
--   CASCADE   for rows that are meaningless without their parent — a like,
--             a cart line, a chat message, a subscription.
--   RESTRICT  for chatbotlar.author_user_id: deleting an author who still
--             has published bots should fail loudly, not silently erase the
--             bots (and the subscriptions other people bought).
```

```
$ grep -cE 'ADD CONSTRAINT|FOREIGN KEY' api/database/migrations/003_add_foreign_keys.sql
106
```

**Kanıt (bölüm 24 — `schema.sql`'in migration ÖNCESİ mi SONRASI mı durumu yansıttığı
kontrol edildi; öncesi):**

```
$ schema.sql'de FK var mı?           → 0
$ schema.sql'de tip uyumsuzluğu var mı?
  kullanicilar.id          int
  chatbotlar.id            int unsigned
  chatbotlar.author_user_id int unsigned      ← ebeveyni int (signed), uyumsuz
  chatbotlar.owner_user_id  int               ← aynı tabloda, farklı tip
  chatbot_chats.user_id    int
  chatbot_likes.user_id    bigint unsigned
  chatbot_hide.user_id     bigint unsigned
   → migration 001'in başlığında anlatılan durumun AYNISI:
     "chatbotlar.id is `int unsigned` while chatbot_id is `int` in 9 tables and
      `bigint unsigned` in 7; kullanicilar.id is `int` while user_id is
      `bigint unsigned` in 14."
   → SONUÇ: schema.sql, migration'ların DÜZELTMEYİ AMAÇLADIĞI durumu içeriyor.
```

**Neden bu bir bulgu — üç katman:**

1. **Kurulum yolu bozuk durum üretiyor.** Yeni bir sunucuda `schema.sql` çalıştıran biri,
   FK'sız ve tip uyumsuz bir veritabanı elde eder. Migration'ların da çalıştırılması
   gerektiğini söyleyen bir doküman yok (README zaten "şema yok" diyor — Tur 1 DOC-001).
2. **Sıralama bilgisi yalnızca yorumda.** `003`'ün başlığı "RUN ORDER: 001 → 002 → 003"
   diyor ve yanlış sırada 150/1452 hatası vereceğini uyarıyor. Bunu zorlayan bir migration
   koşucusu yok (Tur 1: migration aracı yok).
3. **Hiçbiri versiyon kontrolünde değil.** Tur 1 ARCH-003'te `.gitignore:47`'deki `*.sql`
   kuralının bu dosyaları yakaladığını doğrulamıştım. Yani **ölçülmüş, gerekçelendirilmiş,
   106 kısıtlık bir düzeltme tek bir geliştiricinin diskinde** duruyor.

**denetim.md bölüm 10'un asıl sorusuna cevap** — *"Bu proje yeni bir sunucuda güvenilir
şekilde kurulabilir mi?"*: **Hayır.** Üç ayrı nedenle:
- Şema dosyası versiyon kontrolünde değil (klonda hiç yok).
- Diskteki şema, migration'ların düzeltmeyi amaçladığı bozuk durumu içeriyor.
- Migration'ları doğru sırayla uygulayacak bir araç veya doküman yok.

**Ek gözlem — migration'lar bir önceki denetimin ürünü:** Dosya başlıkları "RİSK-9",
"RİSK-10" gibi bulgu kimlikleri ve "run against live data 2026-08-24" gibi ölçüm tarihleri
taşıyor. Yani bu problemler **daha önce tespit edilmiş** ve düzeltme yazılmış; eksik olan
düzeltmenin dağıtılabilir hâle getirilmesi.

**Önerilen çözüm:** `.gitignore`'a `!api/database/**/*.sql` eklemek (Tur 1 ARCH-003);
`schema.sql`'i migration'lar uygulandıktan **sonraki** durumdan yeniden dump etmek (veya
migration'ları kurulum sırasının zorunlu parçası yapmak); basit bir migration koşucusu
(sırayı ve uygulanmışlığı takip eden) eklemek.

**Çözüm önceliği:** Yüksek.

---

### DB-003

**Severity:** 🟠 HIGH
**TÜR:** bug + iş mantığı

**Başlık:** Satıcı bakiyesi `param_marketplace_payments` tablosuna JOIN yapıyor ama `status` sütununu hiç okumuyor — başarısız veya iade edilmiş bir ödemenin satıcı payı bakiyeye dâhil olmaya devam ediyor

**Dosya:** `api/src/Presentation/Controllers/WalletController.php:8-15`

**Bu, Tur 3'ün devrettiği açık sorunun cevabıdır.** Tur 3'te "gelir sorgusu `p.status`'a
bakmıyor gibi görünüyor, doğrulanmadı" olarak Doğrulanamayanlar'a bırakmıştım. Doğrulandı.

**Problem:**

```php
api/src/Presentation/Controllers/WalletController.php:8-15
        $incomeRows = $db->selectMulti(
            "d.payable_amount, d.status, d.created_at, p.order_id
             FROM param_marketplace_details d
             JOIN param_marketplace_payments p ON p.id = d.payment_id
             WHERE d.seller_user_id = ?
             ORDER BY d.created_at DESC",
            [$userId]
        );
```

`param_marketplace_payments` tablosuna JOIN yapılıyor ama ondan yalnızca `p.order_id`
seçiliyor (açıklama metni için). `p.status` ne SELECT'te ne WHERE'de.

**Kanıt (bölüm 24 — `p.status`'un anlamlı değerler taşıdığı ve filtrelemenin gerçekten
hiçbir yerde yapılmadığı doğrulandı):**

```
1) status sütunu anlamlı mı?
$ awk '/CREATE TABLE.*`param_marketplace_payments`/,/^\) ENGINE/' api/database/schema.sql | grep status
  `status` varchar(32) NOT NULL DEFAULT 'pending'
    COMMENT 'pending, payment_started, paid, failed, hash_failed, refunded, partial_refund',
  KEY `idx_status` (`status`)
   → 7 durumlu bir yaşam döngüsü tanımlı, üstelik INDEX'i de var (yani filtrelenmesi
     tasarlanmış).

2) Bakiye hangi sütuna bakıyor?
api/src/Presentation/Controllers/WalletController.php:27-35
        foreach ($incomeRows as $r) {
            $amount = (float) $r['payable_amount'];
            if ($r['status'] === 'approved') {       ← d.status (DETAILS), p.status DEĞİL
                $balance += $amount;
            } elseif ($r['status'] === 'refunded') {
                $balance -= $amount;

3) d.status ne zaman 'approved' oluyor?
api/src/Presentation/Controllers/MarketplaceController.php:344
                'status'            => 'approved',
   → HER ZAMAN, koşulsuz (Tur 3 PAY-001).

4) p.status filtreleyen başka bir yer var mı?
$ grep -rn "param_marketplace_payments" api/src --include=*.php | grep -iE "status|WHERE"
api/src/Presentation/Controllers/WalletController.php:11   (JOIN, filtre yok)
api/src/Presentation/Controllers/MarketplaceController.php:320   (INSERT)
   → hayır.
```

**Sonuç zinciri:** `d.status` her zaman `'approved'` yazılıyor (PAY-001), `p.status` hiç
okunmuyor (bu bulgu). Yani **ödeme durumu sütununun para üzerinde hiçbir etkisi yok.**
Gerçek bir ödeme ağ geçidi bağlandığında `failed`/`hash_failed` olan bir ödeme bile
satıcının çekilebilir bakiyesini artırmaya devam eder.

`idx_status` index'inin varlığı, şemayı yazan kişinin bu filtrelemeyi öngördüğünü
gösteriyor — kod onu hiç kullanmıyor.

**Impact:** Başarısız ödemelerden satıcı bakiyesi oluşması → gerçek para çıkışı.
Tur 3 PAY-001 ve PAY-005 ile birlikte, satıcı bakiyesi hesabının üç ayrı yerden
güvenilmez olduğu anlamına geliyor.

**Önerilen çözüm:** `WHERE d.seller_user_id = ? AND p.status IN ('paid', 'partial_refund')`
— ve `d.status` yerine (veya ek olarak) `p.status`'u yetkili kaynak saymak. PAY-001'in
`pending_approval` önerisiyle birlikte tasarlanmalı.

**Çözüm önceliği:** Yüksek.

---

### DB-004

**Severity:** 🟡 MEDIUM
**TÜR:** doküman + prod blocker

**Başlık:** Şemadaki 9 tablo `utf8mb4_0900_ai_ci` collation'ı kullanıyor — bu collation MySQL 8.0'a özgü ve MariaDB'de yok; README üç yerde MariaDB desteği iddia ediyor

**Dosya:** `api/database/schema.sql`, `README.md:88, 200, 565`

**Problem:**

```
$ grep -oE 'COLLATE=[a-z0-9_]+' api/database/schema.sql | sort | uniq -c
     41 COLLATE=utf8mb4_general_ci
      9 COLLATE=utf8mb4_0900_ai_ci

$ 0900_ai_ci kullanan 9 tablo:
param_marketplace_alerts   param_marketplace_details   param_marketplace_payments
param_marketplace_refunds  param_marketplace_sellers   param_marketplace_soap_log
password_resets            rate_limits                 user_plan_selection
```

README ise şunu söylüyor:

```markdown
README.md:88   | Database | MySQL/MariaDB via PDO (`utf8mb4`, `ERRMODE_EXCEPTION`, emulated prepares off) |
README.md:200  | MySQL or MariaDB | `Database` builds a `mysql:` DSN |
README.md:565  MySQL/MariaDB, accessed exclusively through the singleton `Database` class in
```

`utf8mb4_0900_ai_ci` MySQL 8.0 ile gelen UCA 9.0.0 tabanlı bir collation'dır ve MariaDB
hiçbir sürümünde uygulanmamıştır. Dolayısıyla `schema.sql` bir MariaDB sunucusunda
**9 tabloda `Unknown collation` hatasıyla** başarısız olur.

**Kanıt (bölüm 24 — bu 9 tablonun neden farklı olduğu ve kod tarafında bir MariaDB
bağımlılığı olup olmadığı arandı):**

```
$ Bölünme nerede?
  41 tablo (general_ci): orijinal uygulama tabloları — kullanicilar, chatbotlar, ...
   9 tablo (0900_ai_ci): 6 param_marketplace_* + 3 runtime'da oluşturulan
                          (password_resets, rate_limits, user_plan_selection)
   → İki farklı zamanda/araçla oluşturulmuş. Runtime'da oluşturulanların DDL'i kodda:

api/functions/rate_limit.php:9-13
    $db->ensureTable('rate_limits', "CREATE TABLE IF NOT EXISTS rate_limits (
            rkey VARCHAR(191) PRIMARY KEY, ...
        )");
   → DDL'de COLLATE belirtilmemiş → sunucunun VARSAYILANI kullanılıyor.
     Yani 0900_ai_ci, bu şemanın dump edildiği MySQL 8 sunucusunun varsayılanı.

$ Kodda MySQL 8'e özgü sözdizimi var mı?
api/src/Presentation/Controllers/MarketplaceController.php:326-327 (yorum)
   // MySQL 8's `ADD COLUMN IF NOT EXISTS` rejects this form, so check
   // information_schema first to stay idempotent.
   → Kod MySQL 8 davranışını hesaba katıyor (MariaDB IF NOT EXISTS'i DESTEKLER).
     Yani geliştirme ortamı MySQL 8; MariaDB hiç test edilmemiş görünüyor.
```

**İkinci boyut — collation karışımı riski:** Farklı collation'lı iki tablo arasında
**string** sütunlar üzerinden JOIN veya karşılaştırma yapılırsa MySQL
`Illegal mix of collations` hatası verir. Mevcut kodda bu **gerçekleşmiyor**, çünkü
gruplar arası tüm JOIN'ler tamsayı sütunlar üzerinden:

```
api/src/Presentation/Controllers/MarketplaceController.php:16-18
        "pms.status FROM param_marketplace_sellers pms
         JOIN chatbotlar c ON c.author_user_id = pms.user_id     ← INT
api/src/Infrastructure/Repositories/ChatbotRepository.php:92
        INNER JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id   ← INT
api/src/Presentation/Controllers/WalletController.php:11
        JOIN param_marketplace_payments p ON p.id = d.payment_id  ← INT, ikisi de 0900
```

Bu yüzden **şu an bir hata yok** — bunu ayrı bir bulgu olarak yazmadım. Ama risk latent:
`param_marketplace_sellers.guid_altuyeisyeri` (varchar) ile general_ci bir tablodaki bir
string sütunu karşılaştıran ilk sorgu hata verecek.

**Impact:** MariaDB'de kurulum başarısız (9 tablo). README yanlış bir uyumluluk vaadi
veriyor. Ayrıca gelecekte string JOIN eklendiğinde ani hata.

**Önerilen çözüm:** Hedef veritabanına karar verip README'yi düzeltmek. MariaDB desteği
isteniyorsa 9 tabloyu `utf8mb4_general_ci` (veya `utf8mb4_unicode_ci`) ile yeniden
oluşturmak ve `ensureTable` DDL'lerine açık `COLLATE` eklemek — sunucu varsayılanına
bırakmak bu tutarsızlığın kök nedeni.

**Çözüm önceliği:** Orta — hedef ortam kararına bağlı.

---

### DB-005

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** `chatbot_hide` ve `chatbot_uninterested` tablolarında `user_id` index'i yok — her dashboard yüklemesinde iki tam tablo taraması

**Dosya:** `api/database/schema.sql` (`chatbot_hide`, `chatbot_uninterested`), `api/src/Presentation/Controllers/SocialController.php:330, 348`

**Problem:**

```
$ awk '/CREATE TABLE.*`chatbot_hide`/,/^\) ENGINE/' api/database/schema.sql
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `chatbot_id` bigint unsigned NOT NULL,
  `hidden_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
                      ← user_id üzerinde index YOK

$ awk '/CREATE TABLE.*`chatbot_uninterested`/,/^\) ENGINE/' api/database/schema.sql
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `uninterested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
                      ← user_id üzerinde index YOK
```

İkisi de yalnızca `user_id` ile sorgulanıyor:

```php
api/src/Presentation/Controllers/SocialController.php:330, 348
        $rows = Database::getInstance()->selectMulti('chatbot_id FROM chatbot_hide WHERE user_id = ?', [$userId]);
        ...
        $rows = Database::getInstance()->selectMulti('category_id FROM chatbot_uninterested WHERE user_id = ?', [$userId]);
```

**Kanıt (bölüm 24 — kardeş tabloların index'e sahip olduğu ve bu iki sorgunun sıcak yolda
olduğu doğrulandı):**

```
1) Kardeş tablolar index'li mi? EVET:
  chatbot_likes:    UNIQUE KEY `user_id` (`user_id`,`chatbot_id`)
  chatbot_chats:    KEY `chatbot_id` (`chatbot_id`,`user_id`)
  chatbot_conversations: KEY `chatbot_id` (`chatbot_id`,`user_id`)
  user_coin_balance: PRIMARY KEY (`user_id`)
   → yani index koyma alışkanlığı var; bu iki tablo atlanmış.

2) Sıcak yolda mı? EVET:
web/src/app/dashboard/page.jsx:763-766
            ? fetch(`/api/social/getuninterest.php?id=${userId}`)
            ? fetch(`/api/social/gethide.php?user_id=${userId}`)
   → /dashboard her yüklemede İKİSİNİ de çağırıyor (Tur 4'te okundu).
web/src/app/dashboard/notes/page.jsx     → gethide.php tekrar

3) UNIQUE constraint de yok:
   chatbot_likes'ta (user_id, chatbot_id) UNIQUE var → aynı beğeni iki kez eklenemiyor.
   chatbot_hide ve chatbot_uninterested'ta yok → AYNI kullanıcı AYNI botu/kategoriyi
   birden çok kez gizleyebilir (SocialController::addHide/addUninterest mass assignment
   ile, Tur 2 SEC-014). Satırlar birikir, tarama daha da yavaşlar.
```

**Impact:** Her dashboard yüklemesinde iki tam tablo taraması. Tablolar kullanıcı sayısı ×
gizlenen bot sayısı kadar büyüdüğü ve UNIQUE kısıtı olmadığı için mükerrer satır da
biriktiği için maliyet iki yönden artıyor. DB-001 ile aynı sayfada birleşiyor.

**Önerilen çözüm:** `chatbot_hide` ve `chatbot_uninterested` üzerinde
`UNIQUE KEY (user_id, chatbot_id)` / `UNIQUE KEY (user_id, category_id)` — hem index'i
hem mükerrer kaydı çözer (kardeş tablo `chatbot_likes` bu deseni kullanıyor).

**Çözüm önceliği:** Orta — düzeltmesi tek satırlık ALTER, etkisi doğrudan.

---

### DB-006

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç + prod blocker

**Başlık:** Aynı mantıksal anahtar üç farklı depolama tipinde; `chatbotlar` tablosunda `author_user_id` ile `owner_user_id` aynı ebeveyni farklı tiplerle gösteriyor

**Dosya:** `api/database/schema.sql`, `api/database/migrations/001_align_key_types.sql:1-14`

**Problem:**

```
$ Ebeveyn tabloların PK'ları:
  kullanicilar.id    int              (signed)
  chatbotlar.id      int unsigned

$ chatbotlar içindeki iki kullanıcı referansı:
  `author_user_id` int unsigned NOT NULL,     ← ebeveyni signed int
  `owner_user_id`  int NOT NULL,              ← aynı tabloda, farklı tip

$ Diğer çocuk tablolar:
  chatbot_chats.user_id     int
  chatbot_likes.user_id     bigint unsigned
  chatbot_hide.user_id      bigint unsigned
  chatbot_hide.id           int unsigned      ← kardeşi chatbot_likes.id bigint unsigned
```

Migration 001 bu durumu **ölçmüş ve belgelemiş**:

```sql
api/database/migrations/001_align_key_types.sql:1-12
-- 001_align_key_types.sql  (audit: RİSK-10)
--
-- One logical key, three storage types. chatbotlar.id is `int unsigned`
-- while chatbot_id is `int` in 9 tables and `bigint unsigned` in 7;
-- kullanicilar.id is `int` while user_id is `bigint unsigned` in 14.
-- MySQL refuses a foreign key whose column type does not match the
-- referenced one exactly, so RİSK-9 (no foreign keys anywhere) cannot be
-- fixed until this runs first.
--
-- Direction: children are converted to match their parent, not the other
-- way round — changing kullanicilar.id/chatbotlar.id would force every one
-- of these columns to change anyway, plus the primary keys.
```

**Kanıt (bölüm 24 — bu tip karmaşasının kodda gerçek bir hataya yol açtığı doğrulandı):**

```
$ chatbotlar.id'nin unsigned olması kodda soruna yol açmış mı? EVET, belgeli:
api/src/Presentation/Controllers/ChatbotController.php:16-22 (yorum)
        // ChatbotForm.jsx always sends id:-1 as a "this is a new bot" sentinel
        // (botId is unset and bot is null on the create path). chatbotlar.id
        // is an unsigned auto-increment column, so passing -1 straight into
        // the INSERT's column list failed every single create with
        // "SQLSTATE[22003]: Numeric value out of range" — id must never be
        // client-supplied on create, the DB assigns it.
        unset($data['id']);
   → "her chatbot oluşturma isteği başarısız oluyordu" — unsigned tipin doğrudan sonucu.
```

**Neden problem:**
1. **FK eklenemiyor.** DB-002'nin ön koşulu; migration 001'in başlığı bunu açıkça söylüyor.
2. **Sessiz aralık uyumsuzluğu.** `int unsigned` (0–4,29 milyar) ile `bigint unsigned`
   (0–1,8×10¹⁹) arasında değer aktarımı, `int` (−2,1–+2,1 milyar) hedefe yazıldığında
   taşabilir. Migration 001'in başlığı "Narrowing check (run against live data 2026-08-24)"
   ile bunu kontrol ettiğini söylüyor — yani daraltma güvenli olduğu **ölçülmüş**.
3. **`author_user_id` unsigned / `owner_user_id` signed** — aynı tabloda aynı ebeveyni
   gösteren iki sütun farklı tipte. `countByOwner` `author_user_id` kullanıyor (Tur 3'te
   doğrulandı), diğer sorgular `owner_user_id`. Karşılaştırma yapıldığında MySQL örtük
   dönüşüm uygular ve index kullanımı bozulabilir.

**Impact:** FK eklenemiyor (DB-002 blokeli); tip dönüşümleri index kullanımını bozabilir;
yeni geliştiricinin hangi tipi kullanacağı belirsiz.

**Önerilen çözüm:** Migration 001'i uygulamak — zaten yazılmış ve canlı veriye karşı
doğrulanmış. Ön koşul: DB-002'nin versiyon kontrolü sorununu çözmek.

**Çözüm önceliği:** Orta (DB-002'nin parçası).

---

### DB-007

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** İki sorgu `ORDER BY RAND()` kullanıyor — tablo büyüdükçe tam tarama + tam sıralama

**Dosya:** `api/src/Presentation/Controllers/NoteController.php:37`, `api/src/Infrastructure/Repositories/ChatbotRepository.php:188`

**Problem:**

```php
api/src/Presentation/Controllers/NoteController.php:37
             ORDER BY RAND() LIMIT 100",
```

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php:188
        $sql .= " GROUP BY c.id ORDER BY RAND() LIMIT $safeLimit";
```

`ORDER BY RAND()`, MySQL'in her satır için bir rastgele değer üretip **tüm sonuç kümesini
sıralamasını** gerektirir. `LIMIT 100` sıralamadan sonra uygulanır, yani optimizasyon
sağlamaz. İndeks kullanılamaz; geçici tablo + filesort zorunlu.

**Kanıt (bölüm 24 — `$safeLimit`'in enjeksiyon riski taşıyıp taşımadığı ayrıca kontrol
edildi; TAŞIMIYOR):**

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php:169
        $safeLimit = max(1, min(50, $limit));
```
   → 1–50 arasına sıkıştırılmış tamsayı. Sıralama/limit enjeksiyonu YOK.
     Bu yönde bulgu yazılmadı.

```
$ Diğer ORDER BY'lar istemci girdisi içeriyor mu?
$ grep -rnE 'ORDER BY .*\$' api/src api/functions --include=*.php
ChatbotRepository.php:188      ORDER BY RAND() LIMIT $safeLimit    ← clamp'li
WalletController.php:19        ORDER BY id DESC                    ← sabit
   → istemci kontrollü ORDER BY YOK. bölüm 10'un "sorting injection" maddesi TEMİZ.
```

**Etki farkı:**
- `ChatbotRepository:188` (`getSuggested`) — `WHERE c.kategori_id IN (...)` ile önceden
  filtreliyor ve `LIMIT` en fazla 50. Filtrelenmiş küme küçükse maliyet sınırlı.
- `NoteController:37` — `LIMIT 100` ama filtre kapsamı bu turda okunmadı (yalnızca
  satır 37 grep'lendi). `user_dialog_books` tablosu tüm kullanıcıların not kayıtlarını
  tuttuğu için tam tarama maliyeti kullanıcı sayısıyla büyür.

**Impact:** Keşif/öneri sayfalarında veri büyüdükçe yavaşlama. DB-001 kadar ani değil,
ama aynı yönde.

**Önerilen çözüm:** Rastgele seçim için `WHERE id >= (rastgele offset)` yaklaşımı veya
uygulama tarafında rastgele id kümesi üretip `WHERE id IN (...)` kullanmak.

**Çözüm önceliği:** Orta.

---

### DB-008

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Depolama `decimal(10,2)` ile doğru yapılmış, ama PHP tarafı parayı `float`'a çevirip float aritmetiğiyle topluyor

**Dosya:** `api/src/Shared/Utilities/InputSanitizer.php:43-46`, `api/src/Presentation/Controllers/MarketplaceController.php:223-227, 260`, `api/src/Presentation/Controllers/WalletController.php:25-44`

**Problem:**

Depolama tarafı **doğru** — bu turda doğrulandı:

```
$ grep -nE '`[a-z_]+` (float|double|real)' api/database/schema.sql
(çıktı yok)
$ grep -nE '`[a-z_]+` decimal' api/database/schema.sql | head
221:  `ucret_haftalik` decimal(10,2) DEFAULT NULL,
222:  `ucret_aylik` decimal(10,2) DEFAULT NULL,
370:  `miktar` decimal(10,2) NOT NULL,
402:  `gross_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
403:  `payable_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
422:  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
   → tüm para sütunları decimal(10,2). Tek bir float/double yok.
```

Ama PHP tarafı float'a geçiyor:

```php
api/src/Shared/Utilities/InputSanitizer.php:42-46
    /** Validate and return a float price, ensuring it is non-negative. */
    public static function price(mixed $value): float {
        $f = (float) $value;
        return $f >= 0 ? round($f, 2) : 0.0;
    }
```

```php
api/src/Presentation/Controllers/MarketplaceController.php:223-227, 260
                $price = self::linePrice(
                    (float) $bot['ucret_haftalik'],
                    (float) $bot['ucret_aylik'],
                    $durationWeeks
                );
                ...
                $totalAmount += $price;
```

```php
api/src/Presentation/Controllers/WalletController.php:28-42
            $amount = (float) $r['payable_amount'];
            ...
                $balance += $amount;
            ...
                $balance -= $amount;
```

**Neden problem:** PDO decimal sütunları **string** olarak döndürür (emulated prepares
kapalı olduğu için — `db.php:79`). Kod bunları `(float)` ile IEEE-754 çift duyarlıklı
sayıya çeviriyor. İki kayıp noktası:
1. **Komisyon çarpımı:** `$price * $commissionRate` (0.85 / 0.80) — `0.85` ikili olarak
   tam temsil edilemez. `InputSanitizer::price()` sonucu `round($f, 2)` ile yuvarlıyor,
   bu tek işlem için yeterli.
2. **Birikimli toplama:** `$totalAmount += $price` (sepet kalemleri üzerinde döngü) ve
   `$balance += $amount` (satıcının tüm satış geçmişi üzerinde döngü) **yuvarlanmadan**
   birikiyor. `WalletController:49`'da en sonda `round($balance, 2)` var, ama yüzlerce
   satırlık bir geçmişte biriken hata yuvarlamadan önce kuruş düzeyinde sapabilir.

**Kanıt (bölüm 24 — yuvarlamanın nerede yapıldığı izlendi):**

```
$ Yuvarlama noktaları:
InputSanitizer::price():45            round($f, 2)     ← her kalem fiyatında
MarketplaceController:294             InputSanitizer::price($totalAmount)   ← toplam yazılırken
WalletController:49                   round($balance, 2)                    ← bakiye dönerken
   → Yani yuvarlama VAR, ama birikimin ORTASINDA değil, sonunda.
     Kalem sayısı arttıkça sapma riski artar.
```

**Impact:** Kuruş düzeyinde sapma. Sepet 1–5 kalemken ihmal edilebilir; satıcı bakiyesi
yüzlerce satış satırı üzerinden hesaplandığında (`computeBalanceAndTransactions` tüm
geçmişi tarıyor — `WHERE d.seller_user_id = ?`, LIMIT yok) birikebilir.

**Dürüstlük notu:** Bunu **ölçmedim** — somut bir sapma üretmedim. Bulgu, "para float ile
birikimli toplanıyor" yapısal tespitiyle sınırlı. Depolama tarafının doğru olması,
riskin sınırlı kalmasını sağlıyor; bu yüzden MEDIUM, HIGH değil.

**Önerilen çözüm:** Toplamayı SQL tarafına almak (`SUM(payable_amount)` — decimal
aritmetiği kullanır) veya PHP tarafında `bcmath`/tamsayı kuruş kullanmak.
`computeBalanceAndTransactions` için `SUM` ayrıca DB-001 sınıfı performans kazancı da
sağlar (tüm satırları PHP'ye çekmek yerine).

**Çözüm önceliği:** Orta.

---

### DB-009

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `DEFAULT_PAGE_LIMIT` sabiti tanımlı ve hiç kullanılmıyor — hiçbir liste endpoint'inde sayfalama yok

**Dosya:** `api/src/Shared/Constants/AppConfig.php:34`

**Kanıt:**

```
$ grep -rn 'DEFAULT_PAGE_LIMIT' api/ --include=*.php | grep -v vendor
api/src/Shared/Constants/AppConfig.php:34    const DEFAULT_PAGE_LIMIT = 20;
   → tanım dışında SIFIR kullanım.

$ Sayfalama gerektiren ama yapmayan liste sorguları (bu turda tespit edilenler):
ChatbotRepository::getPublished()      → pazaryeri listesi, LIMIT yok      (DB-001)
ChatbotRepository::getPublishedV2()    → aynı, LIMIT yok
admin/kullanicilar.php:2               → tüm kullanıcılar, LIMIT yok       (BE-003)
admin/abonelik.php:2                   → tüm planlar, LIMIT yok
admin/chatbotkategoriler.php:2         → tüm kategoriler, LIMIT yok
WalletController::computeBalanceAndTransactions → tüm satış+çekim geçmişi, LIMIT yok
SocialController::getChatbotComments   → bir botun TÜM yorumları, LIMIT yok
SocialController::getHide/getUninterest → LIMIT yok (DB-005)

$ LIMIT kullanan yerler (hepsi sabit, sayfalama değil):
NotificationController.php:51    LIMIT 10
NoteController.php:37            LIMIT 100
ChatController.php:59, 74        LIMIT 1
   → "en son N" kalıbı, sayfalama değil.
```

**Neden bir bulgu:** Sabitin varlığı sayfalama niyetini gösteriyor; hiç uygulanmaması,
tüm liste endpoint'lerinin veri hacmiyle doğrusal olarak büyümesi anlamına geliyor.
`getChatbotComments`'ın sınırsız olması ayrıca dikkat çekici: yorum eklemenin rate limiti
de yok (Tur 2 SEC-014).

**Impact:** Bellek ve yanıt boyutu veri hacmiyle sınırsız büyüyor.

**Önerilen çözüm:** Liste endpoint'lerine `LIMIT`/`OFFSET` (veya cursor) eklemek ve
sabiti kullanmak.

**Çözüm önceliği:** Düşük–Orta (DB-001 ile birlikte).

---

### DB-010

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `getHistory` her konuşma satırı için iki korelasyonlu alt sorgu çalıştırıyor ve `chatbot_chats.sent_time` üzerinde index yok

**Dosya:** `api/src/Presentation/Controllers/ChatController.php:156-164`

**Problem:**

```php
api/src/Presentation/Controllers/ChatController.php:156-163
        $results = Database::getInstance()->selectMulti(
            "cc.id, cc.chatbot_id, cc.conversation_name, cb.profil_fotografi,
             (SELECT bc_inner.message   FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.chatbot_id AND bc_inner.user_id = cc.user_id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_message,
             (SELECT bc_inner.sent_time FROM chatbot_chats bc_inner WHERE bc_inner.chatbot_id = cc.chatbot_id AND bc_inner.user_id = cc.user_id ORDER BY bc_inner.sent_time DESC LIMIT 1) AS latest_sent_time
             FROM chatbot_conversations cc
             INNER JOIN chatbotlar cb ON cc.chatbot_id = cb.id
             WHERE cc.user_id = ? ORDER BY cc.id DESC",
            [$userId]
        );
```

**Kanıt (bölüm 24 — index durumu kontrol edildi):**

```
$ awk '/CREATE TABLE.*`chatbot_chats`/,/^\) ENGINE/' api/database/schema.sql | grep -E 'KEY|sent_time'
  `sent_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`,`user_id`)
   → (chatbot_id, user_id) index'i WHERE'i karşılıyor ✓
   → ama sent_time index'te YOK → her alt sorgu, eşleşen satırları filesort ile sıralıyor.
```

**Etki:** Konuşma sayısı × 2 alt sorgu. Her alt sorgu o bot+kullanıcı çiftinin tüm
mesajlarını `sent_time`'a göre sıralıyor. 20 konuşması ve konuşma başına 500 mesajı olan
bir kullanıcı için: 40 alt sorgu × 500 satır sıralama.

İki alt sorgu **aynı satırı** iki farklı sütun için ayrı ayrı çekiyor — tek bir alt sorgu
ile ikisi birden alınabilirdi.

**Dürüstlük notu:** Bu, DB-001'in aksine kullanıcı başına sınırlı (kendi konuşmaları).
Bu yüzden LOW. Yine de bölüm 10'un "N+1 query" ve "missing indexes" maddelerinin somut
örneği.

**Önerilen çözüm:** `KEY (chatbot_id, user_id, sent_time)` eklemek — mevcut index'i
genişletir, alt sorgular index'ten sıralanmış okur. Uzun vadede
`chatbot_conversations.last_message_at` sütunu (şemada **var**, kullanılmıyor —
bkz. Doğrulanamayanlar) bu alt sorguları tamamen gereksiz kılabilir.

**Çözüm önceliği:** Düşük.

---

### DB-011

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** 12 yerde `SELECT *`; ikisi bcrypt parola hash'i çekiyor, biri tüm kullanıcı tablosunu

**Dosya:** 12 konum (aşağıda)

**Kanıt:**

```
$ grep -rnE "select(Single|Multi)\(\s*['\"]\*" api/src api/functions api/admin --include=*.php | grep -v vendor
src/Presentation/Controllers/SellerController.php:19     * FROM banka_bilgileri WHERE user_id = ?
src/Presentation/Controllers/WalletController.php:19     * FROM para_cekme_talepleri WHERE user_id = ?
src/Presentation/Controllers/WalletController.php:132    * FROM banka_bilgileri WHERE user_id = ?
functions/rate_limit.php:15                              * FROM rate_limits WHERE rkey = ?
admin/abonelik.php:2                                     * FROM plans
admin/ajax/adminler.php:26                               * FROM adminler WHERE id = ?          ← hash
admin/ajax/adminler.php:48                               * FROM adminler WHERE kullanici_adi = ? ← hash
admin/ajax/giris.php:44                                  * FROM adminler WHERE kullanici_adi = ? ← hash
admin/chatbotkategoriler.php:2                           * FROM chatbot_kategoriler
admin/index.php:69                                       * FROM themes
admin/kullanicilar.php:2                                 * FROM kullanicilar                   ← BE-003
admin/partials/_login.php:14                             * FROM adminler WHERE kullanici_adi = ? ← hash

$ Ayrıca AuthController'da:
api/src/Presentation/Controllers/AuthController.php:235   '* FROM password_resets WHERE ...'
   → 13. konum (grep deseni selectSingle('* ile eşleşti, yukarıdaki listede var).
```

**Neden bir bulgu:** `SELECT *` üç maliyet üretiyor: gereksiz sütun transferi
(`kullanicilar` ve `chatbotlar`'da `training_prompt`/`kapak_fotografi` gibi büyük
alanlar), şema değişikliklerine kırılganlık, ve hassas sütunların (bcrypt hash)
istemeden PHP kapsamına girmesi.

`banka_bilgileri` özellikle dikkat çekici: 24 sütunlu bir tablo (Tur 2'de
`saveBankInfo`'nun beyaz listesinde görüldü) — TC kimlik numarası, vergi numarası,
doğum tarihi gibi alanlar dâhil, hepsi çekiliyor ve `JsonResponse::success(['bank_info' => $row])`
ile **istemciye gönderiliyor** (`WalletController:132-133`). Kullanıcının kendi verisi
olduğu için yetki sorunu yok, ama gereğinden fazla veri döndürülüyor.

**Impact:** Gereksiz veri transferi; hassas alanların gereksiz yayılımı.

**Önerilen çözüm:** Açık sütun listeleri. Kimlik doğrulama yollarında en az `id, sifre`.

**Çözüm önceliği:** Düşük.

---

### DB-012

**Severity:** 🔵 LOW
**TÜR:** mimari

**Başlık:** `getPublishedV2` ile `getPublished` arasındaki fark iki maddeden oluşuyor — Tur 4 API-002'nin açık sorusu kapandı; ancak V2'nin eklediği alt sorgu index'siz bir tabloya gidiyor

**Dosya:** `api/src/Infrastructure/Repositories/ChatbotRepository.php:76-135`

**Bu, Tur 4'ün devrettiği açık sorunun cevabıdır.** Tur 4 API-002, iki endpoint'in zarf
farkını tespit etmiş, **veri** farkını okuyamadığı için Doğrulanamayanlar'a bırakmıştı.

**Fark tam olarak iki maddede:**

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php:109-112 (yalnızca V2'de)
        if ($userId > 0) {
            $where .= ' AND c.kategori_id NOT IN (SELECT category_id FROM chatbot_uninterested WHERE user_id = ?)';
            $params[] = $userId;
        }
```

```
1) V2 sunucu tarafında "ilgilenmiyorum" filtresi uyguluyor (yukarıdaki blok).
2) V2, toplam_comments sayımını ÇIKARIYOR:
   getPublished    → 6 sayım: chats, follows, lists, likes, dislikes, comments
   getPublishedV2  → 5 sayım: chats, follows, lists, likes, dislikes
   (chatbot_comments LEFT JOIN'i de yok — satır 98'de var, satır 131'de yok)
```

**Kanıt (bölüm 24 — filtrenin şu an nerede yapıldığı kontrol edildi):**

```
$ İstemci bu filtreyi kendisi yapıyor mu? EVET:
web/src/app/dashboard/page.jsx:778-791 (Tur 4'te okundu)
        const uninterestedCategoryIds = Array.isArray(unData?.categories) ? unData.categories.map(Number) : [];
        ...
        if (Array.isArray(botsData?.bots)) {
          const mapped = botsData.bots.filter(
              (bot) => !uninterestedCategoryIds.includes(Number(bot.kategori_id)) && ...
   → İstemci getuninterest.php'yi ayrıca çağırıp JS'te filtreliyor.
   → V2'nin amacı bu filtreyi sunucuya taşımak: 2 istek → 1 istek.
```

**Değerlendirme:** V2 makul bir iyileştirme niyeti taşıyor (bir HTTP isteği tasarrufu,
istemci tarafı filtreleme yükünün kaldırılması). Ama üç sorunu var:

1. **Zarf gerilemesi** (Tur 4 API-002): V2 çıplak dizi döndürüyor; V1 `{success, bots}`.
   Geçiş yapılsa istemcinin `botsData?.bots` kontrolü sessizce boş liste üretir.
2. **Alt sorgu index'siz tabloya gidiyor.** `chatbot_uninterested`'ta `user_id` index'i
   yok (DB-005). Yani V2, her pazaryeri sorgusuna bir tam tablo taraması ekliyor.
3. **`toplam_comments` kaybı** — istemci bu alanı kullanıyorsa V2'ye geçişte sessizce
   `undefined` olur. İstemcinin kullanıp kullanmadığı bu turda kontrol edilmedi.

**Impact:** Şu an sıfır (V2 hiç çağrılmıyor — Tur 1 DEAD-001, Tur 4 API-002). Geçiş
denenirse üç ayrı sessiz kırılma.

**Önerilen çözüm:** V2'yi benimsemek isteniyorsa: zarfı V1'e uydurmak, `chatbot_uninterested`
üzerine index eklemek (DB-005), ve `toplam_comments`'ı geri eklemek. Aksi hâlde silmek.

**Çözüm önceliği:** Düşük.

---

## 4. ELENEN FALSE POSITIVE'LER (denetim.md bölüm 24)

| Aday | Neden bulgu değil | Doğrulama |
| --- | --- | --- |
| `include $adminRoutes[$routePath]` → LFI | `array_key_exists` beyaz liste kontrolü + include edilen değer 23 elemanlı sabit tablodan geliyor | `admin/index.php:52-53, 85-86` |
| `autoload.php:69 require_once $file` → LFI | `$class` PHP autoloader'dan geliyor; `class_exists`/`new $var` ile kullanıcı girdisi hiçbir yerde kullanılmıyor | `grep class_exists|interface_exists|new \$` → çıktı yok |
| PHP object injection (`unserialize`) | Repoda `unserialize`/`eval`/`extract`/`create_function` **hiç yok** | repo geneli grep → sıfır eşleşme |
| `ORDER BY RAND() LIMIT $safeLimit` → sıralama/limit enjeksiyonu | `$safeLimit = max(1, min(50, $limit))` — clamp'li tamsayı | `ChatbotRepository.php:169` |
| İstemci kontrollü `ORDER BY` (sorting injection) | Tüm `ORDER BY`'lar sabit; istemci girdisi içeren yok | `grep 'ORDER BY .*\$'` → 2 sonuç, ikisi de güvenli |
| Para hassasiyeti: float sütunlar | **Tüm** para sütunları `decimal(10,2)`; şemada tek bir `float`/`double`/`real` yok | `grep -E '(float|double|real)'` → çıktı yok |
| Collation karışımı JOIN'leri kırıyor | Gruplar arası tüm JOIN'ler **tamsayı** sütunlar üzerinden; string karşılaştırması yok → şu an hata yok (risk latent, DB-004'te not edildi) | `MarketplaceController:16-18`, `ChatbotRepository:92`, `WalletController:11` |
| Charset eksikliği / Türkçe karakter sorunu | 50/50 tablo `utf8mb4`; PDO DSN'de `charset=utf8mb4`; `JSON_UNESCAPED_UNICODE` yaygın | `schema.sql` sayımı; `db.php:74` |
| `MarketplaceController:202`'deki döngü içi sorgu → N+1 | Sepet kalemi başına 1 indexli sorgu; kalem sayısıyla sınırlı ve her kalem için gerçekten farklı veri gerekiyor. Patolojik N+1 değil | `MarketplaceController.php:190-209` |
| `chatbot_chats` JOIN'i indexsiz | `KEY (chatbot_id, user_id)` var — JOIN indexli. Sorun satır çarpımı (DB-001), index eksikliği değil | `schema.sql` `chatbot_chats` tanımı |

---

## 5. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**Enjeksiyon yüzeyi.** Bu turun en net olumlu sonucu. `unserialize`, `eval`, `extract`,
`create_function` repoda hiç yok; iki dinamik `include`'un ikisi de beyaz liste arkasında;
istemci kontrollü `ORDER BY` yok; `LIMIT` değerleri clamp'li. Tur 2'nin admin CRUD
allowlist'lerini doğrulamasıyla birlikte, bu kod tabanının enjeksiyon tarafı gerçekten
kapatılmış görünüyor. Bölüm 5 ve 10'un bu maddeleri temiz.

**Mimarinin gerçekliği.** denetim.md bölüm 5 doğrudan soruyor: *"abstraction yalnızca
görüntüde mi var?"* Ölçüm net: 147 controller metodunun 147'si statik, DI yalnızca üç auth
use-case'inde, 8 repository arayüzünün 6'sı implementasyonsuz, 11 controller repository'yi
atlayıp `Database::getInstance()` çağırıyor. Bu bir bug değil — statik + singleton PHP'de
işleyen bir desen — ama projenin klasör yapısının (`Domain/Interfaces/`,
`Application/UseCases/`, `Infrastructure/Repositories/`) vaat ettiği şey uygulanmamış.
Somut maliyeti test edilemezlik: hiç test olmamasının (Tur 1) sebebi tercih değil, yapı.

**Veritabanı tasarımı ve gerçek durumu arasındaki fark.** Bu turun en çarpıcı bulgusu
şema dosyalarının kendisiydi. `schema.sql` 50 tablo, 0 foreign key, üç farklı tipte aynı
mantıksal anahtar içeriyor — yani **bozuk durumu** belgeliyor. Buna karşılık
`migrations/00{1,2,3}` bu bozuklukları ölçmüş ("38 orphaned rows across 5 relationships
when measured", "run against live data 2026-08-24"), doğru sırayı belgelemiş, 106 FK
kısıtı yazmış ve `ON DELETE` tercihlerini gerekçelendirmiş. Yani problem **zaten tespit
edilmiş ve çözülmüş** — çözüm sadece dağıtılabilir değil, çünkü dört dosyanın hiçbiri
`.gitignore:47`'deki `*.sql` kuralı yüzünden versiyon kontrolünde değil (Tur 1 ARCH-003).
Bu, denetimin gördüğü en asimetrik durum: yüksek kaliteli bir düzeltme, sıfır dağıtım
yolu.

**Performans.** İki farklı ölçek davranışı var. Bir yanda kademeli yavaşlayanlar:
`ORDER BY RAND()`, sayfalama yokluğu, `SELECT *`, `getHistory`'nin korelasyonlu alt
sorguları, iki tabloda eksik `user_id` index'i. Bunlar veri büyüdükçe doğrusal olarak
kötüleşir ve normal profilleme ile bulunur. Öte yanda `getPublished()` var (DB-001) — altı
sınırsız alt tabloya LEFT JOIN + `COUNT(DISTINCT)`. Bu **kademeli değil ani** bozulur:
küçük veriyle görünmez, gerçek veriyle geçici tablo sınırına çarpar. Ve bu ana sayfanın
sorgusu. Kullanım arttıkça uygulamanın yavaşladığı tek yer burası:
`chatbot_chats` her mesajla büyüyor ve yalnızca sayılmak için JOIN ediliyor.

**Bu proje yeni bir sunucuda güvenilir şekilde kurulabilir mi?** (bölüm 10'un açık sorusu)
Hayır, ve nedenleri Tur 1'den beri birikiyor: şema ve migration'lar versiyon kontrolünde
değil; diskteki şema migration'ların düzeltmeyi amaçladığı bozuk durumu içeriyor;
migration sırasını zorlayan araç yok; `_guard.php` ve `session.php` gibi çalışması için
gerekli PHP dosyaları takipsiz (Tur 1 ARCH-001); 9 tablo MariaDB'de hiç oluşmaz (DB-004)
oysa README üç yerde MariaDB desteği vaat ediyor. Bu beş maddenin hiçbiri kod kalitesi
sorunu değil — hepsi **dağıtılabilirlik** sorunu, ve hepsi düzeltilmesi kolay.

**Tip güvenliği ve sessiz dönüşümler.** `strict_types` hiçbir dosyada yok ama tip
beyanları yaygın — yani PHP zorlayıcı modda çalışıyor ve sessiz dönüşümlere izin veriyor.
Bu turda bunun somut bir sonucunu buldum: `intval(dizi)` her zaman `1` döndürüyor ve admin
tema seçimini kalıcı olarak bozuyor (BE-002). Aynı sınıf risk `InputSanitizer::price()`'ta
da var (`(float) "abc"` = `0.0`) ama orada çağıran taraf `if ($price <= 0)` ile yakalıyor —
yani koruma savunma katmanında, tip sisteminde değil. `strict_types` eklemek doğru hamle
ama test olmadan riskli: şu an sessizce dönüşen her çağrı `TypeError` fırlatmaya başlar.

---

## 6. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| `admin/kullanicilar.php`'nin bcrypt hash'leri HTML'e basıp basmadığı (BE-003) | Dosyanın yalnızca 2. satırı okundu; render kısmı okunmadı. Bulgu "gereksiz çekiliyor" tespitiyle sınırlı, sızıntı iddiası yapılmadı. |
| `$current_theme`'in `_header.php`/`_sidebar.php` içinde kullanılıp kullanılmadığı (BE-002) | O iki partial okunmadı. `admin/index.php:91-95`'te kullanımı yorumlanmış; başka kullanım varsa null erişim uyarısı üretebilir. |
| `_login.php` ve `db_backup.php`'nin `APP_DEBUG`'a bağlı `display_errors` ayarından faydalandığı (BE-004) | `admin/index.php:8-11`'in yorumu bu ayarın yapıldığını söylüyor ama ayarın kendisi (satır 12-17) okunmadı. AJAX endpoint'leri `_guard.php` üzerinden çalıştığı için `index.php`'nin ayarını almayabilir. |
| DB-008'in gerçek bir sapma ürettiği | Ölçülmedi. Float birikimi yapısal olarak tespit edildi; somut bir kuruş sapması üretilmedi. |
| DB-001'in tahmini satır sayısının gerçek veriye karşılık gelmesi | Canlı veri yok. 6×10¹² tahmini varsayımsal satır sayılarına dayanıyor; büyüklük mertebesi kesin, kesin sayı değil. |
| `chatbot_conversations.last_message_at` sütununun kullanılıp kullanılmadığı (DB-010) | Şemada mevcut olduğu görüldü; kodda yazılıp okunduğu **kontrol edilmedi**. Kullanılıyorsa `getHistory`'nin alt sorguları tamamen gereksiz olabilir. |
| `NoteController:37`'deki `ORDER BY RAND()` sorgusunun filtre kapsamı (DB-007) | Yalnızca satır 37 grep'lendi; sorgunun tamamı ve `WHERE` koşulu okunmadı. Tam tarama kapsamı bilinmiyor. |
| İstemcinin `toplam_comments` alanını kullanıp kullanmadığı (DB-012) | Kontrol edilmedi; V2'ye geçişte kaybının etkisi belirsiz. |
| `kullanicilar` tablosunun tam sütun listesi (BE-003, DB-011) | Yalnızca `id` tipi okundu. Hangi hassas sütunların `SELECT *` ile çekildiği tam olarak listelenmedi. |
| Migration 001/002/003'ün **gövdeleri** | Yalnızca başlık yorumları (001: 14 satır, 002: 10 satır, 003: 20 satır) ve 003'ün kısıt sayımı okundu. 106 FK'nın doğru tanımlandığı, `ON DELETE` tercihlerinin tutarlı olduğu ve 002'nin silme ifadelerinin güvenli olduğu **doğrulanmadı**. Bunlar veri silen dosyalar — uygulanmadan önce okunmaları gerekir. |

---

## 7. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Veritabanı — en önemli boşluk:**
- **`api/database/migrations/001_align_key_types.sql` (4 KB), `002_clean_orphan_rows.sql`
  (4,2 KB), `003_add_foreign_keys.sql` (14,7 KB) — gövdeleri okunmadı.** Yalnızca başlık
  yorumları ve kısıt sayımı incelendi. `002` kendi başlığında "Every statement here
  DELETES OR REWRITES DATA" diyor. Bu üç dosya DB-002'nin çözümü olarak öneriliyor;
  **uygulanmadan önce satır satır okunmaları gerekir** ve bunu yapmadım.
- `schema.sql`'in 50 tablosundan 9'unun sütun tanımı okundu. Kalan 41 tablo (özellikle
  `kullanicilar` tam sütun listesi, `param_marketplace_refunds`, `param_marketplace_alerts`,
  `param_marketplace_soap_log`, `producer_plans`, `producer_self_use_credits`,
  `constant_translations`, `dialog_*` ailesi, `plans`/`plan_icerikler`) incelenmedi.
- Tur 3'ten devredilen `plans`, `plan_icerikler`, `producer_plans`,
  `producer_self_use_credits` tabloları **hâlâ okunmadı** — BIZ-003'ün "üretici planı hiç
  var olamıyor" tespitiyle şemada bu tabloların bulunması arasındaki olası çelişki
  çözülmedi.
- İzolasyon seviyesi ve deadlock analizi yapılmadı. `Database`'in PDO seçeneklerinde
  (`db.php:76-80`) izolasyon seviyesi ayarlanmıyor → MySQL varsayılanı
  (`REPEATABLE READ`). `createSubscription`'ın transaction'ı ile `withdraw`'ın
  `GET_LOCK`'unun birbiriyle etkileşimi incelenmedi.

**Backend — okunmayanlar:**
- `api/admin/` altındaki ~25 sayfa dosyası: `seo.php` (240 satır), `adminler.php` (83),
  `updateenv.php` (78), `updategv.php` (75), `sitemap.php` (76), `smtp.php` (45),
  `ayarlar.php` (46) ve tüm içerik sayfaları. Bunlardan `updateenv.php` ve `updategv.php`
  Tur 2'den beri devrediliyor ve **hâlâ okunmadı** — `.env`'e ve `global_vars`'a yazan
  iki endpoint.
- `api/admin/partials/_header.php` ve `_sidebar.php` — BE-002'nin `$current_theme` null
  riski bunlara bağlı.
- `api/admin/assets/` altındaki 7 dosya (`admin.js`, `admin.css`, `site.css`,
  `notification.css`, `notifs.css`, `Notification.js`, `Inter.ttf`) — BE-007'de
  `login.js`'in yetim olduğu bulundu, diğerleri taranmadı.
- `NoteController` (8 metot) — yalnızca satır 37 grep'lendi.
- `UserController`, `SocialController`, `SellerController`'ın çoğu metodu — bu turda
  bölüm 5 açısından (tip güvenliği, null handling) incelenmedi.

### Bölüm bazında boş kalan maddeler

**Bölüm 5** — şu maddeler denetlenmedi:
- `SOLID` ilkelerinin metot düzeyinde değerlendirilmesi (yalnızca DI/statiklik ölçüldü).
- `controller responsibility`: controller'ların gövde uzunlukları ve sorumluluk
  karışımı ölçülmedi. `MarketplaceController::createSubscription` 197 satır — tek bir
  metotta doğrulama + fiyatlama + ödeme + ledger + DDL var, ama bu ayrı bir bulgu olarak
  işlenmedi (Tur 3'te fonksiyonel açıdan incelendi).
- `PHP 8.1+ compatibility` ve `deprecated API'ler`: sistematik tarama yapılmadı.
  `composer.json` `>=8.1` diyor; kodda 8.1'de kaldırılmış bir API kullanımı arandı mı —
  **hayır, aranmadı**.
- `resource cleanup`: `curl_close` (ChatController) ve `unlink` (TrainingController)
  Tur 2'de görülmüştü; dosya tanıtıcıları ve `finfo_close` gibi diğer kaynaklar sistematik
  taranmadı.
- `nullable değerler` ve `null handling`: yalnızca BE-002'de bir örnek bulundu; genel
  tarama yapılmadı.

**Bölüm 10** — şu maddeler boş kaldı:
- `isolation level` — hiç incelenmedi (yukarıda).
- `deadlock ihtimali` — `createSubscription`'ın çok tablolu transaction'ı ile eşzamanlı
  `withdraw`/`consumeMessage` arasında kilit sırası analizi yapılmadı.
- `cascading delete` — migration 003'ün `ON DELETE CASCADE`/`RESTRICT` tercihleri yalnızca
  başlık yorumundan bilindi; gerçek tanımlar okunmadı.
- `orphan records` — migration 002 "38 orphaned rows across 5 relationships" diyor;
  hangi 5 ilişki olduğu ve mevcut durumda yenilerinin oluşup oluşmadığı incelenmedi
  (FK olmadığı için oluşmaya devam ediyor olması gerekir).
- `duplicate data` — yalnızca `chatbot_hide`/`chatbot_uninterested`'ta UNIQUE eksikliği
  tespit edildi; diğer tablolar taranmadı.
- `timezone` — Tur 3 COIN-003'te coin sisteminde PHP/MySQL karışımı bulunmuştu; bu turda
  şema tarafı (`timestamp` vs `datetime` sütun tipi tercihi) incelendi ama tutarlılığı
  değerlendirilmedi. Şemada hem `timestamp` hem `datetime` kullanıldığı görüldü
  (`chatbot_chats.sent_time` datetime, `chatbot_likes.liked_at` timestamp) — `timestamp`
  UTC'ye çevirip geri okur, `datetime` çevirmez. Bu **potansiyel bir tutarsızlık** ama
  ayrı bir bulgu olarak işlenecek kadar incelenmedi.
