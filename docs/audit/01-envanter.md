# Tur 1 — Envanter, README Doğrulaması, Mimari ve Ölü Kod

Kapsanan `docs/denetim.md` bölümleri: **1** (projeyi anla), **2** (README'yi kaynak kabul etme),
**3** (dosya/klasör/mimari audit), **20** (dead code / orphan / unused).

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

Aşağıdaki bulguların tamamı bu listedeki dosyalardan çıkarıldı. Listede olmayan dosya hakkında
bulgu yazılmadı.

**Tam okunan:**
`docs/denetim.md` (bölüm 1–4, 20–24, 27), `README.md` (satır 1–430, 563–780),
`api/src/autoload.php`, `api/admin/ajax/_guard.php`, `web/scripts/phpify.js`,
`web/package.json`, `package.json`, `autostart.bat`, `.gitignore` (ilgili satırlar),
`api/admin/uploads/.htaccess`, `api/admin/.htaccess`, `web/src/lib/utils.js`

**Kısmi okunan (belirtilen satır aralıkları):**
`api/src/Presentation/Controllers/ChatbotController.php:160–180, 285–345`,
`api/admin/index.php:1–12, 55–62`, `api/admin/hit.php:1–15`,
`web/public/api/get_bank_info.php:1–12`, `web/src/shared/api/client.js:1–30`,
`web/src/app/dashboard/wallet/page.jsx:1–12, 140–145`,
`web/src/app/dashboard/chat/page.jsx:12`,
`web/src/app/dashboard/settings/page.jsx:378–400, 595–845 (grep ile)`,
`web/src/features/sharing/ShareModal.jsx:103`,
`web/src/app/dashboard/page.jsx:227, 391, 433, 1095–1115`,
`web/src/shared/ui/badge.jsx:24–27`, `api/functions/db.php:423`,
`api/database/schema.sql` (CREATE TABLE envanteri), `project_tree.txt:1–20, 420–515`

**Envanteri alınan dizinler (dosya listesi + grep, içerik okumadan):**
`api/api/**` (121 dosya), `api/src/**`, `api/admin/**` (vendor hariç), `api/functions/**`,
`api/database/**`, `web/src/**` (210 dosya), `web/public/**`, `.history/`

---

## 1. SİSTEM MODELİ (denetim.md bölüm 1)

Bu bölüm iddia değil, sonraki turların üzerine kuracağı zihinsel model. Doğrulanamayan kısımlar
açıkça işaretlendi.

### 1.1 İki uygulama, tek origin

```
tarayıcı → http://127.0.0.1:3000  (web/server.js — Express)
              ├── /api/*, /admin/*, /assets/*  → http-proxy-middleware → PHP_TARGET (:8000)
              └── diğer her şey                → Next.js request handler
```

`web/next.config.mjs` aynı üç prefix için `rewrites()` de tanımlıyor — `server.js` çalışmayan
platformlar (Vercel) için. `/assets/*` proxy kuralının karşılığı diskte yok (bkz. ARCH-014).

### 1.2 Backend katmanları — kâğıt üzerinde ve gerçekte

`api/api/` altındaki **120 endpoint dosyası** (+ `index.php` 404 fallback) 3 satırlık
thin-wrapper. Hepsi `src/autoload.php` require edip tek bir statik controller metodu çağırıyor.
120/120 eşleşme doğrulandı — çağrılan ama tanımlı olmayan tek metot yok:

```
Doğrulama: her endpoint dosyasından `XController::method` çıkarıp
           Controllers/*.php içindeki `function` tanımlarıyla comm ile diff
Sonuç:     "CALLED BUT NOT DEFINED" → boş
           "DEFINED BUT NOT CALLED" → 5 metot, hepsi private/self:: ile içeriden çağrılıyor
           (assertValidPrice, handleImageUploads, linePrice, paymentsColumnExists,
            computeBalanceAndTransactions) → false positive, bulgu yazılmadı
```

Gerçek katman durumu (dosya sayımı ile):

| Katman | Diskte | Not |
| --- | --- | --- |
| `Presentation/Controllers/` | 14 dosya | Tüm iş yükü burada |
| `Presentation/Middleware/` | 1 (`AuthMiddleware`) | — |
| `Presentation/Response/` | 1 (`JsonResponse`) | — |
| `Application/UseCases/Auth/` | 3 dosya | **Tek dolu use-case klasörü** |
| `Application/UseCases/{Chatbot,User,Wallet}/` | 0 | Boş |
| `Application/{DTO,Validators}/` | 0 | Boş |
| `Domain/Interfaces/` | 8 arayüz | 6'sının implementasyonu yok (ARCH-007) |
| `Domain/Entities/` | 0 | Boş |
| `Infrastructure/Database/` | 1 (`BaseRepository`) | — |
| `Infrastructure/Repositories/` | 2 | `ChatbotRepository`, `UserRepository` |
| `Infrastructure/{Cache,FileStorage,Mail,Payment}/` | 0 | Boş |
| `Services/` | 0 | Autoloader'da hiç yok (ARCH-006) |
| `Shared/{Constants,Exceptions,Utilities}/` | 1+1+1 | — |

Yani mimari **Controller → PDO** düzeyinde; Clean Architecture iskeleti kurulmuş ama
yalnızca auth akışında etine kavuşmuş.

### 1.3 Frontend mimarisi

FSD (Feature-Sliced Design) benzeri bir ayrım var: `app/` (Next.js App Router route'ları),
`entities/`, `features/`, `widgets/`, `shared/`. 210 dosya. Ancak:

- Merkezî API client (`shared/api/client.js`) **hiç import edilmiyor**; onun yerine 51 dosyada
  156 adet çıplak `fetch(` çağrısı var (DOC-004).
- `app/dashboard/<route>/components/` altında `entities/` ve `features/` ile **aynı isimli**
  paralel component setleri var (ARCH-010, DEAD-002).

### 1.4 Doğrulanamayan lifecycle'lar

denetim.md bölüm 1 şu akışları da istiyor: authorization, marketplace satın alma, subscription
lifecycle, coin/message lifecycle, seller/payment lifecycle, AI request lifecycle, file
upload/training lifecycle. **Bu turda controller gövdeleri okunmadı** — bu akışlar Tur 2–5'in
konusu. Tur 1 kapsamı yalnızca envanter/dosya/README katmanı. Tahminle doldurulmadı.

---

## 2. README ↔ KOD ÇELİŞKİLERİ (denetim.md bölüm 2)

`README.md` bu turda **denetlenen materyal** olarak ele alındı, kaynak olarak değil. Her iddia
diskte doğrulandı.

---

### DOC-001

**Severity:** 🟠 HIGH
**TÜR:** doküman + prod blocker

**Başlık:** README "bu repoda şema ve migration yok" diyor; diskte 50 tablolu bir şema ve 3 migration duruyor — ama hiçbiri versiyon kontrolünde değil

**Dosya:** `README.md:228`, `README.md:570`, `api/database/schema.sql`, `api/database/migrations/00{1,2,3}_*.sql`

**Problem:**

README iki ayrı yerde kesin dille aynı şeyi söylüyor:

```markdown
README.md:228
There is no schema file, migration tool, or seed script in this repository, so an existing
`lumanoris` database must be supplied. See [Database](#database).

README.md:570
> **This repository contains no schema, no migrations, and no seed data.** There is no migration
> tool, no `.sql` file under version control (`.gitignore` excludes `*.sql` and `db_backup/`), and no
> package script that creates or resets a database.
```

**Kanıt (false positive kontrolü — bölüm 24):**

```
$ ls -la api/database api/database/migrations
api/database/schema.sql                     29971 bayt
api/database/migrations/001_align_key_types.sql    4026 bayt
api/database/migrations/002_clean_orphan_rows.sql  4194 bayt
api/database/migrations/003_add_foreign_keys.sql  14657 bayt

$ grep -oE 'CREATE TABLE[^(]*`[a-z_0-9]+`' api/database/schema.sql | wc -l
50

$ git ls-files api/database
(çıktı yok)

$ git check-ignore -v api/database/schema.sql
.gitignore:47:*.sql     api/database/schema.sql
```

`project_tree.txt:426-431` (25.08.2026 09:56'da üretilmiş taze ağaç) de bu dosyaları listeliyor:

```
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_align_key_types.sql
│   │   │   ├── 002_clean_orphan_rows.sql
│   │   │   └── 003_add_foreign_keys.sql
│   │   └── schema.sql
```

**Neden problem:** İki katmanlı bir problem, ikisini de ayırmak gerekiyor:

1. **Doküman hatası:** README'nin "no schema" cümlesi çalışma ağacı için yanlış. Yeni bir
   geliştirici README'ye inanıp veritabanını "out of band" aramaya çıkacak, oysa 50 tablolu
   tam şema `api/database/schema.sql` içinde duruyor.
2. **Gerçek prod riski:** README'nin dar teknik iddiası ("no `.sql` file under version control")
   **doğru** — `.gitignore:47`'deki `*.sql` kuralı şemayı da yakalıyor. Yani şema tek bir
   geliştiricinin diskinde yaşıyor; klonlanan/CI'a giden/deploy edilen repoda **yok**.

**Nasıl tetiklenebilir:** `git clone` → `api/database/` klasörü hiç oluşmaz → şema kaynağı yok.

**Impact:** Şemanın tek kopyası versiyonsuz, yedeksiz, geçmişsiz. Disk kaybı = şema kaybı.
Şema değişikliklerinin review edilme veya migration sırasının doğrulanma imkânı yok.

**Önerilen çözüm:** `.gitignore`'a `!api/database/**/*.sql` negative pattern ekleyip şemayı ve
migration'ları takibe almak; README'nin 228 ve 570. satırlarını gerçek duruma göre yazmak.

**Çözüm önceliği:** Yüksek — production öncesi zorunlu.

---

### DOC-002

**Severity:** 🔵 LOW
**TÜR:** doküman

**Başlık:** README'nin "bazı sınıflar iki kez var, autoloader sırası hangisinin kazandığını belirliyor" uyarısı artık geçersiz — üç duplike dizin silinmiş

**Dosya:** `README.md:137-142`

**Problem:**

```markdown
README.md:137
> Some classes exist twice, and the autoloader's directory order decides which one wins:
> `AppConfig` (`Shared/Constants/` wins over `Config/`), `AuthMiddleware` (`Presentation/Middleware/`
> wins over `Middleware/`) and `AppException` (`Shared/Exceptions/` is loaded unconditionally).
> `src/Exceptions/` is not in the autoloader's search list at all, so it is unreachable. Editing the
> losing copy has no effect.
```

**Kanıt (bölüm 24 — iddiadan önce arama):**

```
$ ls api/src/Config api/src/Middleware api/src/Exceptions
ls: cannot access 'api/src/Config': No such file or directory
ls: cannot access 'api/src/Middleware': No such file or directory
ls: cannot access 'api/src/Exceptions': No such file or directory

$ git status --short | grep '^D '
D  api/src/Config/AppConfig.php
D  api/src/Exceptions/AppException.php
D  api/src/Middleware/AuthMiddleware.php
```

Yani duplikeler **staged olarak silinmiş**, ama README uyarısı güncellenmemiş.

**Neden problem:** README bir sınıf çakışması riski uyarıyor; okuyan geliştirici olmayan bir
tuzağı aramaya çıkıyor. Ters yönde de risk var: uyarı hâlâ durduğu için asıl temizliğin
yapıldığı fark edilmiyor.

**Impact:** Kafa karışıklığı; yanlış yerde debug. Runtime etkisi yok.

**Önerilen çözüm:** README:137-142 bloğunu kaldırmak.

**Çözüm önceliği:** Düşük.

---

### DOC-003

**Severity:** 🔵 LOW
**TÜR:** doküman

**Başlık:** README, commit edilmiş Playwright screenshot script'lerini "newcomer'ın tökezleyeceği dosyalar" arasında sayıyor — dosyalar silinmiş

**Dosya:** `README.md:186-188`

**Problem:**

```markdown
README.md:186
- `web/_ux*.js`, `web/_creator_after.js`, `web/_visid_after*.js`, `web/_verify_sidebar_final.js` are
  committed one-off Playwright screenshot scripts with hard-coded absolute output paths. `playwright`
  is not a declared dependency and is not installed.
```

**Kanıt:**

```
$ ls web/_*.js
ls: cannot access 'web/_*.js': No such file or directory

$ git status --short | grep '^D  web/_'
D  web/_creator_after.js
D  web/_ux1_register.js
D  web/_ux2_buy.js
D  web/_ux3_complete_buy.js
D  web/_ux4_checkout.js
D  web/_verify_sidebar_final.js
D  web/_visid_after.js
D  web/_visid_after2.js
```

**Impact:** Yalnızca doküman gürültüsü.

**Önerilen çözüm:** README:186-188'i kaldırmak.

**Çözüm önceliği:** Düşük.

---

### DOC-004

**Severity:** 🟡 MEDIUM
**TÜR:** doküman + mimari

**Başlık:** README merkezî API client'ı kanonik olarak sunuyor; `shared/api/client.js` hiçbir dosya tarafından import edilmiyor, 51 dosyada 156 çıplak `fetch(` var

**Dosya:** `README.md:404`, `web/src/shared/api/client.js`

**Problem:**

README, API sözleşmesini anlatırken client'ı referans veriyor:

```markdown
README.md:404
  JSON string. `web/src/shared/api/client.js` builds exactly that shape; most pages build it inline
  with `FormData`. Some endpoints differ: ...
```

Dosyanın kendi başlık yorumu da kendini zorunlu tek geçiş noktası ilan ediyor:

```javascript
web/src/shared/api/client.js:1-6
/**
 * Centralized API client for all backend requests.
 * All fetch calls should go through these helpers so error handling,
 * headers, and base URL are consistent across features.
 */

const BASE_URL = '';
```

**Kanıt (bölüm 24 — dinamik erişim/alias olasılığı da arandı):**

```
$ grep -rl 'shared/api/client' web/src | wc -l
0

$ grep -rn "api/client\|apiClient\|from ['\"]@/shared/api" web/src
(çıktı yok)

$ grep -rc 'fetch(' web/src --include=*.jsx --include=*.js | grep -v ':0' \
    | awk -F: '{s+=$2} END {print s" calls across "NR" files"}'
156 calls across 51 files
```

**Neden problem:** "All fetch calls should go through these helpers" ifadesi 0/156 oranıyla
gerçekleşmemiş. Hata işleme, `credentials: 'include'`, base URL ve response-envelope
çözümlemesi 51 dosyada bağımsız olarak tekrar ediliyor — bu, sonraki turlarda API sözleşme
uyumsuzluklarının (bölüm 11) ana kaynağı olacak yapısal zemin.

**Impact:** Tek noktadan hata işleme/retry/auth-redirect ekleme imkânı yok. README'ye güvenerek
client'a kod ekleyen biri hiçbir etki görmez.

**Önerilen çözüm:** Ya client'ı gerçekten benimseyip 156 çağrıyı kademeli taşımak, ya dosyayı
ölü kod olarak silip README:404'ü düzeltmek. Arada kalması en kötü durum.

**Çözüm önceliği:** Orta — mimari kararı gerektiriyor, acil değil.

---

### DOC-005

**Severity:** 🔵 LOW
**TÜR:** doküman

**Başlık:** README, admin panelinin `$_SERVER['DOCUMENT_ROOT']` ile dosya yüklediğini söylüyor; repoda hiç `DOCUMENT_ROOT` kullanımı yok

**Dosya:** `README.md:329-331`, `api/admin/index.php:1-5`

**Problem:**

```markdown
README.md:329-331
panel's pretty URLs (`/admin/seo`, `/admin/kullanicilar`, …) resolve. Running the server from `api/`
also sets `DOCUMENT_ROOT` correctly — `admin/index.php` loads
`$_SERVER['DOCUMENT_ROOT'] . '/functions/util.php'`.
```

**Kanıt:**

```
$ (Grep) DOCUMENT_ROOT  in api/  (vendor hariç)
No matches found
```

Gerçek kod `__DIR__` kullanıyor:

```php
api/admin/index.php:1-5
<?php
require_once __DIR__ . '/../functions/util.php';
require_once __DIR__ . '/functions/tailmind.php';
date_default_timezone_set('Europe/Istanbul');
require '../functions/db.php';
```

**Neden problem:** README, "sunucuyu `api/` içinden başlatmak zorunludur" gerekçesini var
olmayan bir `DOCUMENT_ROOT` bağımlılığına dayandırıyor. Gerçek gerekçe farklı (bkz. ARCH-008 —
CWD-relative `require '../functions/db.php'`). Yanlış gerekçe, deployment'ta yanlış düzeltmeye
yol açar.

**Impact:** Yanıltıcı deployment bilgisi.

**Önerilen çözüm:** README:329-331'i gerçek mekanizmayla (CWD-relative include'lar) değiştirmek.

**Çözüm önceliği:** Düşük.

---

### DOC-006

**Severity:** 🔵 LOW
**TÜR:** doküman

**Başlık:** README, `autostart.bat`'in `router.php` olmadan başlattığını ve admin pretty URL'lerin 404 verdiğini söylüyor; dosya artık `router.php` kullanıyor

**Dosya:** `README.md:345-347`, `autostart.bat:10`

**Problem:**

```markdown
README.md:345-347
`autostart.bat` at the repository root opens both terminals on Windows, but it starts the backend as
`php -S localhost:8000 -t api` — without `router.php`. API endpoints work, but admin pretty URLs
return 404 under that command.
```

**Kanıt** — `autostart.bat` bu sorunu zaten çözmüş, üstelik yorumda neden çözüldüğünü de yazmış:

```bat
autostart.bat:2-12
REM PHP backend. Two things matter here and both used to be wrong:
REM  1) router.php must be passed — without it api/router.php never runs, and
REM     the URI decoding/rewriting it does is skipped, so pretty admin URLs and
REM     any encoded path break. package.json's dev:all always used the router;
REM     this file did not, so the two recipes behaved differently.
REM  2) bind 127.0.0.1, not "localhost". On Windows localhost resolves to ::1
REM     first, which left PHP listening on IPv6 only while the Node server binds
REM     IPv4 — the proxy then could not reach it.
start cmd /k "cd api && php -S 127.0.0.1:8000 router.php"
```

Aynı satır README'nin Troubleshooting bölümünü de geçersiz kılıyor: "Admin panel: `/admin/`
loads but `/admin/seo` returns 404 → The PHP server was started without `router.php` (for
example by `autostart.bat`)" — `autostart.bat` artık bu hatayı yapmıyor.

**Impact:** Var olmayan bir sorun için troubleshooting adımı.

**Önerilen çözüm:** README:345-347 ve ilgili Troubleshooting maddesini güncellemek.

**Çözüm önceliği:** Düşük.

---

### DOC-007

**Severity:** 🔵 LOW
**TÜR:** doküman

**Başlık:** README `MIN_WEEKLY_PRICE`'ın hiçbir PHP kodu tarafından okunmadığını söylüyor; 4 çağrı noktasında okunuyor ve zorlanıyor

**Dosya:** `README.md:689`, `api/src/Presentation/Controllers/ChatbotController.php:170-171, 293-294, 326-338`

**Problem:**

```markdown
README.md:689 (tablo hücresi)
| `MIN_WEEKLY_PRICE` / `MAX_WEEKLY_PRICE` | 1 / 5000 ₺ | `ChatbotController::assertValidPrice()` runs
on publish and on price update, but it enforces only `value > 0` and `value <= max` —
`MIN_WEEKLY_PRICE` is never read by any PHP code. ... |
```

**Kanıt:**

```
$ grep -n 'assertValidPrice' api/src/Presentation/Controllers/ChatbotController.php
170:        self::assertValidPrice($weekly, 'Haftalık', AppConfig::MAX_WEEKLY_PRICE, AppConfig::MIN_WEEKLY_PRICE);
171:        self::assertValidPrice($monthly, 'Aylık', AppConfig::MAX_WEEKLY_PRICE * 4, round(AppConfig::MIN_WEEKLY_PRICE * 4 * AppConfig::DISCOUNT_MONTHLY_FACTOR));
293:        self::assertValidPrice($weekly, 'Haftalık', AppConfig::MAX_WEEKLY_PRICE, AppConfig::MIN_WEEKLY_PRICE);
294:        self::assertValidPrice($monthly, 'Aylık', AppConfig::MAX_WEEKLY_PRICE * 4, round(AppConfig::MIN_WEEKLY_PRICE * 4 * AppConfig::DISCOUNT_MONTHLY_FACTOR));
```

Fonksiyonun kendisi `$min`'i gerçekten zorluyor ve kendi yorumu README'nin anlattığı durumun
**geçmişte** kaldığını söylüyor:

```php
api/src/Presentation/Controllers/ChatbotController.php:320-333
     * The lower bound used to be a bare `$value <= 0`, so AppConfig's
     * MIN_WEEKLY_PRICE was documented and mirrored into pricing.js but read by
     * no PHP code at all — a 0,01 ₺ bot passed both layers. $min is now
     * explicit and scales the same way $max does for the monthly field.
     */
    private static function assertValidPrice(float $value, string $label, float $max, float $min): void {
        if ($value < $min || $value > $max) {
            JsonResponse::error(
                sprintf(
                    '%s fiyat en az %s₺, en fazla %s₺ olmalıdır.',
                    $label,
                    number_format($min, 2, ',', '.'),
                    number_format($max, 0, ',', '.')
                ),
                400, AppConfig::ERR_VALIDATION
            );
        }
```

**Neden problem:** README kapatılmış bir güvenlik/iş-mantığı boşluğunu açık gösteriyor. Bu tür
"eski durumu anlatan" README maddeleri, denetimde gerçek açıkların yanında gürültü üretiyor ve
README'nin genel güvenilirliğini düşürüyor.

**Impact:** Yanlış risk değerlendirmesi.

**Önerilen çözüm:** README:689 hücresini güncellemek.

**Çözüm önceliği:** Düşük.

---

### DOC-008

**Severity:** ⚪ INFO
**TÜR:** doküman

**Başlık:** README'nin "Folder Structure" ağacı diskteki 5 üst düzey öğeyi hiç göstermiyor

**Dosya:** `README.md:143-176`

**Problem:** README'nin ağacında bulunmayan, diskte bulunan öğeler:

| Diskte var | README ağacında |
| --- | --- |
| `api/database/` (schema + 3 migration) | yok (DOC-001) |
| `docs/` (`denetim.md`, `audit/`) | yok |
| `project_tree.txt` (35 KB, 25.08.2026 üretimi) | yok |
| `api/src.zip` (52.9 MB) | yok (ARCH-004) |
| `.history/` (182 dosya, 22 MB) | yok (ARCH-011) |

**Kanıt:**

```
$ find . -maxdepth 2 -not -path './.git*' -not -path '*/node_modules*' -not -path './api/vendor*'
./api/database  ./docs  ./project_tree.txt  ./api/src.zip  ./.history
```

**Impact:** Ağaç, "newcomer'ın tökezleyeceği dosyalar" listesi olarak sunuluyor ama en büyük iki
tökezleme kaynağını (53 MB zip, 22 MB history) atlıyor.

**Çözüm önceliği:** Düşük.

---

### DOC-009

**Severity:** ⚪ INFO
**TÜR:** doküman

**Başlık:** README'nin `dev:all` script alıntısı `localhost:8000` diyor; `web/package.json` `127.0.0.1:8000` kullanıyor

**Dosya:** `README.md:301`, `web/package.json:7`

**Kanıt:**

```json
web/package.json:7
"dev:all": "concurrently -k -n web,api -c blue,green \"npm run dev\" \"cd ../api && php -S 127.0.0.1:8000 router.php\"",
```

Fark önemsiz görünüyor ama `autostart.bat:7-9`'daki yorum tam olarak bu ayrımın Windows'ta
IPv6/IPv4 nedeniyle kritik olduğunu anlatıyor. README yanlış varyantı belgeliyor.

**Impact:** Windows'ta kopyala-yapıştır ile proxy'nin backend'e ulaşamaması.

**Çözüm önceliği:** Düşük.

---

### README'nin DOĞRU çıkan iddiaları (denetim.md bölüm 27 — sadece sorun listesi çıkarma)

Denetimin dürüst olması için doğrulanıp **doğru** bulunan iddialar da kayda geçiyor. README bu
projede alışılmadık biçimde özeleştirel ve büyük ölçüde isabetli:

| README iddiası | Doğrulama | Sonuç |
| --- | --- | --- |
| "120 endpoint entrypoint + index.php 404 fallback" | `find api/api -name '*.php'` → 121, index.php hariç 120 | ✅ Doğru |
| "6 arayüzün implementasyonu yok" | grep ile 6/8 arayüz hiç referans edilmiyor | ✅ Doğru (ARCH-007) |
| "There is no Docker, CI, or test tooling of any kind" (`README.md:94`) | `find` ile Dockerfile/docker-compose/.github/jest/phpunit/*.test.js → hiçbiri yok | ✅ Doğru |
| "`api/` altında `assets` dizini yok, `/assets/*` proxy kuralı kullanılmıyor" | `ls api/assets` → yok | ✅ Doğru (ARCH-014) |
| "`web/src/php` yok, `phpify` bozuk" | `ls web/src/php` → yok | ✅ Doğru (DEAD-006) |
| "`Database::truncate()` hiçbir yerde çağrılmıyor" | `api/functions/db.php:423` tanım; başka çağrı yok | ✅ Doğru (DEAD-007) |
| "`global.scss` 11.000 satır, hiçbir şey import etmiyor" | `wc -l` → 11004 satır (303 KB) | ✅ Doğru (DEAD-005) |
| "Şu 11 npm bağımlılığı `web/src` altında import edilmiyor" | 9'u doğrulandı, 2'si nüanslı (ARCH-012) | ✅ Büyük ölçüde doğru |
| "`web/public/api/*.php` var olmayan bir path require ediyor + proxy nedeniyle erişilemez" | `require '../../php/functions/db.php'` doğrulandı | ✅ Doğru (ARCH-013) |
| "`.gitignore` `*.sql` ve `db_backup/` hariç tutuyor" | `.gitignore:46-47` | ✅ Doğru — ama DOC-001'deki yan etkiyle |

---

## 3. DOSYA / KLASÖR / MİMARİ AUDIT (denetim.md bölüm 3)

---

### ARCH-001

**Severity:** 🔴 CRITICAL
**TÜR:** prod blocker + güvenlik

**Başlık:** 16 takip edilen admin dosyası, versiyon kontrolünde OLMAYAN iki dosyayı `require_once` ediyor — temiz klonda admin paneli ve tüm admin AJAX'ı fatal error veriyor, CSRF/yetki guard'ı repoda hiç yok

**Dosya:** `api/admin/ajax/_guard.php` (untracked), `api/admin/functions/session.php` (untracked)

**Fonksiyon/Class:** `admin_session_start()`, `csrf_check()` çağrı zinciri

**Problem:**

`git status` bu iki dosyayı `??` (untracked) olarak gösteriyor:

```
$ git status --short --untracked-files=normal | grep '^??'
?? api/admin/ajax/_guard.php
?? api/admin/functions/session.php
?? api/admin/uploads/
?? api/src.zip
?? docs/
?? project_tree.txt
```

Oysa **takip edilen** 14 admin AJAX dosyası ve `admin/index.php` bunları require ediyor:

```
$ grep -rn "_guard" api/admin --include=*.php
api/admin/ajax/adminler.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/ayarlar.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/create.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/db_backup.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/delete.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/read.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/readenv.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/seo.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/sitemap.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/smtp.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/update.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/updateenv.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/updategv.php:2:require_once __DIR__ . '/_guard.php';
api/admin/ajax/upload.php:2:require_once __DIR__ . '/_guard.php';

$ grep -rn "functions/session" api/admin --include=*.php
api/admin/ajax/cikis.php:2:require_once __DIR__ . '/../functions/session.php';
api/admin/ajax/giris.php:2:require_once __DIR__ . '/../functions/session.php';
api/admin/ajax/_guard.php:21:require_once __DIR__ . '/../functions/session.php';
api/admin/index.php:58:require_once __DIR__ . '/functions/session.php';
```

Bu iki dosya, sistemin **tek** admin yetki + CSRF kapısı:

```php
api/admin/ajax/_guard.php:20-39
require_once __DIR__ . '/../../functions/util.php';
require_once __DIR__ . '/../functions/session.php';

admin_session_start();

if (empty($_SESSION['admin'])) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'status' => 'error', 'message' => 'Yetkisiz erişim.']);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!csrf_check($token)) {
        http_response_code(403);
        ...
```

**Neden problem:** `require_once` başarısız olursa PHP **fatal error** verir — yani temiz bir
klonda admin paneli hiç açılmaz. Bu, "sessizce güvensiz çalışır" senaryosundan daha iyi, ama
asıl mesele şu: **projenin en riskli yüzeyinin (admin CRUD motoru) tek koruma katmanı versiyon
kontrolüne hiç girmemiş.** README bu guard'ı var olan bir özellik gibi anlatıyor
(`api/admin/partials/_header.php:5` de ona atıf yapıyor), ama repo o dosyayı taşımıyor.

**Nasıl tetiklenebilir:**
1. `git clone` → `cd api && php -S 127.0.0.1:8000 router.php` → `/admin` → `require_once`
   `functions/session.php` başarısız → fatal error, panel açılmıyor.
2. Daha tehlikeli varyant: deploy sırasında biri fatal error'ı görüp `_guard.php`'yi
   "hızlıca" boş/yetersiz bir dosyayla dolduruyor → 14 endpoint yetki ve CSRF kontrolsüz kalıyor.

**Impact:** Admin paneli çalışmıyor (prod blocker) **veya** yeniden yazılırsa CSRF + admin
yetki kontrolü kaybı. `db_backup.php` (canlı DB'yi üzerine yazan restore), `delete.php`,
`upload.php`, `updateenv.php` bu guard'ın arkasında.

**Kanıt:** yukarıdaki `git status` + `grep` çıktıları; `_guard.php:20-39` alıntısı.

**Önerilen çözüm:** `api/admin/ajax/_guard.php` ve `api/admin/functions/session.php`'yi derhal
commit etmek. Ardından "takip edilen bir dosyanın require ettiği her dosya takip edilmiş
olmalı" kuralını CI'sız da olsa bir pre-commit kontrolüyle sabitlemek.

**Çözüm önceliği:** **Acil** — production öncesi ilk iş.

---

### ARCH-002

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + prod blocker

**Başlık:** Yükleme dizinindeki PHP-çalıştırma engelini kuran `.htaccess` versiyon kontrolünde değil — deploy'da kaybolur

**Dosya:** `api/admin/uploads/.htaccess` (untracked, `?? api/admin/uploads/`)

**Problem:** Dosya, kullanıcı yüklemelerinin script olarak yorumlanmasını engelleyen tek katman
ve bunu kendi yorumunda açıkça söylüyor:

```apache
api/admin/uploads/.htaccess:1-13
# Uploads are user-supplied bytes served from a public path. Even though the
# endpoint now verifies content and names files itself, never let this
# directory hand anything to a script interpreter — a server configured to map
# extra extensions to PHP (AddHandler, an inherited .htaccess) would otherwise
# turn a stored file into code.
php_flag engine off
<IfModule mod_php.c>
    php_admin_flag engine off
</IfModule>
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule \.(php[0-9]?|phtml|phar|cgi|pl|py|sh|htaccess)$ - [F,L,NC]
</IfModule>
```

**Kanıt (bölüm 24 — kardeş .htaccess takipli mi diye kontrol edildi):**

```
$ git ls-files api/admin/.htaccess api/admin/uploads/.htaccess
api/admin/.htaccess
                       ← uploads/.htaccess satırı YOK

$ git status --short --untracked-files=normal | grep uploads
?? api/admin/uploads/
```

Yani `api/admin/.htaccess` (pretty-URL rewrite) takipli, ama güvenlik amaçlı olan
`uploads/.htaccess` takipsiz. Bu bir tercih değil, gözden kaçma görünüyor.

**Neden problem:** ARCH-001'in aksine bu dosya eksik olduğunda **sessizce** eksik olur —
uygulama sorunsuz çalışır, sadece koruma yoktur.

**Nasıl tetiklenebilir:** Repo klonlanıp Apache'ye deploy edilir; `uploads/` dizini var ama
`.htaccess` yok; upload endpoint'inin içerik doğrulamasını atlatan bir dosya (veya
`AddHandler`'lı bir sunucu konfigürasyonu) yüklenen içeriği çalıştırılabilir hâle getirir.

**Impact:** Yükleme dizini üzerinden uzaktan kod çalıştırma yolunun savunma katmanı kaybı.
Gerçek exploit `upload.php`'nin doğrulamasının aşılmasını da gerektirdiği için CRITICAL değil
HIGH verildi — `upload.php` içeriği bu turda okunmadı, o değerlendirme Tur 2'ye ait.

**Önerilen çözüm:** `git add -f api/admin/uploads/.htaccess`. `.gitignore`'un `uploads/`
klasörünü nasıl etkilediğini de kontrol etmek gerekiyor (bu turda `git check-ignore` ile
doğrulanmadı — dizin untracked, ignore edilmiş değil).

**Çözüm önceliği:** Yüksek.

---

### ARCH-003

**Severity:** 🟠 HIGH
**TÜR:** prod blocker + mimari

**Başlık:** Veritabanı şeması ve migration'ları `.gitignore`'daki `*.sql` kuralına takıldığı için versiyonsuz

**Dosya:** `.gitignore:47`, `api/database/schema.sql`, `api/database/migrations/*.sql`

Bu bulgu DOC-001'in doküman tarafından ayrılmış **teknik** tarafıdır; ayrı ID verildi çünkü
çözümü farklı (README düzeltmesi değil, `.gitignore` düzeltmesi).

**Problem:**

```
.gitignore:46-47
db_backup/
*.sql
```

`*.sql` kuralı, `db_backup/` içindeki canlı yedekleri hariç tutmak için yazılmış görünüyor
(hemen üstündeki satır bunu gösteriyor), ama kural kök-göreli değil, bu yüzden
`api/database/schema.sql` ve üç migration da kapsama giriyor.

**Kanıt:**

```
$ git check-ignore -v api/database/schema.sql
.gitignore:47:*.sql     api/database/schema.sql

$ git ls-files api/database
(çıktı yok)
```

**Neden problem:** Şema, uygulamanın en kritik sözleşmesi. Versiyonsuz olduğu için:
migration sırası doğrulanamıyor, kim neyi değiştirdi bilinemiyor, review edilemiyor, rollback
yok, ve `git clone` yapan hiç kimse veritabanını kuramıyor.

**Impact:** Deploy edilebilir bir artefakt yok; şemanın tek kopyası bir geliştirici diskinde.

**Önerilen çözüm:** `.gitignore`'a şu iki satırı eklemek:
```
!api/database/schema.sql
!api/database/migrations/*.sql
```
Alternatif olarak `*.sql` yerine `/api/admin/db_backup/*.sql` gibi hedefli bir kural yazmak
(hem daha güvenli hem niyeti doğru ifade eder).

**Çözüm önceliği:** Yüksek.

---

### ARCH-004

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç + güvenlik riski

**Başlık:** `api/src.zip` — 52.9 MB, untracked ve `.gitignore` kapsamında DEĞİL; `git add .` onu commit'e sokar

**Dosya:** `api/src.zip`

**Kanıt:**

```
$ ls -la api/src.zip
-rw-r--r-- 1 Ceyhun 197121 52964321 Jul 31 14:17 api/src.zip

$ git check-ignore -v api/src.zip
(çıktı yok — exit != 0, yani ignore EDİLMİYOR)

$ git status --short --untracked-files=normal | grep src.zip
?? api/src.zip
```

**Neden problem:** İki risk birlikte:
1. Bir `git add .` / `git add -A` bu 53 MB'lık blob'u kalıcı olarak git geçmişine sokar; geri
   almak history rewrite gerektirir. Bu repoda **emsali var** — bkz. ARCH-005.
2. `api/` PHP sunucusunun doküman kökü. `php -S` ile gerçek dosyalar as-is servis edildiği için
   (`router.php` "real files and directories are served as-is" mantığı) `GET /src.zip`
   backend kaynak kodunun tamamını indirilebilir hâle getirebilir. **Bu turda `router.php`
   okunmadığı için doğrulanmadı** — "Doğrulanamayanlar" listesine alındı.

**Impact:** Repo şişmesi; potansiyel kaynak kodu sızıntısı.

**Önerilen çözüm:** Dosyayı silmek (içeriği `api/src/` altında zaten canlı) veya en azından
`.gitignore` + doküman kökü dışına taşımak.

**Çözüm önceliği:** Orta — silmek dakikalık iş, riski asimetrik.

---

### ARCH-005

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `api/composer.zip` git geçmişine commit edilmiş bir binary artefakt

**Dosya:** `api/composer.zip` (takipli, çalışma ağacında silinmiş)

**Kanıt:**

```
$ git ls-files -s api/composer.zip
100644 66b69eee2704344231e1f4e8fb17befc0d4d8185 0       api/composer.zip

$ git log --oneline -1 -- api/composer.zip
edc0865 18. commit

$ git status --short | grep composer.zip
 D api/composer.zip
```

**Neden problem:** ARCH-004'ün gerçekleşmiş hâli — bir zip dosyası geçmişe girmiş. Blob hâlâ
git object store'unda; çalışma ağacından silinmesi onu geçmişten kaldırmıyor. Bu, ARCH-004'ün
"olur mu?" sorusunun cevabının "bu repoda zaten oldu" olduğunu gösteriyor.

**Impact:** Klon boyutu; geçmiş temizliği gerektiren teknik borç.

**Önerilen çözüm:** Silmeyi commit etmek; boyut sorun olursa `git filter-repo` ile geçmişten
çıkarmak.

**Çözüm önceliği:** Düşük.

---

### ARCH-006

**Severity:** 🟡 MEDIUM
**TÜR:** mimari + teknik borç

**Başlık:** Autoloader 33 dizin tarıyor, 23'ü diskte yok; diskte var olan `src/Services/` ise arama listesinde hiç yok

**Dosya:** `api/src/autoload.php:22-73`

**Fonksiyon/Class:** `spl_autoload_register` closure

**Problem:**

```php
api/src/autoload.php:26-40 (kesit)
        $searchDirs = [
            // Presentation
            "$base/Presentation/Controllers/",
            "$base/Presentation/Middleware/",
            "$base/Presentation/Response/",
            // Application
            "$base/Application/UseCases/Auth/",
            "$base/Application/UseCases/Chatbot/",
            "$base/Application/UseCases/User/",
            "$base/Application/UseCases/Wallet/",
            "$base/Application/UseCases/Marketplace/",
            "$base/Application/UseCases/Social/",
            "$base/Application/UseCases/Chat/",
            "$base/Application/UseCases/Note/",
            "$base/Application/UseCases/Content/",
            "$base/Application/UseCases/Notification/",
            ...
```

**Kanıt:**

```
$ (autoload.php listesindeki 33 dizin) vs (find api/src -type d)
Listede olup diskte OLMAYAN (23): Application/UseCases/{Marketplace,Social,Chat,Note,
  Content,Notification,Training,Message,Seller,Contact}/, Domain/Services/,
  Infrastructure/* (kısmen), ...
Diskte olup listede OLMAYAN (1): api/src/Services/

$ for d in $(find api/src -type d); do echo "$(find $d -maxdepth 1 -type f|wc -l) $d"; done
0  api/src/Application/DTO
0  api/src/Application/UseCases/Chatbot
0  api/src/Application/UseCases/User
0  api/src/Application/UseCases/Wallet
0  api/src/Application/Validators
0  api/src/Domain/Entities
0  api/src/Infrastructure/Cache
0  api/src/Infrastructure/FileStorage
0  api/src/Infrastructure/Mail
0  api/src/Infrastructure/Payment
0  api/src/Services
(11 boş dizin)
```

**Neden problem:** Üç ayrı sorun aynı yerde:
1. Her autoload **miss**'inde 33 `file_exists()` çağrısı yapılıyor; 23'ü hiçbir zaman
   isabet etmeyecek. Ölçülebilir bir performans sorunu olduğunu iddia etmiyorum
   (ölçülmedi), ama saf gereksiz iş.
2. `api/src/Services/` diskte var ama listede yok → oraya konan bir sınıf **sessizce
   yüklenmez**, "Class not found" verir. Buna karşılık `Domain/Services/` listede var ama
   diskte yok. İsim uyuşmazlığı bir tuzak.
3. Filename-based autoloading (namespace değil, dosya adı) PSR-4 değil ve dosya başına tek
   sınıf varsayıyor. `AppException.php`'nin 8 sınıf içermesi bu yüzden özel bir
   `require_once` ile çözülmüş — kendi yorumu bunu itiraf ediyor (`autoload.php:14-20`).

**Impact:** Yeni geliştiricinin `Services/` altına sınıf koyup neden yüklenmediğini
anlamaması; boş dizinler mimarinin gerçekte var olduğu yanılgısını üretiyor.

**Önerilen çözüm:** Arama listesini diskteki 10 dolu dizine indirmek; `src/Services/`'i
silmek veya listeye eklemek; orta vadede composer PSR-4 autoload'una geçmek
(`composer.json` zaten var).

**Çözüm önceliği:** Orta.

---

### ARCH-007

**Severity:** 🟡 MEDIUM
**TÜR:** mimari + teknik borç

**Başlık:** 8 repository arayüzünün 6'sının ne implementasyonu ne de tek bir referansı var

**Dosya:** `api/src/Domain/Interfaces/{Cart,Chat,Notification,Social,Subscription,Wallet}RepositoryInterface.php`

**Kanıt (bölüm 24 — dinamik/dolaylı kullanım da arandı):**

```
$ grep -rn 'implements' api/src/Infrastructure/Repositories/*.php api/src/Infrastructure/Database/*.php
ChatbotRepository.php:2:class ChatbotRepository extends BaseRepository implements ChatbotRepositoryInterface {
UserRepository.php:2:class UserRepository extends BaseRepository implements UserRepositoryInterface {

$ (her arayüz için) grep -rl "$i" api/src api/functions api/api | grep -v "Domain/Interfaces/$i.php"
CartRepositoryInterface            *** referenced nowhere ***
ChatRepositoryInterface            *** referenced nowhere ***
ChatbotRepositoryInterface         api/src/Infrastructure/Repositories/ChatbotRepository.php
NotificationRepositoryInterface    *** referenced nowhere ***
SocialRepositoryInterface          *** referenced nowhere ***
SubscriptionRepositoryInterface    *** referenced nowhere ***
UserRepositoryInterface            api/src/Infrastructure/Repositories/UserRepository.php
WalletRepositoryInterface          *** referenced nowhere ***
```

**Neden problem:** Bu 6 dosya kod değil, niyet beyanı. Arayüz tanımlamak bir sözleşme kurar;
sözleşmeyi kimse imzalamıyorsa dosya, mimarinin uygulandığı yanılsamasını üretiyor. Somut
zarar: `MarketplaceController`, `WalletController`, `SocialController` doğrudan PDO ile
konuşurken, `Domain/Interfaces/` klasörüne bakan biri onların repository üzerinden gittiğini
sanır.

**Impact:** Yanıltıcı mimari; refactor'a başlarken yanlış varsayım.

**Önerilen çözüm:** İki dürüst seçenek: (a) 6 arayüzü silip mimariyi olduğu gibi göstermek,
(b) implementasyonları yazmak. Şimdiki hâl ikisinin en kötüsü.

**Çözüm önceliği:** Orta — README bunu zaten uyarıyor (`README.md:130-136`), yani ekip
farkında.

---

### ARCH-008

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Admin AJAX dosyaları arasında include-yolu tutarsızlığı: `_guard.php` `__DIR__` kullanıyor, 12 kardeşi CWD/script-dizini göreli path

**Dosya:** `api/admin/ajax/*.php:3-11`, `api/admin/index.php:5`

**Problem:**

```
$ (Grep) (require|include)(_once)? +['"]\.\.?/   in api/  (vendor hariç)
api/admin/ajax/delete.php:10:    require '../../functions/db.php';
api/admin/ajax/updategv.php:3:require '../../functions/db.php';
api/admin/ajax/update.php:10:    require '../../functions/db.php';
api/admin/ajax/adminler.php:3:require '../../functions/db.php';
api/admin/ajax/sitemap.php:11:require_once '../../functions/db.php';
api/admin/ajax/db_backup.php:9:require '../../functions/db.php';
api/admin/ajax/smtp.php:4:require '../../functions/db.php';
api/admin/ajax/create.php:10:    require '../../functions/db.php';
api/admin/ajax/seo.php:4:require '../../functions/db.php';
api/admin/ajax/ayarlar.php:4:require '../../functions/db.php';
api/admin/ajax/read.php:10:    require '../../functions/db.php';
api/admin/index.php:5:require_once '../functions/db.php';
```

Aynı dosyaların 2. satırı ise `__DIR__` kullanıyor:

```php
api/admin/ajax/create.php:2 (ve 13 kardeşi)
require_once __DIR__ . '/_guard.php';
```

**False positive kontrolü (bölüm 24):** Bu path'ler **bozuk değil**. PHP göreli include'ları
`include_path` → çağıran script'in dizini → CWD sırasıyla çözer; `api/admin/ajax/` içinden
`'../../functions/db.php'` → `api/functions/db.php` doğru hedefe gidiyor. `__DIR__` ile
resolve denemesi yaptım, hiçbir kırık path bulunmadı:

```
$ (tüm api/*.php içinde __DIR__-göreli require'ları resolve et)
(çıktı yok — kırık yol yok)
```

Bu yüzden bug değil, LOW teknik borç olarak raporlanıyor.

**Neden problem:** `include_path` içeren bir `php.ini` (veya farklı bir SAPI) çözümleme sırasını
değiştirebilir. Aynı dosyada iki farklı konvansiyonun bulunması, DOC-005'te görüldüğü gibi
dokümantasyonun mekanizmayı yanlış anlatmasına da yol açmış.

**Impact:** Deployment ortamına duyarlılık; düşük ama sıfır olmayan risk.

**Önerilen çözüm:** 12 satırı `__DIR__ . '/../../functions/db.php'` biçimine çevirmek.

**Çözüm önceliği:** Düşük.

---

### ARCH-009

**Severity:** 🟡 MEDIUM
**TÜR:** mimari

**Başlık:** 3 tablo için iki ayrı gerçek kaynağı: `schema.sql` içinde tanımlı, ayrıca runtime'da `CREATE TABLE IF NOT EXISTS` ile de oluşturuluyor

**Dosya:** `api/database/schema.sql`, `api/functions/rate_limit.php`, `AuthController`, `WalletController` (README:583-589 üzerinden tespit, gövdeleri bu turda okunmadı)

**Problem:** README, runtime'da lazy oluşturulan 3 tabloyu listeliyor:

```markdown
README.md:583-589
| Table | Created by |
| `rate_limits` | `functions/rate_limit.php`, on every rate-limited call |
| `password_resets` | `AuthController::sendPasswordResetMail()` |
| `user_plan_selection` | `WalletController` |
```

**Kanıt** — üçü de `schema.sql`'de de tanımlı:

```
$ grep -oE 'CREATE TABLE[^(]*`[a-z_0-9]+`' api/database/schema.sql | grep -oE '`[a-z_0-9]+`' | tr -d '`' | sort
... password_resets ... rate_limits ... user_plan_selection ...
(toplam 50 tablo)
```

**Neden problem:** Aynı tablo iki yerde tanımlanınca sütun/index/charset tanımları sessizce
ayrışır. `CREATE TABLE IF NOT EXISTS` zaten var olan bir tabloyu **değiştirmez** — yani
`schema.sql` bir sütun eklerse runtime tanımı hiç fark etmez, ama sıfırdan kurulan bir ortamda
hangisinin önce koştuğuna göre tablo iki farklı şekle bürünür.

**Impact:** Ortamlar arası şema kayması; "benim makinemde çalışıyor" sınıfı hatalar.

**Önerilen çözüm:** Runtime `CREATE TABLE IF NOT EXISTS` çağrılarını kaldırıp `schema.sql`'i
tek kaynak yapmak (ARCH-003 çözülünce bu mümkün hâle gelir).

**Çözüm önceliği:** Orta. Tabloların gerçek sütun karşılaştırması **Tur 5 (bölüm 10)** işi.

---

### ARCH-010

**Severity:** 🔵 LOW
**TÜR:** mimari + teknik borç

**Başlık:** Frontend'de iki ayrı "lib" kökü ve `app/*/components/` ile `entities/`-`features/` arasında paralel component setleri

**Dosya:** `web/src/lib/utils.js`, `web/src/shared/lib/*`, `web/src/app/dashboard/{chatbots,wallet,upgrade}/components/`

**Problem:** FSD yapısında `shared/` katmanı varken, kökte ikinci bir `lib/` duruyor:

```javascript
web/src/lib/utils.js  (dosyanın tamamı)
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Kanıt:**

```
$ grep -rl '@/lib/utils' web/src | wc -l
43
$ grep -rl '@/shared/lib' web/src | wc -l
16
```

Yani daha çok kullanılan yol (`@/lib/utils`, 43 dosya) FSD dışındaki dizin. Bu shadcn/ui
generator'ının varsayılanı (`components.json`) ile FSD kararının çakışmasından geliyor.

Aynı çakışma component'lerde de var — `app/dashboard/chatbots/components/ChatbotCard.jsx` (166
satır, canlı) ile `entities/chatbot/ui/ChatbotCard.jsx` (324 satır, ölü — bkz. DEAD-002) aynı
isimde iki farklı component.

**Impact:** İki yerde arama; hangisinin canlı olduğu isimle anlaşılmıyor (DEAD-002'ün kök nedeni).

**Önerilen çözüm:** `lib/utils.js`'i `shared/lib/utils.js`'e taşıyıp `components.json`'daki
alias'ı güncellemek; ya da FSD'yi bırakıp shadcn konvansiyonuna tamamen geçmek. Karar
verilmemiş olması sorunun kendisi.

**Çözüm önceliği:** Düşük — ama DEAD-002 temizliğinden önce karar verilmesi gerekiyor.

---

### ARCH-011

**Severity:** ⚪ INFO
**TÜR:** teknik borç

**Başlık:** `.history/` — 182 dosya, 22 MB VSCode Local History çalışma ağacında duruyor

**Dosya:** `.history/`

**Kanıt:**

```
$ find .history -type f | wc -l
182
$ du -sh .history
22M     .history
$ git check-ignore -v .history/
.gitignore:21:.history .history/
```

Doğru şekilde ignore edilmiş, yani VCS riski yok. Ancak `project_tree.txt:14` onu ağacın en
üstünde listeliyor ve içindeki dosya adları (`BankInfo_20250811225338.jsx` gibi) bu turda
tespit edilen ölü component'lerin **eski sürümleri**. Yani grep tabanlı arama yapan bir kişi
(veya araç) 182 eski dosya sürümünde yanlış eşleşme alabilir.

**Impact:** Denetim/arama gürültüsü, 22 MB disk. Runtime etkisi yok.

**Önerilen çözüm:** VSCode `workbench.localHistory` ayarını proje dışına yönlendirmek veya
klasörü silmek.

**Çözüm önceliği:** Düşük.

---

### ARCH-012

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç

**Başlık:** 9 npm bağımlılığı `web/` altında hiç kullanılmıyor; 3'ü ise yalnızca ölü UI primitive'leri tarafından kullanılıyor

**Dosya:** `web/package.json:15-46`

**Kanıt (bölüm 24 — her paket için config dosyaları dahil arandı):**

```
$ (her dependency için) grep -rl "'<paket>" web/src web/server.js web/next.config.mjs \
      web/tailwind.config.js web/postcss.config.js web/scripts

@radix-ui/react-label            *** UNUSED ***
@radix-ui/react-scroll-area      *** UNUSED ***
@react-oauth/google              *** UNUSED ***
@splidejs/react-splide           *** UNUSED ***
@splidejs/splide                 *** UNUSED ***
date-fns                         *** UNUSED ***
framer-motion                    *** UNUSED ***
pdfjs-dist                       *** UNUSED ***
react-icons                      *** UNUSED ***
react-masonry-css                *** UNUSED ***
sharp                            *** UNUSED ***
react-dom                        *** UNUSED ***
```

**False positive elemesi (bölüm 24):** Ham çıktıdaki 12 sonucun 3'ü gerçek bulgu değil —
raporlanmadı:

| Paket | Neden false positive |
| --- | --- |
| `react-dom` | Doğrudan import edilmiyor ama React 19 + Next.js'in çalışması için zorunlu peer/runtime bağımlılığı. |
| `sharp` | Next.js production image optimization'ı tarafından **dolaylı** kullanılır (import edilmez, runtime'da resolve edilir). `next.config.mjs` `images.unoptimized` yalnızca export modunda açıldığı için normal build'de gerekli. |
| `@radix-ui/react-scroll-area` | UNUSED doğrulandı ama README bunu zaten kullanılmayan olarak listeliyor — yeni bulgu değil, teyit. |

**Gerçek bulgu — hiç kullanılmayan 9 paket:**
`@radix-ui/react-label`, `@react-oauth/google`, `@splidejs/react-splide`, `@splidejs/splide`,
`date-fns`, `framer-motion`, `pdfjs-dist`, `react-icons`, `react-masonry-css`
(+ `@radix-ui/react-scroll-area`, README'de zaten kayıtlı).

**Ek bulgu — transitif ölü bağımlılıklar (README bunları "kullanılıyor" listesinde gösteriyor):**

```
$ (her shared/ui primitive için importer sayısı)
avatar                   importers=0    → @radix-ui/react-avatar transitif ölü
separator                importers=0    → @radix-ui/react-separator transitif ölü
switch                   importers=0    → @radix-ui/react-switch transitif ölü
```

Yani `@radix-ui/react-avatar` teknik olarak `shared/ui/avatar.jsx` tarafından import ediliyor
(bu yüzden README doğru diyor), ama `avatar.jsx`'i hiçbir şey import etmiyor → paket de
gerçekte ölü. README'nin "verified as imported" ölçütü bir seviye eksik bakıyor.

**Neden problem:** `pdfjs-dist` (~10 MB) ve `framer-motion` gibi paketler `npm install`
süresini, `node_modules` boyutunu ve güvenlik açığı yüzeyini (dependabot/audit gürültüsü)
büyütüyor. `@react-oauth/google`'ın varlığı ayrıca yanıltıcı: Google girişi doğrudan GIS
script'iyle yapılıyor, yani biri bu paketi gerçek entegrasyon sanıp yanlış yerde debug edebilir.

**Impact:** Build/install maliyeti, güvenlik tarama gürültüsü, yanlış yönlendirme.

**Önerilen çözüm:** 9 paketi kaldırmak; 3 radix paketini ilgili ölü primitive'lerle birlikte
(DEAD-002) kaldırmak; ardından `npm run build` ile doğrulamak.

**Çözüm önceliği:** Orta — güvenli, mekanik bir temizlik.

---

### ARCH-013

**Severity:** ⚪ INFO
**TÜR:** teknik borç

**Başlık:** `web/public/api/*.php` — var olmayan bir path require ediyor ve proxy nedeniyle hiç erişilemez

**Dosya:** `web/public/api/get_bank_info.php:3`, `web/public/api/save_bank_info.php`

**Kanıt:**

```php
web/public/api/get_bank_info.php:1-8
<?php
header('Content-Type: application/json');
require '../../php/functions/db.php';

try {
    $database = Database::getInstance();
    $userId = $_GET['userId'] ?? null;
```

```
$ ls web/php
ls: cannot access 'web/php': No such file or directory
```

Ayrıca `/api/*` istekleri Next.js'e ulaşmadan `http-proxy-middleware` tarafından PHP
backend'ine yönlendiriliyor, dolayısıyla bu iki dosya statik olarak da servis edilmiyor.
Gerçek karşılıkları `api/api/wallet/{get,save}_bank_info.php` olarak zaten var.

**Ek gözlem:** `userId`'yi `$_GET`'ten alıyorlar (session'dan değil). Bir şekilde erişilebilir
hâle gelirlerse bu doğrudan IDOR olur. Erişilemez oldukları için INFO verildi, ama
silinmelerinin gerekçesi bu.

**Impact:** Şu an sıfır runtime etkisi. Yanlışlıkla erişilebilir hâle gelirse yetkilendirmesiz
banka bilgisi okuma.

**Önerilen çözüm:** İki dosyayı silmek.

**Çözüm önceliği:** Düşük — ama silmek risksiz.

---

### ARCH-014

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** İki bağımsız composer ağacı ve karşılığı olmayan bir `/assets/*` proxy kuralı

**Dosya:** `api/composer.json`, `api/admin/composer.json`, `web/server.js`, `web/next.config.mjs`

**Kanıt:**

```
$ ls api/composer.json api/admin/composer.json
api/composer.json          api/admin/composer.json     (iki ayrı bağımlılık ağacı)

$ find api -not -path 'api/vendor*' -type d -name assets
api/admin/assets            ← yalnızca admin altında

$ ls api/assets
ls: cannot access 'api/assets': No such file or directory
```

**Problem 1 — iki composer ağacı:** `api/` (google/apiclient, smalot/pdfparser) ve `api/admin/`
(vlucas/phpdotenv) ayrı `vendor/` dizinleri taşıyor. `api/admin/vendor/` altında symfony
polyfill'leri ve phpoption gibi paketler ikinci kez indirilmiş. Deploy'da iki `composer install`
gerekiyor; README bunu belgeliyor ama gerekçesini vermiyor.

**Problem 2 — `/assets/*` proxy:** `server.js` ve `next.config.mjs` `/assets/*`'i PHP'ye
proxy'liyor, ama `api/assets/` diye bir dizin yok. Admin'in kendi asset'leri `/admin/assets/`
altında, yani `/admin/*` kuralı onları zaten kapsıyor. README bu kuralın kullanılmadığını
doğru şekilde söylüyor (`README.md:111-112`).

**Impact:** Gereksiz deploy adımı ve ölü routing kuralı. Runtime hatası üretmiyor.

**Önerilen çözüm:** `vlucas/phpdotenv`'i ana `composer.json`'a taşıyıp tek vendor ağacına
inmek; `/assets` proxy kuralını kaldırmak.

**Çözüm önceliği:** Düşük.

---

## 4. DEAD CODE / ORPHAN / UNUSED (denetim.md bölüm 20)

Bu bölümdeki bulgular denetim.md bölüm 20'nin istediği formatta veriliyor
(Dosya / Neden kullanılmıyor / Nereden doğruladın / Silinebilir mi / Risk).

---

### DEAD-001 — Frontend'in hiç çağırmadığı backend endpoint'leri

**Severity:** 🟡 MEDIUM · **TÜR:** teknik borç (+ bir kısmı bilinçli tasarım)

**Yöntem:**

```
$ grep -rhoE '[a-zA-Z0-9_]+/[a-zA-Z0-9_]+\.php' web/src --include=*.js --include=*.jsx | sort -u  → 98 referans
$ find api/api -name '*.php' -not -name 'index.php' | sed 's|api/api/||' | sort            → 120 endpoint
$ comm -23 <backend> <frontend>                                                            → 24 aday
```

**False positive elemesi (bölüm 24) — 24 adaydan 1'i elendi:**

```
$ grep -rn 'login-google' web/src
web/src/app/login/page.jsx  ← KULLANILIYOR
```
`auth/login-google.php` benim regex'imin `-` karakterini kapsamaması nedeniyle listeye
düşmüştü. Bulgu değil.

Ters yönde de bir false positive vardı:

```
$ grep -n 'sharer' web/src/features/sharing/ShareModal.jsx
103:  window.open(`https://www.facebook.com/sharer/sharer.php?u=${...}`, "_blank")
```
`sharer/sharer.php` "backend'de olmayan endpoint" gibi görünüyordu; gerçekte Facebook'un
paylaşım URL'i. Bulgu değil.

**Admin kontrolü (bölüm 24):**
```
$ (Grep) /api/(chatbot|content|marketplace|notification|seller|social)/  in api/admin
No matches found
```
Admin paneli hiçbir `/api/*` endpoint'ini tüketmiyor — yani "başka bir client kullanıyor
olabilir" olasılığı elendi.

**Sonuç — 23 çağrılmayan endpoint, niyetlerine göre ayrıştırılmış:**

**(a) Muhtemelen bilinçli — dış/otomatik çağrılan (silinmemeli):** 3 endpoint
`seller/parampos_callback.php` (POS webhook), `seller/marketplace_reconcile.php`
(`PARAM_RECONCILE_SECRET` ile korunan cron), `seller/marketplace_refund.php`.
Bunların gerçekten çağrıldığını **doğrulayamadım** (harici sistem) — Tur 3'e bırakıldı.

**(b) Süperseded — yerine yeni bir endpoint gelmiş (silinebilir):** 4 endpoint

| Dosya | Yerine geçen | Doğrulama |
| --- | --- | --- |
| `social/diduserlike.php` | `social/getuserbotstatus.php` | aşağıda |
| `social/diduserdislike.php` | `social/getuserbotstatus.php` | aşağıda |
| `social/diduserfollow.php` | `social/getuserbotstatus.php` | aşağıda |
| `chatbot/getchatbots.php` **veya** `getchatbots_v2.php` | biri diğerini | Tur 4'e bırakıldı |

`getuserbotstatus.php`'nin bu üçünü tek çağrıda topladığı, onu çağıran dosyanın kendi
yorumunda görülüyor:

```javascript
web/src/entities/chatbot/ui/ChatbotCard.jsx:102-114
        // getuserbotstatus.php reads $_GET (session provides identity) and
        ...
                const res = await fetch(`/api/social/getuserbotstatus.php?chatbot_id=${id}`);
```
```
$ grep -rn 'social/diduser' web/src
(çıktı yok)
```
**Silinebilir mi:** Evet. **Risk:** Düşük — üçü de yalnızca okuma yapıyor.

**(c) Hiç bağlanmamış özellikler (karar gerekiyor):** 16 endpoint

```
chatbot/get_suggested.php          chatbot/getdefaultbot.php
chatbot/getchatbots_v2.php         content/getabout.php
content/getcontactinfo.php         content/getlandingimages.php
content/getowner.php               content/getsocials.php
marketplace/buychatbot.php         marketplace/deletesubscription.php
marketplace/updatecart.php         marketplace/updatesubscription.php
notification/createnotification.php
seller/submerchant_delete.php      seller/submerchant_list.php
seller/submerchant_list_remote.php seller/submerchant_update.php
```

**Nereden doğruladın:** `web/src` + `api/admin` + `api/functions` + `api/src` + `server.js` +
`next.config.mjs` üzerinde her dosya adı için ayrı grep; hepsi `NONE` döndü.

**Silinebilir mi:** Hayır — **önce her birinin ne yaptığı okunmalı.** İçlerinde işlevsel
olarak kritik olanlar var:
- `marketplace/buychatbot.php` — satın alma endpoint'i. Frontend `createsubscription.php`
  kullanıyor. İki paralel satın alma yolu olması **para akışı** açısından incelenmeli
  → **Tur 3 (bölüm 7)**.
- `marketplace/updatecart.php`, `deletesubscription.php`, `updatesubscription.php` —
  UI'da karşılığı olmayan yazma endpoint'leri. Kimlik doğrulaması varsa bile
  "UI'dan erişilemeyen ama açık" yazma yüzeyi → **Tur 2 (bölüm 6)**.
- `notification/createnotification.php` — istemciden bildirim yaratma. Yetkilendirmesi
  kritik → **Tur 2**.
- `content/get{about,contactinfo,landingimages,owner,socials}.php` — admin panelinden
  yönetilen içerik sayfaları için yazılmış, frontend bunları tüketmiyor. Muhtemelen
  gerçek ölü kod.

**Risk (silmenin riski):** Yüksek — bu 16 endpoint'in hangisinin "henüz bağlanmamış özellik",
hangisinin "unutulmuş açık yüzey" olduğu ayrılmadan silme kararı verilmemeli.

---

### DEAD-002 — Hiçbir yerden import edilmeyen frontend modülleri

**Severity:** 🟡 MEDIUM · **TÜR:** teknik borç

**Yöntem ve false positive elemesi (bölüm 24):** İlk taramam 29 aday verdi; bunların 21'i
benim grep pattern'imin hatasıydı (özel karakter kaçırma). Doğrulama için her aday adı için
ayrı ayrı `grep -rn "import .*<isim>"` ve `grep -rn "<dizin>/<isim>"` koşturdum. Elenen
örnekler:

| Yanlış aday | Gerçekte | Kanıt |
| --- | --- | --- |
| `ChatbotForm.jsx` | Kullanılıyor | `app/dashboard/chatbots/create/page.jsx` |
| `DialogueModal.jsx` | Kullanılıyor | `app/dashboard/notes/page.jsx` |
| `shared/ui/Alert.jsx` | İlk taramada "kullanılıyor" göründü, gerçekte ölü | Eşleşmeler `lucide-react`'in `AlertCircle`/`AlertTriangle` ikonlarıydı |
| `shared/ui/switch.jsx` | İlk taramada "kullanılıyor" göründü, gerçekte ölü | Eşleşmeler JS `switch` anahtar sözcüğüydü |

**Doğrulanmış ölü modüller:**

| Dosya | Satır | Neden kullanılmıyor | Nereden doğruladın |
| --- | --- | --- | --- |
| `web/src/entities/chatbot/ui/ChatbotCard.jsx` | 324 | `app/dashboard/chatbots/components/ChatbotCard.jsx` (166 satır) canlı sürüm | `grep -rn "entities/chatbot/ui/ChatbotCard" web/src` → boş; `chatbots/page.jsx:11` yerel sürümü import ediyor |
| `web/src/entities/chatbot/ui/BotCard.jsx` | — | Hiç import yok; tek "referans" bir yorum | `grep -rn 'BotCard' web/src` → yalnızca `app/dashboard/page.jsx`'in **yerel** `BentoBotCard`/`CompactBotCard`/`ListBotCard` fonksiyonları ve `shared/ui/badge.jsx:24-27`'deki yorum |
| `web/src/entities/chatbot/ui/SuggestedCard.jsx` | — | Hiç import yok | `grep -rn "import .*SuggestedCard"` → boş |
| `web/src/entities/user/ui/AccountPoints.jsx` | — | Hiç import yok | aynı |
| `web/src/widgets/MarketCard.jsx` | — | Hiç import yok (`/dashboard/market` route'u `notFound()` döndürüyor) | aynı |
| `web/src/shared/api/client.js` | — | Hiç import yok — bkz. DOC-004 | `grep -rl 'shared/api/client'` → 0 |
| `web/src/shared/ui/Alert.jsx` | — | 0 importer | aşağıdaki toplu sayım |
| `web/src/shared/ui/avatar.jsx` | — | 0 importer | aynı |
| `web/src/shared/ui/separator.jsx` | — | 0 importer | aynı |
| `web/src/shared/ui/stat-card.jsx` | — | 0 importer | aynı |
| `web/src/shared/ui/switch.jsx` | — | 0 importer | aynı |

**Toplu doğrulama:**

```
$ for f in web/src/shared/ui/*.jsx; do n=$(basename $f .jsx); \
    echo "$n $(grep -rl "ui/$n\"" web/src | grep -v "shared/ui/$n.jsx" | wc -l)"; done
Alert 0        avatar 0       separator 0    stat-card 0    switch 0
badge 3        button 30      card 4         checkbox 4     dialog 25
dropdown-menu 6  empty-state 6  filter-popover 3  input 7  page-layout 1
skeleton 7     tabs 1         textarea 3     toast 1        toaster 1    tooltip 1
DeleteConfirmModal 6
```

**Silinebilir mi:** Evet — ancak `entities/chatbot/ui/*` için önce ARCH-010'daki
"hangi klasör konvansiyonu kazanıyor" kararı verilmeli. 324 satırlık `ChatbotCard.jsx`,
166 satırlık canlı sürümden **daha zengin**; ekip yanlışlıkla daha zayıf olanı canlı
tutmuş olabilir. Bu bir UI/ürün kararı → **Tur 6**.

**Risk:** `shared/ui/*` beşlisi için sıfır. `entities/*` üçlüsü için: yanlış sürümü silmek
mümkün, önce hangisinin doğru olduğu belirlenmeli.

---

### DEAD-003 — `chat/page.jsx`'te render edilmeyen dynamic import, 246 satırlık bir dosyayı ölü tutuyor

**Severity:** 🟡 MEDIUM · **TÜR:** bug (ölü kod + gereksiz bundle)

**Dosya:** `web/src/app/dashboard/chat/page.jsx:12`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:12
const WithdrawalModal = dynamic(() => import("@/features/wallet/WithdrawalModal"), { ssr: false });
```

**Kanıt:**

```
$ grep -n 'WithdrawalModal' web/src/app/dashboard/chat/page.jsx
12:const WithdrawalModal = dynamic(() => import("@/features/wallet/WithdrawalModal"), { ssr: false });
                            ← tek eşleşme: tanımlanıyor ama HİÇ render edilmiyor

$ grep -rn 'WithdrawalModal' web/src | grep -v 'chat/page.jsx'
web/src/app/dashboard/wallet/page.jsx:12:const WithdrawalModal = dynamic(() => import("./components/WithdrawalModal"), { ssr: false });
web/src/app/dashboard/wallet/page.jsx:142:      <WithdrawalModal

$ wc -l web/src/features/wallet/WithdrawalModal.jsx web/src/app/dashboard/wallet/components/WithdrawalModal.jsx
246 web/src/features/wallet/WithdrawalModal.jsx          ← chat sayfasının import ettiği, render EDİLMEYEN
133 web/src/app/dashboard/wallet/components/WithdrawalModal.jsx  ← gerçekten kullanılan
```

**Neden problem:** Sohbet sayfasında "para çekme" modalı olmasının işlevsel bir gerekçesi
görünmüyor; muhtemelen bir refactor artığı. Somut sonuç: `features/wallet/WithdrawalModal.jsx`
(246 satır) **yalnızca bu kullanılmayan import sayesinde** "ölü kod taraması"nda canlı
görünüyor. Silinmesi engelleniyor.

**Impact:** 246 satır ölü kod gizli kalıyor. `dynamic()` olduğu için ayrı bir chunk üretilir —
ama render edilmediğinden indirilmez, yani bundle etkisi ihmal edilebilir. Asıl maliyet
bakım/karışıklık.

**Silinebilir mi:** `chat/page.jsx:12` satırı evet. Ardından `features/wallet/WithdrawalModal.jsx`
de silinebilir — ama iki sürüm arasındaki 113 satır farkın ne olduğu (246 vs 133) önce
karşılaştırılmalı; canlı sürüm eksik özellikli olabilir → **Tur 6**.

**Risk:** Düşük.

---

### DEAD-004 — `widgets/info/` altındaki 6 bilgi component'i, `settings/page.jsx` içine kopyalanmış hâlleriyle değiştirilmiş

**Severity:** 🔵 LOW · **TÜR:** teknik borç (duplicate logic)

**Dosya:** `web/src/widgets/info/{AboutPopup,GizlilikPopup,PrivacyPolicy,PrivacyPolicy2,TermsOfUse,UsagePopup}.jsx`

**Problem:** Ayarlar sayfası, `widgets/info/` altındaki component'leri import etmek yerine
**aynı isimli fonksiyonları kendi içinde yeniden tanımlıyor**:

```javascript
web/src/app/dashboard/settings/page.jsx:380-393 (kesit)
function PrivacyPolicy2() {
    ...
      <h4 className="text-sm font-semibold text-white">Gizlilik Politikası</h4>
    ...
}

function TermsOfUse() {
```

ve bunları kullanıyor:

```javascript
web/src/app/dashboard/settings/page.jsx:826, 841
                  <PrivacyPolicy2 />
                  ...
                  <TermsOfUse />
```

**Kanıt:**

```
$ for f in web/src/widgets/info/*.jsx; do n=$(basename $f .jsx); \
    echo "$n $(grep -rn "widgets/info/$n" web/src | grep -v "widgets/info/$n.jsx" | wc -l)"; done
AboutPopup 0           GizlilikPopup 0        PrivacyPolicy 0
PrivacyPolicy2 0       TermsOfUse 0           UsagePopup 0
MesafeliSatisPopup 1   TeslimatIadePopup 1
```

Yani 8 dosyanın 6'sı ölü, 2'si canlı — aynı klasörün yarısı kullanılıyor, yarısı sayfa
içine kopyalanmış. `PrivacyPolicy.jsx` ve `PrivacyPolicy2.jsx` ayrıca birbirinin duplike'i
(`PrivacyPolicy2.jsx` `PrivacyPolicy`'ye referans veriyor).

**Neden problem:** Gizlilik politikası ve kullanım koşulları **hukuki metin**. Aynı metnin
iki kopyası olması, birinin güncellenip diğerinin kalması demek. Şu an canlı olan kopya
sayfanın içinde, yani `widgets/info/` güncellenirse kullanıcı hiçbir değişiklik görmez.

**Silinebilir mi:** Evet — 6 dosya. **Risk:** Düşük, ama silmeden önce sayfa-içi kopyaların
`widgets/info/` sürümlerinden daha eski/eksik olmadığı hukuki metin karşılaştırmasıyla
doğrulanmalı → **Tur 6/7**.

---

### DEAD-005 — `global.scss` (11.004 satır) + `global.css.map` derleme artığı

**Severity:** 🔵 LOW · **TÜR:** teknik borç

**Dosya:** `web/src/app/css/global.scss`, `web/src/app/css/global.css.map`

**Kanıt:**

```
$ wc -l web/src/app/css/global.css web/src/app/css/global.scss
   808 web/src/app/css/global.css      ← app/layout.js'in import ettiği
 11004 web/src/app/css/global.scss     ← 303 KB
$ ls -la web/src/app/css/
global.css       23408 bayt   Aug 24 15:57
global.css.map   90553 bayt   Aug 12  2025   ← 1 yıl eski
global.scss     303637 bayt   Jul 27 10:35
$ grep -n 'sass\|scss' web/package.json
(çıktı yok — Sass derleyicisi yok)
```

**Neden kullanılmıyor:** Hiçbir Sass derleyicisi tanımlı değil (`web/package.json`'da
`sass`/`node-sass` yok), hiçbir dosya `.scss`'i import etmiyor, ve `.css.map` dosyasının
tarihi `global.css`'ten ~1 yıl eski — yani harita zaten geçersiz.

**Silinebilir mi:** Evet, ikisi de. **Risk:** Düşük. `global.scss`'in 11.004 satırı içinde
`global.css`'in 808 satırında olmayan kurallar bulunabilir; silmeden önce bir kez
diff'lenmesi mantıklı. Ama build'e etkisi sıfır.

---

### DEAD-006 — `web/scripts/phpify.js` var olmayan bir kaynak dizini kopyalamaya çalışıyor

**Severity:** 🔵 LOW · **TÜR:** bug (kırık script)

**Dosya:** `web/scripts/phpify.js:7, 28-36`, `web/package.json:8`

**Problem:**

```javascript
web/scripts/phpify.js:6-7
const outDir = path.join(__dirname, "..", "out");
const phpSrc = path.join(__dirname, "..", "src", "php");   ← web/src/php
...
web/scripts/phpify.js:28-36
    await copyRecursive(phpSrc, outDir);
    ...
  } catch (err) {
    console.error("❌ phpify hata:", err);
    process.exit(1);
  }
```

**Kanıt:**

```
$ ls web/src/php
ls: cannot access 'web/src/php': No such file or directory
```

`copyRecursive`'in ilk işi `fs.promises.lstat(src)` — var olmayan yolda ENOENT atar, catch
bloğu `process.exit(1)` ile çıkar. Script her koşuda başarısız.

**Silinebilir mi:** Evet — `web/scripts/phpify.js` + `web/package.json:8`'deki `phpify`
script'i. README bunu zaten "Broken" olarak belgeliyor (`README.md:305`), yani bilinçli
bırakılmış. **Risk:** Düşük. Aynı satırda `export` script'i de bozuk
(`next export` Next.js 15'te kaldırıldı) — README doğru şekilde bunu da not ediyor.

---

### DEAD-007 — Backend ve admin tarafındaki referanssız dosyalar

**Severity:** 🔵 LOW · **TÜR:** teknik borç

| Dosya | Neden kullanılmıyor | Nereden doğruladın | Silinebilir mi | Risk |
| --- | --- | --- | --- | --- |
| `api/functions/minify.php` | Hiçbir yerden require/include edilmiyor | `grep -rn 'minify' api/admin api/functions api/src --include=*.php` → `functions/minify.php` dışında eşleşme yok | Evet | Düşük |
| `api/admin/functions/tailmind.js` | Hiçbir PHP dosyası script olarak dahil etmiyor | `grep -rn "tailmind\.js" api/admin --include=*.php` → boş. Kardeşi `tailmind.php` ise `admin/index.php:3`'te require ediliyor | Evet | Düşük — `tailmind.php`'nin JS karşılığı olabilir, bir kez kontrol edilmeli |
| `api/admin/empty.png` | Hiçbir PHP/JS/CSS referansı yok | `grep -rn "empty\.png" api/admin --include=*.php --include=*.js --include=*.css` → boş | Evet | Düşük |
| `Database::truncate()` | Tanımlı, hiç çağrılmıyor | `api/functions/db.php:423` tanım; başka çağrı yok. README:313 de aynısını söylüyor | **Hayır — silinmeli** | Yüksek tutulursa: tabloyu boşaltan bir metot, çağrısı olmadan sınıfta duruyor. Bir gün yanlışlıkla çağrılırsa veri kaybı |

`Database::truncate()` için not: bu bir "kullanılmıyor, silinebilir" maddesi değil,
**"kullanılmıyor, o hâlde neden var" maddesi.** Veri silen bir yeteneğin çağrısız durması
riski azaltmıyor, gizliyor. Detaylı değerlendirme → **Tur 2 (bölüm 6)**.

---

### DEAD-008 — Çalışma ağacındaki artefaktlar ve log dosyaları

**Severity:** ⚪ INFO · **TÜR:** teknik borç

| Dosya | Durum | Not |
| --- | --- | --- |
| `api/api/error_log` | 0 bayt, `.gitignore:42` ile ignore | Boş, zararsız |
| `api/admin/error_log` | 507 bayt, ignore edilmiş | İçeriği bu turda **okunmadı** — hassas veri içerip içermediği Tur 2'de kontrol edilmeli |
| `api/admin/db_backup/backup-2026-02-23-13-56-14.sql` | 1.59 MB canlı DB yedeği, `.gitignore:46` ile ignore | Diskte duran gerçek üretim/geliştirme verisi. `db_backup.php?mode=restore` bunu `glob()` ile bulup canlı DB'nin üzerine yazıyor (README:308-315) → **Tur 2** |
| `google.txt` (109 B), `customserver.txt` (134 B), `chatbot_table.txt` (266 B) | Kökte, `.gitignore:56-58` ile ignore | README:764-767 bunların gerçek OAuth kimlik bilgileri içerdiğini ve rotate edilmesi gerektiğini söylüyor. **İçerikleri bu turda kasıtlı olarak okunmadı** (denetim raporuna sır yazmamak için). Rotasyonun yapılıp yapılmadığı → **Tur 2** |
| `.DS_Store` (kök, `web/public/`, `web/src/`, `web/src/app/`, `web/src/app/dashboard/`) | 5 adet macOS artığı | `.gitignore` kontrolü yapılmadı |
| `project_tree.txt` | 35 KB, untracked, `.gitignore` kapsamında değil | 25.08.2026 09:56'da üretilmiş. `docs/` bölümü **zaten güncelliğini yitirmiş**: `lumanoris-audit-prompts.md` ve `style-audit-prompt.md` listeliyor, diskte `denetim.md` var. Yani üretilen ağaç bir anlık görüntü, otorite değil |

---

## 5. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

denetim.md bölüm 26'nın istediği X/10 puanlama **bilinçli olarak üretilmedi**: kod okumadan da
yazılabilecek bir sayı olur ve bu turda yalnızca envanter/dosya katmanı okundu. Yerine her
alan için gerekçe:

**Dosya/klasör düzeni.** Yapı iki kez yeniden düzenlenmiş (Clean Architecture backend, FSD
frontend) ama iki geçişin de artıkları temizlenmemiş: backend'de 11 boş dizin ve 6 sahipsiz
arayüz, frontend'de `entities/`↔`app/*/components/` arasında aynı isimli paralel component
setleri. Düzenin kendisi makul; sorun, eski ve yeni düzenin yan yana durup hangisinin canlı
olduğunun dosya adından anlaşılamaması. DEAD-002'de 324 satırlık `ChatbotCard.jsx`'in ölü,
166 satırlığın canlı olması bunun somut maliyeti.

**Versiyon kontrolü hijyeni.** Bu turun en ciddi bulgu kümesi burada. Üç ayrı kategoride
sorun var: (1) çalışması için gerekli dosyalar takipsiz — `_guard.php` ve `session.php` 16
takipli dosya tarafından require ediliyor (ARCH-001); (2) güvenlik kontrolleri takipsiz —
`uploads/.htaccess` (ARCH-002) ve şema (ARCH-003); (3) ters yönde, olmaması gerekenler
takipli veya takipsiz-ama-ignore-edilmemiş — `composer.zip` geçmişe girmiş (ARCH-005),
53 MB `src.zip` bir `git add .` uzaklıkta (ARCH-004). Bunlar tek tek küçük görünüyor ama
toplamı şu: **bu reponun temiz bir klonu çalışmaz.** Production hazırlığı açısından
düzeltilmesi en kolay, atlanması en pahalı bulgu grubu.

**README'nin güvenilirliği.** Alışılmadık biçimde iyi. Çoğu projede README özellikleri
olduğundan iyi gösterir; burada tersi — README stub'ları, bozuk script'leri ve hard-coded
kimlik bilgilerini kendi başlıkları altında açıkça listeliyor, ve doğruladığım 10 iddiadan
10'u tuttu. Sorun farklı: README **kodun önünden gitmiş, sonra kod ilerlemiş ve README
geride kalmış.** Tespit ettiğim 9 çelişkinin 6'sı (DOC-002, 003, 005, 006, 007, 009) "artık
düzeltilmiş bir sorunu hâlâ var gibi anlatmak" biçiminde. Bu, README'yi güvenilmez yapmıyor
ama denetimde gürültü üretiyor ve DOC-001 örneğinde olduğu gibi ciddi bir gerçeği
(şemanın versiyonsuz olması) yanlış bir cümlenin (şemanın yokluğu) arkasına gizliyor.

**Ölü kod yükü.** Ölçülebilir: 120 endpoint'in 23'ü frontend'den hiç çağrılmıyor,
210 frontend dosyasının en az 11'i hiç import edilmiyor, 34 npm bağımlılığının 9'u hiç
kullanılmıyor, `shared/ui/` altındaki 23 primitive'in 5'i ölü, `widgets/info/` altındaki
8 dosyanın 6'sı sayfa içine kopyalanmış hâliyle değiştirilmiş. Bu oranlar (yaklaşık %19
endpoint, %26 npm, %22 UI primitive) aktif geliştirme altındaki bir proje için yüksek ama
felaket değil. Kritik nüans: ölü endpoint'lerin bir kısmı **yazma** işlemi yapıyor
(`updatecart`, `deletesubscription`, `createnotification`, `buychatbot`) — yani "ölü kod"
kategorisi burada aynı zamanda "UI'dan görünmeyen açık yüzey" anlamına geliyor ve Tur 2'nin
güvenlik denetimine devredilmesi gerekiyor.

**Bağımlılık yönetimi.** İki bağımsız composer ağacı, ikisinde de aynı symfony
polyfill'leri; PHP tarafında PSR-4 yerine dosya-adı tabanlı özel autoloader; JS tarafında
kullanılmayan 9 paket. Hiçbiri şu an bir şeyi kırmıyor, ama hepsi "kurulum talimatı iki
`composer install` içeriyor" gibi gereksiz karmaşıklık üretiyor.

---

## 6. DOĞRULANAMAYANLAR

Bu turda **kesin olarak doğrulayamadığım** noktalar, nedeniyle birlikte:

| Konu | Neden doğrulanamadı |
| --- | --- |
| `api/src.zip`'in HTTP üzerinden indirilebilir olup olmadığı (ARCH-004, risk 2) | `api/router.php` bu turda okunmadı. "Gerçek dosyalar as-is servis edilir" bilgisi README'den geliyor, koddan değil. Doğrulanması için `router.php` + `php -S` davranışı incelenmeli → **Tur 7** |
| `api/admin/uploads/` dizininin `.gitignore` durumu (ARCH-002) | `git check-ignore` bu dizin için koşturulmadı; `git status` untracked gösteriyor ama bunun ignore-edilmemişlik mi yoksa yeni-eklenmemişlik mi olduğu ayrıştırılmadı |
| README'nin "build verified working — 22 static-prerendered routes" ve "lint verified passing" iddiaları | `npm run build` / `npm run lint` koşturulmadı (kaynak değiştirmeme kuralı gereği build artefaktı üretmekten kaçındım; ayrıca süre/bağlam maliyeti). Doğrulanması → **Tur 7 (bölüm 14)** |
| `getchatbots.php` ile `getchatbots_v2.php` arasındaki fark ve hangisinin canlı olduğu | İkisinin de controller gövdesi okunmadı → **Tur 4 (bölüm 11)** |
| 16 "hiç bağlanmamış" endpoint'in gerçekten ölü mü yoksa yetkilendirmesiz açık yazma yüzeyi mi olduğu | Controller metot gövdeleri okunmadı → **Tur 2 (bölüm 6)** |
| `seller/parampos_callback.php`, `marketplace_reconcile.php`, `marketplace_refund.php`'in gerçekten dış sistemler tarafından çağrıldığı | Harici sistem davranışı repodan doğrulanamaz. Yalnızca "frontend çağırmıyor" doğrulandı |
| `google.txt`, `customserver.txt`, `chatbot_table.txt` içindeki kimlik bilgilerinin rotate edilip edilmediği | Dosya içerikleri kasıtlı okunmadı (denetim raporuna sır yazmamak için) → **Tur 2** |
| `api/admin/error_log` (507 bayt) içeriğinin hassas veri taşıyıp taşımadığı | Okunmadı → **Tur 2** |
| `.DS_Store` dosyalarının gitignore durumu | Kontrol edilmedi (düşük öncelik) |
| `entities/chatbot/ui/ChatbotCard.jsx` (324 satır, ölü) ile canlı 166 satırlık sürüm arasındaki işlevsel fark | İki dosyanın gövdesi karşılaştırılmadı → **Tur 6** |
| `features/wallet/WithdrawalModal.jsx` (246 satır) ile canlı 133 satırlık sürüm arasındaki fark | Aynı → **Tur 6** |
| `global.scss` (11.004 satır) içinde `global.css`'te olmayan kural bulunup bulunmadığı | Diff alınmadı (bağlam maliyeti) |

---

## 7. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

- **`api/src/Presentation/Controllers/*.php` — 14 dosyanın 13'ünün gövdesi.** Yalnızca
  `ChatbotController.php`'nin fiyat doğrulama bölümü (160–180, 285–345) okundu. Bu, bilinçli
  bir sınır: controller gövdeleri bölüm 5, 6, 7, 8, 11, 16'nın konusu.
- **`api/functions/*.php` — 12 dosyanın hiçbiri.** Yalnızca `db.php:423` (`truncate`) tek satır
  olarak grep'lendi. `bootstrap.php`, `coin_engine.php`, `checkout_payments.php`,
  `rate_limit.php`, `validators.php`, `util.php`, `ParamPosMarketplace.php`,
  `producer_plan.php`, `chatbot_limits.php`, `phpmailer.php`, `minify.php` okunmadı.
- **`api/router.php` — hiç okunmadı.** ARCH-004'ün ikinci riskinin doğrulanması buna bağlı.
- **`api/admin/ajax/{create,read,update,delete}.php` — gövdeleri okunmadı.** README bunları
  "codebase'in en riskli yüzeyi" olarak işaretliyor; okuma Tur 2'ye ait.
- **`api/database/schema.sql` — yalnızca `CREATE TABLE` isimleri çıkarıldı** (50 tablo).
  Sütunlar, index'ler, foreign key'ler, charset'ler okunmadı → Tur 5.
- **`api/database/migrations/*.sql` — hiçbiri okunmadı.** Yalnızca varlıkları ve boyutları
  doğrulandı.
- **`web/src/app/**/page.jsx` — 20 sayfanın hiçbiri baştan sona okunmadı.** Yalnızca grep ile
  hedefli satırlar (import'lar, belirli isim eşleşmeleri) incelendi.
- **`web/server.js`, `web/next.config.mjs`, `web/tailwind.config.js` — okunmadı.** Yalnızca
  bağımlılık kullanımı için grep'lendi.
- **`api/src/Shared/Constants/AppConfig.php` — okunmadı.** Sabit değerleri README'den alındı;
  `MIN_WEEKLY_PRICE`'ın kullanımı `ChatbotController` tarafından doğrulandı ama sabitin
  kendi değeri (1 ₺) doğrulanmadı.
- **`api/src/Presentation/Middleware/AuthMiddleware.php` — okunmadı.** Bölüm 6, Tur 2.
- **`api/admin/**` — 30+ PHP sayfası envanteri alındı, gövdeleri okunmadı.**
- **`.history/` altındaki 182 dosya** — kasıtlı olarak hiç açılmadı (eski sürümler).

### Bölüm bazında boş kalan maddeler

**Bölüm 1** — şu lifecycle'lar modellenmedi: authorization akışı, marketplace satın alma
akışı, subscription lifecycle, chatbot lifecycle, coin/message lifecycle, seller/payment
lifecycle, admin lifecycle, AI request lifecycle, file upload/training lifecycle. Yalnızca
request path, backend katmanlama ve frontend mimarisi modellendi. (Bu 9 madde Tur 2–5'in
konusu; tahminle doldurulmadı.)

**Bölüm 2** — şu karşılaştırmalar yapılmadı:
- "README'de belirtilen endpoint gerçekten frontend tarafından kullanılıyor mu?" — **kısmen
  yapıldı** (DEAD-001), ama README'nin API tabloları (satır 429–562) tek tek endpoint bazında
  koda karşı doğrulanmadı → Tur 4.
- "Endpoint'in anlattığı davranış gerçekten kodda var mı?" — hiç yapılmadı (controller
  gövdeleri okunmadı) → Tur 4.
- "README'deki authentication bilgileri güncel mi?" — hiç yapılmadı (README:623–676 iddiaları
  `AuthMiddleware`/`LoginUseCase`'e karşı doğrulanmadı) → Tur 2.
- "README'deki environment variable'lar gerçekten kullanılıyor mu?" — hiç yapılmadı. README
  `PARAM_*` değişkenlerinin hiçbir kod tarafından okunmadığını söylüyor (satır 274–280); bu
  iddia **doğrulanmadı** → Tur 7.
- "README'de production-ready görünen fakat gerçekte stub olan sistemler" — README bunları
  kendisi listeliyor (satır 707–719); listenin **doğruluğu** doğrulanmadı → Tur 3 ve Tur 7.

**Bölüm 3** — şu maddeler boş kaldı:
- `unreachable code` — kod gövdeleri okunmadığı için tespit edilemedi.
- `eksik dependency'ler` — yalnızca fazla olanlar (ARCH-012) tespit edildi; import edilip
  `package.json`'da olmayan bir paket olup olmadığı **kontrol edilmedi**.
- `yanlış dependency versiyonları` / `dependency conflict ihtimalleri` — `package-lock.json` ve
  `composer.lock` hiç incelenmedi.
- `build sırasında ortaya çıkabilecek problemler` — build koşturulmadı → Tur 7.
- `naming inconsistency` — kısmen (ARCH-010, ARCH-006). Frontend/backend arasındaki
  Türkçe/İngilizce alan adı uyuşmazlıkları (`eposta`/`email`, `ucret_haftalik`/`weeklyPrice`)
  tespit edilmedi → Tur 4 (bölüm 11).
- `duplicate logic` — yalnızca duplicate *dosya* düzeyinde bakıldı (DEAD-002, DEAD-004).
  Fonksiyon içi mantık tekrarı incelenmedi → Tur 6 (bölüm 19).

**Bölüm 20** — şu maddeler boş kaldı:
- `eski route'lar` — `/auth` ve `/dashboard/market`'in `notFound()` döndürdüğü README'den
  biliniyor, **kodda doğrulanmadı** → Tur 6.
- `eski CSS` — yalnızca `global.scss`/`global.css.map` (DEAD-005). `global.css`'in 808 satırı
  içinde kullanılmayan kural taraması yapılmadı.
- `artık kullanılmayan environment variable'lar` — hiç yapılmadı → Tur 7.
- `eski config'ler` — `.vscode/`, `components.json`, `nodemon.json`, `eslint.config.mjs`,
  `jsconfig.json` incelenmedi.
