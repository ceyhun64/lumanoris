# Düzeltme Turu 2 — 2026-08-26

Başlangıç noktası: [`08-ozet.md`](08-ozet.md) roadmap'i + [`09-duzeltme.md`](09-duzeltme.md)
"yapıldı" kaydı. Bulgular yeniden türetilmedi, okundu.

`01`–`09` arası rapor dosyalarına dokunulmadı.

---

## FAZ 0 — 09'da açık bırakılanları kapat

### 0.1 — `git add` (ARCH-001 🔴 / ARCH-002 🟠)

**Durum: ✅ tamamlandı** (commit edilmedi — kullanıcı isteği).

29 dosya stage'lendi. Stage öncesi üç aşamalı sır taraması yapıldı:

| Kontrol | Sonuç |
| --- | --- |
| `.env` dosyaları ignore'lu mu? | ✅ `api/.env`, `api/admin/.env`, `web/.env` — üçü de ignore'lu, stage'e girmedi |
| `schema.sql` veri içeriyor mu? | ✅ 0 `INSERT`/`REPLACE`/`LOCK TABLES` — yalnızca DDL. 0 e-posta, 0 bcrypt hash |
| Migration'lar veri içeriyor mu? | ✅ dördünde de 0 `INSERT` |
| Sır biçimi taraması (`AIza…`, `GOCSPX-…`, bcrypt, private key, DB parolası) | ⚠️ 2 eşleşme — aşağıda |

**Eşleşme 1 — kabul edildi:** `api/admin/functions/admin_login.php:62` bir bcrypt
hash içeriyor. Bu gerçek bir kimlik bilgisi değil; kullanıcı bulunamadığında da
`password_verify()` çalıştırmak için üretilmiş **sahte hash** (girdisi
`bin2hex(random_bytes(16))`, kimse bilmiyor). Amacı zamanlama sızıntısını
kapatmak — yanıt süresi "bu kullanıcı adı var mı?" sorusunu cevaplamasın diye.

**Eşleşme 2 — o anda STAGE EDİLMEDİ:** `docs/audit/02-guvenlik.md` gerçek DB parolasını
**3 kez düz metin** içeriyor (satır 693, 720, 2512). Rapor
dosyalarına dokunmama kuralı gereği redakte edilmedi; bunun yerine stage
dışında bırakıldı.

> **Güncelleme (0.4):** kullanıcı bu iki kalem için kurala istisna verdi;
> parola redakte edildi ve dosya stage'lendi. Bkz. bölüm 0.4a.

Parolanın git geçmişinde olduğu ayrıca doğrulandı:
`git log -S "<parola>" -- api/functions/db.php` → **`a77323c`**. Yani 09'un
"rotate edin" uyarısı geçerli; 02'yi commit etmemek tek başına yeterli değil.

**Stage dışında bırakılan ikinci dosya:** `project_tree.txt` (2,8 MB, 37.907
satır). Bu turun ürünü değil; `vendor/` altındaki her Google API client
dosyasını listeleyen üretilmiş bir çıktı. Sır içermiyor (`.env` yalnızca dosya
adı olarak geçiyor, içeriğiyle değil) ama depoya girmesi için bir sebep de yok.

---

### 0.2 — Migration gövdeleri okundu (DB-002 🟠 / DB-006 🟡)

**Durum: ✅ okundu, ölçüldü, onaylandı ve uygulandı.** Aşağıdaki bölüm onay
ÖNCESİ raporun kendisidir; uygulama sonucu "0.2 (devam)" başlığı altında.

Dördü de okundu; `002`'nin etkisi canlı veriye karşı yeniden ölçüldü (yalnızca
`SELECT`, hiçbir yazma yapılmadı).

#### 001_align_key_types.sql — 31 `MODIFY COLUMN`, veri silmez

Tek mantıksal anahtar üç farklı tipte saklanmış: `chatbotlar.id` `int unsigned`
iken `chatbot_id` 9 tabloda `int`, 7 tabloda `bigint unsigned`;
`kullanicilar.id` `int` iken `user_id` 14 tabloda `bigint unsigned`. MySQL
tipleri birebir eşleşmeyen FK'yı reddettiği için `003`'ün ön koşulu.

Yön: çocuklar ebeveyne uyduruluyor (tersi tüm PK'ları değiştirmek olurdu).

**Daraltma riski ölçüldü** — `bigint unsigned` → `int` dönüşümü taşma yaratır mı:

```
chatbot_chats.chatbot_id   MAX=27   ✓        chatbot_comments.user_id   MAX=43   ✓
chatbot_likes.chatbot_id   MAX=27   ✓        chatbot_follows.user_id    MAX=84   ✓
dialog_likes.user_id       MAX=0    ✓        (int sınırı: 2.147.483.647)
```

Tekrar çalıştırılabilir (bir sütunu zaten sahip olduğu tipe çevirmek no-op).

#### 002_clean_orphan_rows.sql — **35 satır siler, 1 satır günceller**

Bu dosya kendi başlığında *"Every statement here DELETES OR REWRITES DATA"*
diyor. Ölçüm bugün (2026-08-26) yeniden yapıldı:

| # | İşlem | Tablo | Etki |
| --- | --- | --- | --- |
| 1 | **DELETE** | `user_emails` | **32 / 76 satır** — silinmiş kullanıcılara ait e-posta geçmişi |
| 2 | **DELETE** | `chatbot_chats` | 2 / 121 satır — kullanıcısı yok |
| 3 | **DELETE** | `chatbot_chats` | *aynı 2 satır* — botu da yok |
| 4 | **UPDATE** | `chatbotlar` | **1 / 14 satır** — silinmez, `owner_user_id` düzeltilir |
| 5 | **DELETE** | `user_dialog_books` | 1 / 4 satır — `chatbot_id = 0` sentinel'i |

> **Dosyanın kendi başlığı "38 orphaned rows" diyor; bugünkü gerçek sayı 35.**
> Fark, 2 ve 3 numaralı kontrollerin **aynı iki satırı** yakalamasından
> geliyor (`chatbot_chats` id=7 ve id=8: hem `user_id=31` hem `chatbot_id=19`
> yok). Ayrı sayılırsa 37, tekilleştirilirse 35.

**Tam olarak neler siliniyor:**

- **`user_emails` (32 satır):** `user_id` = 2, 3, 4, 5, 8, 9, 10, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35,
  36, 37, 38 — her biri 1 satır. Hepsi artık var olmayan kullanıcılar.
- **`chatbot_chats` (2 satır):** `id=7` ve `id=8`, ikisi de
  `user_id=31, chatbot_id=19`, mesaj metni `"Merhaba yazar!"`.
- **`user_dialog_books` (1 satır):** `id=8, user_id=83, chatbot_id=0`.
  Silinmiş bir bot değil — "bot seçilmedi" sentinel'i; onarılamaz.
- **`chatbotlar` (1 satır, SİLİNMEZ):** bot **#5 "LUMANORIS AI"** —
  `owner_user_id` **10 → 6**'ya çekiliyor (kendi `author_user_id`'si). 10
  numaralı kullanıcı yok. Bot ürünün varsayılan asistanı olduğu için
  silinmiyor.

#### 003_add_foreign_keys.sql — 53 FK, veri silmez (ama davranışı değiştirir)

```
ON DELETE CASCADE   : 52
ON DELETE RESTRICT  :  1   (chatbotlar.author_user_id)
DROP bloğu          : 53   (yorumlu, geri alınabilir)
```

> **00-ILERLEME.md "106 kısıt" diyor — gerçek sayı 53.** 106, `ADD` + yorumlu
> `DROP` satırlarının toplamı.

**İki tutarsızlık tespit edildi (yeni bulgu değil, migration'ların kendi içinde):**

1. **`002`'nin yorumu `003` ile çelişiyor.** `002`, 4. maddede şöyle diyor:
   *"003 already declares this constraint ON DELETE SET NULL for that case."*
   Gerçekte `003`'te **tek bir `SET NULL` yok**;
   `fk_chatbotlar_owner_user_id` **`ON DELETE CASCADE`** olarak tanımlı.
   Yani `002`'nin sunduğu alternatif yol (sütunu nullable yapıp NULL yazmak)
   `003` ile birlikte çalışmaz — kullanıcı silindiğinde bot NULL'a düşmez,
   **zincirleme silinir**.

2. **Aynı tabloda iki kısıt zıt davranıyor.** `chatbotlar.author_user_id`
   `RESTRICT` (botu olan yazar silinemez — doğru), ama
   `chatbotlar.owner_user_id` `CASCADE`. `owner ≠ author` olan bir botta,
   sahibin silinmesi botu ve `user_subscriptions` üzerinden **başkalarının
   satın aldığı abonelikleri** sessizce siler.

   **Bugünkü veride bu riskin gerçekleşme yolu yok:** `owner ≠ author` olan
   tek bot #5, ve `002` zaten onu `owner = author = 6` yapıyor. `002`'den
   sonra her botun sahibi = yazarı, dolayısıyla `RESTRICT` her zaman önce
   devreye giriyor. Risk gelecekteki botlar için **gizli** kalıyor.

   Bağlam: `user_subscriptions` bugün 16 satır, **0 aktif** abonelik.

#### 004_add_details_chatbot_id.sql — idempotent DDL, veri silmez

Bu turda (09'da) yazıldı: `createSubscription`'ın transaction'ı içindeki
`ALTER TABLE`'ı oradan çıkarmak için (PAY-004). `information_schema` kontrolü
+ `PREPARE`/`EXECUTE` ile koşullu çalışıyor, ikinci kez çalıştırmak zararsız.

#### Ön-uçuş kontrolü — dördü de çalıştırılabilir durumda

```
001  dokunduğu tablo: 24  | eksik tablo: yok ✓
002  dokunduğu tablo:  5  | eksik tablo: yok ✓
003  dokunduğu tablo: 38  | eksik tablo: yok ✓
004  dokunduğu tablo:  1  | eksik tablo: yok ✓
mevcut FK sayısı: 0  → 003 çakışmaz
```

**(Bu noktada uygulanmadı — veri silen bir işlem, onay olmadan çalıştırılmadı.)**

---

### 0.2 (devam) — Uygulama

Kullanıcı onayı: *"Önce yedek al, sonra 4'ünü de uygula."*

**Yedek:** `storage/db_backup/backup-2026-08-26-07-02-43.sql` — 51 tablo, 30
`INSERT`, etkilenen 5 tablonun verisi içinde doğrulandı.

Yedek alma iki hatayı ortaya çıkardı, ikisi de düzeltildi:

- **`mysqldump` PATH'te değil.** `runMysqlCli()` fail-closed davranıp sahte bir
  yedek üretmedi (doğru), ama araç bulunamıyordu. `Database::mysqlBinary()`
  eklendi: `MYSQL_BIN_DIR` → `PATH` → bilinen kurulum dizinleri sırasıyla
  aranıyor. `api/.env`'e `MYSQL_BIN_DIR` yazıldı, `.env.example`'a belgelendi.
- **Başarısız yedek 0 baytlık dosya bırakıyordu.** `proc_open` stdout'u dosyaya
  yönlendirdiği için dosya komut çalışmadan oluşuyor. `restore()` "en yeni .sql"
  dosyasını seçtiğinden, o boş dosya bir sonraki geri yüklemede canlı
  veritabanının üzerine yazılacak "yedek" olarak seçilebilirdi. `backup()` artık
  hatada dosyayı siliyor ve 0 baytlık çıktıyı da reddediyor.

#### İlk deneme: 001 ✅ 002 ✅ 003 ❌

`003` on birinci kısıtta durdu:

```
SQLSTATE[23000]: 1452 Cannot add or update a child row:
a foreign key constraint fails (`fk_chatbot_follows_user_id`)
```

**001 ve 002 tam olarak öngörüldüğü gibi uygulandı** (doğrulandı):

| Ölçüm | Önce | Sonra | Beklenen |
| --- | --- | --- | --- |
| `user_emails` | 76 | 44 | 44 ✓ |
| `chatbot_chats` | 121 | 119 | 119 ✓ |
| `user_dialog_books` | 4 | 3 | 3 ✓ |
| bot #5 `owner_user_id` | 10 | 6 | 6 ✓ |
| `user_emails` yetim | 32 | 0 | 0 ✓ |

---

### 🆕 DB-013 🟠 — `002_clean_orphan_rows.sql` 53 kısıtın yalnızca 5'ini temizliyor

**TÜR:** bug + prod blocker
**Dosya:** `api/database/migrations/002_clean_orphan_rows.sql`

002 kendi başlığında *"38 orphaned rows across 5 relationships when measured"*
diyor. `003` ise **53** kısıt tanımlıyor. Aradaki 48 ilişki hiç ölçülmemiş.

53 kısıtın tamamı tarandığında (002 uygulandıktan sonra) 3 ilişkide 27 yetim
satır kaldığı görüldü — üçü de 002'nin zaten sildiği sınıftan, sahibi silinmiş
kullanıcıya ait satırlar:

| İlişki | Yetim | İçerik |
| --- | --- | --- |
| `chatbot_follows.user_id` | 25 / 86 | `user_id` = 8, 9, 12–20, 23–29, 32–38 |
| `chatbot_purchase_credits.user_id` | 1 / 1 | `id=4`, `user_id=31`, 150/150 kredi, `expires_at=2026-08-18` |
| `user_plan_selection.user_id` | 1 / 1 | `user_id=10`, plan `Gold` |

Ödenmiş kredi satırı için üç şey doğrulandı: kullanıcı 31 silinmiş, süre bugünden
**önce** dolmuş (hesap geri gelse bile kullanılamaz), ve 002 zaten aynı
kullanıcının sohbetlerini silmişti. Geri kazanılabilir değer yok.

**Düzeltme:** `002b_clean_orphan_rows_2.sql` yazıldı (gerekçeler ve "krediyi
saklamak isterseniz" alternatifi dosyanın içinde). Kullanıcı onayıyla uygulandı.

> Dosya adı önce `005_` idi; runner ada göre sıraladığı için `003`'ten **sonra**
> çalışacaktı. `002b_` olarak yeniden adlandırıldı.

---

### 🆕 DB-014 🟠 — `003_add_foreign_keys.sql` kısmi hatadan sonra yeniden çalıştırılamıyor

**TÜR:** bug + prod blocker
**Dosya:** `api/database/migrations/003_add_foreign_keys.sql`

003 düz bir `ALTER TABLE … ADD CONSTRAINT` listesiydi. MySQL'de her DDL örtük
`COMMIT` yaptığı için, dosya ortasında başarısız olduğunda **ilk N kısıt kalıcı
oluyor**. İkinci deneme ilk kısıtta patlıyor:

```
SQLSTATE[HY000]: 1826 Duplicate foreign key constraint name 'fk_banka_bilgileri_user_id'
```

Canlı doğrulama: ilk denemeden sonra veritabanında **10/53** kısıt kalmıştı.
Bu, 002'nin eksikliğiyle birleşince migration'ları kurtarılamaz hâle getiriyordu
— tam olarak DB-002'nin "yeni bir sunucuda güvenilir kurulabilir mi?" sorusunun
cevabını "hayır" yapan şey.

**Düzeltme:** 53 kısıtın her biri `information_schema` kontrolüyle sarıldı
(`SET @c := (SELECT COUNT(*) …); SET @s := IF(@c=0, 'ALTER…', 'DO 0');
PREPARE/EXECUTE/DEALLOCATE`) — `004`'ün zaten kullandığı desen. Var olan kısıt
sessizce atlanıyor, dosya tekrar çalıştırılabilir. Yorumlu `DROP` bloğu
(geri alınabilirlik) korundu.

---

### 0.2 sonuç — beş migration da uygulandı ✅

```
✓ 001_align_key_types.sql        ✓ 003_add_foreign_keys.sql
✓ 002_clean_orphan_rows.sql      ✓ 004_add_details_chatbot_id.sql
✓ 002b_clean_orphan_rows_2.sql
```

**Canlı doğrulama:**

| Kontrol | Sonuç |
| --- | --- |
| Foreign key sayısı | **53 / 53** ✓ (`CASCADE` 52, `RESTRICT` 1) |
| 53 ilişkinin tamamında kalan yetim | **0** ✓ |
| `chatbot_follows` | 86 → 61 ✓ |
| `chatbot_purchase_credits` / `user_plan_selection` | 1 → 0 / 1 → 0 ✓ |
| `param_marketplace_details.chatbot_id` (004) | `int unsigned` + `idx_details_chatbot` ✓ |
| Tip hizalaması (001) | `chatbotlar.id` = `chatbot_chats.chatbot_id` = `int unsigned` ✓ |

**Uygulama regresyonu — FK'lar eklendikten sonra 10 akış canlı test edildi:**

| # | Akış | Sonuç |
| --- | --- | --- |
| 1 | Kayıt (`kullanicilar`, `user_emails`, `chatbot_follows`) | 200 ✓ |
| 2 | Giriş | 200 ✓ |
| 3 | Bot oluşturma (`chatbotlar` → author + owner FK) | 200 ✓ |
| 4 | Sohbet başlatma (`chatbot_conversations` FK ×2) | 200 ✓ |
| 5 | Mesaj kaydetme (`chatbot_chats` FK ×2) | 200 ✓ |
| 6 | Yorum (`chatbot_comments` FK ×2) | 200 ✓ |
| 7 | `generateReply` + coin tüketimi/iadesi | ✓ |
| 8 | Cüzdan bakiyesi (`param_marketplace_*` FK'ları) | 200 ✓ |
| 9 | Sepete ekleme | 422 `SELLER_NOT_ACTIVE` — FK değil, beklenen DEP-001 davranışı |
| 10 | **Bot silme → CASCADE** | sohbet/yorum/konuşma 1→0, otomatik ✓ |

**Kısıt davranışı ayrıca test edildi (transaction + rollback ile):**

- Botu **olan** kullanıcıyı silmek → `1451` ile **engellendi** (`RESTRICT`) ✓
- Botu **olmayan** kullanıcıyı silmek → başarılı, takipleri `CASCADE` ile gitti ✓

Yani yetimlerin ilk etapta nasıl biriktiği de kapandı: uygulama kodu çocuk
satırları elle silmeyi unutsa bile veritabanı artık tutuyor.

**`schema.sql` bilinçli olarak yeniden üretilmedi.** Temiz kurulum yolu
şöyle çalışıyor ve doğrulandı: `schema.sql` (temel durum) → `migrate.php`
(001 tipleri hizalar, 002/002b boş veride no-op, 003 idempotent, 004 idempotent)
→ doğru son durum. Şemayı canlı veritabanından yeniden üretmek bu zinciri
gereksiz kılardı ama migration'ların test edilmesini de engellerdi.

---

### 🆕 DB-015 🟠 — 53 FK'nın 52'si `ON DELETE CASCADE`; para/muhasebe tablolarında bu yanlış

**TÜR:** iş mantığı + veri kaybı + uyum (VUK/KVKK)
**Dosya:** `api/database/migrations/003_add_foreign_keys.sql`
**Durum:** ⏸️ **rapor edildi, DEĞİŞTİRİLMEDİ — onay bekleniyor**

`003` bir tek `RESTRICT` (`chatbotlar.author_user_id`) ve 52 `CASCADE`
tanımlıyor. Dosyanın kendi yorumu doğru sezgiyi yazmış:

> `RESTRICT` for chatbotlar.author_user_id: deleting an author who still has
> published bots should fail loudly, not silently erase the bots
> **(and the subscriptions other people bought)**.

Ama parantez içindeki koruma tam olarak uygulanmamış: `user_subscriptions`'ın
kendi iki kısıtı `CASCADE`. Yani yazar silinemiyor ama **bot silinebiliyor** ve
sildiğinde başkalarının satın aldığı abonelikler sessizce gidiyor.

#### Sınıf A — Para / muhasebe: CASCADE yanlış (8 kısıt)

| # | Kısıt | Şu an | Öneri | Gerekçe |
| --- | --- | --- | --- | --- |
| 33 | `para_cekme_talepleri.user_id` | CASCADE | **RESTRICT** | Şirketten para ÇIKIŞI kaydı. `iban` + `miktar` yalnızca bu satırda; başka kopyası yok. Kullanıcı silinince ödeme yapıldığının tek kanıtı kayboluyor. |
| 36 | `param_marketplace_payments.user_id` | CASCADE | **RESTRICT** | Tahsilat başlığı. Silinince siparişin alıcısı kayboluyor — ve `param_marketplace_details.payment_id`'de FK **olmadığı** için satıcı payı satırları yetim kalıyor (bkz. DB-016). |
| 52 | `user_subscriptions.user_id` | CASCADE | **RESTRICT** | Ödeme karşılığı verilmiş erişim hakkı. |
| 51 | `user_subscriptions.chatbot_id` | CASCADE | **RESTRICT** | **En tehlikelisi.** Satıcı kendi botunu silerse, o bota abone olmuş **başkalarının** ödediği abonelikler zincirleme siliniyor. İade talebi geldiğinde dayanak kalmıyor. |
| 18 | `chatbot_purchase_credits.user_id` | CASCADE | **RESTRICT** | Ödeme karşılığı mesaj hakkı (`calculateMessageAllowance`). |
| 17 | `chatbot_purchase_credits.chatbot_id` | CASCADE | **RESTRICT** | Aynı: bot silinince müşterinin ödediği hak yanıyor. |
| 35 | `param_marketplace_details.chatbot_id` | CASCADE | **SET NULL** | Sütun **zaten `NULL` kabul ediyor** — ALTER gerekmiyor. Bu satır satıcının gelir kalemi; bot silinince gelir kaydı değil, yalnızca "hangi bot" bilgisi düşmeli. |
| 37 | `param_marketplace_sellers.user_id` | CASCADE | **RESTRICT** | KYC kaydı (TC/IBAN doğrulama izi) + ödeme yapılan sub-merchant kimliği. Geçmiş ödemelerin kime yapıldığının kaydı. |

#### Sınıf B — Plan tabloları: bugün zararsız, ödeme açılınca A'ya taşınmalı (4)

| # | Kısıt | Şu an | Öneri | Gerekçe |
| --- | --- | --- | --- | --- |
| 39 | `producer_plans.user_id` | CASCADE | **RESTRICT** | Ücretli üretici planı. Bugün 0 satır ve tahsilat yok (BIZ-003), ama satılır satılmaz muhasebe kaydı olur. |
| 50 | `user_plan_selection.user_id` | CASCADE | CASCADE *(şimdilik)* | `upgradePlan` fail-closed (BIZ-001), karşılığında tahsilat yok. Ödeme açıldığında RESTRICT'e çekilmeli. |
| 41 | `producer_self_use_credits.user_id` | CASCADE | CASCADE ✓ | Plandan türetilen sayaç, kendi başına muhasebe değeri yok. |
| 40 | `producer_self_use_credits.chatbot_id` | CASCADE | CASCADE ✓ | Aynı. |

#### Sınıf C — İçerik sahipliği (2)

| # | Kısıt | Şu an | Öneri | Gerekçe |
| --- | --- | --- | --- | --- |
| 24 | `chatbotlar.author_user_id` | RESTRICT | RESTRICT ✓ | Zaten doğru. |
| 25 | `chatbotlar.owner_user_id` | CASCADE | **RESTRICT** | Faz 0'da rapor edilen tutarsızlık. `author` RESTRICT ile korunurken `owner` CASCADE botu — ve zincirleme aboneliklerini — siliyor. Ayrıca `002`'nin yorumu bu kısıtın `SET NULL` olduğunu söylüyor, değil. |

#### Sınıf D — Kişisel veri / kimlik: CASCADE **doğru** (6)

`banka_bilgileri.user_id` (1), `user_emails.user_id` (47),
`user_phones.user_id` (49), `password_resets.user_id` (38),
`user_tokens.user_id` (53), `notifications.user_id` (32).

Bunlar kişisel veri ya da oturum artığı; hesap silinince **gitmeleri gerekiyor**
(KVKK md. 7). `banka_bilgileri` özellikle dikkat çekici: IBAN/TC taşıyor ama
denetim izi kaybolmuyor, çünkü `para_cekme_talepleri` kendi `iban` kopyasını
tutuyor.

#### Sınıf E — Davranış / türetilmiş veri: CASCADE **doğru** (32)

Beğeni, beğenmeme, takip, gizleme, ilgilenmeme, ziyaret, şikâyet, yorum,
sohbet, konuşma, sepet, liste, günlük coin bakiyesi, diyalog etkileşimleri.
Ebeveyni olmadan anlamı yok, saklama yükümlülüğü de yok.

#### Sınıf F — Operasyon kaydı (1)

| # | Kısıt | Şu an | Öneri | Gerekçe |
| --- | --- | --- | --- | --- |
| 34 | `param_marketplace_alerts.user_id` | CASCADE | **SET NULL** | Sütun **zaten `NULL` kabul ediyor**. Ödeme uyarısı bir operasyon/denetim kaydı; ilgili kullanıcı silinse de uyarının kendisi kalmalı. |

#### Toplam

| Sınıf | Kısıt | Öneri |
| --- | --- | --- |
| A — para/muhasebe | 8 | 7 × RESTRICT, 1 × SET NULL |
| B — plan | 4 | 1 × RESTRICT, 3 × değişiklik yok |
| C — sahiplik | 2 | 1 × RESTRICT, 1 × değişiklik yok |
| D — kişisel veri | 6 | değişiklik yok (CASCADE doğru) |
| E — davranış | 32 | değişiklik yok (CASCADE doğru) |
| F — operasyon | 1 | 1 × SET NULL |
| **Değişecek** | **11** | **9 × RESTRICT, 2 × SET NULL** |

#### RESTRICT'in operasyonel bedeli — ve neden yine de doğru

9 kısıt RESTRICT olursa **ödeme yapmış bir kullanıcı artık silinemez.** Bu bir
yan etki değil, amacın kendisi: VUK muhasebe kayıtlarında 5 yıl saklama
istiyor, KVKK ise kişisel verinin silinmesini. İkisi `SET NULL` ile
uzlaşmıyor — `payments.user_id`'yi NULL yapmak "bu siparişi kim aldı"
sorusunu tamamen cevapsız bırakır ve mutabakatı da bozar.

Doğru uzlaşma **silme değil anonimleştirme**: `kullanicilar` satırı kalır,
kişisel alanları (`ad_soyad`, `eposta`, `kullanici_adi`, `avatar`) yer
tutucuyla değiştirilir. Muhasebe zinciri kopmaz, kişisel veri gerçekten
silinir. `banka_bilgileri`, `user_emails`, `user_phones` zaten CASCADE ile
gittiği için IBAN/TC/telefon da temizlenir.

Bugün **hiçbir hesap silme uç noktası yok** (`grep` ile doğrulandı: yalnızca
`SocialController::deleteUserList` var, o da liste siliyor). Yani RESTRICT
bugün hiçbir çalışan akışı kırmıyor; anonimleştirme yordamı, hesap silme
özelliği yazıldığında gerekecek.

#### Uygulama planı (onaylanırsa)

`006_fix_fk_delete_rules.sql`: 11 kısıt `DROP` + doğru kuralla `ADD`.
`SET NULL` alan iki sütun zaten nullable, **`ALTER TABLE` gerekmiyor**.
`003` ile aynı desende idempotent yazılacak (DB-014). Veri silmez.

---

### 🆕 DB-016 🟡 — Ledger'ın kendi iç bağlarında FK yok; en önemsiz bağında var

**TÜR:** veri bütünlüğü
**Durum:** ⏸️ rapor edildi, değiştirilmedi

53 kısıt taranırken, yabancı-anahtar görünümlü ama FK'sı olmayan sütunlar da
listelendi. Para tablolarında tablo şu:

| Sütun | Hedef | Satır | Not |
| --- | --- | --- | --- |
| `param_marketplace_details.payment_id` | `param_marketplace_payments.id` | 15 | **FK yok** |
| `param_marketplace_details.seller_user_id` | `kullanicilar.id` | 15 | **FK yok** |
| `param_marketplace_refunds.payment_id` | `param_marketplace_payments.id` | 0 | FK yok |
| `param_marketplace_refunds.detail_id` | `param_marketplace_details.id` | 0 | FK yok |
| `param_marketplace_refunds.requested_by_user_id` | `kullanicilar.id` | 0 | FK yok |
| `param_marketplace_alerts.seller_user_id` | `kullanicilar.id` | 0 | FK yok |

Örüntü ters: `param_marketplace_details`'in **en önemsiz** bağı
(`chatbot_id`) FK'lı ve üstelik CASCADE'li; ödemeye ve satıcıya bağlayan iki
kritik sütunda hiç FK yok. `computeBalanceAndTransactions()` satıcı bakiyesini
tam da bu iki sütun üzerinden hesaplıyor.

FK'sı olmayan diğer sütunlar: `chatbot_in_list.list_id`,
`chatbotlar.kategori_id`, `plan_icerikler.plan_id`, `dialog_*.dialog_id` (6
tablo), `*_uninterested.category_id` (2 tablo).

> Ad taramasının yanlış pozitifleri (bunlar FK değil, dış sistem kimlikleri):
> `kullanicilar.google_id`, `param_marketplace_payments.order_id` /
> `param_transaction_id` / `param_receipt_id`, `param_marketplace_alerts.order_id`,
> `param_marketplace_soap_log.order_id`.

DB-015 onaylanırsa aynı migration'a eklenebilir; ama `dialog_*.dialog_id`'nin
hedef tablosu belirsiz (`user_dialog_books` mi başka bir tablo mu) —
o grup ayrıca incelenmeli.

---

## 0.4 — Sır temizliği

Kullanıcı, rapor dosyalarına dokunmama kuralını bu iki kalem için askıya aldı.

### 0.4a — `docs/audit/02-guvenlik.md` redakte edildi ✅

Gerçek DB parolası dosyada **3 kez düz metin** duruyordu (satır 693, 720, 2512).
Üçü de `[REDACTED-DB-PASSWORD]` ile değiştirildi. Bulgunun kanıt değeri
korundu — üç satır da hâlâ tam olarak neyi kanıtladığını söylüyor:

| Satır | Redaksiyon sonrası | Kanıtladığı |
| --- | --- | --- |
| 693 | `private $password_dev = '[REDACTED-DB-PASSWORD]';` | `db.php`'de hard-coded kimlik bilgisi vardı (SEC-008) |
| 720 | `git log --oneline -S'[REDACTED-DB-PASSWORD]' … → a77323c` | Parolanın git geçmişinde olduğu |
| 2512 | `yalnızca [REDACTED-DB-PASSWORD] için hedefli git log -S yapıldı` | Taramanın kapsamı |

Dosya artık sır taramasından temiz geçiyor ve stage'lendi. Faz 0'da stage
dışında bırakılmasının sebebi ortadan kalktı.

### 0.4b — `storage/db_backup/` — gerçek kullanıcı verisi

Dizinde iki dosya var, ikisi de **düz metin** ve **gerçek kullanıcı verisi**
içeriyor:

| Dosya | Boyut | Tarih | Kaynak |
| --- | --- | --- | --- |
| `backup-2026-02-23-13-56-14.sql` | 1,6 MB | 2026-02-23 | `api/admin/db_backup/`'tan taşındı (SEC-001) |
| `backup-2026-08-26-07-02-43.sql` | 99 KB | 2026-08-26 | Migration öncesi yedek (Faz 0.2) |

**Yeni yedeğin içeriği ölçüldü:** 140 e-posta adresi, 49 kullanıcı satırı,
7 IBAN görünümlü değer, 2 bcrypt parola hash'i, 51 tablo.

**Nerede duruyor:** `<repo>/storage/db_backup/` — **doküman kökünün dışında.**
Eskiden `api/admin/db_backup/` içindeydi ve `GET /admin/db_backup/<dosya>.sql`
ile kimlik doğrulaması olmadan indirilebiliyordu (SEC-001 🔴). Bugünkü konum
web sunucusunun servis ettiği hiçbir yola karşılık gelmiyor;
`Database::backupDir()` ayrıca `api/` altına düşen bir `DB_BACKUP_DIR`
yapılandırmasını açıkça reddediyor.

**`.gitignore` durumu — doğrulandı:**

```
$ git check-ignore -v storage/db_backup/*.sql
storage/.gitignore:4:*   storage/db_backup/backup-2026-02-23-13-56-14.sql
storage/.gitignore:4:*   storage/db_backup/backup-2026-08-26-07-02-43.sql
```

`storage/.gitignore` her şeyi ignore edip yalnızca kendini bırakıyor
(`*` + `!.gitignore`), böylece dizin temiz bir klonda var oluyor ama içeriği
asla commit'lenmiyor. Kök `.gitignore`'daki `*.sql` ve `storage/*` kuralları
ikinci bir katman.

**Ne kadar duracak — öneri:**

| Dosya | Öneri |
| --- | --- |
| `backup-2026-08-26-07-02-43.sql` | Migration'ların doğru çalıştığından emin olunana kadar (birkaç gün). Geri dönüş yolu bu. |
| `backup-2026-02-23-13-56-14.sql` | **Silinebilir.** 6 aylık, migration öncesi şemaya ait, ve bugünkü veritabanıyla uyumsuz (o günden beri 001–004 uygulandı). Geri yüklenmesi işe yaramaz, saklanması yalnızca sızıntı yüzeyi. |

Silme kullanıcının kararı — bu turda hiçbir yedek silinmedi.

**Kalıcı öneri:** yedekler bir dosya sistemi klasöründe süresiz durmamalı.
Üretimde `DB_BACKUP_DIR`'i şifreli bir birime ya da nesne depolamaya (server-side
encryption + yaşam döngüsü kuralı) yönlendirin. `backup()` dosyayı `0600` ile
oluşturuyor, ama bu yalnızca aynı makinedeki diğer kullanıcılara karşı koruma.

---

## 0.5 — Bu turda kendi kodumda bulunan iki hata

Faz 0.2'de yedek alırken ortaya çıktılar. İkisi de düzeltme turu 1'de (09)
yazılmış kodda; denetim izi eksik kalmasın diye bulgu olarak kaydediliyor.

### 🆕 FIX-001 🟡 — `Database::backup()` PATH'e bağımlıydı, araç yoksa yedek alınamıyordu

**TÜR:** bug + prod blocker
**Dosya:** `api/functions/db.php` (`runMysqlCli`)
**Kaynak:** düzeltme turu 1, SEC-001/SEC-007 kapsamında yazılan `backup()`/`restore()`

`runMysqlCli()` `proc_open`'a çıplak `'mysqldump'` argümanı veriyordu, yani
ikilinin `PATH` üzerinde olmasına güveniyordu. Windows'ta MySQL kurulumu
ikilileri `PATH`'e eklemiyor; çoğu paylaşımlı hostingte de eklenmiyor. Sonuç:

```
Uncaught Exception: mysql/mysqldump çalıştırılamadı. Araçlar PATH üzerinde mi?
```

Yani **admin panelindeki yedekleme düğmesi hiçbir zaman çalışmayacaktı** ve
SEC-007'de POST'a çevrilen `restore` da aynı şekilde. Fonksiyonun fail-closed
davranması doğruydu (sahte yedek üretmedi), ama özellik kullanılamaz hâldeydi.

**Düzeltme:** `Database::mysqlBinary()` eklendi. Sıra: `MYSQL_BIN_DIR` ortam
değişkeni → `PATH` (`where`/`command -v`) → bilinen kurulum dizinleri
(MySQL 8.0/8.4, MariaDB 10.11/11.4, XAMPP, Laragon; Unix'te `/usr/bin`,
`/usr/local/bin`, `/opt/homebrew/bin`). Bulunamazsa hata mesajı ne
yapılacağını söylüyor. `api/.env`'e `MYSQL_BIN_DIR` yazıldı, `.env.example`'a
belgelendi.

**Canlı doğrulama:** ✅ `backup()` çalıştı — 51 tablo, 99 KB, migration öncesi
yedek başarıyla alındı.

### 🆕 FIX-002 🟠 — Başarısız yedek 0 baytlık dosya bırakıyordu; `restore()` onu "en yeni yedek" sanabilirdi

**TÜR:** bug + veri kaybı riski
**Dosya:** `api/functions/db.php` (`backup`)
**Kaynak:** düzeltme turu 1

`proc_open`'ın `['file', $backupFile, 'w']` betimleyicisi dosyayı **komut
çalışmadan önce** oluşturuyor. FIX-001'deki hata alındığında geriye 0 baytlık
bir `backup-2026-08-26-06-58-52.sql` kaldı — canlı olarak gözlendi.

Tehlike `restore()`'da: yedek adı verilmediğinde `glob()` + `sort()` ile **en
yeni** `.sql` dosyası seçiliyor. Dosya adı zaman damgalı olduğundan, boş dosya
her zaman "en yeni" olur. Yani başarısız bir yedeklemeden sonra çalıştırılan
bir geri yükleme, canlı veritabanına **boş bir dosya** yazacaktı.

Zincirin geri kalanı bunu yakalamıyordu: `mysql < bos.sql` hatasız çalışır ve
0 döndürür, dolayısıyla `runMysqlCli` da istisna atmazdı. Kullanıcı "Veritabanı
başarıyla geri yüklendi." mesajını görürdü.

**Düzeltme:** `backup()` artık (a) hata durumunda kısmi dosyayı siliyor,
(b) komut 0 dönse bile boş çıktıyı reddedip istisna atıyor. Kalan 0 baytlık
dosya elle temizlendi.

**Canlı doğrulama:** ✅ Boş dosya silindi; sonraki `backup()` çağrısı 99 KB'lık
geçerli bir yedek üretti ve içeriği (51 tablo, etkilenen 5 tablonun verisi)
doğrulandı.

> **Not:** SEC-007'nin `restore` yolu (POST + CSRF + `confirm=RESTORE`) bu turda
> **canlı test edilmedi** — gerçek bir geri yükleme çalıştırmak canlı
> veritabanının üzerine yazmak demek olurdu. Yalnızca reddetme yolu doğrulandı
> (`GET ?mode=restore` → 403). Boş yedek koruması kod okumasıyla doğrulandı,
> uçtan uca değil.

---

## 0.6 — DB-015 onayı öncesi iki ön koşul (A ve B)

### A — `user_subscriptions.chatbot_id → RESTRICT` bot silmeyi kırıyor

#### A.1 — Kod çocuk satırları elle siliyor mu? **HAYIR.**

```php
// ChatbotController::deleteChatbot():217
$repo->deleteById($id);

// ChatbotRepository::deleteById():31-33
public function deleteById(int $id): bool {
    return self::delete(self::T, 'id = ?', [$id]) > 0;
}
```

Çıplak `DELETE FROM chatbotlar WHERE id = ?`. Ne abonelik, ne kredi, ne sohbet,
ne yorum — hiçbir çocuk satır kodda silinmiyor.

**Bu aynı zamanda yetimlerin nasıl biriktiğinin cevabı:** FK'lar yokken bu
silme, geride sahipsiz `chatbot_chats` / `user_subscriptions` satırları
bırakıyordu. `002` ve `002b`'nin temizlediği 62 satırın kaynağı tam olarak bu.

**Sonuç:** RESTRICT gerçekten devreye girecek — kod önden silmediği için FK
son sözü söyleyecek. Ama kullanıcının uyarısı yerinde: FK **tek başına yetmez**,
çünkü satıcı anlamsız bir `1451` hatası görecek.

#### A.2 — Soft delete altyapısı **zaten var ve doğru çalışıyor**

`unpublishChatbot` (`api/api/chatbot/unpublishchatbot.php` → `is_independent = 1`)
mevcut. Düzeltme turu 1'de `userHasAccess()` `preview`/`full` olarak ayrıldığında
istenen davranış kazara doğru kuruldu — `full` dalı `is_independent`'a hiç
bakmıyor, yalnızca sahiplik veya süresi geçmemiş aboneliğe bakıyor.

**Canlı doğrulama** (transaction + rollback, kalıcı değişiklik yok):

| Durum | Sonuç |
| --- | --- |
| Bot yayındayken, abonenin `full` erişimi | `true` |
| **Bot yayından kaldırıldıktan sonra, abonenin `full` erişimi** | **`true`** ✓ |
| Yayından sonra pazaryerinde listeleniyor mu | **HAYIR** (düştü) ✓ |
| Aboneliği olmayan üçüncü kişi | `false` ✓ |

Yani istenen davranış — *pazaryerinden düşsün, mevcut aboneler süresi dolana
kadar erişebilsin* — kod yazmadan hâlihazırda sağlanıyor. Eksik olan tek şey,
silme düğmesinin bunu yapmaması.

#### A.3 — Etkinin ölçüsü

RESTRICT **her** referans satırında tetiklenir, süresi dolmuş abonelikler dahil.
Yani "bir kez satmış bot bir daha hard delete edilemez":

```
toplam 14 bottan 7 tanesi hard delete edilemeyecek
  #5 LUMANORIS AI (2 abonelik) · #20 Hikaye Ustası (4) · #22 Kod Rehberi (1)
  #24 İngilizce Hoca (1) · #25 Çeviri Uzmanı (1) · #27 Fitness Koçu (6)
  #33 Audit Bot Indep (1)
Aktif abonelik: hepsinde 0 (hepsi süresi dolmuş)
```

Bu kasıtlı: abonelik satırı bir **satın alma kaydı**. Süresi dolmuş olması onu
muhasebe kaydı olmaktan çıkarmıyor.

---

### 🆕 BIZ-006 🟠 — `deleteChatbot` hard delete yapıyor; ödenmiş abonelikleri yok ediyor

**TÜR:** iş mantığı + veri kaybı
**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:199-219`,
`api/src/Infrastructure/Repositories/ChatbotRepository.php:31-33`
**Durum:** ⏸️ rapor edildi, **değiştirilmedi** — DB-015 ile birlikte kararı bekleniyor

Üç dönemde üç farklı yanlış davranış:

| Dönem | Davranış |
| --- | --- |
| FK'lardan önce | Bot siliniyor, `user_subscriptions` satırları **yetim** kalıyor. Müşteri parasını ödemiş, aboneliği hâlâ tabloda, ama işaret ettiği bot yok. |
| **Bugün (003 sonrası, CASCADE)** | Bot siliniyor, **ödenmiş abonelikler zincirleme siliniyor.** İade talebinde dayanak kalmıyor. |
| DB-015 sonrası (RESTRICT), kod değişmezse | Silme `1451` ile reddediliyor; satıcı `Sunucu hatası oluştu.` görüyor, ne olduğunu anlamıyor. |

**Önerilen davranış — DB-015 ile aynı sürümde gitmeli:**

1. `deleteChatbot`, silmeden önce `user_subscriptions` ve
   `chatbot_purchase_credits`'te satır var mı diye baksın.
2. Varsa hard delete'i **reddetsin** (`409`) ve satıcıya ne yapacağını söylesin:
   *"Bu chatbot satın alınmış. Silinemez, ancak yayından kaldırabilirsiniz —
   pazaryerinden düşer, mevcut aboneler süreleri dolana kadar erişmeye devam
   eder."*
3. Hiç satılmamışsa hard delete serbest kalsın (bugünkü davranış).
4. Frontend değişikliği **gerekmiyor**: `chatbots/page.jsx:74-77` zaten
   `result.success` kontrol edip `result.message` gösteriyor. İsteğe bağlı
   iyileştirme, aynı karta "Yayından Kaldır" eylemini eklemek —
   `ChatbotCard.jsx:129` bunu zaten çağırıyor.

Bu, FK'yı bir hata kaynağı olmaktan çıkarıp **son savunma hattına** çeviriyor:
normal yolda kullanıcı anlamlı bir mesaj alıyor, FK yalnızca kodun kaçırdığı
bir yol kalırsa devreye giriyor.

**Neden `SET NULL` değil:** `user_subscriptions.chatbot_id`'yi NULL yapmak
"bu kişi neye abone oldu" sorusunu cevapsız bırakır — abonelik kaydının tek
anlamı zaten hangi bota ait olduğu.

---

### B — DB-016: FK eklemeden önce yetim sayımı

003'ün dersi uygulandı: **her aday kısıt için önce yetim sayıldı.**

| Tablo | Sütun | Hedef | Satır | **Yetim** | Nullable | Tip |
| --- | --- | --- | --- | --- | --- | --- |
| `param_marketplace_details` | `payment_id` | `param_marketplace_payments.id` | 15 | **0** ✓ | NO | uyumlu |
| `param_marketplace_details` | `seller_user_id` | `kullanicilar.id` | 15 | **0** ✓ | NO | uyumlu |
| `param_marketplace_refunds` | `payment_id` | `param_marketplace_payments.id` | 0 | **0** ✓ | NO | uyumlu |
| `param_marketplace_refunds` | `detail_id` | `param_marketplace_details.id` | 0 | **0** ✓ | NO | uyumlu |
| `param_marketplace_refunds` | `requested_by_user_id` | `kullanicilar.id` | 0 | **0** ✓ | YES | uyumlu |
| `param_marketplace_alerts` | `seller_user_id` | `kullanicilar.id` | 0 | **0** ✓ | YES | uyumlu |
| `chatbot_in_list` | `list_id` | `user_lists.id` | 4 | **0** ✓ | NO | uyumlu |
| `plan_icerikler` | `plan_id` | `plans.id` | 0 | **0** ✓ | NO | uyumlu |
| `chatbotlar` | `kategori_id` | `chatbot_kategoriler.id` | 14 | **0** ✓ | YES | ⚠️ `int unsigned` vs `int` |
| `chatbot_uninterested` | `category_id` | `chatbot_kategoriler.id` | 0 | **0** ✓ | NO | ⚠️ `bigint unsigned` vs `int` |
| `dialog_uninterested` | `category_id` | `chatbot_kategoriler.id` | 0 | **0** ✓ | NO | ⚠️ `bigint unsigned` vs `int` |

**Yetim sayısı 11 adayın hepsinde sıfır — temizlik migration'ı gerekmiyor.**
`002`/`002b` gibi bir veri silme adımı yok; 006 saf DDL olacak.

**Ama 3 sütunda tip uyumsuzluğu var** ve MySQL tipleri birebir eşleşmeyen FK'yı
reddeder (errno 150). Bu, `001`'in bıraktığı bir boşluk: `001` `user_id` ve
`chatbot_id`'yi hizaladı, **`category_id`/`kategori_id`'ye hiç dokunmadı**.

Daraltma güvenliği ölçüldü:

```
chatbotlar.kategori_id             14 satır  MAX=32  (4 NULL)  → güvenli
chatbot_uninterested.category_id    0 satır  MAX=0             → güvenli
dialog_uninterested.category_id     0 satır  MAX=0             → güvenli
chatbot_kategoriler.id: int        (15 kategori)
```

006 bu üç sütunu önce `MODIFY COLUMN` ile hizalayacak (`001`'in deseni),
sonra FK'yı ekleyecek. Veri silmez, taşma riski yok.

**`dialog_*.dialog_id` (6 tablo) kapsam dışı** — hedef tablosu belirsiz
(`user_dialog_books` mi başka bir şey mi), altısı da 0 satır, ve tahminle FK
eklemek yanlış ilişkiyi kalıcılaştırır. Ayrı bir inceleme kalemi.

#### DB-016 için önerilen `ON DELETE` kuralları

DB-015'in sınıflandırmasıyla tutarlı:

| Kısıt | Öneri | Gerekçe |
| --- | --- | --- |
| `param_marketplace_details.payment_id` | **RESTRICT** | Ledger satırı başlığından koparılamaz |
| `param_marketplace_details.seller_user_id` | **RESTRICT** | Satıcının gelir kaydı (sınıf A) |
| `param_marketplace_refunds.payment_id` | **RESTRICT** | İade kaydı (sınıf A) |
| `param_marketplace_refunds.detail_id` | **RESTRICT** | Aynı |
| `param_marketplace_refunds.requested_by_user_id` | **SET NULL** | Nullable; iade kaydı kalsın, talep eden düşsün |
| `param_marketplace_alerts.seller_user_id` | **SET NULL** | Nullable; operasyon kaydı (sınıf F) |
| `chatbot_in_list.list_id` | **CASCADE** | Liste silinince içindekiler gider (sınıf E) |
| `plan_icerikler.plan_id` | **CASCADE** | Plan içeriği plandan türer |
| `chatbotlar.kategori_id` | **SET NULL** | Nullable; kategori silinince bot silinmemeli |
| `chatbot_uninterested.category_id` | **CASCADE** | Tercih kaydı (sınıf E) |
| `dialog_uninterested.category_id` | **CASCADE** | Aynı |

**006 toplamı:** 11 kısıt kural değişikliği (DB-015) + 11 yeni kısıt (DB-016)
+ 3 `MODIFY COLUMN`. Veri silmez.

---

## 0.7 — `006` uygulandı + BIZ-006 kodu + restore testi

### 006_fix_fk_delete_rules.sql ✅

Uygulama öncesi **yeni yedek** alındı (`backup-2026-08-26-07-35-45.sql`, 106 KB) —
002b sonrası durum bir öncekinden farklıydı.

Dosya elle değil **üreteçle** yazıldı: kural listesi tek bir PHP dizisinde
duruyor, 25 blok aynı desende üretiliyor. Gözden geçirmesi kolay, kopyala-yapıştır
hatası yok. Runner dosyayı doğru şekilde "veri silmez" olarak sınıflandırdı
(`--allow-destructive` istemedi).

**Örtük COMMIT'e karşı önlem:** DDL'de rollback olmadığı için uygulama
öncesi ve sonrası FK durumu JSON'a alınıp fark çıkarıldı. Hata hâlinde hangi
kısıtın hangi durumda kaldığı bu iki anlık görüntüden okunabilirdi.

| Ölçüm | Önce | Sonra |
| --- | --- | --- |
| Toplam FK | 53 | **64** (+11) |
| CASCADE | 52 | 45 |
| RESTRICT | 1 | **14** |
| SET NULL | 0 | **5** |
| Kaybolan kısıt | — | **0** |

**Kural değişen 11 kısıt** (hepsi doğrulandı):
`para_cekme_talepleri.user_id`, `param_marketplace_payments.user_id`,
`user_subscriptions.user_id`, `user_subscriptions.chatbot_id`,
`chatbot_purchase_credits.user_id`, `chatbot_purchase_credits.chatbot_id`,
`param_marketplace_sellers.user_id`, `producer_plans.user_id`,
`chatbotlar.owner_user_id` → **RESTRICT**;
`param_marketplace_details.chatbot_id`, `param_marketplace_alerts.user_id`
→ **SET NULL**.

**Eklenen 11 kısıt** (DB-016): ledger'ın iç bağları
(`details.payment_id`, `details.seller_user_id`, `refunds.payment_id`,
`refunds.detail_id` → RESTRICT), nullable operasyon bağları
(`refunds.requested_by_user_id`, `alerts.seller_user_id`,
`chatbotlar.kategori_id` → SET NULL) ve türetilmiş veriler
(`chatbot_in_list.list_id`, `plan_icerikler.plan_id`,
iki `*_uninterested.category_id` → CASCADE).

**Tip hizalaması:** üç `category_id`/`kategori_id` sütunu `int`'e çekildi —
`001`'in bıraktığı boşluk. Hepsi artık `chatbot_kategoriler.id` ile uyumlu.

**Veri kaybı yok:** 7 kritik tablonun satır sayıları uygulama öncesiyle birebir
aynı (`kullanicilar` 49, `chatbotlar` 14, `user_subscriptions` 16,
`param_marketplace_payments` 16, `param_marketplace_details` 15,
`chatbot_follows` 61, `chatbot_chats` 119).

### BIZ-006 kodu ✅

`ChatbotController::deleteChatbot` artık silmeden önce `user_subscriptions` ve
`chatbot_purchase_credits`'e bakıyor. Satır varsa `409` + ne yapılacağını
anlatan mesaj; yoksa hard delete serbest.

### Regresyon — 11 akış, canlı

| # | Akış | Sonuç |
| --- | --- | --- |
| 1–2 | Kayıt, giriş | 200 ✓ |
| 3 | Bot oluşturma | 200 ✓ |
| 4–6 | Sohbet, mesaj, yorum | 200 ✓ |
| 7 | `generateReply` + coin | `{"remaining":9}` ✓ |
| 8 | Cüzdan bakiyesi | 200 ✓ |
| 9 | Sepete ekleme | 422 `SELLER_NOT_ACTIVE` (beklenen, DEP-001) |
| 10a | **Satılmamış bot silme** | 200 ✓ — sohbet/yorum/konuşma 1→0 (CASCADE) |
| 10b | **Satılmış bot silme** | **409** ✓ — `has_sales`, `subscriptions:1`, `can_unpublish:true`. Bot ve abonelik yerinde kaldı |
| 10c | **Yayından kaldır → abone erişimi** | 200; pazaryerinden düştü, **abonenin erişimi `true`** ✓ |
| 10d | Yayından kalkmış satılmış botu silme | 409 ✓ — mesaj "zaten yayından kaldırılmış" varyantına geçti |
| 11 | **Kullanıcı silme** | aşağıda |

**Kullanıcı silme (transaction + rollback, kalıcı değişiklik yok):**

| Kullanıcı | Sonuç |
| --- | --- |
| Ödeme yapmış (11) | **ENGELLENDİ** — `fk_param_marketplace_payments_user_id` |
| Aboneliği olan / botu olan (6) | **ENGELLENDİ** — `fk_chatbotlar_author_user_id` |
| Para çekmiş (21) | **ENGELLENDİ** — `fk_chatbotlar_author_user_id` |
| Hiçbir para/içerik bağı olmayan (79) | **SİLİNDİ** — takip 1→0, e-posta 1→0 (CASCADE) ✓ |

DB-015'in amacı tam olarak bu: para bağı olan silinemiyor, olmayan temiz
siliniyor.

### FIX-002 — scratch restore testi ✅

Kullanıcının önerdiği yöntemle, **canlı veritabanına dokunmadan**:

1. `lumanoris_restore_test` yaratıldı.
2. `backup-2026-08-26-07-35-45.sql` oraya geri yüklendi.
3. Canlıyla karşılaştırıldı.
4. Scratch düşürüldü (doğrulandı: 0 kaldı, canlı 49 kullanıcıyla yerinde).

| Karşılaştırma | Sonuç |
| --- | --- |
| Tablo sayısı | 51 = 51 ✓ |
| Satır sayısı | 582 vs 578 — fark 4 |
| Örnek satırlar (`kullanicilar`) | birebir ✓ |
| FK | 64 vs 53 |
| `ON DELETE` kuralları | farklı |

**Farkların hepsi beklenen ve açıklanabilir** — yedek `006`'dan **önce**
alındı:

- `schema_migrations` 6 vs 5 → yedekte `006` yok.
- FK 64 vs 53, kurallar farklı → `006`'nın +11 kısıtı ve 11 kural değişikliği
  yedekte yok.
- `rate_limits` 74 vs 71 → yedek sonrası çalıştırılan regresyon testleri.

**Kesinleştirme:** scratch'in FK durumu, `006` uygulanmadan **hemen önce**
alınan anlık görüntüyle karşılaştırıldı:

```
yedek anındaki FK sayısı (006 öncesi): 53
scratch FK sayısı                    : 53
kısıt adları + ON DELETE kuralları   : ✓ BİREBİR AYNI
schema_migrations: 001, 002, 002b, 003, 004  (006 yok — doğru)
```

Yani yedek, **alındığı andaki durumu birebir üretiyor.** FIX-002'nin
"yedekler gerçekten geri yüklenebilir mi?" sorusu **evet** olarak kapandı.

**Boş/bozuk yedek reddi de doğrulandı:**

- *(a) Tehdidin gerçekliği:* dizine 0 baytlık `backup-2099-…sql` konuldu;
  `restore()`'un `glob()+sort()` mantığının onu **en yeni** olarak seçtiği
  gösterildi. Düzeltme öncesi bu dosya canlı veritabanına yazılacaktı.
- *(b) Korumanın çalışması:* `Database`'in `database` özelliği reflection ile
  var olmayan bir ada çevrildi (PDO bağlantısı geçerli, yalnızca `mysqldump`
  argümanı bozuk). Sonuç: istisna atıldı **ve dizinde kalıntı dosya kalmadı**
  (önce 3, sonra 3).

> Not: `restore()`'un **başarı** yolu hâlâ canlıda test edilmedi — bu turda
> yapılan, aynı yedeği `mysql` ile scratch DB'ye yüklemekti; bu `restore()`'un
> çalıştırdığı komutun aynısı, ama fonksiyonun kendisi değil.

### Yedek temizliği ✅

`backup-2026-02-23-13-56-14.sql` (1,6 MB) **silindi** — scratch restore testi
bugünkü yedeğin geri yüklenebilir olduğunu gösterdikten sonra. Şubat yedeği
`001`–`006` öncesi şemaya aitti; bugünkü veritabanına geri yüklenmesi işe
yaramazdı, saklanması yalnızca sızıntı yüzeyiydi (1,6 MB'lık düz metin kullanıcı
verisi).

Kalan iki yedek (99 KB + 106 KB), ikisi de `006` öncesi, ikisi de gitignore'lu.

---

## FAZ 1

### 1. DB-001 🟠 + DB-009 🔵 + DB-012 — `getPublished()` ✅

**Kartezyen çarpım canlı ölçüldü:**

```
yayında bot            : 9
JOIN sonrası ara satır : 2.062
bot başına çarpan      : 229x
```

Altı sınırsız alt tabloya `LEFT JOIN` + `COUNT(DISTINCT)`: bir botun sohbet,
takip, liste, beğeni, beğenmeme ve yorum satırları birbiriyle çarpılıyor,
MySQL o ara sonucu üretip `DISTINCT` ile eliyordu. Altı sayı da aynı anda
büyüdüğü için gerçek veriyle çarpım hızla patlar.

**Düzeltme:** skaler alt sorgu — aynı dosyadaki `getMenuItems()` bu deseni
zaten kullanıyordu. Her sayı kendi indeksli aramasını yapıyor.

| Doğrulama | Sonuç |
| --- | --- |
| Eski ve yeni sorgunun döndürdüğü **sayılar** | **birebir aynı** (9 bot, 6 sayaç) ✓ |
| `EXPLAIN` adım sayısı | 8 → **3** |
| Skaler alt sorguların dayandığı 8 indeks | hepsi mevcut ✓ (kısmen 006'nın FK'ları yarattı) |
| Uç nokta | `{"success":true,"total":9,"limit":100,"offset":0}` ✓ |

**DB-009 (sayfalama):** `limit`/`offset` eklendi, varsayılan 100, tavan 200.
Yanıt geriye dönük uyumlu — `bots` aynı yerde, `total`/`limit`/`offset`
yalnızca eklendi.

**DB-012 kararı — V1 ve V2 birleştirildi.** İkisi arasındaki fark tam iki
maddeydi (V2 "ilgilenmiyorum" filtresi ekliyor, `toplam_comments` sayımını
çıkarıyor). İkinci fark bir tasarım kararı değil kopyalama farkıydı; artık
ikisi de döndürüyor. `getPublishedV2()` tek satırlık bir delege oldu.
İmzası korundu (`getchatbots_v2.php` onu çağırıyor) ve **çıplak dizi**
sözleşmesi bilinçli olarak değiştirilmedi — zarf tekilleştirmesi ERR-003
kapsamında topluca yapılmalı.

> Frontend yalnızca V1'i çağırıyor (`explore/page.jsx`, `dashboard/page.jsx`);
> V2 hâlâ hiçbir istemci tarafından kullanılmıyor.

---

### 2. BIZ-002 🟠 + UX-002 🟡 + BIZ-003 🟡 — plan sistemi

#### Ön koşul: plan tablolarının gerçek şeması (yedi turda hiç okunmamıştı)

**Beş tablonun beşi de BOŞ (0 satır).** Ve daha önemlisi:

> **`plans` tablosunda hiçbir limit sütunu yok.**
> Şema yalnızca `name_tr`, `name_en`, `monthly_price`, `yearly_price`,
> `currency`, `description_tr`, `description_en` tutabiliyor.

`plan_icerikler.feature_tr` **serbest metin** (`varchar(255)`) — pazarlama
kopyası, makine tarafından okunabilir kota değil. Yani *"Elmas = 10 bot,
100 mesaj/gün"* cümlesinin şemada saklanacağı bir yer **hiç olmamış.**

Bu, "chatbot_limits.php stub'ı gerçek plan limitlerini okusun" isteğinin
neden bugüne kadar yapılamadığını da açıklıyor: okunacak bir şey yoktu.
`// TODO: query user plan table when plans are active on prod` yorumu, var
olmayan bir sütuna işaret ediyordu.

Katalog ise kodda: `WalletController::getPricing()` dört planı fiyatlarıyla
birlikte PHP dizisi olarak döndürüyor.

#### BIZ-003'ün sorusuna cevap: "üretici planı hiç var olamıyor" — şemada karşılığı var mı?

**Kısmen — ve sebebi şema değil.**

`producer_plans` tablosu **var** ve yapısal olarak bir satır tutabilir
(`user_id` UNIQUE + `started_at` + `expires_at`). Var olamamasının iki
sebebi:

1. **Yazacak yol yok.** `buyProducerAccount()` fail-closed bir stub, her
   zaman `success:false` döndürüyor. Hiçbir kod bu tabloya `INSERT` yapmıyor.
2. **Plan referansı yok.** Tabloda `plan_id` ya da tür alanı yok — "hangi
   üretici planı" sorusunun cevabı tasarım gereği saklanamıyor. Tablo
   yalnızca "şu tarihe kadar üretici planı var" diyebiliyor, "hangi seviyede"
   diyemiyor.

Yani BIZ-003'ün tespiti doğru ama sebebi tabloların yokluğu değil; satın alma
yolunun stub olması ve şemanın seviye kavramını taşımaması.

#### UX-002'nin somut kaynağı — canlı doğrulandı

İki ekran iki farklı kaynağa bakıyordu:

| Ekran | Kaynak | Sonuç |
| --- | --- | --- |
| Dashboard başlığı | `UserController` → `user_plan_selection.plan_name` (serbest metin) | "Elmas" |
| Bot ekranı | `getChatbotLimits` → `chatbot_limits.php` stub → `AppConfig::FREE_*` | 1 / 2 |

İkisi de kendi içinde doğruydu; aralarında hiçbir bağ yoktu.

#### Yapılanlar

**Yeni: `api/functions/plans.php`** — tek doğruluk kaynağı.
`getUserPlan()`, `getUserPlanName()`, `getDailyMessageLimit()`,
`getPlanCatalog()`, ve migration uygulanmamışsa AppConfig'e düşen
`fallbackPlan()`.

**Yeni: `007_plan_limits.sql`** — `plans`'a kota sütunları
(`independent_bot_limit`, `public_bot_limit`, `daily_message_limit`,
`sort_order`, `is_default`) + `name_tr`'ye UNIQUE + dört planın
tohumlanması + özelliklerin `plan_icerikler`'e taşınması.

Üç tüketici tek kaynağa bağlandı:

| Dosya | Önce | Sonra |
| --- | --- | --- |
| `chatbot_limits.php` | stub, herkese 1/2 | `getUserPlan()` |
| `coin_engine.php` | sabit `DAILY_FREE_MESSAGES` (10) | `getDailyMessageLimit()` |
| `UserController` | `user_plan_selection.plan_name` | `getUserPlan()['name_tr']` |
| `WalletController::getPricing()` | kodda gömülü dizi | `getPlanCatalog()` + geri düşüş |

`getPricing()` ayrıca gerçek kotaları (`limits`) ve kullanıcının mevcut
planını (`is_current`) döndürüyor — "Mevcut Paket" etiketi eskiden Ücretsiz
plana sabitlenmişti.

#### Doğrulama

**007 uygulanmadan (geri düşüş yolu) — canlı:**

```
dashboard başlığı : planName "Ücretsiz Plan", dailyCoins 10/10
bot limit ekranı  : independent_limit 1, public_limit 2
getUserPlan       : source = appconfig-fallback
```

Yani migration uygulanmadan davranış **birebir eskisiyle aynı** — kurulum
sırası ne olursa olsun kırılma yok.

**007 uygulanmış gibi (geçici tohumlama, sonra geri alındı):**

```
Ücretsiz  ₺0.00    bağımsız:1   public:2   günlük:10     varsayılan:1
Gümüş     ₺149.00  bağımsız:3   public:5   günlük:50
Altın     ₺299.00  bağımsız:10  public:15  günlük:200
Elmas     ₺599.00  bağımsız:50  public:50  günlük:1000
```

`getPricing()` katalogu tablodan okudu ve gerçek kotaları döndürdü ✓

Geçici tohumlama **tamamen geri alındı** (plans 0 satır, eklenen 5 sütun
düşürüldü, `user_plan_selection` boş, test kullanıcısı silindi) — 007 onay
beklediği için kalıcı bir değişiklik bırakılmadı.

#### Bu doğrulama iki hata ortaya çıkardı

**Hata 1 (düzeltildi):** `getDailyMessageLimit()` `chatbot_limits.php`'ye
konmuştu ama `coin_engine.php` de onu çağırıyor ve o dosyayı yüklemiyor.
Sonuç canlıda: `Call to undefined function getDailyMessageLimit()` —
dashboard başlığı 500 verdi. Fonksiyon `plans.php`'ye taşındı.

**Hata 2 → yeni bulgu DB-017.** Aşağıda.

---

### 🆕 DB-017 🟠 — DB-004 düzeltildi ama canlı veritabanı hiç dönüştürülmedi

**TÜR:** bug + prod blocker
**Dosya:** canlı şema (migration `005_fix_table_collations.sql` ile düzeltiliyor)
**Durum:** ⏸️ migration yazıldı, **uygulanmadı** — onay bekliyor

DB-004 🟡 *"9 tablo `utf8mb4_0900_ai_ci` kullanıyor, bu collation MySQL 8'e
özgü ve MariaDB'de yok"* diyordu. Düzeltme turu 1'de iki şey yapıldı:
`schema.sql`'deki 9 tanım çevrildi ve `ensureTable()` artık açık `COLLATE`
yazıyor. **İkisi de yalnızca gelecekteki kurulumlar için doğruydu; canlı
veritabanına hiç dokunulmadı.**

**Nasıl yakalandı:** plan sistemi `user_plan_selection.plan_name` ile
`plans.name_tr` arasında JOIN yapmak istedi:

```
SQLSTATE[HY000]: 1267 Illegal mix of collations
(utf8mb4_general_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='
```

Yani bu yalnızca "MariaDB'ye taşınamaz" sorunu değil — **MySQL 8'de de iki
tablo arasında JOIN yapmayı imkânsız kılıyor.** DB-004 🟡 olarak
sınıflandırılmıştı; gerçek etkisi daha yüksek.

**Ölçüm (2026-08-26): 10 tablo, 38 sütun.** Hepsi ödeme/oturum altyapısı:

```
param_marketplace_alerts    param_marketplace_details   param_marketplace_payments
param_marketplace_refunds   param_marketplace_sellers   param_marketplace_soap_log
password_resets             rate_limits                 schema_migrations
user_plan_selection
```

`schema_migrations` listede olması ironik: migrate.php'nin kendi tablosu da
düzeltme öncesi `ensureTable()`'ın eski hâliyle oluşmuş.

**Düzeltme:** `005_fix_table_collations.sql` — on `CONVERT TO CHARACTER SET`,
her biri koşullu. Veri silmez; karakter kümesi zaten `utf8mb4`, yalnızca
karşılaştırma kuralı değişiyor. Etkilenen sütunlar hash, GUID, durum kodu,
JSON blob ve dosya adı — sıralama farkının görünür sonucu yok.

> Dosya `005_` numarasını aldı çünkü **007'nin ön koşulu**: collation
> düzeltilmeden `plans` ↔ `user_plan_selection` JOIN'i çalışmıyor.

---


---

## Bekleyen iki migration uygulandı

Yeni yedek (`backup-2026-08-26-08-08-55.sql`) alındıktan sonra:

- **`005_fix_table_collations.sql`** ✅ — DB-017. Doğrulama: yanlış collation
  **0 tablo / 0 sütun**, `plans` ↔ `user_plan_selection` JOIN'i artık çalışıyor,
  veri sayıları değişmedi (49 kullanıcı, 16 ödeme, 16 abonelik).
- **`007_plan_limits.sql`** ✅ — ilk denemede kendi ürettiğim `ALTER` dizesinde
  kapanış tırnağı eksikti (`1064` sözdizimi hatası); tek satıra indirilip
  düzeltildi. Runner sırayı bozmadan durdu, düzeltmeden sonra temiz geçti.

```
Ücretsiz  ₺0.00     bot:1/2    mesaj:10     varsayılan:1  özellik:2
Gümüş     ₺149.00   bot:3/5    mesaj:50                   özellik:3
Altın     ₺299.00   bot:10/15  mesaj:200                  özellik:4
Elmas     ₺599.00   bot:50/50  mesaj:1000                 özellik:4
```

### UX-002 canlı doğrulandı

| | Ücretsiz kullanıcı | Elmas planındaki kullanıcı |
| --- | --- | --- |
| Dashboard başlığı | `plan=Ücretsiz coin=10/10` | `plan=Elmas coin=1000/1000` |
| Bot ekranı | `bağımsız 0/1 public 0/2` | `bağımsız 0/50 public 0/50` |
| Fiyat sayfası | — | `Elmas <- MEVCUT (Mevcut Paket)` |

Üç ekran da aynı kaynaktan okuyor. **Limitler gerçekten zorlanıyor:**
Ücretsiz kullanıcı 2. bağımsız botta reddedildi; plan Gümüş'e çıkarıldığında
2. ve 3. bot geçti, 4. reddedildi.

Doğrulama iki hata daha ortaya çıkardı, ikisi de düzeltildi:

- `dailyCoinsTotal` hâlâ `AppConfig::DAILY_FREE_MESSAGES`'ten geliyordu →
  Elmas planındaki kullanıcı **"1000/10"** gibi anlamsız bir oran görüyordu.
- Limit hata mesajı her planda *"Ücretsiz ... hakkınızı kullandınız"* diyordu →
  artık `"Gümüş planınızdaki 3 bağımsız chatbot hakkınızı kullandınız."`

---

## FAZ 2

### DB-005 🟡 ✅ — eksik UNIQUE kısıtlar

`chatbot_likes`/`dislikes`/`follows` "aynı kullanıcı aynı şeyi iki kez yapamaz"
kuralını UNIQUE ile zorluyordu; aynı sınıftaki üç tabloda yoktu.

`008_missing_unique_keys.sql` uygulandı. Uygulama öncesi ölçüm: **üç tabloda da
yinelenen kayıt yok**, temizlik gerekmedi. Canlı doğrulama: yinelenen
`chatbot_in_list` ekleme denemesi `1062 Duplicate entry` ile **reddedildi**.

> DB-005'in indeks yarısı `006`'nın yan etkisiyle zaten kapanmıştı — MySQL
> FK sütunlarına indeks yoksa kendisi oluşturuyor. Skaler alt sorguların
> dayandığı 8 indeksin hepsi mevcut.

### PAY-008 🟡 ✅ — checkout idempotency

Üç katman: `GET_LOCK` (eşzamanlılık), idempotency anahtarı (istemci gönderirse
o, yoksa sepet parmak izinden türetiliyor), `checkRateLimit` (5/dk).

**Canlı doğrulama — aynı sepet iki kez gönderildi:**

```
1. gönderim: {"success":true,"ids":["33"],"order_id":"ORD-44A05420"}
2. gönderim: {"success":true,"message":"Bu sipariş zaten oluşturulmuş.",
              "order_id":"ORD-44A05420","ids":[],"repeated":true}

abonelik satırı: 1   ödeme satırı: 1   (ikisi de 1 — çift kayıt YOK)
```

**Rezervasyon asılı kalmıyor:** `JsonResponse::error()` `exit` çağırdığı için
catch bloğu çalışmıyordu; `register_shutdown_function` ile tamamlanmamış
rezervasyon her çıkış yolunda siliniyor. Doğrulama: geçersiz sepet iki kez
gönderildi, ikisinde de aynı doğrulama hatası döndü (rezervasyon asılı kalsaydı
ikincisi "zaten oluşturulmuş" derdi), `order_id IS NULL` kayıt sayısı **0**.

### PAY-009 🟡 ✅ — aylık fiyat sunucuda türetiliyor

Aylık fiyat yalnızca istemcide (`pricing.js:36`) haftalıktan türetiliyordu;
sunucu iki fiyatı bağımsız kabul ediyordu. Yani satıcı haftalık ₺100 / aylık ₺1
gönderebilirdi — `linePrice()` `duration_weeks >= 4` için aylık fiyatı
kullandığından doğrudan gelir kaybı.

`deriveMonthlyPrice()` eklendi; `publishChatbot` ve `updateChatbotPrice`
istemcinin gönderdiği aylık değeri **yok sayıyor**.

### ERR-003 🟡 / API-005 🟡 ✅ (ContentController kısmı)

`ContentController`'ın **8 metodu** zarfsız yanıt veriyordu. Hepsi
`JsonResponse::success()`'a çevrildi ve **8 tüketici** güncellendi:

| Uç nokta | Tüketici |
| --- | --- |
| `getcategories` | `chatbots`, `explore`, `following`, `notes`, `dashboard` (5 dosya) |
| `gettermsofsale` | `MesafeliSatisPopup` |
| `getdelivery` | `TeslimatIadePopup` |
| `getadcounts` | `chat/page.jsx` |

Canlı doğrulama: sekiz uç noktanın sekizi de `{"success":true,...}`.

> `getchatbots_v2.php` bilinçli olarak çıplak dizi kalmaya devam ediyor —
> hiçbir istemcisi yok ve kalan 20 `echo json_encode` noktasıyla birlikte
> topluca ele alınmalı.

### AI-002 🟡 ✅ — SSE tamponlaması

Her chunk kendi başına `split("\n")` ile ayrıştırılıyordu. Ağ paketleri SSE
kare sınırlarına saygı duymaz: bir `data: {...}` satırı iki okuma arasında
bölündüğünde iki yarım parça da geçersiz JSON olur, `catch {}` ikisini de
sessizce yutar ve **o metin parçası cevaptan düşer** — kullanıcı ortasından
eksik bir cevap görür, hiçbir yerde iz kalmaz.

Tampon eklendi (tamamlanmamış son satır bir sonraki okumaya devrediliyor).
**İki yerde**: `chat/page.jsx` ve bot oluşturma önizlemesi.

### REACT-001 🟡 ✅ (ProfileCard)

`useAbortableEffect` hook'u yazıldı (`shared/hooks/`). `ProfileCard`'ın
**5 fetch effect'i** dönüştürüldü: 7 effect / 0 cleanup → 5 iptal edilebilir
effect. `AbortError` ayrı ele alınıyor ki log kirlenmesin.

Kalan `useEffect` yalnızca `localStorage` okuyor — bilinçli olarak dokunulmadı.

---

## FAZ 3 — hiç bakılmamış yerler

### 🆕 SEC-021 🟠 — `updategv.php` SVG kabul ediyor ve magic-byte doğrulaması yok

**TÜR:** güvenlik
**Dosya:** `api/admin/ajax/updategv.php`

İki sorun:

1. **İzin verilen uzantılar arasında `svg` vardı.** SVG bir belgedir, resim
   değil: içine `<script>` ya da `onload=` gömülebilir. Dosya
   `assets/img/global/` altına yazılıp site kaynağından servis edildiği için
   doğrudan açıldığında JavaScript **aynı origin'de** çalışır.
   `api/assets/.htaccess` PHP yorumlayıcısını kapatıyor ama SVG'nin
   JavaScript'i tarayıcıda çalışır, sunucuda değil.
2. **Yalnızca uzantı kontrolü.** Aynı dizindeki `admin/ajax/upload.php`
   magic-byte doğrulaması yapıyor (`finfo_file`) — bu yol hiç yapmıyordu.
   Denetimin dört turda tekrarladığı örüntünün bir örneği daha: *"aynı
   projede doğrusu var, bu yola uygulanmamış."*

**Düzeltme:** SVG kaldırıldı, MIME magic-byte ile doğrulanıyor (upload.php ile
aynı yaklaşım), dosya adı sunucuda üretiliyor, 5 MB sınırı, `is_uploaded_file`
kontrolü, `mkdir(0777)` → `0755`.

### 🆕 SEC-022 🔵 — `global_vars` için sunucu tarafı HTML sanitizasyonu yok

**TÜR:** güvenlik (kabul edilen risk)
**Dosya:** `api/admin/ajax/updategv.php`

Tur 2'den devredilen açık sorunun cevabı: **hayır, hiçbir sanitizasyon yok.**
`$_POST`'taki her anahtar doğrudan `global_vars`'a yazılıyor, ve o değerler
altı bileşende `dangerouslySetInnerHTML` ile render ediliyor (SEC-017).

Bilinçli olarak **düzeltilmedi**: bu alanların içeriği kasıtlı olarak HTML
(gizlilik politikası, kullanım koşulları — başlık, liste, bağlantı içeriyor),
sanitize etmek özelliği bozar. Yazma yetkisi yalnızca admin oturumunda ve
`_guard.php` CSRF zorunlu kılıyor. Azaltıcı katman düzeltme turu 1'de eklendi:
`next.config.mjs`'in CSP'si `script-src`'yi kısıtlıyor.

Gerçek çözüm bir HTML sanitizasyon kütüphanesi (ör. HTMLPurifier) — yeni
bağımlılık gerektirir, ayrı karar.

### 🆕 BIZ-007 🟡 ✅ — `saveChatbot` yetim dosya bırakıyordu

**TÜR:** bug (Tur 3'ten devredilen açık soru)
**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php`

`handleImageUploads()` `move_uploaded_file()` çağırıyor; hemen ardından gelen
`pickAllowed()` reddi `JsonResponse::error()` ile **exit** ediyor, ya da
`create()` istisna atabiliyor. Her iki durumda da `assets/kapak_fotografi/`
altında hiçbir satırın göstermediği bir dosya kalıyordu. Transaction yok,
temizlik yok — dosyalar sessizce birikip hiç silinmiyordu.

**Düzeltme:** shutdown kancası, kayıt oluşmadıysa bu istekte yazılan dosyaları
siliyor.

**Canlı doğrulama:**

| Senaryo | Dosya sayısı |
| --- | --- |
| Yasak alanla reddedilen kayıt (403) | 0 → **0** (yetim bırakmadı) |
| Başarılı kayıt (200) | 0 → **1** (korundu) |

### `BuyModal.jsx` — sözleşme tarafı temiz

Tur 3'te okunamamıştı. İncelendi: **fiyatı sunucuya göndermiyor** (yalnızca
`chatbot_id` + `order_weeks`), `result.success` kontrol ediyor,
`result.message` gösteriyor, try/catch var. `user_id` gönderiyor ama sunucu
oturumdan alıyor, zararsız.

Tek sorun düzeltildi: aylık indirim yüzdesi `ucret_haftalik` 0 iken sıfıra
bölünüyor ve ekranda **"%-Infinity kâr"** yazıyordu.

### `admin/ajax/smtp.php` — temiz

SMTP kimlik bilgilerinin nerede saklandığı sorusunun cevabı: `global_vars`
tablosu (`smtp_host`, `smtp_email`, `smtp_pass`, `smtp_name`), admin
panelinden yönetiliyor. `_guard.php` arkasında, CSRF korumalı. Düzeltme turu
1'de yazılan `mailerConfig()` bunları okuyor ve ortam değişkenleri
(`SMTP_*`) öncelikli.

> Not: `smtp_pass` veritabanında **düz metin**. Uygulamanın SMTP'ye bağlanmak
> için parolanın kendisine ihtiyacı olduğundan geri döndürülebilir olmak
> zorunda; gerçek çözüm ortam değişkeni (zaten destekleniyor) ya da bir sır
> yöneticisi. Bulgu olarak ayrıca yazılmadı — SEC-001'in kapsamındaki DB
> dökümü riski zaten kaydedilmiş durumda.

### PHP 8.1+ uyumluluk taraması — **temiz**

Denetimin "hiç yapılmadı" dediği kalem. İki yöntemle bakıldı:

1. **Statik tarama** — kaldırılmış/deprecated API listesi
   (`create_function`, `each()`, `money_format`, `ereg`, `split()`,
   `utf8_encode/decode`, `strftime`, `FILTER_SANITIZE_STRING`,
   `libxml_disable_entity_loader`, `${}` dize interpolasyonu, `mysql_*`).
   Üç eşleşme çıktı, **üçü de yanlış pozitif**: `foreach(`, `chunk_split()`,
   ve JavaScript template literal'ları.

2. **Çalışma zamanı** — bu turda çalıştırılan onlarca isteğin ürettiği
   `storage/logs/php-error.log` tarandı: **0 deprecation, 0 warning**.
   (PHP 8.5.1 üzerinde çalışıyor, yani 8.1'den sonraki tüm deprecation'lar
   da kapsanıyor.)

Log ayrıca ERR-001/ERR-002 altyapısının gerçekten çalıştığını gösterdi —
admin giriş rate limit'i, Gemini hatası, collation hatası ve `upgradePlan`
reddi hepsi yakalanmış.

> Yan tespit: Gemini çağrıları bu ortamda `SSL certificate: unable to get
> local issuer certificate` ile düşüyor. Kod hatası değil, yerel CA bundle
> eksikliği (`php.ini`'de `curl.cainfo`). generateReply testlerinde iade
> yolunun tetiklenmesinin sebebi buydu.

---

## KAPANMAYANLAR

| Bulgu | Durum | Neden |
| --- | --- | --- |
| **DEP-001 🔴** Param POS entegrasyonu | Kapanamaz | `addSubMerchant()` fail-closed stub. `status='active'` yazmak KYC'siz satıcıya para akışı açmak olurdu. Gerçek gateway gerekiyor. |
| **BIZ-001 🔴** `upgradePlan` | Bilinçli fail-closed | 503. Katalog ve limitler artık doğru, ama **plan seçilemez** — ödeme entegrasyonuna bağlı. Plan ataması bugün yalnızca DB'den elle yapılabiliyor. |
| **SEC-022 🔵** `global_vars` HTML sanitizasyonu | Kabul edilen risk | İçerik kasıtlı olarak HTML; sanitize etmek özelliği bozar. Admin-only + CSRF + CSP azaltıyor. Gerçek çözüm HTMLPurifier — yeni bağımlılık, ayrı karar. |
| **ERR-003 / API-005** kalan 20 nokta | Kısmen açık | `ContentController`'ın 8 metodu kapatıldı. Kalanların çoğu zaten `success` içeriyor; `getchatbots_v2.php` çıplak dizi kalmaya devam ediyor (hiç istemcisi yok). Toplu zarf tekilleştirmesi ayrı kalem. |
| **REACT-001** kalan 6 dosya | Kısmen açık | Hook yazıldı ve `ProfileCard` (en kötü durum: 7 effect / 0 cleanup) dönüştürüldü. Diğer 6 dosya aynı desende dönüştürülebilir. |
| **DB-016** `dialog_*.dialog_id` (6 tablo) | Kapsam dışı | Hedef tablo belirsiz, altısı da 0 satır. Tahminle FK eklemek yanlış ilişkiyi kalıcılaştırır. |
| **`restore()` başarı yolu** | Kısmen doğrulandı | Scratch DB'ye `mysql` ile geri yükleme yapıldı (aynı komut), fonksiyonun kendisi canlıda çalıştırılmadı. |
| **`smtp_pass` düz metin** | Yapısal | Uygulamanın parolanın kendisine ihtiyacı var, geri döndürülebilir olmak zorunda. `SMTP_PASS` ortam değişkeni destekleniyor ve önceliklidir. |
| **Gemini SSL** | Ortam sorunu | `curl.cainfo` yerelde tanımlı değil. Kod hatası değil. |
| **Anahtar rotasyonu** | Kullanıcıda | Gemini API anahtarı + DB parolası. |
| **`project_tree.txt`** | Stage dışında | 2,8 MB üretilmiş çıktı. Karar kullanıcıda. |

---

## Bu turun toplamı

| | Sayı |
| --- | --- |
| Uygulanan migration | **8** (001, 002, 002b, 003, 004, 005, 006, 007, 008) |
| Foreign key | 0 → **64** |
| Kapatılan denetim bulgusu | DB-001, DB-002, DB-004, DB-005, DB-006, DB-009, DB-012, PAY-008, PAY-009, ERR-003 (kısmi), API-005 (kısmi), AI-002, REACT-001 (kısmi), BIZ-002, UX-002, BIZ-003 |
| Bu turda bulunan yeni bulgu | **9** — DB-013, DB-014, DB-015, DB-016, DB-017, BIZ-006, BIZ-007, SEC-021, SEC-022, artı kendi kodumuzdaki FIX-001 ve FIX-002 |
| Canlı doğrulanan akış | 11 regresyon + 15 hedefli test |

---

## Son doğrulama turu — değiştirilip hiç çalıştırılmamış yollar

"Kod hatası kaldı mı?" sorusuna cevap vermek için, bu turda **değiştirilmiş
ama bir kez bile çalıştırılmamış** yollar tek tek test edildi. Lint ve build
"sözdizimi doğru" der, "mantık doğru" demez.

| Yol | Sonuç |
| --- | --- |
| `publishChatbot` — plan limiti mesajı | ✅ `"Ücretsiz planınızdaki 2 herkese açık chatbot hakkınızı kullandınız."` |
| `publishChatbot` — PAY-009 fiyat türetmesi | ✅ istemci `ucret_aylik:1` gönderdi, DB'ye **180.00** yazıldı (50×4×0,9) |
| `updateChatbotPrice` — PAY-009 | ✅ istemci `5` gönderdi, DB'ye **360.00** yazıldı (100×4×0,9) |
| `listWithdrawals` (admin) | ✅ JSON döndü |
| `listWithdrawals` (admin'siz) | ✅ 403 |
| SEC-021 MIME doğrulaması | ✅ aşağıda |
| BIZ-007 yetim dosya | ✅ logda `yetim görsel silindi: assets/kapak_fotografi/…` |

### 🆕 Bu turda bulunan bir hata — düzeltildi

**Para çekme durum beyaz listesi veriyle uyuşmuyordu.**

`WITHDRAWAL_STATUSES` ilk yazımda ASCII'ye sadeleştirilmişti
(`onaylandi`, `odendi`) ama kayıtlı veri Türkçe yazımı kullanıyor:

```
=== veritabanındaki gerçek durum değerleri ===
  onaylandı       1 satır
```

Sonuç: admin bir talebi **onaylayamıyordu** (`Geçersiz durum`), ve
`?status=onaylandı` filtresi de reddediliyordu. Uç nokta hiç
çalıştırılmadığı için önceki turda fark edilmemişti.

**Düzeltme:** liste kanonik Türkçe yazıma çevrildi
(`beklemede`, `onaylandı`, `ödendi`, `reddedildi`, `iptal`) ve
`normalizeWithdrawalStatus()` eklendi — ASCII varyantlar kabul edilip
kanonik biçime çevriliyor, böylece veritabanında tek yazım kalıyor.

Doğrulama:

```
  girdi onaylandı  -> onaylandı  KABUL
  girdi onaylandi  -> onaylandı  KABUL
  girdi ödendi     -> ödendi     KABUL
  girdi odendi     -> ödendi     KABUL
  girdi beklemede  -> beklemede  KABUL
  girdi saçma      -> saçma      RED
```

### SEC-021 doğrulaması — ve ortamla ilgili bir tespit

`fileinfo` eklentisi **bu ortamda yüklü değil** (`extension_loaded('fileinfo')
= false`), yani `finfo_open()` hiç çağrılamıyor. Kod bunu öngörüp
`getimagesize()`'a düşüyor ve doğru sonuç veriyor:

| Dosya | Tespit edilen MIME | Sonuç |
| --- | --- | --- |
| Gerçek PNG (`admin/logo.png`) | `image/png` | **KABUL** ✓ |
| Gerçek PNG (`admin/empty.png`) | `image/png` | **KABUL** ✓ |
| `<script>` içeren SVG | `NULL` | **RED** ✓ |
| PHP kodu, `.png` adıyla | `NULL` | **RED** ✓ |

Eski kod ikisini de kabul ederdi (yalnızca uzantıya bakıyordu).

> Not: aynı `function_exists('finfo_open')` koruması `InputSanitizer::detectMime()`
> içinde de var — chatbot görsel yüklemeleri de aynı yoldan geçiyor. Production
> sunucusunda `fileinfo` açıksa magic-byte doğrulaması devreye girer ve daha
> güçlüdür; kapalıyken `getimagesize` yeterli koruma sağlıyor.
