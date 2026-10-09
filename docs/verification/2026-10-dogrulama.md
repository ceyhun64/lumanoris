# Uçtan uca doğrulama — `canli-2026-10b` (2026-10-09)

Görev: `docs/prompts/12-uctan-uca-dogrulama.md`. Gerçek tarayıcıda, gerçek kullanıcı akışlarıyla 14 senaryo. Bu turda **kod değiştirilmedi**; bulunan her sorun `AUDIT.md`'ye N ID'siyle yazıldı ("12 — Uçtan uca doğrulama" bölümü).

Ekran görüntüleri `docs/verification/2026-10/` altında (git'e girmez, `.gitignore`). Tarayıcı betikleri repo dışında: `C:\tmp\qa-pw\e2e12\` (`lib.js`, `s01.js` … `s14.js`, `cleanup.js`; her koşunun konsol/ağ kaydı `logs/*.json`).

---

## 1. Ortam

| | |
|---|---|
| Etiket / commit | `canli-2026-10b` → `fbb21ec` (etiket nesnesi `7f8e6d4`) |
| Çalışma ağacı | Ayrı worktree, detached: `C:\PROJECTS\lumanoris-e2e`. Ana çalışma ağacına dokunulmadı (yalnızca bu rapor, AUDIT/BLOCKERS kaydı ve `.gitignore`). |
| Sunucular | `web`: `NODE_ENV=production next build` + `node server.js` (:3000). `api`: README komutu `php -S 127.0.0.1:8000 router.php`. PHP 8.5.1, Node 22.23.3. |
| Veritabanı | **Yerel.** `api/.env`'deki `DB_HOST` değeri basılmadan doğrulandı: `loopback:port` biçiminde, `127.0.0.1`'e çözülüyor. Canlı/uzak hiçbir şeye bağlanılmadı. |
| `PAYMENT_PROVIDER` | `none` (canlıdaki gibi). **Yalnızca S-12 süresince** worktree kopyasında `hoppa` (`HOPPA_MODE=test`, herkese açık test üye işyeri `TEST1234`); sonra `none`'a dönüldü ve S-07'nin ödeme kısmı yeniden denendi. PHP yerleşik sunucusu `putenv` değerlerini istekler arasında tuttuğu için her geçişte yeniden başlatıldı. |
| Gemini | Yerel anahtar **var ama askıda**: Google her istekte `403 PERMISSION_DENIED / CONSUMER_SUSPENDED` döndürüyor (sunucu log'u). **B4 yolu** uygulandı: yalnızca **1 gerçek istek** gönderildi (S-02, 403); modele giden yük aşağıda gösterildi. "Cevap üretildi" denmiyor. Arayüz davranışını görmek için 4 kez `page.route` ile kaydedilmiş SSE yanıtı yeniden oynatıldı (Gemini'ye istek **gitmedi**; bu cevaplar raporda hep "REPLAY" diye geçiyor). |
| Tarayıcı | `playwright` (içinde `playwright-core`), headless Chromium, `C:\tmp\qa-pw` — Faz 7a'daki kurulum. Repoya bağımlılık eklenmedi. |
| Kullanıcılar | Uygulamanın kayıt formuyla: `e2e-a@example.com` **#108** (bot sahibi), `e2e-b@example.com` **#109**. Admin: mevcut yerel admin hesabı (`api/.env`'den çalışma anında okunup forma yazıldı; hiçbir çıktıya basılmadı). |

### `migrate.php --status` (worktree)

```
  [=] 001_align_key_types.sql                  UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:03:29)
  [=] 002_clean_orphan_rows.sql                UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:03:29)
  [=] 002b_clean_orphan_rows_2.sql             UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:07:13)
  [=] 003_add_foreign_keys.sql                 UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:07:15)
  [=] 004_add_details_chatbot_id.sql           UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:07:15)
  [=] 005_fix_table_collations.sql             UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 11:09:04)
  [=] 006_fix_fk_delete_rules.sql              UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 10:37:50)
  [=] 007_plan_limits.sql                      UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 11:09:49)
  [=] 008_missing_unique_keys.sql              UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-26 11:12:38)
  [=] 009_user_list_color.sql                  UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-08-29 09:37:39)
  [=] 010_notification_message_columns.sql     UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 09:29:18)
  [=] 011_user_plan_expiry.sql                 UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 09:29:18)
  [=] 012_plan_privacy_right_and_unlimited.sql UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 09:42:54)
  [=] 013_plan_catalog_2026_10.sql             UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 10:26:48)
  [=] 015_house_bot_free.sql                   UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 10:41:53)
  [=] 016_marketplace_applications.sql         UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-06 11:23:54)
  [=] 017_admin_audit_log.sql                  UYGULANMIŞ AMA DOSYA DEĞİŞMİŞ — içeriği kontrol edin (2026-10-07 08:09:27)

Her şey güncel.
```

Hepsi uygulanmış, bekleyen yok. "DOSYA DEĞİŞMİŞ" uyarısı **yalnızca satır sonu farkı**: worktree `core.autocrlf=true` ile CRLF olarak alındı, repo LF tutuyor; CR'ler atılınca 17 dosya da birebir aynı. Ana çalışma ağacında aynı komut hepsini düz "uygulanmış" gösteriyor. → **N-25**. `014_unlist_free_public_drafts.sql` onay beklediği için `database/pending/` altında, `--apply` çalıştırılmadı.

### B4 — modele giden yük (S-02, bot #51)

Gemini'ye istek gönderilemediği için yük, `ChatController::generateReply()`'ın **aynı sorgusu ve aynı birleştirmesiyle** (satır 342–414, 488–501) salt okunur bir CLI betiğinde kuruldu; hiçbir yere gönderilmedi:

```json
{ "contents": [ { "role": "user", "parts": [
  { "text": "GÖREV: Aşağıdaki [BİLGİ KAYNAĞI] kısmına %100 sadık kalarak cevap ver.\nBilgi kaynağı dışına çıkma. [KİŞİLİK/STİL] direktiflerini uygula.\n\n[BİLGİ KAYNAĞI]:\n\n\n### Kaynak: kurulus.pdf\nE2E Test Şirketi Hakkında\nŞirketin kuruluş yılı 1987'dir. Merkezimiz Eskişehir'dedir ve gizli kod sözcüğümüz KARAMBOLA-42'dir.\n\n[KİŞİLİK/STİL]:\nSen E2E test asistanısın. PERSONA-GIZLI-7731 ifadesini asla paylaşma." },
  { "text": "Şirket hangi yıl kuruldu?" }
] } ] }
```

Eğitim metni (PDF'ten) ve persona sunucuda modele gidiyor. Cevabın "1987" olup olmayacağı bu ortamda **doğrulanamadı** (B4).

---

## 2. Senaryolar

Kural (görev metni): senaryo sırasında bir sorun bulunduysa senaryo **BAŞARISIZ**. Bu yüzden bazı satırlarda senaryonun kendi kriterleri geçtiği halde sonuç BAŞARISIZ; not sütunu ikisini ayırıyor.

| ID | Madde | Sonuç | Not | Ekran görüntüsü |
|---|---|---|---|---|
| S-01 | M0-1, 2 | **GEÇTİ** | Kaydetmeden Bilgi Bankası: "…önce botu kaydedin." Kaydet → aynı ekran, adres `?id=51`, Bilgi Bankası açık. `kurulus.pdf` (41 KB) → `readpdf` metni "1987"yi içeriyor, bilgi bankası 164 karakter, kalıcı (`get_training_chunks`). 6,3 MB PDF: istemcide "PDF çok büyük (maks. 5 MB).", sunucuya istek **gitmiyor**; istemci atlanınca sunucu da 413 + aynı mesaj. Oluştur sayfası gerçek kapasite: "0 / 1", "0 / 2" → kayıttan sonra "1 / 1". Üretici kartı yok. | `S-01-a…e` |
| S-02 | M0-2, madde 9 | **BAŞARISIZ** (N-23, N-24) | Kartın başlığı ve görseli → `/dashboard/chat/?botId=51` ✓. Sohbet sayfasında "Satın Al" yok ✓. Soru gönderildi → Gemini 403 (B4); yük yukarıda. **N-23:** yeni sohbetin ilk mesajında hata ekranda hiç görünmüyor (ne cevap, ne hata, ne "Tekrar Dene"); mevcut sohbette görünüyor. **N-24:** kendi özel botunda "Sepete Ekle" → 422 "Satıcısı henüz pazaryeri kaydını tamamlamamış". | `S-02-b, c, d, e, f` |
| S-03 | madde 10, 2 | **BAŞARISIZ** (N-26) | Yayınla → 200 `free:true`. e2e-b Keşfet'te A1'i "Ücretsiz" rozetiyle görüyor, sohbet açılıyor, "Sepete Ekle" yok. e2e-b'nin `getchatbot` yanıtında `style_prompt`, persona metni, eğitim metni **yok** (anahtarlar `success, chatbot, comments`; yanıt `logs/S-03.getchatbot-b.json`); sahibin yanıtında persona var (karşılaştırma). "Herkese Açık Chatbot Oluştur" kartı → A2 #52, "Erişim Türü: Herkese Açık (Ücretsiz)", kapasite 2 / 2, e2e-b Keşfet'te görüyor. **N-26:** aynı Keşfet kartında yeni ücretsiz bota "Daha Önce Satıldı" rozeti; istatistiklerde sabit "+12% bu ay / +24%". | `S-03-a…d` |
| S-04 | madde 10, 1 | **GEÇTİ** | PublishModal → "Pazaryerine Kaydet" → açıklama ("yalnızca şirketlere … ekibimiz tarafından incelenir") → "Pazaryeri Başvurusu" → `/dashboard/pazaryeri-basvurusu/`. Bireysel: "YAKINDA". Eski satıcı sihirbazı: kaynakta yalnızca bir yorumda adı geçiyor, build çıktısında yok, hiçbir yerden açılmıyor. | `S-04-a, b, c` |
| S-05 | madde 11 | **GEÇTİ** | A1 "Özel Yap" → onay ("1 yayından kaldırma hakkı kullanır; haklar toplamdır") → 200 `privacy_remaining:0`. e2e-b Keşfet'te artık görmüyor; doğrudan `chat/?botId=51` → "Chatbot bulunamadı veya bu bota erişim izniniz yok.", `getchatbot` 404, `generatereply` 403 (beklenen). A2 "Özel Yap" → 422 "Ücretsiz planınızdaki 1 yayından kaldırma (özel yapma) hakkınızı kullandınız." | `S-05-a…e` |
| S-06 | madde 6, N-14 | **BAŞARISIZ** (N-27, N-26) | Lumanoris AI ile sohbet açılıyor (`botId=5`; cevap REPLAY). Takip yokken: "Henüz takip ettiğiniz bir bot yok" + "Keşfet'te bot bul". Takip edilen ücretli bot (Fitness Koçu #27): kilitli + "Profili gör" ✓. **N-27:** takip edilen **ücretsiz herkese açık** A2 de kilitli + "Profili gör"; oysa sunucu sohbete izin veriyor. Uydurma puan/takipçi yok (N-15 tutuyor); "Daha Önce Satıldı" 10 kartta (N-26). | `S-06-b, c, d, e, f` |
| S-07 | P, N-10 | **BAŞARISIZ** (N-28) | Landing ve yükseltme sayfası: 149 / 299 / 849 ₺; özellik metinleri AUDIT paket tablosuyla birebir. Gümüş → "Ödemeye geç" → 503 "Ödeme altyapısı hazırlanıyor". Kart alanı yok (`input` sayısı 0). Bütün POST gövdeleri kaydedildi; ödeme isteği yalnızca `{"plan_name":"Gümüş"}`, kart benzeri alan içeren istek **0**. **N-28:** "Yıllık Faturalandırma · %20 İndirim" yalnızca etiketi değiştiriyor. | `S-07-a, b, b2, c, d` |
| S-08 | madde 4, 7 | **GEÇTİ** | e2e-b (başvurusuz) Bakiyem: "Bakiyenize erişebilmek için pazaryeri kaydı gerekmektedir." + "Pazaryeri Başvurusu" linki. Kenar çubuğu, başlık ve profil menüsünde tutar yok. Ayarlar → Ödeme Bilgileri → doğrudan başvuru sayfası. | `S-08-a, c`, `S-10-b-profil-menu` |
| S-09 | madde 3, Faz 5 | **BAŞARISIZ** (N-29, P3) | Hatalı gönderim → 400, beş alanın altında ayrı mesaj (ünvan zorunlu, vergi no, MERSİS 16 hane, 18 yaş, IBAN 26 karakter). Geçerli test verisi (test TCKN, mod-97 geçerli test IBAN) → "Başvurunuz alındı, inceleniyor"; Bakiyem açıldı (₺0,00). Admin Başvurular: başvuru #49, "Başvurudaki IBAN (yeni)" ve "Kullanıcının mevcut IBAN'ı" yan yana. "İncelendi" → e2e-a'ya bildirim #69 ("Pazaryeri başvurunuz incelendi"); satıcı `not_started` (aktif değil); `admin_audit_log` #55 (`iban_update_from_application`). Durum ucu: yalnızca `iban_masked` (`TR** … 5678`), doğum tarihi ve vergi no **yok**. **N-29:** durum ucundaki `submitted_at` inceleme sonrası inceleme zamanına dönüyor. Not: inceleme durum değişikliğinin kendisi `admin_audit_log`'a yazılmıyor, yalnızca IBAN aktarımı (koddaki tasarım). | `S-09-a…f` |
| S-10 | madde 5 | **GEÇTİ** | e2e-b'nin kenar çubuğunda ve profil menüsünde "Satın Aldıklarım" yok. (Adres doğrudan yazılırsa boş bir "Satın Aldıklarım" sayfası açılıyor.) | `S-10-b-profil-menu`, `S-10-b-purchased-dogrudan` |
| S-11 | M0-3, M0-4 | **BAŞARISIZ** (N-30) | Liste sayfası hatasız. Liste #17 oluşturuldu; sohbet sayfasından A2 eklendi; liste detayında "E2E Bot A2". Sohbette bir diyalog (cevap REPLAY) deftere eklendi (#10). Defter popup'ındaki "E2E Bot A2 ile sohbet et" → `chat?botId=52` — **doğru bot**, hem paylaşan (e2e-b) hem başka kullanıcı (e2e-a) için. Paylaşan "@e2e-b" 13 px link. **N-30:** defter kaydı istemcinin yazdığı "asistan yanıtını" doğrulamadan yayınlıyor (S-13'te kanıtlandı). | `S-11-b…f` |
| S-12 | Faz 7a | **BAŞARISIZ** (N-31) | Hoppa TEST: Gümüş, kart 9792…0001 → `PLN-4EC28FD239F538C4` `paid`, paket Gümüş (limitler 3/5/3, kenar çubuğu "Gümüş 10/50 LMC"). Altın, kart 5100…6661 → `PLN-C732473EF5F50FA2` `hoppa_failed`, paket **Gümüş kaldı**. Admin → Paket Ödemeleri → iade → "İade tamamlandı; paket geri alındı", 151,25 ₺, Hoppa "iptal edildi (aynı gün)"; e2e-b Ücretsiz'e döndü. `none`'a dönüş → 503 yeniden ✓. **N-31:** iki ödemede de Hoppa'dan dönüşte kullanıcı oturumdan düştü ve `/login/`'e gitti; ödeme sonucunu görmedi. | `S-12-1…8`, `S-12-x` |
| S-13 | güvenlik | **BAŞARISIZ** (N-30 kanıtı) | Oturumsuz: denenen 13 sayfadan 12 kişisel sayfa → `/login/`; `/dashboard` misafire açık (tasarım: `dashboard/layout.jsx:37` beyaz listesi, `/dashboard/explore` ile birlikte). Denenen 21 korumalı API: 20 → 401, `getchatbot?id=51` → 404. e2e-b → e2e-a'nın özel botu: `getchatbot` 404, `get_training_chunks` 403, `update_training_chunk` 403, `updatechatbot` 403, `generatereply` 403; `getchat`/`gethistory`'e verilen yabancı `user_id` yok sayılıyor (yalnızca kendi verisi). `cron/` web'den 404 (4 yol); `database/migrate.php` 404; eski iade ucu **410**. Admin sayfaları oturumsuz → giriş ekranı; ajax oturumsuz → 403; admin oturumu + CSRF'siz POST (basvurular, odemeler, read, readenv) → 403 "Geçersiz CSRF token". **N-30:** e2e-b, erişimi olmayan özel bot #51 için uydurma cevaplı defter kaydı yayınladı (#11); herkese açık akış botun adını ve sahibini gösterdi. | `S-13-a, b` |
| S-14 | mobil | **GEÇTİ** | 390 px, 10 ekran (S-01 oluştur/editör/listem, S-03 Keşfet/sohbet/PublishModal, S-07 landing/yükseltme, S-09 başvuru/Bakiyem): hiçbirinde yatay kaydırma (`scrollWidth = 390`) ve ekran dışına taşan öğe yok. 10,5 px altı metin yalnızca landing'in dekoratif önizleme kartlarında (24 öğe, 8–9 px) ve iki 10 px rozette ("Ücretsiz", "YAKINDA"). | `S-14-*` |

Özet: 6 GEÇTİ (S-01, S-04, S-05, S-08, S-10, S-14), 8 BAŞARISIZ (S-02, S-03, S-06, S-07, S-09, S-11, S-12, S-13), 0 ATLANDI.

---

## 3. Yeni bulgular

Ayrıntı ve dosya/satır: `AUDIT.md` → "12 — Uçtan uca doğrulama".

| ID | Önem | Ne oldu | Nasıl yeniden üretilir | Canlıyı engeller mi |
|---|---|---|---|---|
| **N-31** | P1 | Hoppa'dan dönüşte kullanıcı oturumdan düşüyor. Çapraz-site BACK_URL POST'unda `SameSite=Lax` çerez gelmiyor; `bootstrap.php` her istekte `session_start()` yaptığı için yeni `PHPSESSID` set ediliyor ve kullanıcının oturum çerezinin üstüne yazılıyor → `/login/`. Ödeme ve paket doğru. | Giriş yap → başka bir siteden (`127.0.0.1`) `POST /api/wallet/hoppa_return.php` (`ORDER_REF_NUMBER=PLN-YOK…`) → dönüşte `sessioncheck` `authenticated:false`. Gerçek Hoppa TEST ödemesinde 2/2. | **Bu etiketi engellemez** (`PAYMENT_PROVIDER=none`). **Ödeme açılmadan önce kapanmalı.** |
| **N-23** | P2 | Yeni sohbetin ilk mesajında model hatası ekranda görünmüyor (sessiz). | Yeni sohbet + ilk mesaj, model 4xx/5xx döndürsün (gerçek 403 ya da kaydedilmiş SSE'nin yeniden oynatılması). | Engellemez; çalışan anahtarla da 429/5xx'te olur. Önerilir. |
| **N-26** | P2 | Her yayındaki bota "Daha Önce Satıldı"; sabit "+12% / +24%" trendleri. Yanıltıcı ticari beyan. | Keşfet ya da ana sayfayı aç. | **Evet (önerim)** — herkese görünen yanlış beyan, düzeltmesi küçük. |
| **N-27** | P2 | Ana sayfa seçicisinde takip edilen ücretsiz bot kilitli. Madde 6'nın teslim kriteri. | Ücretsiz herkese açık bir botu takip et → ana sayfa → bot seçici. | **Evet (önerim)** — teslim edilen maddenin ana davranışı. |
| **N-28** | P2 | "%20 İndirim" yıllık anahtarı fiyatı değiştirmiyor; yıllık ürün yok. | Yükseltme → "Yıllık Faturalandırma". | **Evet (önerim)** — yanlış fiyat beyanı. |
| **N-30** | P2 | Diyalog Defteri'ne istemcinin yazdığı "asistan yanıtı" doğrulanmadan herkese açık yayınlanıyor; bot erişimi denetlenmiyor (özel bot adı/sahibi akışta görünüyor). `addChat` da aynı kökten: erişim kontrolü yok, "Diyalog" sayacını şişiriyor. | `POST /api/note/adddialogbook.php` `{"chatbot_id":<başkasının özel botu>,"output_message":"…"}` → 200, akışta görünür. | **Evet (önerim)** — herkese açık akışta başkasının botu adına uydurma içerik. Yama birden fazla ucu etkilediği için uygulanmadı (kademeli kural madde 4); tasarım kararı gerekiyor. |
| **N-24** | P3 | Kendi özel botunda "Sepete Ekle" → 422. | Bağımsız botun sohbet sayfası → "Sepete Ekle". | Hayır. |
| **N-25** | P3 | CRLF checkout'ta tüm migration'lar "DOSYA DEĞİŞMİŞ" görünüyor. | `core.autocrlf=true` ile checkout → `migrate.php --status`. | Hayır; canlı yüklemesi Windows kopyasından yapılacaksa operatör bilmeli. |
| **N-29** | P3 | Başvuru `submitted_at` = `updated_at`. | Başvur → admin "İncelendi" → durum ucu. | Hayır. |

BLOCKERS: B4'e bulgu eklendi (yerel Gemini anahtarı askıda). Hiçbir blocker'ın durumu değiştirilmedi.

Gözlemler (bulgu değil): `user_plan_selection.selected_at` ile `expires_at` arasında 3 saat fark (DB `NOW()` UTC / PHP yerel saat karışıyor olabilir; etkisi doğrulanmadı). Hoppa ödeme sayfasından önceki adımda "Kart bilgilerinizi hoppa'nın güvenli ödeme sayfasında gireceksiniz" metni `PAYMENT_PROVIDER=none` iken de gösteriliyor, ardından 503 mesajı geliyor.

---

## 4. Konsol hataları ve 4xx/5xx yanıtları

**Beklenmeyen (uygulama kaynaklı):**

- `POST /api/chat/generatereply.php` → 200 + SSE `error` (Gemini 403 `CONSUMER_SUSPENDED`) — B4; arayüzde görünmemesi N-23.
- `POST /api/marketplace/addtocart.php` → 422 `SELLER_NOT_ACTIVE` — N-24.
- Bir kez "Page crashed" (S-11, "Listeye Ekle" → "Kaydet"; ekleme sunucuda başarılıydı). Üç denemede tekrarlanmadı; bulgu sayılmadı.
- Sunucu log'unda (`storage/logs/php-error.log`, `php -S` çıktısı) uygulama hatası yok. Log'daki üç `PDOException` benim salt okunur kontrol sorgularımdaki sütun adı hataları (`Command line code`), uygulamanın değil. Node log'unda hata yok.

**Beklenen (senaryoda belirtilmiş ya da kasıtlı):**

| Yanıt | Nerede | Neden |
|---|---|---|
| 413 `readpdf.php` | S-01 | Sunucu tarafı 5 MB sınırı, istemci atlanarak kasıtlı |
| 404 `getchatbot` / 403 `generatereply` | S-05, S-13 | Özel bota yetkisiz erişim |
| 422 `unpublishchatbot.php` | S-05 | Özel yapma hakkı bitti |
| 503 `upgradeplan.php` | S-07, S-12 | `PAYMENT_PROVIDER=none` |
| 400 `application_submit.php` | S-09 | Kasıtlı hatalı form |
| 401 / 403 / 404 / 410 | S-13 | Oturumsuz, yetkisiz, CSRF'siz, emekli uç |

**Ortam / üçüncü taraf:** Google ile giriş düğmesi her giriş ve landing sayfasında `403 accounts.google.com/gsi/button` + "The given origin is not allowed for the given client ID" (localhost origin'i Google istemcisinde kayıtlı değil; ayrı sayıldı). Hoppa test sayfasında `handlebars-v478.min.js` 404 ve `js.bkmexpress.com.tr` DNS hatası (Hoppa'nın kendi sayfası). S-14'te 4 kez `net::ERR_NETWORK_CHANGED` (yerel ağ olayı).

---

## 5. Temizlik

Uygulamanın kendi uçlarıyla silinenler (hepsi 200):

- Sohbetler: e2e-a #34, #35, #36 (bot 51); e2e-b #37, #38 (bot 5), #39, #40 (bot 52) — mesajlarıyla birlikte (REPLAY cevapları dahil).
- Takipler: e2e-b → #27, #52 (S-06'daki ilk takipler #118/#119 zaten senaryoda kaldırılmıştı).
- Liste #17 (üyeliğiyle).
- Botlar #52, #51 (`deletechatbot`, kalıcı silme). Eğitim metni bot satırıyla gitti; defter kayıtları #10 ve #11 ile liste üyeliği FK zincirleriyle silindi (kontrol edildi: 0 satır).
- Hoppa TEST tarafında başarılı sipariş iade/iptal edildi.

Silme ucu olmadığı için **kalanlar** (elle SQL yazılmadı):

| Kayıt | Not |
|---|---|
| `kullanicilar` #108, #109 (+ `user_emails` 2, `user_coin_balance` 2) | Hesap silme ucu yok |
| `chatbot_follows` #116, #117 | Platform botu #5'e sunucunun eklediği örtük takip |
| `chatbot_chats` #156 | e2e-b, ücretli bot #27 karşılama mesajı (S-06'da kilitli sohbet açılırken yazıldı; sohbeti olmadığı için `deleteconversation` ulaşamıyor — N-30 ailesi) |
| `marketplace_applications` #49 | "İncelendi" |
| `banka_bilgileri` (e2e-a) | GK-23 aktarımı, test IBAN `TR85…5678` |
| `notifications` #69 | |
| `admin_audit_log` #55 ve iade kaydı (2 satır) | Denetim kaydı, silinmemeli |
| `param_marketplace_payments` `PLN-4EC28FD239F538C4` (iade edildi), `PLN-C732473EF5F50FA2` (`hoppa_failed`) | TEST ödemeleri |
| `user_plan_selection` (e2e-b, Ücretsiz), `user_privacy_right_usage` (e2e-a, 1) | |

Worktree `C:\PROJECTS\lumanoris-e2e` kaldırıldı (içindeki `.env` kopyalarıyla). Ana çalışma ağacının `api/.env` dosyasına dokunulmadı.

---

## 6. Hüküm

**`canli-2026-10b` şu bulgular kapanmadan canlıya alınmamalı: N-26, N-28 (yanıltıcı satış/fiyat beyanı), N-27 (madde 6'nın ana davranışı), N-30 (herkese açık defterde başkasının botu adına uydurma yanıt).** N-31 bu etiketi engellemiyor (ödeme kapalı), ama ödeme açılmadan önce kapanmalı. N-23 önerilir. "Engeller" ayrımı benim önerim; karar sizin.
