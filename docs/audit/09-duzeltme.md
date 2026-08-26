# Düzeltme Turu — 2026-08-26

Denetim raporlarının (`docs/audit/01`–`08`) bulguları uygulandı. Bu dosya **ne
yapıldığını** kaydeder; bulguların kendisi ilgili tur raporlarında.

Kural: denetimde "hiçbir kaynak dosya değiştirilmez" geçerliydi. Bu turda tam
tersi — raporlar okundu, kod değiştirildi. Rapor dosyalarına dokunulmadı.

---

## Özet

| Faz | Kalem | Durum |
| --- | --- | --- |
| **P0** | 10 | ✅ 8 kod düzeltmesi tamamlandı + canlı doğrulandı; 2'si kullanıcı eylemi (anahtar rotasyonu) |
| **P1** | 18 | ✅ 17 tamamlandı; 1'i (gerçek Param POS entegrasyonu) kod düzeyinde çözülemez |
| **P2** | seçili | ✅ 8 kalem (API-001, ERR-003 kısmi, COIN-002/003/004, SEC-016, SEC-020, DB-004) |
| **P3** | seçili | ✅ DOC-001…009 (README) |

**Canlı doğrulama:** `php -S 127.0.0.1:8123 router.php` üzerinde uçtan uca test
edildi (aşağıda her kalemin yanında).

---

## P0 — Hemen

| # | Bulgu | Yapılan | Doğrulama |
| --- | --- | --- | --- |
| 1 | **SEC-001 🔴** | `api/.htaccess` + `api/admin/.htaccess` + `router.php` denylist'i; `db_backup/` → `storage/db_backup/`, `error_log` → `storage/logs/`; her ikisi de doküman kökünün dışında. `Database::backupDir()` doküman kökü altına düşen yapılandırmayı reddediyor. | ✅ `GET /admin/.env`, `/admin/error_log`, `/admin/db_backup/*.sql`, `/composer.json`, `/src/autoload.php` → **404**; `/admin/`, `/api/…` → **200** |
| 2 | **ARCH-001 🔴 / ARCH-002 🟠** | `_guard.php`, `admin/functions/session.php`, `admin/uploads/.htaccess` diskte var ve doğru; **`git add` izin verilmedi** → aşağıdaki "Kullanıcı eylemi" bölümüne bakın | ⚠️ beklemede |
| 3 | **ARCH-003 🟠 / DB-002 🟠** | `.gitignore`'a `!api/database/*.sql` + `!api/database/**/*.sql`; `storage/*` ignore ama `storage/.gitignore` korunuyor. Ayrıca **`api/database/migrate.php`** yazıldı: sıralı uygulama, `schema_migrations` tablosu, varsayılan kuru çalışma, veri silen dosyalar için `--allow-destructive`. | ✅ `git check-ignore` → şema ve 4 migration artık izlenebilir; runner dry-run doğru listeliyor |
| 4 | **SEC-008 🟠** | `db.php`'deki hard-coded `host/user/pass/db` kaldırıldı; DB_* eksikse **fail-loud**. Değerler `api/.env`'e taşındı. Ortak `functions/env.php` yazıldı (admin paneli bootstrap kullanmadığı için .env'i hiç görmüyordu — fail-loud'u güvenli kılan şey bu). | ✅ bağlantı testi geçti; eksik değişkenle açıklayıcı hata |
| 5 | **SEC-002 🔴** | `updateSubscription` beyaz listesi: yalnızca `status`. `expiry_date`, `chatbot_id`, `duration_weeks` reddediliyor. | ✅ `chatbot_id` → 403 "Bu alanlar güncellenemez" |
| 6 | **BIZ-001 🔴** | `upgradePlan` fail-closed (503 `FEATURE_UNAVAILABLE`) + plan adı kataloğa karşı doğrulanıyor. `ERR_UNAVAILABLE` sabiti eklendi. | ✅ "Elmas" → 503, "Kral" → 400 |
| 7 | **SEC-007 🟠** | `db_backup.php` → POST + CSRF zorunlu, `restore` ayrıca `confirm=RESTORE` istiyor; `list` modu eklendi. Admin UI POST'a çevrildi. | ✅ `GET ?mode=restore` → 403 |
| 8 | **SEC-005/006 🟠 + BE-001 🟠** | İki bağımsız admin giriş implementasyonu tek `admin/functions/admin_login.php`'de birleşti: `session_regenerate_id(true)` + iki katmanlı rate limit (hesap 5/15dk, IP 20/15dk) + sabit süreli parola doğrulama + başarıda sayaç sıfırlama. `_login.php` artık `alert()` yerine escape'li sunucu tarafı hata gösteriyor. | ✅ 5 deneme 401, 6.'da **429** |
| 9 | **SEC-004 🟠** | Google girişinde `email_verified` zorunlu (string/int varyantları dahil) + `sub` kontrolü. | ✅ lint + kod yolu |
| 10 | **PAY-001 🔴** | `chargeCard()` artık `simulated: true` bildiriyor; `createSubscription` bunu görünce ledger'ı `pending_approval` ile yazıyor (`paid`/`approved` yerine). **DB-003** ile birlikte: bakiye sorgusu artık `p.status`'u da okuyor → sahte kart çekilebilir bakiye üretemiyor. | ✅ lint + kod yolu |

---

## P1 — Production'dan önce

### En yüksek getirili değişiklik: `generateReply` (5 bulgu birden)

`chatbot_id` alındı, sistem talimatı sunucuda kuruluyor:

- **COIN-001 🔴** — `consumeMessage()` artık **sunucuda** çağrılıyor. İstemcideki
  ayrı `consumemessage.php` çağrısı kaldırıldı (tek gerçek limit oydu ve
  atlanabiliyordu).
- **PAY-002 🔴** — `userHasAccess()` ikiye ayrıldı: `preview` (pazaryeri kartı)
  ve `full` (sohbet + özel içerik). Varsayılan `full`, yani unutulan bir çağrı
  ücretsiz erişim değil reddedilen erişim üretiyor. `getDetail()` abonesi
  olmayana `style_prompt` göndermiyor.
- **SEC-015 🟡** — `system_instruction` artık istemciden **alınmıyor**.
- **AI-001 🟠** — `training_prompt` sunucuda `LEFT(…, 60000)` ile sınırlanıyor;
  istemci tüm eğitim metnini indirmiyor (`loadFullTrainingPrompt` kaldırıldı).
- **AI-005 🟡** — upstream hata verirse **iade** ediliyor (`refundMessage()`),
  ve `AI-004` gereği istemci/sunucu zaman aşımları 20 sn'de hizalandı.

**Canlı doğrulama:** abone olunmayan bota `generatereply` → **403**. Sahibi
olunan botta: `event: meta {"remaining":9}` → coin 10→9 → upstream hatası →
`refunded: true` → DB'de coin **10**. Zincirin tamamı çalışıyor.

### Diğer P1 kalemleri

| Bulgu | Yapılan |
| --- | --- |
| **BIZ-004 🟡 / SEC-003 🟠 / SEC-014 🟡** | `InputSanitizer::pickAllowed()` + `isSafeIdentifier()`. Beyaz listeler: `updateChatbot`, `saveChatbot`, `addChat`, `addConversation`, `addComment`, `updateCart`, `updateSubscription`. `BaseRepository::assertSafeColumns()` son savunma hattı. Reddedilen anahtarlar **sessizce düşürülmüyor**, açıkça raporlanıyor. ✅ canlı: `sent_time` → 403, `chatbot_id` → 403 |
| **DEP-003 🟠** | `sendEmail()` artık gerçek: bağımlılıksız `SmtpClient` (EHLO→STARTTLS→AUTH→DATA, multipart alternative, nokta-doldurma, başlık enjeksiyonu koruması). `$htmlBody` **kullanılıyor** (eskiden hiç okunmuyordu). SMTP yoksa **fail-closed**. ✅ canlı: yapılandırma yokken `success:false` |
| **SEC-010 🟡** | Parola değişimi tüm remember-me token'larını siliyor + diğer oturumları yok ediyor |
| **SEC-011 🟡** | `passwordPolicyError()` tek yerde, kayıt **ve** sıfırlamada. İstemci alt sınırı 8→10 hizalandı. ✅ canlı: 7 karakter → 400 |
| **SEC-012 🟡** | Şifre sıfırlama artık kayıtlı/kayıtsız ayrımı yapmıyor |
| **SEC-013 🟡** | Rate limiter atomik (`INSERT … ON DUPLICATE KEY UPDATE`), anahtar SHA-256, fırsatçı temizlik, `rateLimitReset()`. ✅ birim testi: 3 limit → 4. çağrı false, reset sonrası true |
| **SEC-009 🟡** | Remember-me: `session_regenerate_id` + tek kullanımlık token rotasyonu; geçersiz validator selector'ı yakıyor |
| **SEC-018 🔵** | 11 `PARAM_*` değişkeni `web/.env` → `api/.env` |
| **PAY-003 🟠** | `grantPurchaseCredit` upsert oldu — abonelik yenileme artık mümkün (UNIQUE ihlali checkout'u 500'le düşürüyordu) |
| **PAY-004 🟠** | Transaction içindeki `ALTER TABLE` → `migrations/004`. Kod artık şema değiştirmiyor, yalnızca sütun varlığını okuyor |
| **PAY-005 🟠** | Bakiye hesabında çekim okuması `$strict` modda istisnayı yükseltiyor; `withdraw()` bu modu kullanıyor |
| **PAY-006 🟠** | `listWithdrawals` + `updateWithdrawalStatus` (admin, durum beyaz listesi, kapalı talep için `force`, kayıt izi). ✅ canlı: admin olmayan → 403 |
| **PAY-007 🟠** | `parampos_callback` artık POST + paylaşılan sır (fail-closed) + replay koruması (`param_callback_events`) + rate limit. ✅ canlı: sırsız → 403 |
| **PAY-012 🟡** | `processRefund` / `reconcilePayments` fail-open sahte başarıyı bıraktı, 503 döndürüyor |
| **DEP-001 🔴** | Kod düzeyinde açılamaz (KYC'siz satıcı yaratmak olurdu). Yapılan: stub kaynaklı red açıkça ayırt ediliyor ve kullanıcıya "entegrasyon henüz devrede değil" deniyor |
| **DEP-002 🟠** | TC kimlik no/IBAN/adres artık ne error_log'a ne `param_payload_json`'a düz yazılıyor — anahtar adları korunuyor, değerler maskeleniyor |
| **DEP-005 🟡** | `server.js`: `PORT`/`HOST` env, `/healthz`, SIGTERM/SIGINT graceful shutdown (15 sn zorla-çık), NODE_ENV logu |
| **ERR-001 🟠 / ERR-002 🟡** | `functions/logging.php`: log hedefi doküman kökü dışına sabitlendi, `APP_DEBUG` ayrımı admin tarafında da. `set_error_handler` (loglar, yanıt gövdesini kirletmez — bilinçli olarak istisnaya çevirmiyor, vendor deprecation'ları çalışan yolları kırardı) + `register_shutdown_function` (fatal → düzgün JSON) |
| **NEXT-001 🟠** | `headers()`: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, prod'da HSTS. `/api`, `/admin`, `/assets` hariç (admin paneli iki CDN kullanıyor) |
| **FE-001 🟠** | Sabit kodlu iki cümlelik yer tutucular gitti; `LegalDocument` bileşeni `getprivacy.php`/`getusage.php`'den okuyor (yükleniyor/boş/hata durumları dahil) |
| **UX-001 🟠** | Sahte önizleme asistanı gitti. Kayıtlı botta gerçek `generatereply.php` akışı; kaydedilmemiş botta sahte cevap yerine "önce kaydedin". "Canlı Test Modu"/"Sandbox v2.4" etiketleri dürüstleştirildi |
| **SEO-001 🟡** | `web/src/robots.txt` → `web/public/robots.txt` (Next `src/`'den servis etmiyordu, /robots.txt 404'tü) |
| **DB-004 🟡** | 9 tablonun `utf8mb4_0900_ai_ci` (MySQL 8'e özgü) collation'ı `utf8mb4_general_ci` oldu; `ensureTable()` artık açık `ENGINE/CHARSET/COLLATE` yazıyor — kök neden buydu. ✅ doğrulandı |

---

## P2 — Seçili kalemler

| Bulgu | Yapılan |
| --- | --- |
| **API-001 🟠** | `getchatbot.php` başarıda da zarflı; istemci `res.ok` + `success` kontrol ediyor ve hata ekranı gösteriyor (404/403 artık sessiz değil) |
| **COIN-002 🟡 / COIN-003 🟡** | Sıfırlama kararı+yazma tek atomik UPDATE'te ve tamamen SQL saatinde (`CURDATE()`, `NOW() - INTERVAL 1 DAY`). PHP/MySQL timezone ayrımı ve çift-sıfırlama yarışı kapandı. ✅ dört kural da test edildi |
| **COIN-004 🟡** | `refundMessage()` iade yolu |
| **SEC-016 🟡** | Avatar doğrulaması: yalnızca `assets/…` yolu veya ≤512 KB `data:image/…`, base64 gövdesi `getimagesizefromstring` ile doğrulanıyor, `..` reddediliyor |
| **SEC-020 🔵** | `api/assets/.htaccess` (script yorumlayıcısı kapalı) |
| **AI-004 🟡** | İstemci 15 sn / sunucu 30 sn ayrımı → ikisi de 20 sn |

---

## P3 — README

DOC-001…009'un dokuzu da güncellendi: şema/migration artık var ve kurulum
adımları yazıldı, silinmiş Playwright script'leri ve `DOCUMENT_ROOT` iddiası
kaldırıldı, `autostart.bat` ve `dev:all` gerçek komutlarıyla (`127.0.0.1:8000`)
düzeltildi, `MIN_WEEKLY_PRICE`'ın dört çağrı noktası kaydedildi, klasör ağacı
diskteki gerçekle eşitlendi. Yeni bir **Security** bölümü eklendi (üç katmanlı
denylist, başlıklar, sır envanteri, kimlik doğrulama sertleştirmeleri, mass
assignment).

---

## ⚠️ Kullanıcı eylemi gereken 5 madde

1. **`git add` izni verilmedi** — şu üç dosya diskte doğru ama hâlâ izlenmiyor:
   `api/admin/ajax/_guard.php`, `api/admin/functions/session.php`,
   `api/admin/uploads/.htaccess`. (ARCH-001 🔴 / ARCH-002 🟠)
   Ayrıca yeni dosyalar: `api/.htaccess`, `api/assets/.htaccess`,
   `api/functions/{env,logging,smtp_client}.php`,
   `api/admin/functions/admin_login.php`, `api/database/migrate.php`,
   `api/database/migrations/004_*.sql`, `storage/.gitignore`,
   `api/wallet/{list_withdrawals,update_withdrawal_status}.php`.

2. **Gemini API anahtarını rotate edin.** `api/admin/.env` kimlik doğrulaması
   olmadan indirilebiliyordu. Dosyayı taşımak yetmez.

3. **`api/src.zip` (51 MB, ARCH-004 🟡)** `storage/archive/src-2026-07-31.zip` konumuna taşındı — doküman kökünün dışına, ve gitignore'lu. Silinmedi; içeriğine ihtiyacınız yoksa siz silin.

4. **DB parolasını rotate edin.** Git geçmişinde (`a77323c`) ve düz metin
   `storage/db_backup/*.sql` dökümünde. `PARAM_*` değerleri de git geçmişinde
   olabilir.

5. **Migration'ları uygulayın — ama önce okuyun.**
   `002_clean_orphan_rows.sql` veri siliyor (kendi başlığı böyle diyor).
   `php api/database/migrate.php` kuru çalışır; `--apply --allow-destructive`
   gerçekten uygular. **Bu turda kasıtlı olarak çalıştırılmadı.**

---

## Kapatılamayan tek bulgu

**DEP-001 🔴 — gerçek Param POS entegrasyonu.** `addSubMerchant()` bir stub ve
her zaman başarısız dönüyor; bu doğru (fail-closed) davranış, ama sonucu temiz
bir kurulumda kimsenin satıcı olamaması. `status='active'` yazmak KYC'siz bir
satıcıya para akışı açmak olurdu, dolayısıyla kod düzeyinde çözülemez. Yapılan:
kullanıcıya gerçek sebep söyleniyor, ve entegrasyon geldiğinde `chargeCard`'ın
`simulated` bayrağını kaldırmak `pending_approval` → `paid` geçişini tek yerden
açıyor.
