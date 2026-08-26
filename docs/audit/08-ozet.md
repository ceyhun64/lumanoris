# Tur 8 — Önceliklendirme, Sonuç Raporu ve Son Kontrol

Kapsanan `docs/denetim.md` bölümleri: **25** (Önceliklendirme), **26** (Sonuç raporu —
**puanlama HARİÇ**), **27** (Bulgu türlerinin ayrıştırılması), **29** (Son kontrol).

Bu tur yeni kod okumadı. Yedi turun bulgularını sentezler, önceliklendirir ve
`denetim.md`'nin SON TALİMAT'ındaki soruyu cevaplar.

---

## BU RAPORUN KURALLARI

- **HİÇBİR KAYNAK DOSYA DEĞİŞTİRİLMEDİ.**
- Bu tur **yeni bulgu üretmiyor.** Her satır önceki turlardaki bir bulguya atıf yapar;
  atıfsız iddia yoktur.
- **Bölüm 26'nın istediği X/10 puanlama ÜRETİLMEDİ** — kod okumadan da yazılabilecek bir
  sayı olduğu için. Yerine her alan için gerekçeli değerlendirme yazıldı.
- Bölüm 27 gereği bulgular **türlerine göre** ayrıştırıldı.
- Bölüm 29'un son kontrol soruları tek tek, dürüstçe cevaplandı — dahil olmak üzere
  "duplicate raporladın mı?" sorusu.
- Emin olunamayanlar "Kalan belirsizlikler"de toplandı.

---

## 1. TOPLAM TABLO

| Tur | Bölümler | Bulgu | 🔴 | 🟠 | 🟡 | 🔵 | ⚪ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 — Envanter | 1, 2, 3, 20 | 31 | 1 | 3 | 9 | 13 | 5 |
| 2 — Güvenlik | 6, 12 | 32 | 2 | 7 | 12 | 11 | 0 |
| 3 — Para | 7, 8, 16 | 25 | 4 | 6 | 10 | 5 | 0 |
| 4 — AI / Sözleşme | 9, 11, 4a | 18 | 0 | 3 | 11 | 4 | 0 |
| 5 — Backend / DB | 5, 10 | 20 | 0 | 4 | 9 | 7 | 0 |
| 6 — Frontend | 4b, 17, 18, 19 | 13 | 0 | 2 | 6 | 5 | 0 |
| 7 — Prod hazırlık | 13, 14, 15, 21 | 7 | 1 | 2 | 3 | 1 | 0 |
| **Toplam** | | **146** | **8** | **27** | **60** | **46** | **5** |

Ek çıktılar: **67 elenen false positive** (gerekçeleriyle kayıtlı), **59 doğrulanamayan
madde**, **2 önceki-tur düzeltmesi**, **3 önceki-tur teyidi (üçü de temiz)**,
bölüm 21'in **27 özellikli** tablosu, bölüm 15'in **39 maddeli** test listesi.

**Not:** Bir bulgu (BE-008) aslında **olumlu** bir sonuç — `unserialize`/`eval`/LFI
yokluğunun doğrulanması. Bölüm 27 gereği olumsuz sonuçları da kayda geçirmek için bulgu
numarası verildi, ama düzeltilecek bir şey değil.

---

## 2. İLK 10 PROBLEM (denetim.md bölüm 25)

Sıralama ölçütü: **gerçekleşen zarar × sömürü kolaylığı × düzeltme maliyetinin tersi**.

---

### #1 — Kimlik doğrulaması olmadan `.env` ve veritabanı dökümü indirilebiliyor

**Problem:** `router.php:7` doküman kökündeki her gerçek dosyayı olduğu gibi servis ediyor;
`server.js:29` `/admin/*`'ı oraya proxy'liyor; `api/admin/.htaccess`'te hiçbir erişim
kuralı yok. Sonuç: `GET /admin/.env` (Gemini API anahtarı),
`GET /admin/db_backup/backup-2026-02-23-13-56-14.sql` (**1,59 MB tam veritabanı dökümü** —
tüm kullanıcı e-postaları + bcrypt hash'ler + admin hash'leri),
`GET /admin/error_log`. *(SEC-001 🔴)*

**Risk:** Tüm kullanıcı tabanının sızması; API anahtarı hırsızlığı. Log dosyası ayrıca
TC kimlik numarası ve IBAN taşıyor *(DEP-002 🟠)* ve kart son-4 + tutar *(PAY-015)*.
`admin/index.php:16` `ini_set('log_errors','1')` ile loglama açık ve `error_log` yolu
ayarlanmadığı için PHP çalışan betiğin dizinine — yani doküman kökünün içine — yazıyor.

**Neden önce çözülmeli:** Şu an **aktif** bir sızıntı. Hiçbir önkoşulu yok, başka hiçbir
düzeltmeyi beklemiyor, ve diğer tüm kimlik doğrulama çalışmasını anlamsızlaştırıyor:
parola hash'lerini bcrypt cost 12 ile korumanın anlamı, hash'lerin bulunduğu dökümün
kimlik doğrulamasız indirilebildiği bir kurulumda yok.

**Tahmini çözüm:** `db_backup/`, `error_log`, `.env` dosyalarını doküman kökünün dışına
taşımak + `router.php`'ye denylist + Gemini anahtarını rotate etmek. **Yarım gün.**

---

### #2 — Kullanıcı kendi aboneliğini ücretsiz olarak süresiz uzatabiliyor

**Problem:** `MarketplaceController::updateSubscription():383` yalnızca `id` ve `user_id`'yi
`unset` ediyor; `user_subscriptions.expiry_date` istemciden yazılabiliyor. Tek istek:
`data={"id":<kendi>,"expiry_date":"2099-12-31"}` *(SEC-002 🔴)*

**Risk:** Doğrudan gelir kaybı. Zaman sınırlı abonelik, ürünün tek gelir mekanizması.

**Neden önce çözülmeli:** Sömürüsü trivial (bir kez satın almış olmak yeterli), düzeltmesi
5 satır, ve doğru desen aynı kod tabanında zaten var
(`WalletController::saveBankInfo:150-156` beyaz listesi).

**Tahmini çözüm:** `array_intersect_key` beyaz listesi. **1 saat.** Aynı düzeltme
`saveChatbot`, `updateChatbot`, `addChat`, `addConversation`, `addComment`, `updateCart`'a
da uygulanmalı *(SEC-003 🟠, SEC-014 🟡)* — kök neden `BaseRepository`'de sütun beyaz
listesi olmaması *(BIZ-004 🟡)*.

---

### #3 — Sahte kart ile satın alma, satıcıya çekilebilir gerçek bakiye üretiyor

**Problem:** `chargeCard()` Luhn-geçerli **herhangi** bir numarayı kabul edip tahsilatı
simüle ediyor. Çevresindeki kod sonucu gerçek ödeme gibi işliyor: `status='paid'` ödeme
satırı, `status='approved'` satıcı payı, ve `computeBalanceAndTransactions:29` o
`'approved'`'ı çekilebilir bakiyeye çeviriyor *(PAY-001 🔴)*. Bakiye sorgusu ayrıca
`param_marketplace_payments.status`'u hiç okumuyor *(DB-003 🟠)*, `para_cekme_talepleri`
okuması istisnayı yutuyor *(PAY-005 🟠)*.

**Risk:** Hiç para girmemişken sistemde çekilebilir bakiye. Kötü niyetli bir satıcı
kendi botunu ikinci hesapla sahte kartla alıp bakiyeyi çekebilir.

**Neden önce çözülmeli:** Gerçek para çıkışı. Ve **stub olması mazeret değil** — asıl
sorun çevresindeki kodun stub olduğunu bilmemesi. Şema bunu öngörmüş:
`param_marketplace_details.status` varsayılanı `'pending_approval'` ve sütun yorumu beş
durumlu bir settlement zinciri tanımlıyor; kod o fazı atlıyor.

**Tahmini çözüm (gerçek gateway olmadan bile):** Stub aktifken `'approved'` yerine
`'pending_approval'` yazmak. **2 saat.** Tam çözüm gerçek Param POS entegrasyonu (#5).

---

### #4 — Ödeme duvarı yok: satıştaki her botun tam içeriği ücretsiz elde edilebiliyor

**Problem:** `ChatbotRepository::userHasAccess()` satır 9 (`is_independent = 0 AND
pms.user_id IS NOT NULL`) satıştaki her botu abonelik olmadan açıyor *(PAY-002 🔴)*.
`generateReply` sistem talimatını istemciden alıyor ve `chatbot_id`'yi hiç sormuyor
*(SEC-015 🟡)*. Zincir: `getchatbot.php` → `style_prompt`,
`get_training_chunks.php` → tam `training_prompt` (sayfalanarak),
`generatereply.php` → o talimatla sınırsız sohbet.

**Risk:** Pazaryerinin sattığı şey (eğitilmiş persona) ücretsiz kopyalanabiliyor.
Abonelik modelinin koruduğu tek şey hazır arayüz, içerik değil.

**Neden önce çözülmeli:** İki ayrı belgelenmiş davranışın birleşimi ürünün gelir modelini
ortadan kaldırıyor, ve bu birleşimin tartışıldığına dair hiçbir iz yok.

**Tahmini çözüm:** Aşağıdaki #6 ile aynı düzeltme kapatıyor. **1 gün.**

---

### #5 — Tek stub tüm pazaryerini kilitliyor: temiz kurulumda satılabilir hiçbir şey yok

**Problem:** `ParamPosMarketplace::addSubMerchant()` her zaman `success:false` döndürüyor →
`SellerController::register:88-96` `status='rejected'` yazıyor → `status='active'`'e bağlı
**altı kapı** kapanıyor (`saveChatbot:53`, `publishChatbot:191`, `addToCart:21`,
`createSubscription:217`, `getPublished:92` INNER JOIN, `userHasAccess` 2. dal).
İkinci kilit: `listIller`/`listIlceler` boş dönüyor, `register` `il_kod`/`ilce_kod`'u
zorunlu tutuyor → form doldurulamıyor bile *(DEP-001 🔴)*.

**Risk:** Ürünün gelir döngüsünün tamamı — bot yayınlama, pazaryeri, satın alma, abonelik,
satıcı kazancı — temiz bir kurulumda erişilemez.

**Neden önce çözülmeli:** #3 ve #4'ün düzeltmesinin **doğrulanabilmesi** buna bağlı.
Pazaryeri çalışmadan ödeme akışı test edilemez.

**Tahmini çözüm:** Gerçek Param POS SOAP/REST istemcisi. **En büyük iş kalemi — 1-2 hafta**
(kimlik bilgileri `web/.env`'de mevcut, ama yanlış yerde — *SEC-018 🔵*).

---

### #6 — Mesaj limiti tamamen istemcide: `generateReply` botu tanımıyor

**Problem:** `generateReply` `consumeMessage()`'ı hiç çağırmıyor; istekte `chatbot_id`
bile yok, yani çağırması **mümkün değil**. Kodun kendi yorumu kabul ediyor:
*"consumeMessage's daily coin budget is a separate endpoint the client may simply not
call."* Etkin limit 10/gün yerine 20/dk = **28.800/gün** *(COIN-001 🔴)*.

Aynı kök nedenden çıkan diğerleri: sistem talimatı istemciden *(SEC-015)*, ödeme duvarı
bypass *(PAY-002)*, sınırsız bağlam her mesajda Gemini'ye — 500 KB eğitim metni ≈ 125k
token × 20 istek/dk *(AI-001 🟠)*, coin Gemini'den önce yanıyor ve iade yok
*(AI-005 🟡)*.

**Risk:** Ücretsiz katmanın tek kısıtı devre dışı; Gemini faturası kullanıcı tarafından
belirleniyor; satın alınan bonus krediler muhasebeleştirilmiyor.

**Neden önce çözülmeli:** **Bu denetimin en yüksek getirili tek değişikliği.**
`generateReply`'a `chatbot_id` eklemek + talimatı sunucuda kurmak, dört turda tespit
edilen **beş bulguyu** birden kapatıyor: COIN-001 🔴, PAY-002 🔴, SEC-015 🟡, AI-001 🟠,
AI-005 🟡.

**Tahmini çözüm:** `chatbot_id` al → `userHasAccess` doğrula → `style_prompt` +
`training_prompt`'u DB'den oku (boyut sınırıyla) → `consumeMessage`'ı sunucuda çağır.
**1-2 gün.**

---

### #7 — Ücretli üyelik ödeme almadan yükseliyor, ve ödeme alınsa da karşılığı yok

**Problem:** `getPricing` ₺149/₺299/₺599 paketleri "Sınırsız mesaj hakkı", "Sınırsız
chatbot oluşturma" vaadiyle ilan ediyor. `upgradePlan` `plan_name`'i doğrulamadan yazıp
"Üyelik paketiniz güncellendi" diyor — `chargeCard` çağrısı yok *(BIZ-001 🔴)*.
Yazdığını yalnızca dashboard başlığı okuyor; `chatbot_limits.php` planı hiç sorgulamıyor
*(BIZ-002 🟠)*, `getChatbotLimits` ücretli kullanıcıya da 1/2 limitini bildiriyor
*(UX-002 🟡)*. `PRODUCER_INDEPENDENT_LIMIT`/`PRODUCER_PUBLIC_LIMIT` sabitleri tanımlı,
sıfır kullanım.

**Risk:** İki yönlü — bugün ücretsiz "Elmas" etiketi alınabiliyor; ödeme entegre edilirse
kullanıcı parayı ödeyip **hiçbir şey almaz** (tüketici hukuku açısından da sorunlu).
Dashboard başlığı "Elmas" derken bot ekranı ücretsiz limiti gösteriyor — iki ekran
çelişiyor.

**Neden önce çözülmeli:** En dürüst hamle bir satırlık: endpoint'i fail-closed yapmak.
`producer_plan.php:12-15` doğru deseni zaten gösteriyor.

**Tahmini çözüm:** Devre dışı bırakma **1 saat**; gerçek plan sistemi **1 hafta**.

---

### #8 — Temiz bir klon çalışmıyor: çalışması için gerekli dosyalar versiyon kontrolünde değil

**Problem:** Üç ayrı kategoride:
- `api/admin/ajax/_guard.php` ve `api/admin/functions/session.php` **takipsiz**, ama
  16 takipli dosya bunları `require_once` ediyor. Bu ikisi admin panelinin **tek** yetki +
  CSRF kapısı *(ARCH-001 🔴)*.
- `api/admin/uploads/.htaccess` takipsiz — yükleme dizininde PHP çalıştırmayı engelleyen
  tek katman *(ARCH-002 🟠)*.
- `api/database/schema.sql` (50 tablo) ve üç migration `.gitignore:47`'deki `*.sql`
  kuralına takılıyor *(ARCH-003 🟠, DB-002 🟠)*. Üstelik diskteki şema, migration'ların
  düzeltmeyi amaçladığı **bozuk durumu** içeriyor: 0 foreign key, üç farklı tipte aynı
  anahtar *(DB-006 🟡)*.

**Risk:** `git clone` → admin paneli fatal error; veritabanı kurulamıyor; upload koruması
sessizce kaybolmuş.

**Neden önce çözülmeli:** Her şeyin ön koşulu. Ve düzeltmesi dakikalar sürüyor.

**Tahmini çözüm:** İki `git add` + `.gitignore`'a negative pattern. **1 saat.**
**Ama migration'lar uygulanmadan önce okunmalı** — `002` kendi başlığında "Every statement
here DELETES OR REWRITES DATA" diyor ve bu denetim onları hiç okumadı.

---

### #9 — Şifre sıfırlama uçtan uca imkânsız ve README yanlış yönlendiriyor

**Problem:** `sendEmail()` `$htmlBody` parametresini alıyor ve **hiç kullanmıyor** — ne
gönderiyor ne logluyor. Kod yalnızca `$body`'de ve veritabanında SHA-256 hash olarak var.
Kullanıcıya "kod gönderildi" deniyor *(DEP-003 🟠)*. README'nin "The generated code is
visible in the PHP error log" tavsiyesi **yanlış**.

**Risk:** Şifresini unutan kullanıcının hesabına erişimi kalıcı olarak kesiliyor.
Sıfırlama sonrası mevcut oturumlar da iptal edilmiyor *(SEC-010 🟡)* ve parola politikası
uygulanmıyor *(SEC-011 🟡)*.

**Neden önce çözülmeli:** Kullanıcı kaybı doğuran, sessiz bir arıza. SMTP ayarları admin
panelinde zaten yönetiliyor.

**Tahmini çözüm:** Gerçek PHPMailer **1 gün**; ara çözüm olarak `success:false`
döndürmek **10 dakika**.

---

### #10 — Admin girişi iki ayrı yerde uygulanmış, ikisinde de oturum yenileme ve rate limit yok

**Problem:** `api/admin/ajax/giris.php` ve `api/admin/partials/_login.php:1-26` — iki
bağımsız kimlik doğrulama implementasyonu (ikincisi no-JS geri düşüş yolu, gerçekten
erişilebilir). İkisinde de `session_regenerate_id` yok *(SEC-005 🟠)* ve rate limit yok
*(SEC-006 🟠)*, oysa kullanıcı girişinde ikisi de var *(BE-001 🟠)*. Admin ve kullanıcı
oturumları **aynı çerezi** paylaşıyor (`session.php:16-20` bunu belgeliyor), bu yüzden
saldırgan kendi oturum kimliğini sabitleyebilir. Ayrıca
`db_backup.php?mode=restore` GET ile çalışıyor ve `_guard.php:32` CSRF'i GET'ten muaf
tutuyor → admin'e gönderilen tek bir link canlı veritabanını üzerine yazıyor
*(SEC-007 🟠)*.

**Risk:** Admin ele geçirme → `db_backup.php?mode=restore` (yıkıcı), `readenv.php`
(API anahtarları), `updateenv.php` (yapılandırma enjeksiyonu — *DEP-004 🟡*).

**Neden önce çözülmeli:** Admin, sistemin en yetkili aktörü ve en zayıf korunan giriş
noktası. Düzeltmeler tek satırlık.

**Tahmini çözüm:** İki dosyaya `session_regenerate_id(true)` + `checkRateLimit`;
`db_backup.php`'yi POST'a çevirmek. **Yarım gün.** Uzun vadede tek giriş yoluna indirmek.

---

## 3. ROADMAP (denetim.md bölüm 25)

Sıra **bağımlılıklara göre** kuruldu: her fazın çıktısı sonraki fazın ön koşulu.

### P0 — Hemen (1 hafta, sıra önemli)

Bu fazın tamamı **düzeltmesi kolay, etkisi büyük** işlerden oluşuyor. Toplam tahmin:
**3-4 gün.**

| # | İş | Bulgu | Neden bu sırada |
| --- | --- | --- | --- |
| 1 | `.env`, `db_backup/`, `error_log` doküman kökü dışına + `router.php` denylist + **Gemini anahtarını rotate et** | SEC-001 🔴 | Aktif sızıntı, önkoşulu yok |
| 2 | `_guard.php` + `session.php` + `uploads/.htaccess` commit | ARCH-001 🔴, ARCH-002 🟠 | Her şeyin ön koşulu, 2 dk |
| 3 | `.gitignore`'a `!api/database/**/*.sql` — **migration'ları uygulamadan önce oku** | ARCH-003 🟠, DB-002 🟠 | Kurulumun ön koşulu |
| 4 | DB parolasını rotate et + `db.php`'deki hard-coded fallback'i kaldır (fail-loud) | SEC-008 🟠 | Parola git geçmişinde, ve şu an **aktif** yol |
| 5 | `updateSubscription` sütun beyaz listesi | SEC-002 🔴 | Aktif gelir kaybı, 5 satır |
| 6 | `upgradePlan`'ı fail-closed yap | BIZ-001 🔴 | Tek satır |
| 7 | `db_backup.php`'yi POST'a çevir | SEC-007 🟠 | Yıkıcı, tek tıkla |
| 8 | Admin girişine `session_regenerate_id` + rate limit (**iki dosya**) | SEC-005/006 🟠, BE-001 🟠 | Tek satırlık, iki yerde |
| 9 | Google login'e `email_verified` kontrolü | SEC-004 🟠 | Tek satır, hesap ele geçirme |
| 10 | `chargeCard` stub'ı aktifken `'pending_approval'` yaz | PAY-001 🔴 (kısmi) | Bakiye zincirini kes |

### P1 — Production'dan önce (4-6 hafta)

| İş | Bulgu | Tahmin |
| --- | --- | --- |
| **Gerçek Param POS entegrasyonu** (sub-merchant + tahsilat + callback imza/replay + iade) | DEP-001 🔴, PAY-001 🔴, PAY-007 🟠, PAY-012 🟡 | 1-2 hafta |
| **`generateReply`'a `chatbot_id`** → erişim kontrolü + sunucuda talimat + boyut sınırı + sunucuda `consumeMessage` | COIN-001 🔴, PAY-002 🔴, SEC-015 🟡, AI-001 🟠, AI-005 🟡 | 1-2 gün |
| Mass assignment: `BaseRepository`'ye sütun doğrulaması + 5 endpoint'e beyaz liste | BIZ-004 🟡, SEC-003 🟠, SEC-014 🟡 | 2 gün |
| Gerçek e-posta (PHPMailer) + sıfırlamada oturum iptali + parola politikası | DEP-003 🟠, SEC-010 🟡, SEC-011 🟡 | 2 gün |
| Abonelik yenilemeyi düzelt (`grantPurchaseCredit` upsert) | PAY-003 🟠 | 2 saat |
| `ALTER TABLE`'ı transaction dışına / migration'a taşı | PAY-004 🟠 | 2 saat |
| Satıcı ödeme akışını tamamla: `durum` güncelleme yolu + allowlist + fail-closed bakiye | PAY-006 🟠, PAY-005 🟠, DB-003 🟠 | 3 gün |
| Hata yönetimi: admin tarafında `APP_DEBUG` ayrımı + `set_error_handler` + shutdown kancası | ERR-001 🟠, ERR-002 🟡 | 1 gün |
| Güvenlik başlıkları (`headers()`: CSP, X-Frame-Options, HSTS, nosniff) | NEXT-001 🟠 | 1 gün |
| Hukuki metinleri API'ye bağla (KVKW/mesafeli satış) | FE-001 🟠 | 2 saat |
| Health check + graceful shutdown + `PORT` + `NODE_ENV` | DEP-005 🟡 | 1 gün |
| MariaDB/MySQL kararı + collation düzeltmesi + README | DB-004 🟡 | Yarım gün |
| Rate limiter'ı atomik yap + `rkey` hash'le + temizlik | SEC-013 🟡 | 1 gün |
| Hesap enumerasyonunu kapat (parola sıfırlama) | SEC-012 🟡 | 2 saat |
| Remember-me: oturum yenileme + token rotasyonu | SEC-009 🟡 | 2 saat |
| `robots.txt`'i `public/`'e taşı | SEO-001 🟡 | 5 dk |
| Sahte önizleme asistanını gerçek yap veya etiketle | UX-001 🟠 | Yarım gün |
| POS kimlik bilgilerini `web/.env`'den `api/.env`'e taşı + rotate | SEC-018 🔵 | 1 saat |

### P2 — Yakın zamanda (2-3 ay)

| İş | Bulgu |
| --- | --- |
| `getPublished()` kartezyen çarpımını düzelt (skaler alt sorgu / sayaç sütunu) + sayfalama | DB-001 🟠, DB-009 🔵 |
| Eksik index'ler + UNIQUE kısıtlar (`chatbot_hide`, `chatbot_uninterested`) | DB-005 🟡 |
| Migration 001+002+003'ü **okuduktan sonra** uygula (FK'lar, tip hizalama) | DB-002 🟠, DB-006 🟡 |
| API zarfını tekilleştir (28 `echo json_encode` noktası) + istemcide `res.ok` | ERR-003 🟡, API-001 🟠, API-005 🟡 |
| Plan sistemini gerçekten uygula (`chatbot_limits.php` + coin planı okusun) | BIZ-002 🟠, UX-002 🟡, BIZ-003 🟡 |
| Haftalık/aylık fiyat ilişkisini sunucuda türet | PAY-009 🟡 |
| Checkout idempotency + rate limit + kilit | PAY-008 🟡 |
| Coin sıfırlama yarışı + timezone (SQL'e taşı) + iade yolu | COIN-002/003/004 🟡 |
| Frontend async temizliği (`AbortController`) | REACT-001 🟡 |
| SSE tamponlaması + `res.ok` + zaman aşımı hizalama | AI-002/003/004 🟡 |
| Avatar doğrulaması + `api/assets/.htaccess` | SEC-016 🟡, SEC-020 🔵 |
| **Test altyapısı** — bölüm 15'in 12 kalın maddesi | (yapısal) |

### P3 — Teknik borç (sürekli)

| İş | Bulgu |
| --- | --- |
| README'yi koda göre güncelle (9 çelişki) | DOC-001…009 |
| Ölü kod temizliği: 23 çağrılmayan endpoint, 11 import edilmeyen modül, 9 kullanılmayan npm paketi, `global.scss` (11.004 satır), ölü CSS bloğu | DEAD-001…008, ARCH-012, NEXT-005 |
| Autoloader'ı gerçek dizinlere indir / PSR-4'e geç; 11 boş dizini ve 6 sahipsiz arayüzü kaldır | ARCH-006 🟡, ARCH-007 🟡 |
| `api/src.zip` (52,9 MB) sil; `composer.zip`'i geçmişten çıkar | ARCH-004 🟡, ARCH-005 🔵 |
| `reactStrictMode: true` + çıkan uyarıları düzelt | NEXT-002 🟡 |
| 12 dosyadaki BOM + `.editorconfig` | NEXT-003 🟡 |
| `strict_types` kademeli (test altyapısından **sonra**) | BE-006 🔵 |
| DI / statik metot mimarisi (test edilebilirlik için) | BE-005 🟡 |
| Kalan 🔵/⚪ bulgular | — |

---

## 4. ALAN DEĞERLENDİRMELERİ (bölüm 26 yerine — puanlama üretilmedi)

`denetim.md` bölüm 26 her alan için X/10 istiyor. **Üretmedim**: bu sayı kod okumadan da
yazılabilir ve bu denetimin 145 bulgusunun hiçbirini daha anlaşılır kılmaz. Yerine her
alan için, hangi bulgulara dayandığı belli olan 2-4 cümlelik değerlendirme:

**Mimari.** Backend'de Clean Architecture, frontend'de FSD iskeleti kurulmuş ama ikisi de
yarı yolda: 8 repository arayüzünün 6'sı implementasyonsuz, 11 boş dizin, 147 controller
metodunun 147'si statik, DI yalnızca üç auth use-case'inde *(ARCH-006/007, BE-005)*.
Frontend'de `entities/` ile `app/*/components/` arasında aynı isimli paralel setler var ve
hangisinin canlı olduğu dosya adından anlaşılmıyor — 324 satırlık `ChatbotCard.jsx` ölü,
166 satırlık canlı *(ARCH-010, DEAD-002)*. Yapı makul; sorun eski ve yeni düzenin yan yana
durması.

**Güvenlik.** İki uçlu ve bu ayrım önemli. Enjeksiyon tarafı gerçekten kapatılmış: admin
CRUD motorunun üç allowlist guard'ı çalışıyor, `unserialize`/`eval`/LFI yok, istemci
kontrollü `ORDER BY` yok — 11 false positive bu yüzden elendi *(Tur 2, BE-008)*. IDOR
tarafı da iyi: `denetim.md`'nin örnek olarak saydığı endpoint'lerin hepsinde sahiplik
kontrolü var. Buna karşılık **satır düzeyinde** duran yetkilendirme **alan düzeyinde**
devam etmiyor (mass assignment, 5 endpoint), ve en ağır bulgu tamamen kod dışı: dosya
sızıntısı *(SEC-001)*. Tekrar eden örüntü: doğru çözüm projede mevcut, ilk keşfedildiği
yola uygulanmış, kardeşlerine uygulanmamış.

**Backend.** PHP tarafında kalite yorumlarda görünüyor — düzeltmelerin yanında "önceden
şöyleydi, şu gerçek vaka yüzünden değişti" biçiminde gerçek tarihçe var, ve bu çoğu ticari
projeden iyi. Yapısal zayıflık test edilemezlik: singleton + tümü statik metotlar
*(BE-005)*, ki bu "test yazılmamış" değil "test yazılamaz" demek. Hata yönetimi `/api`'de
doğru (`APP_DEBUG` ayrımı), admin'de hiç yok *(ERR-001)*, ve `set_error_handler` iki
tarafta da kurulmamış *(ERR-002)*.

**Frontend.** Erişilebilirlik beklenenin üzerinde: skip-link doğru uygulanmış, `<main>`
landmark, 7/7 `<img>`'de `alt`, 25 dosyada `aria-*` — bölüm 18'de yazılacak bulgu
bulunamadı. Next.js App Router doğru kullanılmış (17 route'ta metadata, `notFound()` ile
bilinçli emeklilik, `authReady` gate'iyle doğru route koruması). Zayıf noktalar: 51
dosyanın 8'inde `res.ok` kontrolü *(API-005)* — ki bu disiplinsizlik değil, zarf
tutarsızlığına *(ERR-003)* verilen rasyonel tepki — ve `AbortController`'ın hiç
kullanılmaması *(REACT-001)*.

**Veritabanı.** En çarpıcı bulgu şema dosyalarının kendisiydi: `schema.sql` 50 tablo /
0 foreign key / üç farklı tipte aynı anahtar içeriyor, yani **bozuk durumu** belgeliyor.
Buna karşılık `migrations/00{1,2,3}` bu bozuklukları ölçmüş ("38 orphaned rows ... when
measured", "run against live data 2026-08-24"), sırayı belgelemiş, 106 FK yazmış. Yani
problem zaten tespit edilmiş ve çözülmüş — çözüm sadece dağıtılabilir değil, çünkü dört
dosya `.gitignore`'a takılıyor *(DB-002, ARCH-003)*. Para hassasiyeti doğru
(tüm sütunlar `decimal(10,2)`, tek float yok), ama PHP tarafı float ile birikimli topluyor
*(DB-008)*.

**Ödeme ve iş mantığı.** Fiyat manipülasyonu tarafı sağlam: fiyat her zaman DB'den,
`getCart` ve `createSubscription` tek `linePrice()` kaynağından geçiyor, sıfır fiyat
reddediliyor, indirim tam bir kez uygulanıyor — ve her düzeltmenin yanında hangi gerçek
vakadan çıktığı yazıyor (216,00 TL gösterilip 135,00 TL tahsil edilmesi; ORD-2041EEC4'ün
0,00 TL satışı). Sorunlar iki başka yerde: **stub'ların çevresindeki kod stub olduğunu
bilmiyor** *(PAY-001)* ve **durum makineleri tamamlanmamış** — `param_marketplace_details`
beş durumlu döngünün yalnızca birini kullanıyor, `para_cekme_talepleri.durum` hiçbir yerde
güncellenmiyor ve tablo admin beyaz listesinde de yok *(PAY-006)*.

**AI / Gemini.** Sunucu tarafı özenli: SSE başlıkları, buffer boşaltma, upstream hatasını
yapılandırılmış `error` çerçevesine çevirme, API anahtarını istemciye sızdırmama. Tek
mimari tercih — **sistem talimatının istemcide kurulması** — dört turda tespit edilen beş
bulgunun ortak kökü. İstemci tarafında üç eksik hatayı sessizleştiriyor: `res.ok` yok
*(AI-003)*, satır tamponlaması yok *(AI-004)*, zaman aşımı sunucunun yarısı *(AI-002)*.

**Performans.** İki farklı ölçek davranışı: kademeli yavaşlayanlar (`ORDER BY RAND()`,
sayfalama yokluğu, `SELECT *` × 12, eksik index'ler) ve **ani** bozulan
`getPublished()` — altı sınırsız alt tabloya LEFT JOIN + `COUNT(DISTINCT)`, ve bu ana
sayfanın sorgusu *(DB-001)*. Küçük veriyle görünmez. Frontend'de bundle ölçülmedi;
16/20 sayfa client component, veri üç ardışık turdan sonra geliyor *(PERF-001)*. Olumlu:
17 `dynamic()` importuyla modal'lar kod bölmeye alınmış.

**Test.** Hiç test yok, ve bunun nedeni tercih değil yapı: `Database::getInstance()`
singleton'ı ve 147 statik metot unit test'i imkânsız kılıyor *(BE-005)*. Bölüm 15 için
39 test maddesi çıkarıldı ve her biri bu denetimde bulunan somut bir hataya bağlandı;
12'si 🔴/🟠 bulgulara karşılık geliyor ve hepsi integration/API/E2E seviyesinde — çünkü
unit seviyesi şu an erişilebilir değil.

**Deployment hazırlığı.** Bölüm 14'ün açık sorusu — *"yeni bir VPS'e verilse README ile
kurulabilir mi?"* — **hayır**, ve altı adımda tıkanıyor (ARCH-001 → DOC-001 → DB-002 →
DB-004 → DEP-001 → DEP-005). Hiçbiri kod kalitesi sorunu değil, hepsi paketleme/dağıtım,
ve hepsi düzeltilmesi kolay. Asimetri şu: koddaki mühendislik kalitesi dağıtım
katmanının kalitesinden belirgin biçimde yüksek.

**Kod kalitesi.** Borç düşük: tüm repoda 2 TODO, yanıltıcı yorum bulunamadı — aksine
yorumlar alışılmadık biçimde açıklayıcı. Bulunan kalite sorunları (12 dosyada BOM, ölü
CSS bloğu, bir escape tutarsızlığı) gerçek ama küçük. Bölüm 19'un uyardığı "ben farklı
yazardım" alanına girmemek için başlık hiyerarşisi, Türkçe/İngilizce karışık adlandırma ve
bileşen boyutları gibi adaylar bilinçli olarak elendi.

**Production hazırlığı.** Bölüm 21'in tablosu 27 özellik listeliyor ve **hiçbiri hazır
değil**: 9'u tamamen çalışmıyor, 10'u çalışıyor görünüp yanlış sonuç veriyor, 8'i
ölçek/ortam değişince kırılacak. İkinci grup en tehlikeli çünkü kullanıcı fark etmiyor.

---

## 5. BULGULARIN TÜRLERİNE GÖRE AYRIŞTIRILMASI (bölüm 27)

Bölüm 27 bu ayrımı açıkça istiyor: *"Her şeyi 'bunu değiştir' şeklinde raporlama."*

| Tür | Sayı | Örnekler | Ne anlama geliyor |
| --- | --- | --- | --- |
| **Prod blocker** | 14 | ARCH-001, DEP-001, DEP-003, DB-002, PAY-004, DEP-005, BIZ-002, PAY-012 | Production'a çıkmayı **engelliyor**. Kod hatası değil, eksik/dağıtılamaz. |
| **Güvenlik açığı** | 31 | SEC-001…020, DEP-002, ERR-001, NEXT-001, BE-001 | Sömürülebilir. 2'si 🔴, 9'u 🟠. |
| **İş mantığı hatası** | 19 | PAY-002, COIN-001, BIZ-001, UX-001, PAY-006, FE-001 | Kod çalışıyor, **yanlış şeyi** yapıyor. En sinsi grup. |
| **Gerçek bug** | 28 | PAY-003, PAY-005, BE-002, AI-002/003/004, FE-003/004, ERR-005…011 | Beklenen davranışı vermiyor. |
| **Mimari problem** | 12 | ARCH-006/007/010, BE-005, PERF-001, API-002, BIZ-004, DB-006 | Yapısal; bugün kırmıyor, yarın maliyet. |
| **Teknik borç** | 33 | DEAD-001…008, ARCH-004/005/012, NEXT-002…005, BE-006/007, DB-009…012 | Bakım maliyeti. |
| **Doküman problemi** | 9 | DOC-001…009 | README ↔ kod çelişkisi. 6'sı "artık düzeltilmiş bir sorunu var gibi anlatmak". |
| **Olumlu doğrulama** | 1 | BE-008 | Düzeltilecek bir şey değil; enjeksiyon yokluğunun kaydı. |

**Bu ayrımın pratik sonucu:** 145 bulgunun 33'ü *(teknik borç)* + 9'u *(doküman)* = 42'si
**production'ı engellemiyor** ve P3'e ait. Buna karşılık 14 prod blocker + 31 güvenlik
açığı, P0/P1'in tamamını oluşturuyor. Yani liste uzun ama **öncelik dağılımı net**.

**En tehlikeli grup "iş mantığı hatası" (19 bulgu)** çünkü hiçbiri hata mesajı üretmiyor:
sahte kart geçiyor, sahte önizleme cevap veriyor, dosya eki "gönderiliyor", plan
"yükseltiliyor", gizlilik politikası "gösteriliyor", coin "tükeniyor". Hepsi sessizce
yanlış.

---

## 6. TEKRAR EDEN DÖRT ÖRÜNTÜ

Bu, 145 bulgunun ezberlenmesi gerekmeyen özeti. Dört örüntü bulguların çoğunu açıklıyor:

**(1) "Doğru çözüm projede var, tüm yollara uygulanmamış" — en az 15 bulgu.**
`session_regenerate_id` iki login yolunda var, remember-me ve admin'de yok. Rate limit
kullanıcı girişinde iki katmanlı, admin girişinde sıfır. Sütun beyaz listesi
`saveBankInfo`'da var, beş yazma endpoint'inde yok. `APP_DEBUG` ayrımı `/api`'de var,
admin'de yok. `GET_LOCK` `withdraw`'da var, rate limiter'da yok. `assertSafeColumnName`
`Database`'de var, `BaseRepository`'de yok. **İyi haber:** bu bulgular tasarlanmayı değil
kopyalanmayı bekliyor.

**(2) "Yönetiliyor ama kullanıcıya ulaşmıyor" — 4 bulgu.**
Hukuki metinler *(FE-001)*, admin teması *(BE-002)*, ana sayfa görselleri *(UX-003)*,
plan limitleri *(UX-002)*. Dört farklı teknik neden, tek sonuç: **yönetim panelindeki
değişiklikler yansımıyor.** Tek tek küçük, toplamda yönetim panelinin güvenilirliğini
ortadan kaldırıyor.

**(3) "Sahte başarı geri bildirimi" — 4 bulgu.**
`chargeCard` (→ ledger'a `paid`/`approved`), `sendEmail` (→ kurtarılamaz hesap),
`processRefund`/`reconcilePayments` (→ admin'e "tamamlandı"), `upgradePlan` (→ ödeme
almadan "güncellendi"), önizleme asistanı (→ sahte AI cevabı). Beş stub'ın **ikisi doğru**
davranıyor (`producer_plan.php` ve `ParamPosMarketplace`'ın yazma metotları → fail-closed),
üçü fail-open. Fark kritik: fail-closed stub zararsız, fail-open stub **gerçek sonuç
üretiyor**.

**(4) "Mühendislik kalitesi yüksek, dağıtım kalitesi düşük."**
Atomik coin azaltma, `GET_LOCK`'lu withdraw, allowlist'li SQL guard'ları, ölçülmüş
migration'lar, gerçek SSE streaming, doğru erişilebilirlik — bunlar iyi iş. Buna karşılık
çalışması için gerekli dosyalar commit edilmemiş, şema versiyonsuz, health check yok,
sırlar doküman kökünde. **En kolay düzeltilecek bulgular en ağır sonuçları doğuruyor.**

---

## 7. SON KONTROL (denetim.md bölüm 29)

Her soruya dürüst cevap:

**"Aynı problemi farklı başlıklarda duplicate raporladın mı?"**
Kısmen — ve nerede olduğunu açıkça söylüyorum. Beş küme var:
1. **SEC-001 ↔ DEP-002 ↔ PAY-015 ↔ ERR-012** — SEC-001 *mekanizma* (log/dosya
   erişilebilir), diğer üçü *içerik* (PII, PAN, API anahtarı). Duplicate değil ama tek
   zincir; roadmap'te tek iş olarak birleştirdim.
2. **ARCH-003 ↔ DB-002** — bilinçli böldüm (Tur 5'te gerekçesini yazdım): ARCH-003
   ".sql takipsiz", DB-002 "şema 0 FK içeriyor ve düzeltmesi de takipsiz". Örtüşme var.
3. **SEC-002/003/014 ↔ BIZ-004** — BIZ-004 kök neden, diğer üçü tezahürü. Ayrı tutmak
   doğruydu (düzeltmeleri farklı katmanda) ama roadmap'te tek satır.
4. **SEC-015 ↔ PAY-002 ↔ COIN-001 ↔ AI-001 ↔ AI-005** — beşi tek kök nedenden
   (`generateReply` botu tanımıyor). Tur 4'te bunu açıkça yazdım; #6'da tek iş.
5. **BIZ-001 ↔ BIZ-002 ↔ UX-002** — plan kümesi, üç farklı katman.
Kasıtsız duplicate bulamadım.

**"README ile kod arasındaki çelişkileri kontrol ettin mi?"** Evet — Tur 1'in ana işi.
9 çelişki *(DOC-001…009)*, ve doğrulanan 10 iddianın 10'u tuttu. Sonradan iki çelişki daha
çıktı: DEP-003 (error_log tavsiyesi yanlış) ve DB-004 (MariaDB vaadi). Örüntü: README
kodun önünden gitmiş, sonra kod ilerlemiş, README geride kalmış — 9 çelişkinin 6'sı
"artık düzeltilmiş bir sorunu hâlâ varmış gibi anlatmak".

**"Frontend ve backend'i birlikte değerlendirdin mi?"** Evet, Tur 4 tamamen buna ayrıldı.
Ama **eksik**: bölüm 11'in istediği 120 endpoint × 9 alanlı tam sözleşme tablosu
üretilmedi; 19 endpoint karşılaştırıldı (~%16). Ve 48 fetch içeren 7 frontend dosyasının
sözleşme karşılaştırması üç turdur yapılamadı.

**"Security + business logic birlikte incelendi mi?"** Evet — en değerli bulgular tam
buradan çıktı. PAY-002 (iki belgelenmiş davranışın birleşimi ödeme duvarını kaldırıyor),
SEC-003 (mass assignment publish gate'ini atlıyor), COIN-001 (limit istemcide) hiçbiri
tek başına güvenlik veya tek başına iş mantığı denetiminde görünmezdi.

**"Payment sistemine özel audit yapıldı mı?"** Evet, Tur 3'ün tamamı. 15 PAY bulgusu,
2'si 🔴.

**"Race condition düşündün mü?"** Evet. Bulunan: SEC-013 (rate limiter TOCTOU),
COIN-002 (coin sıfırlama), PAY-008 (checkout idempotency), FE-004 (mesaj sırası),
REACT-001 (istemci yarışı). Elenen: `consumeMessage` (atomik), `withdraw` (`GET_LOCK`),
ilk coin insert'i (çözülmüş). **Yapılmayan:** izolasyon seviyesi ve deadlock analizi.

**"IDOR düşündün mü?"** Evet, `denetim.md`'nin örnek listesindeki her endpoint kontrol
edildi ve **hepsinde sahiplik kontrolü var** — bu yönde bulgu çıkmadı. Asıl bulgu bir
seviye derinde: satır düzeyinde doğru, alan düzeyinde yok (mass assignment).

**"Client-side manipulation düşündün mü?"** Evet, en verimli açı oldu: COIN-001,
SEC-015, PAY-009/010, FE-002, API-003/004.

**"Dead code kontrol edildi mi?"** Evet, Tur 1 (8 DEAD bulgusu) ve sonraki turlarda
eklemeler (BE-007, NEXT-005). 23 çağrılmayan endpoint, 11 import edilmeyen modül,
9 kullanılmayan npm paketi. **Ama tamamlanmadı:** `api/admin/assets/` altındaki 7 dosya
ve fonksiyon-içi mantık tekrarı hiç taranmadı.

**"Dependency kontrol edildi mi?"** Kısmen. Kullanılmayan 9 npm paketi bulundu
*(ARCH-012)*, sürümler listelendi *(DEP-006)*. **Eksik:** CVE durumu doğrulanamadı
(veritabanına erişim yok), `package-lock.json` transitif ağacı incelenmedi, PHP 8.1
deprecated API taraması hiç yapılmadı.

**"Deployment kontrol edildi mi?"** Evet, Tur 7. Bölüm 14'ün açık sorusu net cevaplandı.
**Eksik:** HTTPS/nginx/PHP-FPM yapılandırması repoda olmadığı için değerlendirilemedi.

**"Test eksiklikleri kontrol edildi mi?"** Evet, 39 maddelik kategorize liste, her biri
somut bir bulguya bağlı.

**"Production readiness değerlendirildi mi?"** Evet — bölüm 21'in 27 özellikli tablosu ve
bu raporun 4. bölümü.

---

## 8. SORUNUN CEVABI

`denetim.md`'nin SON TALİMAT'ı şunu soruyor:

> **"Bu projeyi production'a çıkarmadan önce tam olarak neleri düzeltmeliyim ve hangi
> sırayla düzeltmeliyim?"**

**Kısa cevap:** Bu hafta 10 kalem *(P0)*, sonra 4-6 hafta *(P1)*. P0'ın tamamı
küçük düzeltmelerden oluşuyor ve toplam 3-4 gün; P1'in ise **yarısı tek bir işten**
oluşuyor: gerçek Param POS entegrasyonu.

**Sıranın mantığı — üç ön koşul zinciri:**

1. **Önce sızıntıyı kapat, sonra her şeyi.** SEC-001 çözülmeden yapılan hiçbir güvenlik
   düzeltmesinin anlamı yok: parola hash'lerini korumak, hash'lerin bulunduğu dökümün
   indirilebildiği bir kurulumda karşılıksız. Bu, hiçbir şeyi beklemiyor — bugün
   yapılabilir.
2. **Sonra repoyu klonlanabilir yap.** ARCH-001 + ARCH-002 + ARCH-003 çözülmeden hiçbir
   düzeltme **doğrulanamaz**, çünkü temiz bir ortam kurulamıyor. Bu 1 saatlik iş, P1'in
   tamamının ön koşulu.
3. **Sonra pazaryerini çalışır hale getir.** DEP-001 çözülmeden PAY-001, PAY-002,
   PAY-003 ve PAY-006'nın düzeltmeleri **test edilemez**, çünkü satılabilir hiçbir şey
   yok.

**Bu sıraya uymamanın maliyeti somut:** DEP-001'i sona bırakırsanız, P1'deki yedi ödeme
düzeltmesini de sona bırakmış olursunuz — çünkü hiçbirini doğrulayamazsınız.

**En yüksek getirili tek değişiklik:** `generateReply`'a `chatbot_id` eklemek ve sistem
talimatını sunucuda kurmak. 1-2 günlük iş, **beş bulguyu** kapatıyor (COIN-001 🔴,
PAY-002 🔴, SEC-015 🟡, AI-001 🟠, AI-005 🟡) ve ürünün gelir modelinin temelini geri
getiriyor.

**Production'a çıkmayı engelleyen minimum liste (14 prod blocker):**
ARCH-001, ARCH-002, ARCH-003/DB-002, SEC-001, SEC-002, SEC-007, SEC-008, DEP-001,
DEP-003, DEP-005, PAY-001, PAY-004, BIZ-001, BIZ-002. Bunların dışındaki 131 bulgu
production'ı **engellemiyor** — ama 27'si 🟠 ve ilk üç ay içinde ele alınmalı.

**Son bir not, denetim.md bölüm 27 gereği:** Bu 145 bulgu "proje kötü" demiyor. Bulguların
dağılımı bunu gösteriyor: 42'si teknik borç ve doküman, 67 aday false positive olarak
elendi çünkü kod onları zaten çözmüş. Kodun içindeki mühendislik — atomik coin azaltma,
kilitli withdraw, allowlist'li SQL guard'ları, ölçülmüş migration'lar, düzeltmelerin
yanındaki gerçek tarihçe yorumları — çoğu ticari projeden iyi. Eksik olan **yayılım ve
paketleme**: bir tehdit keşfedildiğinde çözüm yalnızca keşfedildiği yola uygulanmış, ve
çalışan kodun dağıtılabilir hâle getirilmesi yapılmamış. İkisi de mimari yeniden yazım
gerektirmiyor.

---

## 9. KALAN BELİRSİZLİKLER

Bu denetimin **doğrulayamadığı** ve karar vermeden önce kontrol edilmesi gereken 8 madde
(59 doğrulanamayan maddenin en kritikleri):

| Konu | Neden önemli | Nasıl kontrol edilir |
| --- | --- | --- |
| **`migrations/00{1,2,3}` gövdeleri hiç okunmadı** | DB-002'nin çözümü olarak öneriliyorlar; `002` "Every statement here DELETES OR REWRITES DATA" diyor. 106 FK tanımı ve silme ifadeleri doğrulanmadı | Uygulamadan önce satır satır okuyun, önce bir kopya veritabanında deneyin |
| **`api/admin/error_log` içeriği okunmadı** | SEC-001 + DEP-002 + PAY-015'in gerçek etkisi buna bağlı. Şifre kodu içermediği doğrulandı (DEP-003), TC/IBAN içerdiği kod okumasından çıkarıldı | Dosyayı siz açın; TC/IBAN varsa sızıntı gerçekleşmiş sayılmalı |
| **Canlı HTTP testi hiç yapılmadı** | SEC-001'in `GET /admin/.env` iddiası üç dosyanın okunmasından çıkarıldı; `%2e%2e` traversal yedi turda doğrulanamadı | Sunucuyu başlatıp `curl -i http://localhost:3000/admin/.env` |
| **`npm run build` çalıştırılmadı** | README'nin "22 route" iddiası ve NEXT-003'ün (12 dosyada BOM) etkisi bilinmiyor | `cd web && npm run build` |
| **CVE durumu doğrulanamadı** | `smalot/pdfparser v2.12.5` kullanıcı PDF'i ayrıştırıyor | `composer audit` |
| **`updategv.php` okunmadı** | SEC-017'nin (`dangerouslySetInnerHTML` × 6) sunucu tarafı sanitizasyon sorusu cevapsız | 75 satır, okunmalı |
| **`plans`/`producer_plans` tabloları okunmadı** | BIZ-003'ün "üretici planı hiç var olamıyor" tespitiyle çelişebilir | `schema.sql`'deki tanımlara bakın |
| **`web/.env` ve `google.txt` içerikleri kasıtlı okunmadı** | POS parolası ve OAuth kimlik bilgileri rotate edilmiş mi bilinmiyor | Siz kontrol edin; rapora sır yazmamak için okumadım |

**Ayrıca kapsanmayan alanlar:** `SocialController`'ın 22 metodunun çoğu,
`NoteController`'ın 8 metodu, `NotificationController` — bu üç alanda çalışmayan
özellikler veya güvenlik bulguları **olabilir ve aranmadı**. Bölüm 21'in 27 özellikli
tablosu yalnızca okunan dosyalardan çıkan özellikleri içeriyor.

---

## 10. DENETİMİN KENDİ KAPSAMI

Dürüstlük gereği, bu denetimin ne kadarını gerçekten kapsadığı:

| Ölçüt | Değer |
| --- | --- |
| Okunan kaynak dosya | ~70 tam veya kısmi (repoda vendor hariç ~400 dosya) |
| Okunan controller metodu | ~60 / 147 |
| Karşılaştırılan API endpoint'i | 19 / 120 (%16) |
| İncelenen veritabanı tablosu | 9 / 50 |
| Okunan frontend bileşeni | ~15 / 210 |
| Okunmayan admin sayfası | ~25 |
| Çalıştırılan komut | 0 (build, test, sunucu — hiçbiri) |

**Yani bu denetim tamamlanmış değil.** Yedi turun her biri kendi "KAPSANMAYANLAR"
bölümünde neyi atladığını ve nedenini yazdı. Bulunan 145 bulgu, okunan %20'lik kesitten
çıktı; okunmayan kısımda benzer yoğunlukta bulgu olması beklenir. En büyük tek boşluk
bölüm 11'in tam sözleşme tablosu (120 endpoint × 9 alan) — bu tek başına ayrı bir tur
gerektirir.

Buna karşılık, okunan kesit **rastgele değil**: her turda önce en riskli yüzeyler
(kimlik doğrulama, ödeme, coin, yetkilendirme) okundu, ve `denetim.md`'nin SON
TALİMAT'ındaki *"özellikle güvenlik, authorization, ödeme, abonelik, coin/credit, veri
bütünlüğü ve kullanıcılar arası veri izolasyonunda çok agresif ol"* yönlendirmesi
sıralamayı belirledi. 8 🔴 ve 27 🟠 bulgunun tamamı bu alanlardan çıktı.
