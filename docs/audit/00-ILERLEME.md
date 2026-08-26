# Lumanoris Denetimi — İlerleme Tablosu

Kaynak kapsam listesi: `docs/denetim.md`
Kural: hiçbir kaynak dosya değiştirilmez; çıktı yalnızca `docs/audit/` altına yazılır.

## Tur planı ve durum

| Tur | Kapsanan bölümler | Durum | Rapor dosyası | Okunan dosya sayısı |
| --- | --- | --- | --- | --- |
| 1 | 1, 2, 3, 20 | ✅ Tamamlandı | `docs/audit/01-envanter.md` | 34 tam/kısmi okuma + 9 dizin envanteri |
| 2 | 6, 12 | ✅ Tamamlandı | `docs/audit/02-guvenlik.md` | 21 tam + 13 kısmi okuma |
| 3 | 7, 8, 16 | ✅ Tamamlandı | `docs/audit/03-para.md` | 7 tam + 8 kısmi okuma + 5 tablo şeması |
| 4 | 9, 11, 4 (Frontend API) | ✅ Tamamlandı | `docs/audit/04-ai-ve-sozlesme.md` | 1 tam + 8 kısmi okuma + 4 mekanik tarama |
| 5 | 5, 10 | ✅ Tamamlandı | `docs/audit/05-backend-db.md` | 2 tam + 4 kısmi okuma + 9 tablo şeması + 5 mekanik tarama |
| 6 | 4 (React/Next), 17, 18, 19 | ✅ Tamamlandı | `docs/audit/06-frontend.md` | 8 tam + 5 kısmi okuma + 7 mekanik tarama |
| 7 | 13, 14, 15, 21 | ✅ Tamamlandı | `docs/audit/07-prod-hazirlik.md` | 4 tam + 4 kısmi okuma + 6 mekanik tarama |
| 8 | 25, 26 (puanlama HARİÇ), 27, 29 | ✅ Tamamlandı | `docs/audit/08-ozet.md` | Yeni kod okunmadı — 7 turun sentezi |
| **Düzeltme** | P0 + P1 + seçili P2/P3 | ✅ **Uygulandı** | `docs/audit/09-duzeltme.md` | Raporlar okundu, kod değiştirildi |
| **Düzeltme 2** | Faz 0–3 | ✅ **Tamamlandı** | `docs/audit/10-duzeltme-2.md` | 8 migration, 64 FK, 9 yeni bulgu |

**DENETİM TAMAMLANDI.** Toplam 146 bulgu, 8 rapor dosyası, ~12.000 satır.

**DÜZELTME TURU TAMAMLANDI (2026-08-26).** P0'ın 10 kaleminin 8'i kodla kapatıldı
(2'si anahtar rotasyonu — kullanıcı eylemi), P1'in 18 kaleminin 17'si, ve seçili
P2/P3 kalemleri. Ayrıntı ve canlı doğrulama kayıtları: [`09-duzeltme.md`](09-duzeltme.md).

Kapatılamayan tek bulgu **DEP-001 🔴** (gerçek Param POS entegrasyonu) — kod
düzeyinde çözülemez, `status='active'` yazmak KYC'siz satıcı yaratmak olurdu.


**DÜZELTME TURU 2 — FAZ 0 TAMAMLANDI (2026-08-26).**
`git add`: 31 dosya stage'lendi (üç aşamalı sır taraması yapıldı). Migration'lar: yedek alındı,
**beşi de uygulandı**, **53/53 foreign key canlı**, 53 ilişkide **0 yetim**, ve
FK'lar eklendikten sonra 10 uygulama akışı canlı test edildi.

İki yeni bulgu çıktı ve ikisi de düzeltildi: **DB-013 🟠** (002, 53 kısıtın
yalnızca 5'ini temizliyordu — 27 yetim kalıyordu → `002b` yazıldı) ve
**DB-014 🟠** (003 kısmi hatadan sonra yeniden çalıştırılamıyordu → idempotent
hâle getirildi). Ayrıntı: [`10-duzeltme-2.md`](10-duzeltme-2.md).

**FAZ 0.6/0.7 + FAZ 1:** DB-015 onaylandı ve DB-016 ile birlikte `006` olarak
uygulandı — **64 FK** (45 CASCADE, 14 RESTRICT, 5 SET NULL), sıfır veri kaybı,
11 akışlık regresyon geçti. **BIZ-006 🟠** (bot silme ödenmiş abonelikleri yok
ediyordu) kodla kapatıldı. FIX-002 scratch DB'de doğrulandı, Şubat yedeği silindi.
FAZ 1'de **DB-001/009/012** kapatıldı (kartezyen çarpım 229x → skaler alt sorgu)
ve plan sistemi tek kaynağa bağlandı; `005` ve `007` migration'ları da uygulandı. Yeni bulgu **DB-017 🟠**: DB-004 yalnızca gelecekteki kurulumlar için
düzeltilmişti; canlı veritabanındaki 10 tablo / 38 sütun hâlâ yanlış collation'da
ve MySQL 8'de bile JOIN'i kırıyor.

**FAZ 2 + FAZ 3:** `008` (eksik UNIQUE kısıtlar) eklendi — **toplam 8
migration, 64 FK**. FAZ 2'de PAY-008 (checkout idempotency), PAY-009 (aylık fiyat
sunucuda türetiliyor), ERR-003/API-005'in ContentController kısmı (8 uç nokta +
8 tüketici), AI-002 (SSE tamponlaması) ve REACT-001 (ProfileCard) kapatıldı.
FAZ 3'te hiç bakılmamış beş alan incelendi: **SEC-021 🟠** (updategv.php SVG
kabul ediyor + magic-byte yok) ve **BIZ-007 🟡** (saveChatbot yetim dosya
bırakıyordu) düzeltildi, **SEC-022 🔵** kabul edilen risk olarak kaydedildi,
`BuyModal.jsx` temiz çıktı, ve **PHP 8.1 uyumluluk taraması temiz**
(statik + çalışma zamanı, 0 deprecation).

**0.3/0.4/0.5 ek işleri:** FK silme politikası 53 kısıt için tablo tablo
gözden geçirildi — **DB-015 🟠** (para/muhasebe tablolarında CASCADE yanlış,
11 kısıt değişmeli) ve **DB-016 🟡** (ledger'ın kendi iç bağlarında FK yok)
rapor edildi, **değiştirilmedi, onay bekliyor**. `02-guvenlik.md`'deki düz metin
DB parolası redakte edilip stage'lendi. Bu turda kendi kodumuzda bulunan iki
hata **FIX-001 🟡** ve **FIX-002 🟠** olarak kayda geçti.

Not: bu turda **53 kısıt** sayıldı; aşağıdaki "106 kısıt" ifadesi `ADD` + yorumlu
`DROP` satırlarının toplamıydı.

⚠️ **Kullanıcı eyleminde kalan tek madde:** anahtar rotasyonu (Gemini API anahtarı
ve DB parolası). Redaksiyon rotasyonun yerine geçmez — parola `a77323c`'den beri
git geçmişinde.

---

## GENEL TOPLAM

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | **146** |
| 🔴 CRITICAL | **8** — ARCH-001, SEC-001, SEC-002, PAY-001, PAY-002, COIN-001, BIZ-001, DEP-001 |
| 🟠 HIGH | **27** |
| 🟡 MEDIUM | **60** |
| 🔵 LOW | **46** |
| ⚪ INFO | **5** |
| Elenen false positive | **67** (hepsi gerekçeli) |
| Doğrulanamayan madde | **59** |
| Önceki turlara düzeltme | 2 (Tur 2 SEC-005/006 kapsamı, Tur 3 PAY-011 gerekçesi) |
| Önceki turlara teyit | 3 (üçü de **temiz** çıktı) |
| Prod blocker sayısı | **14** |

**Türlere göre (bölüm 27):** prod blocker 14 · güvenlik 31 · iş mantığı 19 · bug 28 ·
mimari 12 · teknik borç 33 · doküman 9 · olumlu doğrulama 1

**Roadmap:** P0 (3-4 gün, 10 kalem) → P1 (4-6 hafta) → P2 (2-3 ay) → P3 (sürekli).
Ayrıntı: [`08-ozet.md`](08-ozet.md) bölüm 3.

**En yüksek getirili tek değişiklik:** `generateReply`'a `chatbot_id` eklemek ve sistem
talimatını sunucuda kurmak — 1-2 günlük iş, **beş bulguyu** birden kapatıyor
(COIN-001 🔴, PAY-002 🔴, SEC-015 🟡, AI-001 🟠, AI-005 🟡).

---

## Tur 1 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 31 (DOC-001…009, ARCH-001…014, DEAD-001…008) |
| 🔴 CRITICAL | 1 — ARCH-001 |
| 🟠 HIGH | 3 — DOC-001, ARCH-002, ARCH-003 |
| 🟡 MEDIUM | 9 |
| 🔵 LOW | 13 |
| ⚪ INFO | 5 |
| Elenen false positive | 6 |
| Doğrulanamayan madde | 12 |

**Elenen false positive'ler:** `auth/login-google.php` (regex `-` kaçırdı), `sharer/sharer.php`
(Facebook paylaşım URL'i), `react-dom` + `sharp` (dolaylı runtime bağımlılığı), 5 private
controller helper (`self::` ile içeriden çağrılıyor), CWD-göreli `require` path'leri.

---

## Tur 2 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 32 (SEC-001…020, ERR-001…012) |
| 🔴 CRITICAL | 2 — SEC-001, SEC-002 |
| 🟠 HIGH | 7 — SEC-003…008, ERR-001 |
| 🟡 MEDIUM | 11 |
| 🔵 LOW | 12 |
| ⚪ INFO | 0 |
| Elenen false positive | 11 |
| Doğrulanamayan madde | 10 |

**En kritik ikisi:**
- **SEC-001 🔴** — `router.php:4-9` + `server.js:29` (`pathFilter: ['/admin',…]`) birlikte,
  `GET /admin/.env` (Gemini API anahtarı), `GET /admin/db_backup/*.sql` (1,59 MB canlı DB
  dökümü — tüm e-postalar + bcrypt hash'ler) ve `GET /admin/error_log` yollarını **kimlik
  doğrulaması olmadan** açıyor. `api/admin/.htaccess`'te hiçbir erişim kuralı yok.
- **SEC-002 🔴** — `MarketplaceController::updateSubscription():383` yalnızca `id` ve `user_id`
  alanlarını çıkarıyor; `user_subscriptions.expiry_date` istemciden yazılabiliyor →
  kullanıcı kendi aboneliğini ücretsiz olarak süresiz uzatabiliyor.

**Elenen false positive'ler (11):** admin CRUD SQLi (üç allowlist guard'ı gerçekten çağrılıyor),
`assertSafeWhereFragment` (blocklist değil, allowlist grameri), remember-me süre kontrolü
(SQL'de var), `buychatbot.php` (410 ile devre dışı), `createnotification.php` (hedef sunucuda
zorlanıyor), ReactMarkdown XSS (v10 ham HTML render etmiyor), `require_method` içermeyen
metotlar (hepsi getter), `readpdf.php` (auth + boyut sınırı eklenmiş), `admin/ajax/upload.php`
(magic-byte doğrulaması var), `withdraw()` yarış koşulu (`GET_LOCK` + transaction var),
`saveBankInfo` mass assignment (beyaz liste var).

**Tur 2'nin ana örüntüsü:** 32 bulgunun en az 12'si *"aynı projede doğrusu var, bu yola
uygulanmamış"* biçiminde — `session_regenerate_id` iki login yolunda var, remember-me ve admin
girişinde yok; rate limit kullanıcı girişinde iki katmanlı, admin girişinde hiç yok; sütun
beyaz listesi `saveBankInfo`'da var, beş yazma endpoint'inde yok; `APP_DEBUG` hata ayrımı
`/api`'de var, admin'de yok.

---

## Tur 3 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 25 (PAY-001…015, COIN-001…005, BIZ-001…005) |
| 🔴 CRITICAL | 4 — PAY-001, PAY-002, COIN-001, BIZ-001 |
| 🟠 HIGH | 6 — PAY-003…007, BIZ-002 |
| 🟡 MEDIUM | 10 |
| 🔵 LOW | 5 |
| ⚪ INFO | 0 |
| Elenen false positive | 14 |
| Doğrulanamayan madde | 9 |

**Dört CRITICAL:**
- **PAY-001** — `chargeCard()` (`checkout_payments.php:56-63`) sahte Luhn-geçerli kartı kabul
  edip başarı simüle ediyor; çevresindeki kod sonucu gerçek ödeme gibi işliyor:
  `status='paid'` ödeme satırı, `status='approved'` satıcı payı, ve `withdraw()` üzerinden
  **çekilebilir bakiye**. Şema `pending_approval` varsayılanıyla iki fazlı settlement
  öngörmüş; kod o fazı atlıyor.
- **PAY-002** — `ChatbotRepository::userHasAccess()` satır 9 (`is_independent = 0 AND
  pms.user_id IS NOT NULL`) satıştaki her botu abonelik olmadan açıyor. Tur 2 SEC-015 ile
  birleşince: `getchatbot` + `get_training_chunks` ile persona ve eğitim metni çekilip
  `generatereply`'a `system_instruction` olarak verilebiliyor → **ürünün tamamı ücretsiz**.
- **COIN-001** — `generateReply` `consumeMessage()`'ı hiç çağırmıyor (istekte `chatbot_id`
  bile yok). Mesaj limiti tamamen istemcinin gönüllü bir endpoint'i çağırmasına bağlı.
  Etkin limit 10/gün yerine **28.800/gün** (`genreply` rate limiti 20/dk).
- **BIZ-001** — `upgradePlan` ₺149/₺299/₺599 paketlerini **ödeme almadan** yazıyor,
  `plan_name`'i doğrulamıyor; yazdığı kaydı yalnızca dashboard başlığı okuyor, hiçbir
  limit/kota okumuyor. Ödeme alınsaydı da karşılıksız olurdu (bkz. BIZ-002).

**Tur 3'ün ana örüntüsü:** Fiyat manipülasyonu tarafı gerçekten sağlam (fiyat her zaman
DB'den, tek `linePrice()` kaynağı, sıfır fiyat reddi). Sorunlar iki başka yerde:
(1) **stub'ların çevresindeki kod stub olduğunu bilmiyor** — simüle edilmiş tahsilat
`'paid'`/`'approved'` ledger satırlarına ve çekilebilir bakiyeye dönüşüyor;
(2) **tamamlanmamış durum makineleri** — `param_marketplace_details` beş durumlu yaşam
döngüsünün yalnızca birini kullanıyor, `para_cekme_talepleri.durum` hiçbir yerde
güncellenmiyor ve tablo admin beyaz listesinde de değil.

**Elenen false positive'ler (14):** `duration_weeks=52` ile yıllık erişim (süre 30 güne
sabitli), istemci fiyatıyla ödeme (fiyat DB'den), aylık indirimin iki kez uygulanması
(düzeltilmiş), sepet/checkout tutar farkı (tek `linePrice` kaynağı), `consumeMessage` coin
yarışı (atomik), ilk coin satırı yarışı (çözülmüş), `withdraw()` bakiye yarışı (`GET_LOCK`),
abonelik süresinin PHP saatiyle hesaplanması (DB saatine sabitli), `createSubscription`'ın
sepete güvenmesi (kurallar yeniden kontrol ediliyor), NULL fiyatlı bot (reddediliyor),
`reconcile` sır karşılaştırması (`hash_equals`), `refund()` yetkisi (`requireAdmin`),
`countByOwner`'ın `author_user_id` kullanması (transfer devre dışı), pricing.js ↔ AppConfig
ayrışması (birebir aynı).

---

## Tur 4 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 18 (AI-001…007, API-001…006, FE-001…005) |
| 🔴 CRITICAL | 0 |
| 🟠 HIGH | 3 — AI-001, API-001, FE-001 |
| 🟡 MEDIUM | 11 |
| 🔵 LOW | 4 |
| ⚪ INFO | 0 |
| Elenen false positive | 10 |
| Doğrulanamayan madde | 8 |

**Üç HIGH:**
- **AI-001** — Botun **tüm** `training_prompt`'u (LONGTEXT, sınırsız) istemcide toplanıp
  her mesajda Gemini'ye gönderiliyor. Dört katmanın hiçbirinde boyut/token sınırı yok.
  500 KB eğitim metni ≈ 125k token × dakikada 20 istek = **2,5M token/dk, tek kullanıcıdan.**
- **API-001** — `getchatbot.php` başarıda zarfsız (`{chatbot:…}`), hatada zarflı
  (`{success:false,…}`). İstemci ayırt edemediği için hiç kontrol yapmıyor → 404 tamamen
  sessiz, sohbet sayfası boş kalıyor, hata mesajı yok.
- **FE-001** — Ayarlar sayfasındaki gizlilik politikası ve kullanım koşulları **sabit kodlu
  iki cümlelik yer tutucu**. Admin panelinden yönetilen gerçek KVKK/kullanım metni
  (`global_vars` → `getprivacy.php` → `widgets/info/PrivacyPolicy2.jsx`) hiçbir kullanıcıya
  ulaşmıyor; o bileşenler Tur 1'de "ölü" olarak işaretlenmişti — ölü olan, **çalışan** koddu.

**Tur 4'ün ana örüntüsü:** Tek bir mimari tercih — **sistem talimatının istemcide
kurulması** — dört turda tespit edilen beş bulgunun ortak kökü (SEC-015, PAY-002,
COIN-001, AI-001, AI-005). `chatbot_id` alıp talimatı sunucuda kurmak, bu beşinin hepsini
birden kapatıyor: denetimin bulduğu en yüksek getirili tek değişiklik.

İkinci örüntü: **hata sessizleşiyor.** Sunucu doğru durum kodunu ve `error_code`'u özenle
üretiyor, istemci okumuyor — `res.ok` 51 dosyanın yalnızca 8'inde kontrol ediliyor. Bu bir
disiplin eksikliği değil, Tur 2 ERR-003'ün (28 noktada zarf atlanması) rasyonel sonucu:
`success` anahtarının varlığı endpoint'e göre değiştiğinde istemci kontrolü tamamen bırakıyor.

**Elenen false positive'ler (10):** `PrivacyPolicy.jsx`'in `content` beklentisi (sunucu
gerçekten sarıyor), `dashboard/page.jsx`'in kontrolsüz fetch'leri (`Array.isArray` guard'ı
çökmeyi önlüyor), dashboard'un üç yanıt şekli beklentisi (üçü de eşleşiyor), `consumemessage`
zarfı (istemci `allowed` okuyor, `success` değil), `x-www-form-urlencoded` kullanımı
(PHP `$_POST` her iki tipi de dolduruyor), `loadFullTrainingPrompt` sonsuz döngü riski
(`hasMore` monoton), checkout'un fiyatı yeniden hesaplaması (sunucu `lineTotal`'ı
kullanılıyor), checkout hata işleme (tam), `get_training_chunks` success kontrolü (var),
`getchat.php` kullanıcı izolasyonu (sorgu kapsıyor).

---

## Tur 5 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 20 (BE-001…008, DB-001…012) |
| 🔴 CRITICAL | 0 |
| 🟠 HIGH | 4 — BE-001, DB-001, DB-002, DB-003 |
| 🟡 MEDIUM | 9 |
| 🔵 LOW | 7 |
| ⚪ INFO | 0 |
| Elenen false positive | 10 |
| Doğrulanamayan madde | 10 |
| **Önceki turlara düzeltme** | **2 — Tur 2 SEC-005/006 kapsamı, Tur 3 PAY-011 gerekçesi** |

**Dört HIGH:**
- **BE-001** — `api/admin/partials/_login.php:1-26` ikinci ve **tamamen bağımsız** bir admin
  kimlik doğrulama implementasyonu (no-JS geri düşüş yolu). `session_regenerate_id` ve rate
  limit ikisinde de yok. Bu yol **kimlik doğrulaması olmadan** erişilebilir olduğu için
  Tur 2 ERR-009'un "admin oturumu gerekiyor, bu yüzden LOW" gerekçesi de geçersiz.
- **DB-001** — `ChatbotRepository::getPublished()` altı sınırsız alt tabloya LEFT JOIN +
  `COUNT(DISTINCT)` → kartezyen çarpım. Ana sayfanın sorgusu, sayfalama yok. Küçük veriyle
  görünmez, gerçek veriyle **ani** çöker.
- **DB-002** — `schema.sql`: 50 tablo, **0 foreign key**. Düzeltme migration'larda hazır ve
  ölçülmüş (106 kısıt, "38 orphaned rows ... when measured") ama hiçbiri versiyon
  kontrolünde değil. Diskteki şema, migration'ların düzeltmeyi amaçladığı bozuk durumu
  içeriyor.
- **DB-003** — Satıcı bakiyesi `param_marketplace_payments`'a JOIN yapıyor ama `p.status`'u
  hiç okumuyor. `d.status` ise her zaman `'approved'` yazılıyor (PAY-001) → **ödeme durumu
  sütununun para üzerinde hiçbir etkisi yok.** Şemada `idx_status` index'i var, kullanılmıyor.

**Tur 5'in ana örüntüsü:** Enjeksiyon yüzeyi gerçekten temiz (`unserialize`/`eval`/`extract`
sıfır, iki dinamik include de beyaz liste arkasında, istemci kontrollü `ORDER BY` yok,
tüm para sütunları `decimal(10,2)`) — 10 false positive bu yüzden elendi. Asıl sorun
**dağıtılabilirlik**: şema ve migration'lar versiyon kontrolünde değil, diskteki şema bozuk
durumu belgeliyor, migration sırasını zorlayan araç yok, 9 tablo MariaDB'de hiç oluşmaz
(README üç yerde MariaDB vaat ediyor). Bölüm 10'un açık sorusuna cevap — *"yeni bir sunucuda
güvenilir kurulabilir mi?"* — **hayır**, ve nedenlerinin hiçbiri kod kalitesi değil.

En asimetrik bulgu: migration'lar bir **önceki denetimin** ürünü ("RİSK-9", "RİSK-10",
"run against live data 2026-08-24"). Yüksek kaliteli, ölçülmüş bir düzeltme var; sıfır
dağıtım yolu var.

---

## Tur 6 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 13 (NEXT-001…005, REACT-001, UX-001…003, SEO-001…003, CQ-001) |
| 🔴 CRITICAL | 0 |
| 🟠 HIGH | 2 — NEXT-001, UX-001 |
| 🟡 MEDIUM | 6 |
| 🔵 LOW | 5 |
| ⚪ INFO | 0 |
| Elenen false positive | 12 |
| Doğrulanamayan madde | 8 |
| **Önceki turlara teyit** | **3 — hepsi TEMİZ çıktı** |

**Üç teyit (bölüm 27 gereği olumsuz sonuçlar da kayda geçti):**
- **Tur 2 devri — admin `echo` XSS: yok.** Kullanıcı kontrollü 4 alanın 4'ü de
  `htmlspecialchars` ile escape ediliyor (`adminler.php:24`, `chatbotistatistik.php:14`,
  `chatbotlar.php:15`, `kullanicilar.php:14`). "En olası stored-XSS yeri" temiz çıktı.
- **Tur 5 BE-003 devri — bcrypt hash HTML'e düşmüyor.** `kullanicilar.php:12-16`
  `$kullanicilar`'ı yalnızca `id` + `ad_soyad` için kullanıyor; `sifre` hiçbir yere
  yazılmıyor. Tur 5'teki temkinli ifade doğruymuş.
- **Tur 1 devri — `notFound()` route'ları** doğru ve gerekçe yorumlu.

**İki HIGH:**
- **NEXT-001** — `next.config.mjs`'de `headers()` yok: CSP, X-Frame-Options,
  Referrer-Policy, HSTS hiçbiri tanımlı değil. Kendi başına açık değil, ama Tur 2
  SEC-017 (6 bileşende `dangerouslySetInnerHTML`), SEC-005/009 + Tur 5 BE-001 (session
  fixation) ve Tur 4 FE-005 (ham PAN) bulgularının **azaltıcı katmanının hiç olmaması**.
  Admin paneli üstelik iki üçüncü taraf CDN'den script/CSS yüklüyor.
- **UX-001** — Bot oluşturma sayfasındaki "Önizleme Asistanı" sahte:
  `create/page.jsx:330-338` `setTimeout(800)` + sabit şablon (`"${userText}" sorunuzu
  sistem talimatıma [${systemPrompt.slice(0,30)}...] göre yanıtlıyorum!`). Sayfa
  `generatereply.php`'yi hiç çağırmıyor. Kullanıcı prompt'unu test ettiğini sanıyor;
  cevap prompt'un içeriğinden bağımsız.

**Tur 6'nın iki örüntüsü:**
1. **"Yönetiliyor ama ulaşmıyor" — dördüncü örnek.** UX-003: ana sayfa görselleri admin'de
   yönetiliyor (`/admin/anasayfa`), `getlandingimages.php` onları sunuyor, gösterecek
   sayfa yok (`app/page.jsx` → `redirect("/dashboard")`). Tur 4 FE-001 (hukuki metinler),
   Tur 5 BE-002 (tema), Tur 6 UX-002 (plan limitleri) ile aynı kalıp.
2. **"Sahte başarı geri bildirimi" — üçüncü örnek.** UX-001, Tur 3 PAY-012
   (`processRefund` no-op ama başarı) ve Tur 3 BIZ-001 (`upgradePlan` ödeme almadan
   "güncellendi") ile aynı sınıf.

**Olumlu:** Erişilebilirlik bu turun sürprizi — `<html lang="tr">`, doğru uygulanmış
skip-link (`dashboard/layout.jsx:49-54`), `<main>` landmark, **7/7 `<img>`'de `alt`**,
25 dosyada `aria-*`, 20 dosyada `disabled` ile çift tıklama koruması. Bölüm 18'de
erişilebilirlik yönünde yazılacak bulgu bulunamadı. Route koruması
(`dashboard/layout.jsx:39-45`) `authReady` gate'iyle doğru — korumasız içerik flash'ı yok.
Tüm repoda **2 TODO** (ikisi de bilinen `chatbot_limits.php` konusu).

---

## Tur 7 özet sayıları

| Metrik | Değer |
| --- | --- |
| Toplam bulgu | 8 (DEP-001…006, PERF-001, + bölüm 21 konsolidasyonu) |
| 🔴 CRITICAL | 1 — DEP-001 |
| 🟠 HIGH | 2 — DEP-002, DEP-003 |
| 🟡 MEDIUM | 3 |
| 🔵 LOW | 1 |
| Bölüm 21 konsolide tablosu | **27 özellik**, hiçbiri production'a hazır değil |
| Bölüm 15 test listesi | 8 unit + 8 integration + 7 API + 7 E2E + 9 güvenlik testi, her biri somut bir bulguya bağlı |
| Doğrulanamayan madde | 8 |

**DEP-001 🔴 — tek stub tüm pazaryerini kilitliyor.** `ParamPosMarketplace::addSubMerchant()`
her zaman `success:false` döndürüyor → `SellerController::register:88-96` `status='rejected'`
yazıyor → `status='active'`'e bağlı **altı kapı** kapanıyor: `saveChatbot:53`,
`publishChatbot:191`, `addToCart:21`, `createSubscription:217`, `getPublished:92` (INNER JOIN),
`userHasAccess` 2. dal. Temiz bir kurulumda kimse satıcı olamıyor → hiçbir bot yayınlanamıyor
→ pazaryeri boş → hiçbir satış yapılamıyor. İkinci kilit: `listIller`/`listIlceler` de boş
dönüyor, `register` `il_kod`/`ilce_kod`'u zorunlu tutuyor → form doldurulamıyor bile.

**Önemli nüans:** Tur 3 PAY-001 ve PAY-002'nin sömürüsü `status='active'` satırlarının
varlığını gerektiriyor. Geliştirme veritabanında bunlar var (elle eklenmiş), temiz kurulumda
yok. Bu, o iki bulgunun ciddiyetini azaltmıyor (production'da gerçek satıcılar olacak) ama
önkoşulunu netleştiriyor.

**DEP-003 🟠 — şifre sıfırlama kurtarılamaz.** `sendEmail()` `$htmlBody` parametresini alıyor
ama **hiç kullanmıyor** — ne gönderiyor ne logluyor. Kod yalnızca `$body` içinde ve DB'de
SHA-256 hash olarak var. **README'nin "kod error_log'da görünür" tavsiyesi yanlış.**
Bu aynı zamanda Tur 2/3'ten devredilen "error_log şifre kodu içeriyor mu?" sorusunu
**hayır** olarak kapatıyor.

**DEP-002 🟠 — TC kimlik no + IBAN error_log'da.** `ParamPosMarketplace.php:11`
`json_encode($params)` ile `TC_VN`, `IBAN_No`, `Kisi_DogumTarihi`, `GSM_No`, `Adres`
loglanıyor. Tur 2 SEC-001 o dosyanın HTTP'den okunabildiğini gösterdi. Aynı veri
`param_marketplace_sellers.param_payload_json`'a da düz JSON yazılıyor (DB dökümü de
indirilebilir).

**Turun ana bulgusu — stub'ların yarısı fail-open.** Beş stub'dan ikisi doğru davranıyor
(`producer_plan.php` ve `ParamPosMarketplace`'ın yazma metotları → `success: false`).
Üçü **sahte başarı** döndürüyor: `chargeCard` (→ ledger'a `paid`/`approved` + çekilebilir
bakiye), `sendEmail` (→ "gönderildi" ama kurtarılamaz hesap), `processRefund`/
`reconcilePayments` (→ admin'e "tamamlandı"). Fail-closed stub zararsız; fail-open stub
**gerçek sonuç üretiyor**.

**Bölüm 14'ün açık sorusu — "yeni bir VPS'e verilse README ile kurulabilir mi?"**
**Hayır.** Altı adımda tıkanıyor: `_guard.php`/`session.php` yok (ARCH-001) → şema yok
(DOC-001) → migration'lar versiyon kontrolünde değil (DB-002) → MariaDB'de 9 tablo
başarısız (DB-004) → satıcı kaydı yapılamıyor (DEP-001) → health check/graceful
shutdown/PORT yok (DEP-005). Hiçbiri kod kalitesi sorunu değil; hepsi paketleme/dağıtım.

---

## Sonraki turlara devredilen açık sorular

### Tur 1'den devredilenler (durum güncellendi)

| Konu | Hedef tur | Durum |
| --- | --- | --- |
| Admin legacy CRUD motoru (istemciden tablo/WHERE) | Tur 2 | ✅ **Kapandı** — üç allowlist guard'ı doğrulandı, SQLi yok (false positive olarak kayda geçti) |
| `db.php` hard-coded DB kimlik bilgileri | Tur 2 | ✅ **Kapandı** — SEC-008 🟠; git geçmişinde (`a77323c`) ve şu an **aktif** yol |
| Beş stub dosyası (`checkout_payments`, `producer_plan`, `chatbot_limits`, `phpmailer`, `ParamPosMarketplace`) | Tur 3 + Tur 7 | ✅ **Tamamen kapandı** — PAY-001 🔴, PAY-012, BIZ-002 🟠, BIZ-003 (Tur 3); DEP-001 🔴, DEP-003 🟠 (Tur 7). Örüntü: **beşten üçü fail-open (sahte başarı), ikisi fail-closed (doğru)** |
| `AppConfig` / `coin_engine.php` / `pricing.js` sabit aynalaması | Tur 3 | ✅ **Kapandı** — beş sabit ve iki formül birebir aynı; false positive olarak kayda geçti |
| `getchatbots.php` vs `getchatbots_v2.php` farkı | Tur 4 | 🟡 **Kısmen** — API-002: zarf farkı kesin (v1 zarflı, v2 çıplak dizi), v2 hâlâ hiç çağrılmıyor. `getPublished()` vs `getPublishedV2()` **veri** farkı okunmadı → Tur 5 |
| `schema.sql` 50 tablosunun kodla karşılaştırılması | Tur 5 | 🟡 **Kısmen** — 9 tablonun sütun+index tanımı okundu (DB-001…012 buradan çıktı). Kalan 41 tablo incelenmedi |
| `notFound()` route'ları, `force-static` mimarisi | Tur 6 | ✅ **Kapandı** — `notFound()` ikisi de doğru ve gerekçe yorumlu (temiz). `force-static` + istemci veri çekimi tutarlı tercih; SEO etkisi SEO-003'te değerlendirildi (public yüzey yalnızca `/login` + `/forgot-password`) |
| Tur 1 DEAD-001/c'deki 16 "bağlanmamış" endpoint | Tur 2 | 🟡 **Kısmen** — `updatesubscription` sömürülebilir çıktı (SEC-002), `buychatbot` ve `createnotification` temiz; kalan 13'ü hâlâ denetlenmedi |

### Tur 2'den devredilenler

| Konu | Hedef tur | Durum |
| --- | --- | --- |
| **`BaseRepository.php` okunmalı — ilk iş** | Tur 3 | ✅ **Kapandı** — BIZ-004: sütun beyaz listesi **yok**, `assertSafeColumnName` de yok. SEC-002/003/014 tam olarak geçerli, hiçbiri zayıflamadı |
| `SellerController`'ın 12 metodu, `parampos_callback` kimlik doğrulama modeli | Tur 3 | 🟡 **Kısmen** — `reconcile`/`refund`/`paramposCallback` okundu (PAY-007 🟠: callback tamamen korumasız). Kalan 9 metot okunmadı → Tur 7 |
| `createSubscription` / checkout para akışı | Tur 3 | ✅ **Kapandı** — PAY-001…011. CSRF açısından: `require_method('POST')` var, `SameSite=Lax` yeterli; ayrı bulgu yazılmadı |
| `api/admin/error_log` içeriği (şifre sıfırlama kodları var mı?) | Tur 3 | ⏳ **Hâlâ açık** — kasıtlı okunmadı (rapora sır yazmamak için). SEC-001 ve PAY-015'in etki değerlendirmesi buna bağlı. **Kullanıcının kendisi kontrol etmeli.** |
| `api/admin/ajax/updateenv.php` | Tur 7 | ✅ **Kapandı** — DEP-004 🟡: `.env` satır sonu enjeksiyonu, `hash_equals` yerine `!==` (üstelik `_guard.php` doğru kontrolü zaten yapmış), `file_put_contents` sonucu kontrol edilmiyor. Etki alanı `api/admin/.env` ile sınırlı |
| `api/admin/ajax/updategv.php` gövdesi | — | ⏳ **Hâlâ açık** — Tur 7'de de okunmadı. Tur 2 SEC-017'nin (`dangerouslySetInnerHTML`) sunucu tarafı HTML sanitizasyon sorusu **cevapsız** |
| Admin PHP sayfalarındaki `echo` çıktıları (kullanıcı→admin stored XSS) | Tur 6 | ✅ **Kapandı — TEMİZ.** Kullanıcı kontrollü 4 alanın 4'ü de `htmlspecialchars` ile escape ediliyor. Tek escape'siz nokta CQ-001 (`kategori_adi_tr`, admin kontrollü, 🔵) |
| `smalot/pdfparser` CVE durumu, `composer.lock` denetimi | Tur 7 | 🟡 **Kısmen** — sürüm tespit edildi (**v2.12.5**), diğer paketler de listelendi (DEP-006). **CVE durumu doğrulanamadı** — CVE veritabanına erişim yok. Kullanıcı PDF'i ayrıştırdığı için takip edilmeli |
| `%2e%2e` path traversal (`router.php:4`) | — | ⏳ **Yedi turda da doğrulanamadı** — canlı sunucu gerekiyor, kaynak değiştirmeme kuralı gereği başlatılmadı. **Kullanıcının kendisi test etmeli** |
| `next.config.mjs`'te CSP/security header var mı? | Tur 6 | ✅ **Kapandı** — NEXT-001 🟠: **hiçbiri yok.** `headers()` fonksiyonu tanımlı değil; `server.js` ve `.htaccess`'te de yok |
| `unserialize` / dinamik `include` (PHP object injection, LFI) | Tur 5 | ✅ **Kapandı** — BE-008: `unserialize`/`eval`/`extract`/`create_function` **sıfır**; iki dinamik include de beyaz liste arkasında. Temiz |
| SMTP kimlik bilgilerinin nerede saklandığı | Tur 7 | ⏳ Açık — `admin/ajax/smtp.php` okunmadı |

### Tur 3'ten devredilenler

| Konu | Hedef tur | Neden |
| --- | --- | --- |
| **`SellerController::register` (106 satır)** | Tur 7 | ✅ **Kapandı** — akış titizlikle yazılmış (tam doğrulama, idempotency, red kaydı, `active` yalnızca gateway başarısında). Ama `addSubMerchant` stub'ı hep başarısız → **DEP-001 🔴**. Ayrıca DEP-002 🟠: TC kimlik no + IBAN error_log'a yazılıyor |
| `api/functions/ParamPosMarketplace.php` | Tur 7 | ✅ **Kapandı** — DEP-001 🔴 + DEP-002 🟠. Altı metodun ikisi boş liste, dördü `success:false` döndürüyor |
| `computeBalanceAndTransactions`'ın gelir sorgusu `p.status`'a bakmıyor gibi | Tur 5 | ✅ **Kapandı** — DB-003 🟠: gerçekten filtrelemiyor. `d.status` her zaman `approved` yazıldığı için (PAY-001) **ödeme durumu sütununun para üzerinde hiçbir etkisi yok**. Şemada `idx_status` index'i var, kullanılmıyor |
| `param_marketplace_payments` tablosunun sütun tanımı | Tur 5 | ✅ **Kapandı** — `items_json`/`seller_splits_json`/`product_amount` sütunları **VAR**. → **Tur 3 PAY-011 düzeltildi** (05-backend-db.md bölüm 0), gerekçesi daraltıldı: "veri yok" değil, "veri sorgulanamaz blob'da + ilişkisel sütunlar yanlış" |
| `plans`, `plan_icerikler`, `producer_plans`, `producer_self_use_credits` tabloları | Tur 7 | ⏳ **Hâlâ açık** — Tur 5'te de okunamadı. BIZ-003'ün "üretici planı hiç var olamıyor" tespitiyle olası çelişki çözülmedi |
| `chat/page.jsx`'te `consumemessage` ↔ `generatereply` çağrı **sırası** | Tur 4 | ✅ **Kapandı** — AI-005: coin **önce** yanıyor (satır 464), Gemini sonra (satır 602). Başarısızlıkta iade yok. Ayrıca iki endpoint'in rate limitleri uyumsuz (60/dk vs 20/dk) → 21.–60. mesajlarda coin karşılıksız yanıyor |
| `checkout/page.jsx` payload'ı | Tur 4 | ✅ **Kapandı** — sözleşme tarafı temiz (FormData + `success` kontrolü + hata gösterimi + fiyatı yeniden hesaplamama). Bulgular: API-004 (`use_3d` okunmuyor), FE-005 (ham PAN). **`BuyModal.jsx` okunamadı** → Tur 6 |
| `saveChatbot`'ta yetim dosya riski (görsel diske yazılıp `create()` başarısız olursa) | Tur 7 | ⏳ **Hâlâ açık** — Tur 5'te incelenmedi, transaction yok |
| `getChatbotLimits` (ChatbotController:226-245) | Tur 6 | ✅ **Kapandı** — UX-002 🟡: endpoint doğru yazılmış ama `chatbot_limits.php` stub'ından **her zaman 1/2** alıyor. Ücretli kullanıcı bot ekranında ücretsiz limiti görüyor, dashboard başlığı ise "Elmas" diyor — iki ekran çelişiyor |

### Tur 4'ten devredilenler

| Konu | Hedef tur | Neden |
| --- | --- | --- |
| **48 fetch içeren 7 frontend dosyası** | Tur 6 → Tur 7 | 🟡 **Kısmen** — lifecycle sayımı yapıldı (REACT-001: `AbortController` **hiçbirinde yok**, `ProfileCard` 7 effect / 0 cleanup; `DashboardHeader` temiz çıktı). **Sözleşme karşılaştırması hâlâ yapılmadı** |
| `ChatbotRepository::getPublished()` vs `getPublishedV2()` gövdeleri | Tur 5 | ✅ **Kapandı** — DB-012: fark tam iki madde (V2 sunucuda "ilgilenmiyorum" filtresi ekliyor; `toplam_comments` sayımını çıkarıyor). V2 index'siz `chatbot_uninterested`'a alt sorgu atıyor (DB-005) |
| `chat/page.jsx`'in "Tekrar Dene" mekanizması (satır 575-577 yorumu) | Tur 6 | Yeniden denemede coin'in tekrar tüketilip tüketilmediği doğrulanmadı |
| `MessageInput.jsx` (260 satır) | Tur 6 | FE-003'ün (dosya eki atılıyor) arayüz tarafı — dosya seçici gerçekten sunuluyor mu |

### Tur 5'ten devredilenler

| Konu | Hedef tur | Neden |
| --- | --- | --- |
| **`migrations/00{1,2,3}` gövdeleri okunmalı — uygulanmadan ÖNCE** | Tur 7 | DB-002'nin çözümü olarak öneriliyorlar. `002` kendi başlığında "Every statement here DELETES OR REWRITES DATA" diyor. 106 FK tanımı, `ON DELETE` tercihleri ve 002'nin silme ifadeleri **doğrulanmadı** |
| `admin/kullanicilar.php` render kısmı (bcrypt hash HTML'e düşüyor mu?) | Tur 6 | BE-003 yalnızca 2. satırı okudu; sızıntı iddiası yapılmadı. Tur 2'nin admin `echo` denetimiyle birlikte yapılmalı |
| `admin/partials/_header.php` + `_sidebar.php` | Tur 6 | BE-002'nin `$current_theme` null erişim riski bunlara bağlı |
| `chatbot_conversations.last_message_at` kullanılıyor mu? | Tur 6 veya 7 | Şemada var; kullanılıyorsa `getHistory`'nin iki korelasyonlu alt sorgusu (DB-010) tamamen gereksiz olabilir |
| İzolasyon seviyesi + deadlock analizi | Tur 7 | `db.php:76-80`'de izolasyon ayarlanmıyor (MySQL varsayılanı `REPEATABLE READ`). `createSubscription` transaction'ı ↔ `withdraw` `GET_LOCK`'u etkileşimi incelenmedi |
| `timestamp` vs `datetime` tutarsızlığı | Tur 7 | Şemada ikisi de kullanılıyor (`chatbot_chats.sent_time` datetime, `chatbot_likes.liked_at` timestamp). `timestamp` UTC dönüşümü yapar, `datetime` yapmaz — COIN-003'ün şema tarafı olabilir, ayrı bulgu yazılacak kadar incelenmedi |
| `api/admin/assets/` altındaki 7 dosya | Tur 6 | BE-007'de `login.js`'in yetim olduğu bulundu; diğerleri (admin.js, 4 CSS, Notification.js, Inter.ttf) taranmadı |
| PHP 8.1+ uyumluluğu / deprecated API taraması | Tur 7 | **Hiç yapılmadı.** `composer.json` `>=8.1` diyor; 8.1'de kaldırılmış API kullanımı arandı mı → hayır |
| **Bölüm 11'in tam sözleşme tablosu** (120 endpoint × 9 alan) | ayrı tur gerekir | Tur 4 yalnızca 19 endpoint karşılaştırdı (~%16). Tam tablo tek turda çıkarılamaz |
| Bölüm 4'ün "auth gerektiren endpoint'ler gerçekten korunuyor mu" maddesi | Tur 6 | Sunucu tarafı Tur 2'de ölçüldü; istemcinin korumasız sandığı endpoint karşılaştırması yapılmadı |
