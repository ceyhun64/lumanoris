# Tur 3 — Ödeme / Abonelik, Coin Sistemi ve İş Mantığı

Kapsanan `docs/denetim.md` bölümleri: **7** (Payment / Money / Subscription), **8** (Coin / Credit / Limit), **16** (Business Logic).

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

**Tam okunanlar (7):**
`api/src/Infrastructure/Database/BaseRepository.php`, `api/functions/coin_engine.php`,
`api/functions/checkout_payments.php`, `api/functions/chatbot_limits.php`,
`api/functions/producer_plan.php`, `api/src/Presentation/Controllers/MessageController.php`,
`web/src/shared/lib/pricing.js`

**Kısmi okunanlar (belirtilen satır aralıkları):**
`MarketplaceController.php:1-120, 159-356` (addToCart, getCart, linePrice,
paymentsColumnExists, createSubscription — tamamı),
`WalletController.php:1-66, 219-300` (computeBalanceAndTransactions, getMyBalance, getIban,
getPricing, upgradePlan, getSubscription başı),
`SellerController.php:195-240` (reconcile, refund, paramposCallback),
`ChatbotRepository.php:54-66` (countByOwner), `userHasAccess` + `getDetail` gövdeleri,
`AppConfig.php` (sabit satırları), `UserController.php:13-14` (grep ile)

**Şema envanteri (`api/database/schema.sql`):** `user_subscriptions`, `user_cart`,
`chatbot_purchase_credits`, `param_marketplace_details`, `para_cekme_talepleri` tablolarının
sütun + index + constraint tanımları

**Tur 2'den devredilen ilk iş:** `BaseRepository.php` okundu → sonuç BIZ-004'te.

---

## 1. ÖDEME / PARA / ABONELİK (denetim.md bölüm 7)

---

### PAY-001

**Severity:** 🔴 CRITICAL
**TÜR:** prod blocker + iş mantığı

**Başlık:** `chargeCard()` sahte kart numarasını kabul edip ödemeyi simüle ediyor, ama çevresindeki kod sonucu **gerçek ödeme** gibi işliyor: `status='paid'` ödeme satırı, `status='approved'` satıcı payı ve çekilebilir bakiye yazıyor

**Dosya:** `api/functions/checkout_payments.php:28-63`, `api/src/Presentation/Controllers/MarketplaceController.php:280-296, 336-346`, `api/src/Presentation/Controllers/WalletController.php:27-36`

**Fonksiyon/Class:** `chargeCard()` → `MarketplaceController::createSubscription()` → `WalletController::computeBalanceAndTransactions()`

**Problem:**

Ödeme kapısı yalnızca **biçimsel** doğrulama yapıyor, sonra başarı uyduruyor:

```php
api/functions/checkout_payments.php:56-63
    // Dev stub — production calls the real Param POS charge here and
    // returns its actual success/failure. This environment has no gateway
    // credentials, so it only simulates a successful charge once the card
    // itself has passed every check above.
    error_log('[checkout_payments-stub] chargeCard: simulated charge of ' . $amount . ' for card ending ' . substr($number, -4));
    return ['success' => true];
}
```

Üstündeki tüm kontroller (satır 34-55) Luhn checksum, CVV biçimi ve son kullanma tarihi —
hiçbiri kartın **var olduğunu** ya da bakiyesi olduğunu doğrulamıyor. `4111111111111111`
gibi herkesin bildiği bir test numarası Luhn'dan geçer.

Sorun stub'ın kendisi değil — **çevresindeki kodun stub olduğunu bilmemesi.** Çağıran taraf
dönüşü gerçek bir tahsilat gibi işliyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:280-296
        $card = is_array($data['card'] ?? null) ? $data['card'] : [];
        $chargeResult = chargeCard($card, $totalAmount);
        if (!$chargeResult['success']) {
            $conn->rollBack();
            JsonResponse::error($chargeResult['message'] ?? 'Ödeme başarısız.', 402, AppConfig::ERR_PAYMENT);
        }
        ...
        $paymentRow = [
            'order_id' => $orderId,
            'user_id'  => $userId,
            'amount'   => InputSanitizer::price($totalAmount),
            'status'   => 'paid',
        ];
```

ve satıcı payını **onaylanmış** olarak kaydediyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:336-345
        foreach ($detailRows as $row) {
            $db->insert('param_marketplace_details', [
                'payment_id'        => $paymentId,
                'seller_user_id'    => $row['seller_user_id'],
                'chatbot_id'        => $row['chatbot_id'],
                'guid_altuyeisyeri' => '', // no real ParamPos sub-merchant guid outside prod
                'gross_amount'      => $row['payable_amount'],
                'payable_amount'    => $row['payable_amount'],
                'status'            => 'approved',
            ]);
        }
```

Ve `'approved'` doğrudan çekilebilir bakiyeye dönüşüyor:

```php
api/src/Presentation/Controllers/WalletController.php:27-31
        foreach ($incomeRows as $r) {
            $amount = (float) $r['payable_amount'];
            if ($r['status'] === 'approved') {
                $balance += $amount;
```

**Kanıt (bölüm 24 — şemanın bu akışı nasıl tasarladığı kontrol edildi; kod tasarımı atlıyor):**

```
$ awk '/CREATE TABLE.*`param_marketplace_details`/,/^\) ENGINE/' api/database/schema.sql
  `status` varchar(32) NOT NULL DEFAULT 'pending_approval'
           COMMENT 'pending_approval, approved, cancelled, cancel_failed, refunded',
  `pysiparis_guid` varchar(64) DEFAULT NULL COMMENT 'Param PYSiparis_GUID',
  `param_response_json` longtext,
  `refunded_at` datetime DEFAULT NULL,
```

Şema **iki fazlı** bir settlement öngörmüş: satır `pending_approval` olarak doğar, gerçek
gateway onayı gelince `approved` olur. `createSubscription:344` doğrudan `'approved'`
yazıyor — yani şemanın varsayılanı ve tasarlanan geçiş atlanıyor. `pysiparis_guid`,
`param_response_json` ve `refunded_at` sütunları hiç yazılmıyor.

```
$ grep -rn "'pending_approval'" api/ --include=*.php | grep -v vendor
(çıktı yok — kod bu durumu hiç kullanmıyor)
```

**Nasıl tetiklenebilir (tam zincir):**
1. Saldırgan A hesabıyla bir bot oluşturur, satıcı kaydını tamamlar, 5000 ₺ haftalık fiyat verir.
2. B hesabıyla sepete ekler ve `POST /api/marketplace/createsubscription.php` ile
   `card = {number:"4111111111111111", expiry:"12/30", cvv:"123", holder_name:"X"}` gönderir.
3. `chargeCard` → `success: true`. `param_marketplace_payments` satırı `status='paid'`.
4. `param_marketplace_details` satırı A için `payable_amount = 5000 * 0.80 = 4000`,
   `status='approved'`.
5. A'nın `getmybalance` bakiyesi 4000 ₺ artar; `withdraw()` bu tutar için gerçek bir
   para çekme talebi oluşturur.

**Impact:** Hiç para girmemişken sistemde çekilebilir bakiye yaratılıyor. Gerçek bir ödeme
ağ geçidi bağlandığında bile mimari sorun kalır: onay/settlement fazı yok, `chargeCard`'ın
dönüşü anında `approved`'a çevriliyor, ve chargeback için `refunded_at` yazan bir yol yok.

**Dürüstlük notu:** README bu dosyayı "Development stubs" başlığı altında açıkça listeliyor
(`README.md:707-719`) ve `chargeCard`'ın simüle ettiğini yazıyor. Yani bu **gizli bir bug
değil, bilinen bir durum.** Bulgu olarak raporlanmasının nedeni denetim.md bölüm 21 ve 22:
production'a çıkacakmış gibi denetleniyor, ve bölüm 22'ye göre "para kaybı" CRITICAL. Asıl
tespit şu: stub'ın *belgelenmiş* olması, **çevresindeki kodun stub'a gerçek muamelesi
yapmasını** meşrulaştırmıyor. `'paid'`/`'approved'` yazan satırlar ve `withdraw()` yolu
stub'ı bir ödeme sistemi gibi kullanıyor.

**Önerilen çözüm (gerçek gateway gelene kadar bile uygulanabilir olanlar):**
1. `chargeCard` stub olduğu sürece `param_marketplace_details.status` **`pending_approval`**
   yazılmalı — şemanın varsayılanı bu. Böylece satıcı bakiyesi asla simüle edilmiş bir
   tahsilattan beslenmez.
2. `param_marketplace_payments.status` için ayrı bir `simulated` değeri kullanmak.
3. `chargeCard`'ın stub olduğunu çalışma anında belli eden bir bayrak
   (`['success' => true, 'simulated' => true]`) döndürmesi ve çağıranın buna göre davranması.

**Çözüm önceliği:** **Acil** — production öncesi mutlak blocker.

---

### PAY-002

**Severity:** 🔴 CRITICAL
**TÜR:** iş mantığı + güvenlik

**Başlık:** Satışta olan her botun tüm içeriği (persona + eğitim metni) abonelik olmadan her oturum açmış kullanıcıya açık; Tur 2'deki `generateReply` boşluğuyla birleşince ürünün tamamı ücretsiz elde edilebiliyor

**Dosya:** `api/src/Infrastructure/Repositories/ChatbotRepository.php:userHasAccess()` satır 9, `api/src/Presentation/Controllers/TrainingController.php:50-79`, `api/src/Presentation/Controllers/ChatController.php:179-207`

**Fonksiyon/Class:** `ChatbotRepository::userHasAccess()`

**Problem:**

Erişim politikasının ortasındaki `OR` dalı aboneliği tamamen devre dışı bırakıyor:

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php (userHasAccess gövdesi)
            "SELECT 1
             FROM `chatbotlar` c
             LEFT JOIN param_marketplace_sellers pms ON pms.user_id = c.author_user_id AND pms.status = 'active'
             WHERE c.id = ?
               AND (
                    c.author_user_id = ?
                 OR (c.is_independent = 0 AND pms.user_id IS NOT NULL)     ← ABONELİK GEREKTİRMEZ
                 OR EXISTS (
                      SELECT 1 FROM user_subscriptions us
                      WHERE us.user_id = ? AND us.chatbot_id = c.id
                        AND us.status = 1 AND us.expiry_date > NOW()
                    )
               )",
```

İkinci dal: "bot yayında (`is_independent = 0`) **ve** yazarı aktif satıcı" → erişim ver.
Bu, **satışta olan her botun tanımı**. Yani üçüncü dal (abonelik kontrolü) normal durumda
gereksiz: bir aboneliğin var olabilmesi için bot zaten yayında ve satıcısı aktif olmak
zorunda (`createSubscription:212-220` bunu zorluyor).

Bu erişim politikası eğitim metnini de kapsıyor:

```php
api/src/Presentation/Controllers/TrainingController.php:57-66
        if (!(new ChatbotRepository())->userHasAccess($botId, $userId)) {
            JsonResponse::error('Bu chatbot üzerinde yetkiniz yok.', 403, AppConfig::ERR_PERMISSION);
        }

        $conn  = Database::getInstance()->getConnection();
        $stmt  = $conn->prepare('SELECT SUBSTRING(training_prompt, :start, :limit) as chunk, LENGTH(training_prompt) as total_length FROM chatbotlar WHERE id = :id');
        $start = $offset + 1;
```

`$limit = 10000` ve dönüşte `hasMore` var — yani **sayfalanarak tüm eğitim metni** çekilebiliyor.

**Kanıt (bölüm 24 — bunun bilinçli bir "önizleme" politikası olup olmadığı arandı; kısmen öyle):**

```
$ TrainingController.php:39-49 yorumu:
   // chat/page.jsx loads a bot's full training_prompt client-side for
   // every conversation, not just the bot's own owner — a logged-in
   // buyer or anyone previewing a published marketplace bot needs read
   // access here too.
   → Evet, "önizleme" bilinçli. Ama "önizleme" TÜM eğitim korpusunu kapsıyor.

$ getDetail'in döndürdüğü sütunlar (ChatbotRepository::getDetail):
   c.id, c.isim, c.is_independent, author_username, owner_username, c.owner_user_id,
   c.aciklama, c.kategori_id, c.kapak_fotografi, c.profil_fotografi,
   c.style_prompt, c.sohbet_basi_mesaj, likes, dislikes, follows, toplam_chats
   → style_prompt (persona) ve sohbet_basi_mesaj da aynı kapıdan geçiyor.

$ README bu davranışı belgeliyor mu?  → EVET (README.md:664-668):
   "grants access when the caller is the bot's author, when the bot is non-independent
    and its author is an active marketplace seller, or when the caller holds a live
    user_subscriptions row for it."
```

**Nasıl tetiklenebilir — Tur 2 SEC-015 ile birleşen tam zincir:**

1. `GET /api/chatbot/getchatbot.php?id=<botId>` → `style_prompt` + `sohbet_basi_mesaj`
   (abonelik gerekmiyor, `userHasAccess` 2. dal).
2. `GET /api/training/get_training_chunks.php?botId=<botId>&offset=0`, `hasMore` bitene
   kadar tekrar → **tam `training_prompt`** (aynı kapı).
3. `POST /api/chat/generatereply.php` ile `data={"system_instruction":"<1+2'den kurulan
   talimat>","message":"..."}` → Tur 2 SEC-015'te doğrulandı: sunucu `system_instruction`'ı
   istemciden alıyor, `chatbot_id` hiç sormuyor, erişim kontrolü yapamıyor.

Sonuç: satıştaki botun **tam işlevi**, hiç ödeme yapılmadan, kalıcı olarak elde edilmiş olur.

**Impact:** Pazaryerinin satmaya çalıştığı şey (eğitilmiş bir persona) ücretsiz kopyalanabiliyor.
Abonelik modelinin tek koruduğu şey, botun uygulama içindeki hazır arayüzü — içeriği değil.

**Dürüstlük notu (severity gerekçesi):** İki ayrı davranışın da README'de belgelenmiş olduğunu
biliyorum ve ikisi de tek başına savunulabilir ("pazaryeri önizlemesi" ve "esnek chat proxy").
CRITICAL verilmesinin nedeni **birleşimi**: iki belgelenmiş davranış birlikte ürünün ödeme
duvarını tamamen kaldırıyor, ve bu birleşimin hiçbir yerde tartışıldığına dair iz yok.

**Önerilen çözüm:**
1. Önizleme ile satın alınmış erişimi ayırmak: `userHasAccess`'e bir `$purpose` parametresi
   (`'preview'` / `'full'`). Önizleme `aciklama` + `sohbet_basi_mesaj` görsün;
   `style_prompt` ve `training_prompt` yalnızca abonelik/sahiplikle açılsın.
2. `generateReply`'ın `system_instruction`'ı istemciden almayı bırakması (SEC-015'in çözümü) —
   bu tek başına zinciri kırar.

**Çözüm önceliği:** **Acil** — ürünün gelir modelinin temeli.

---

### PAY-003

**Severity:** 🟠 HIGH
**TÜR:** bug + prod blocker

**Başlık:** `grantPurchaseCredit` UNIQUE constraint'e rağmen düz `INSERT` yapıyor — 100 ₺ ve üzeri bir botun **ikinci kez satın alınması** checkout'u 500 ile düşürüyor; abonelik yenileme imkânsız

**Dosya:** `api/functions/coin_engine.php:143-155`, `api/src/Presentation/Controllers/MarketplaceController.php:264, 349-352`

**Fonksiyon/Class:** `grantPurchaseCredit()`

**Problem:**

Fonksiyonun docblock'u "topping up" (üzerine ekleme) diyor, gövdesi düz `insert`:

```php
api/functions/coin_engine.php:143-155
/** Grants (or tops up) a purchase-credit allowance for a user+chatbot after a paid purchase. */
function grantPurchaseCredit(Database $db, int $userId, int $chatbotId, float $totalPaid, string $expiresAt): void {
    $allowance = calculateMessageAllowance($totalPaid);
    if ($allowance <= 0) return;

    $db->insert(AppConfig::TABLE_PURCHASE_CREDITS, [
        'user_id'           => $userId,
        'chatbot_id'        => $chatbotId,
        'credits_remaining' => $allowance,
        'credits_total'     => $allowance,
        'expires_at'        => $expiresAt,
    ]);
}
```

**Kanıt (bölüm 24 — üç şey doğrulandı: constraint var mı, `insert` upsert destekliyor mu,
istisna nereye gidiyor):**

```
1) Tabloda UNIQUE constraint VAR:
$ awk '/CREATE TABLE.*`chatbot_purchase_credits`/,/^\) ENGINE/' api/database/schema.sql
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_chatbot` (`user_id`,`chatbot_id`)     ← ikinci satır imkânsız

2) Database::insert() upsert DESTEKLİYOR ama burada kullanılmıyor:
api/functions/db.php:368        public function insert($table, $data, $updateOnDuplicate = false)
api/src/Presentation/Controllers/WalletController.php:282-286
        $db->insert('user_plan_selection', [...], true);   ← başka bir yerde 3. argüman KULLANILMIŞ
$ grep -n 'grantPurchaseCredit' api/src/Presentation/Controllers/MarketplaceController.php
264:            grantPurchaseCredit($db, $userId, $chatbotId, $price, $expiryDate);   ← argüman yok

3) İstisna nereye gidiyor:
api/src/Presentation/Controllers/MarketplaceController.php:349-352
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            throw $e;
        }
   → yeniden fırlatılıyor → bootstrap.php:93 global handler → 500 "Sunucu hatası oluştu."
```

**Nasıl tetiklenebilir:**
1. Kullanıcı 100 ₺ veya üzeri bir botu satın alır → `chatbot_purchase_credits` satırı oluşur.
2. Abonelik 30 gün sonra dolar.
3. Aynı botu yeniden satın almak ister → `grantPurchaseCredit` `Duplicate entry` fırlatır →
   tüm transaction geri alınır → kullanıcı **jenerik 500** görür, sepeti dolu kalır,
   hiçbir açıklama yok.

**Tetikleme eşiği (dürüstlük):** Yalnızca `calculateMessageAllowance($price) > 0` olduğunda,
yani `$price >= 100` ₺ olduğunda. 100 ₺'nin altındaki alımlarda satır 146'daki
`if ($allowance <= 0) return;` erken çıkıyor ve hata oluşmuyor. `MIN_WEEKLY_PRICE = 1` ve
aylık fiyat `round(weekly * 4 * 0.9)` olduğu için 28 ₺/hafta üstündeki her botun aylık
fiyatı 100 ₺'yi geçiyor — yani eşik pratikte çoğu bot için aşılıyor.

**Impact:** denetim.md bölüm 7'nin "subscription renewal" maddesi **tamamen kırık**. Dönen
müşteri ikinci kez satın alamıyor. Gelir kaybı + teşhis edilemeyen 500. Ayrıca kullanıcı
tekrar denedikçe her seferinde aynı hatayı alıyor (idempotent bir hata, ama açıklamasız).

**Önerilen çözüm:** `$db->insert(..., true)` (upsert) — ama `updateOnDuplicate` tüm sütunları
`VALUES()` ile ezdiği için `credits_remaining` mevcut kalanı silip yeni tahsisi yazar. Doğrusu
açık bir `INSERT ... ON DUPLICATE KEY UPDATE credits_remaining = credits_remaining + VALUES(credits_remaining),
credits_total = credits_total + VALUES(credits_total), expires_at = GREATEST(expires_at, VALUES(expires_at))`
— docblock'un zaten anlattığı "top up" davranışı.

**Çözüm önceliği:** Yüksek.

---

### PAY-004

**Severity:** 🟠 HIGH
**TÜR:** bug + prod blocker

**Başlık:** `createSubscription` açık bir transaction'ın **içinde** `ALTER TABLE` çalıştırıyor — MySQL'in örtük commit'i atomikliği bozuyor; DDL yetkisi olmayan bir prod kullanıcısında checkout kalıcı olarak 500 veriyor

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:188, 328-334, 348-352`

**Problem:**

Transaction satır 188'de açılıyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:184-189
        // The loop below does several inserts/deletes per cart item with no
        // transaction — a failure partway through (e.g. item 3 of 5) used to
        // leave prior items fully purchased/removed from cart while later
        // ones silently never happened, with no way to retry cleanly.
        $conn->beginTransaction();
        try {
```

ve satır 333'te — hâlâ transaction içindeyken — DDL çalışıyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:328-334
        $columnCheck = $db->selectSingle(
            "COUNT(*) AS cnt FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'param_marketplace_details' AND column_name = 'chatbot_id'"
        );
        if ((int) ($columnCheck['cnt'] ?? 0) === 0) {
            $conn->exec('ALTER TABLE param_marketplace_details ADD COLUMN chatbot_id INT NULL AFTER seller_user_id');
        }
```

**Neden problem — iki ayrı sonuç:**

**(a) Atomiklik kaybı.** MySQL/InnoDB'de DDL ifadeleri **örtük COMMIT** tetikler. `ALTER TABLE`
çalıştığı anda satır 188'de açılan transaction sessizce commit edilir. Bundan sonra:
- Satır 336-346'daki `param_marketplace_details` insert'leri başarısız olursa geri alınacak
  bir şey kalmamıştır — abonelikler, krediler ve sepet silme işlemleri **kalıcıdır**.
- Satır 350'deki `$conn->rollBack()` çağrısı `inTransaction()` kontrolüyle korunuyor, yani
  patlamaz; ama geri alma da yapmaz.

Bu, satır 184-188'deki yorumun çözmeye çalıştığı sorunun tam olarak geri gelmesi:
"item 3 of 5'te başarısızlık, öncekiler satın alınmış kalır".

**(b) Least-privilege veritabanı kullanıcısında kalıcı 500.** `ALTER TABLE` DDL yetkisi
gerektiriyor. Aynı kod tabanı bu tehlikeyi başka bir yerde tanımış ve çözmüş:

```php
api/functions/db.php:158-168 (ensureTable docblock'undan)
     * Three hot paths (rate limiting on every login/register attempt, password
     * reset, plan selection) used to fire `CREATE TABLE IF NOT EXISTS` on every
     * single request. That works here only because the dev database user is
     * root: a least-privilege production user with SELECT/INSERT/UPDATE/DELETE
     * and no DDL rights would take a PDOException on every one of those calls,
     * turning all three flows into 500s — a fragility invisible in the code.
```

`ensureTable` bu yüzden önce `information_schema`'ya bakıyor. Buradaki `ALTER TABLE` de
`information_schema` kontrolü yapıyor (satır 328-331) — **ama sütun gerçekten yoksa ALTER
kaçınılmaz.** Yani DDL yetkisi olmayan bir prod kullanıcısında **her checkout** 500 verir,
ve sütun asla oluşmadığı için bu durum kalıcıdır.

**Kanıt (bölüm 24 — aynı kalıbın başka nerede olduğu ve transaction dışında mı olduğu kontrol edildi):**

```
$ grep -rn "ALTER TABLE" api/src api/functions --include=*.php
api/src/Presentation/Controllers/MarketplaceController.php:333   ← transaction İÇİNDE
api/src/Presentation/Controllers/NotificationController.php:29   ← transaction dışında (zararsız)
api/src/Presentation/Controllers/NotificationController.php (message_en için ikinci ALTER)

$ grep -n 'beginTransaction' api/src/Presentation/Controllers/NotificationController.php
(çıktı yok — orada transaction yok, bu yüzden yalnızca DDL-yetkisi sorunu var)
```

**Impact:** İlk checkout'ta kısmi satın alma riski; DDL yetkisiz prod kullanıcısında
checkout'un tamamen çalışmaması.

**Önerilen çözüm:** Şema değişikliği çalışma anında yapılmamalı — `api/database/migrations/`
klasörü zaten var (Tur 1 DOC-001). `chatbot_id` sütununu bir migration'a taşımak ve bu
bloğu tamamen kaldırmak. Geçici çözüm olarak en azından `ALTER`'ı `beginTransaction()`'dan
**önce** çalıştırmak.

**Çözüm önceliği:** Yüksek.

---

### PAY-005

**Severity:** 🟠 HIGH
**TÜR:** bug + iş mantığı

**Başlık:** `computeBalanceAndTransactions` para çekme geçmişini okurken istisnayı yutuyor — okuma başarısız olursa bakiye **tüm çekimler yok sayılarak** hesaplanıyor ve `withdraw()` bu şişmiş bakiyeyi doğrulama ölçütü olarak kullanıyor

**Dosya:** `api/src/Presentation/Controllers/WalletController.php:17-22, 105-110`

**Problem:**

```php
api/src/Presentation/Controllers/WalletController.php:17-22
        $withdrawRows = [];
        try {
            $withdrawRows = $db->selectMulti('* FROM para_cekme_talepleri WHERE user_id = ? ORDER BY id DESC', [$userId]);
        } catch (Exception $e) {
            error_log('[getmybalance] para_cekme_talepleri okunamadı: ' . $e->getMessage());
        }
```

İstisna loglanıp yutuluyor, `$withdrawRows` boş dizi olarak kalıyor. Sonraki döngü (satır
38-45) bakiyeden hiçbir çekim düşmüyor. Ve bu fonksiyonun dönüşü **para çekme
doğrulamasının tek ölçütü**:

```php
api/src/Presentation/Controllers/WalletController.php:103-110
        $conn->beginTransaction();
        try {
            $available = self::computeBalanceAndTransactions($db, $userId)['balance'];
            if ($amount > $available) {
                $conn->rollBack();
                $conn->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
                JsonResponse::error('Talep edilen tutar mevcut bakiyenizi aşıyor.', 400, AppConfig::ERR_VALIDATION);
            }
```

**Kanıt (bölüm 24 — fonksiyonun gerçekten hem gösterim hem doğrulama için kullanıldığı,
docblock'un kendi iddiasıyla birlikte doğrulandı):**

```php
api/src/Presentation/Controllers/WalletController.php:3-7
    /**
     * Shared by getMyBalance() (display) and withdraw() (validation) so the
     * two can never drift into disagreeing about what a seller's balance is.
     */
    private static function computeBalanceAndTransactions(Database $db, int $userId): array {
```

Docblock doğru: ikisi de aynı fonksiyonu kullanıyor. Ama paylaşılan fonksiyonun **hatalı
durumda sessizce iyimser bir değer döndürmesi**, ortaklaştırmanın sağladığı güvenceyi yok
ediyor — ikisi de aynı yanlış sayıyı görüyor.

Karşılaştırma: aynı fonksiyondaki **gelir** okuması (satır 8-15) try/catch **içinde değil** —
yani gelir okunamazsa istisna yükselir ve 500 döner (fail-closed, doğru davranış). Yalnızca
çekim okuması fail-open.

**Nasıl tetiklenebilir:** `para_cekme_talepleri` okumasının başarısız olması gerekiyor —
tablo yok, kilitli, izin yok, ya da geçici bir bağlantı hatası. Bu kod yolunun *varlığı*
tablonun eksik olabileceğinin kabulü (aksi hâlde try/catch'e gerek yoktu).

**Impact:** Satıcı, önceki tüm çekimlerini yok sayan bir bakiye görür ve `withdraw()` bu
tutarı onaylar → aynı gelir birden fazla kez çekilebilir. Gerçek para çıkışı.

**Önerilen çözüm:** Çekim okuması da fail-closed olmalı: istisnayı yutmak yerine yükseltmek
(bakiyeyi hiç göstermemek, çekime izin vermemek). En azından `withdraw()` yolunda catch
kaldırılmalı — gösterimde tolerans kabul edilebilir, doğrulamada asla.

**Çözüm önceliği:** Yüksek.

---

### PAY-006

**Severity:** 🟠 HIGH
**TÜR:** iş mantığı

**Başlık:** Para çekme taleplerinin `durum` alanını güncelleyen **hiçbir kod yok** ve tablo admin CRUD beyaz listesinde de değil — talepler kalıcı olarak "beklemede" kalıyor ve satıcının bakiyesini süresiz kilitliyor

**Dosya:** `api/src/Presentation/Controllers/WalletController.php:112-117, 38-45`, `api/functions/db.php:288-292`

**Problem:**

Talep oluşturuluyor:

```php
api/src/Presentation/Controllers/WalletController.php:112-117
            $id = $db->insert('para_cekme_talepleri', [
                'user_id' => $userId,
                'iban'    => InputSanitizer::string($data['iban'], 40),
                'miktar'  => $amount,
                'durum'   => 'beklemede',
            ]);
```

ve bakiyeden düşülüyor:

```php
api/src/Presentation/Controllers/WalletController.php:38-44
        foreach ($withdrawRows as $w) {
            $amount = (float) ($w['miktar'] ?? 0);
            $durum  = (string) ($w['durum'] ?? '');
            if ($durum !== 'reddedildi' && $durum !== 'iptal') {
                $balance -= $amount;
            }
```

**Kanıt (bölüm 24 — tabloyu güncelleyen her yol arandı: kod, admin CRUD, admin sayfaları):**

```
$ (Grep) para_cekme_talepleri   tüm repo, vendor hariç
api/src/Presentation/Controllers/WalletController.php:19    ← SELECT
api/src/Presentation/Controllers/WalletController.php:21    ← error_log metni
api/src/Presentation/Controllers/WalletController.php:112   ← INSERT
README.md:612                                              ← tablo listesi
   → UPDATE eden tek bir satır YOK.

$ Admin CRUD motoru bu tabloya erişebilir mi?
api/functions/db.php:288-292
    private const ADMIN_ALLOWED_PLAIN_TABLES = [
        'plans', 'plan_icerikler', 'chatbotlar', 'chatbot_kategoriler',
        'kullanicilar', 'chatbot_reports', 'chatbot_visits', 'chatbot_likes',
        'chatbot_dislikes', 'chatbot_follows', 'chatbot_chats',
    ];
   → para_cekme_talepleri beyaz listede DEĞİL → admin/ajax/update.php reddeder
     ("Geçersiz tablo.", db.php:307).

$ Admin panelinde para çekmeyle ilgili HERHANGİ bir sayfa var mı?
$ grep -rln 'cekme\|bakiye\|withdraw' api/admin --include=*.php | grep -v vendor
(çıktı yok — exit 1)
   → Admin panelinin 30+ PHP sayfasının hiçbiri para çekmeden söz etmiyor.
     Yani eksik olan yalnızca CRUD beyaz listesi kaydı değil; talebi görecek
     bir admin ekranı da hiç yazılmamış.
```

**Neden problem — iki ayrı sonuç:**

1. **Satıcı hiç para alamıyor.** Talep `beklemede` doğuyor ve o durumda kalıyor. Onaylayacak
   bir arayüz, endpoint veya admin yolu yok. Ödeme yaşam döngüsünün terminal durumu yok.
2. **Bakiye kalıcı olarak kilitleniyor.** Satır 41'deki koşul `beklemede`'yi "düşülecek"
   sayıyor. Yani talep oluşturan satıcı bakiyesini anında kaybediyor ve geri de alamıyor
   (`reddedildi`/`iptal` yazacak kod da yok). Satıcı 4000 ₺ için talep açarsa bakiyesi 0
   olur, para gelmez, talep iptal edilemez.

**Ek kusur — blocklist mantığı:** Satır 41 bir **blocklist**. Yeni bir durum eklenirse
(örneğin `hata`, `basarisiz`, `iade_edildi`) ya da `durum` NULL olursa, tutar bakiyeden
düşülmeye devam eder. Doğrusu allowlist olmalı ("yalnızca `beklemede` ve `odendi` düşülür").

**Impact:** Satıcı ödeme akışı hiç tamamlanmıyor; satıcılar bakiyelerini kalıcı olarak
kaybediyor. Pazaryerinin satıcı tarafı işlevsiz.

**Önerilen çözüm:** Talep durumunu yönetecek bir admin arayüzü/endpoint'i (en azından
`para_cekme_talepleri`'ni admin beyaz listesine eklemek); satır 41'i allowlist'e çevirmek;
`iptal` için satıcıya kendi bekleyen talebini geri çekme yolu vermek.

**Çözüm önceliği:** Yüksek.

---

### PAY-007

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + prod blocker

**Başlık:** `parampos_callback.php` kimlik doğrulaması, imza kontrolü ve replay koruması olmadan herkese açık — ödeme webhook'unun doğrulama iskeleti hiç yok

**Dosya:** `api/src/Presentation/Controllers/SellerController.php:230-235`, `api/functions/checkout_payments.php:95-100`

**Problem:**

```php
api/src/Presentation/Controllers/SellerController.php:230-235
    public static function paramposCallback(): void {
        require_once __DIR__ . '/../../../functions/ParamPosMarketplace.php';
        require_once __DIR__ . '/../../../functions/checkout_payments.php';
        $db = Database::getInstance();
        handleParamCallback($db, $db->getConnection(), $_POST);
    }
```

Guard yok, `require_method` yok, imza doğrulaması yok, nonce/idempotency yok. Hedef stub:

```php
api/functions/checkout_payments.php:95-100
function handleParamCallback(Database $db, PDO $conn, array $post): void {
    error_log('[checkout_payments-stub] handleParamCallback called');
    http_response_code(200);
    echo 'OK';
    exit;
}
```

**Kanıt (bölüm 24 — kardeş endpoint'lerin nasıl korunduğuyla karşılaştırıldı):**

```
$ SellerController içindeki üç "operasyonel" endpoint:
:195 reconcile()        → PARAM_RECONCILE_SECRET + hash_equals  ✓ korumalı
:220 refund()           → AuthMiddleware::requireAdmin()         ✓ korumalı
:230 paramposCallback() → (hiçbir şey)                           ✗ korumasız

$ grep -c 'requireAuth\|requireAdmin\|hash_equals\|require_method' \
      <paramposCallback gövdesi, satır 230-235>
0
```

Yani aynı sınıfta iki farklı koruma deseni uygulanmış, callback'e hiçbiri uygulanmamış.

**Neden şu an sömürülemez ve neden yine de HIGH:** Stub hiçbir şey yapmadığı için bugün
zararsız — `error_log`'a satır yazıp `OK` döndürüyor. HIGH verilmesinin nedeni bunun bir
**prod blocker** olması: gerçek `handleParamCallback` production'da ödeme durumunu
güncelleyecek (dosyanın kendi başlık yorumu satır 10: *"processes a Param POS async callback
POST"*). O kod bu iskelete yerleştirildiğinde:
- **Webhook forgery:** herkes `status='paid'` bildiren bir POST atabilir.
- **Webhook replay:** aynı bildirim tekrar tekrar işlenebilir (idempotency anahtarı yok).
- Doğrulama için bir yer (imza kontrolü, IP allowlist) hazırlanmamış.

denetim.md bölüm 7 bu üç maddeyi ayrı ayrı sayıyor: "payment callback security",
"webhook replay", "webhook forgery".

**Ek gözlem:** Stub `echo 'OK'; exit;` yapıyor — yani `Content-Type: application/json`
başlığı (bootstrap.php:10) gönderilmişken düz metin dönüyor. Zarf tutarsızlığı.

**Önerilen çözüm:** Stub'ın yerine bile şunlar şimdiden konabilir: `require_method('POST')`,
paylaşılan sırla HMAC imza doğrulaması, ve `param_marketplace_payments` üzerinde
`pysiparis_guid` bazlı idempotency kontrolü (sütun şemada zaten var, hiç yazılmıyor).

**Çözüm önceliği:** Yüksek — gerçek gateway bağlanmadan **önce** yapılmalı.

---

### PAY-008

**Severity:** 🟡 MEDIUM
**TÜR:** bug + iş mantığı

**Başlık:** `createSubscription`'da idempotency anahtarı, rate limit ve eşzamanlılık kilidi yok — aynı sepet iki kez gönderildiğinde iki abonelik ve iki ödeme satırı oluşuyor

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:159-192, 239-266`

**Problem:** Endpoint istemcinin gönderdiği `items[]` dizisiyle çalışıyor — sepeti okumuyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:164-167, 190-193
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || empty($data['items']) || !is_array($data['items'])) {
            JsonResponse::error('Veri bulunamadı!', 400, AppConfig::ERR_VALIDATION);
        }
        ...
            foreach ($data['items'] as $item) {
                $chatbotId     = InputSanitizer::positiveInt($item['chatbot_id'] ?? 0);
                $durationWeeks = InputSanitizer::positiveInt($item['duration_weeks'] ?? 0) ?: 4;
```

Sepet silme işlemi döngünün **içinde** (satır 266), ama sipariş kaynağı sepet değil istemci
verisi. Yani sepetin boşalması ikinci isteği engellemiyor.

**Kanıt (bölüm 24 — dört olası koruma katmanı tek tek arandı; üçü aynı projede başka
yerlerde VAR):**

```
1) Idempotency anahtarı / order_id tekilliği?
api/src/Presentation/Controllers/MarketplaceController.php:290
        $orderId = 'ORD-' . strtoupper(InputSanitizer::randomToken(4));
   → her istekte YENİ rastgele id; istemciden gelen bir anahtar yok. Idempotency YOK.

2) Rate limit?
$ grep -c 'checkRateLimit' <createSubscription gövdesi, satır 159-355>
0
   Karşılaştırma — aynı projede VAR: ChatbotController:30 (savechatbot 20/300),
   ChatController:185 (genreply 20/60), TrainingController:92 (readpdf 10/300),
   MessageController:28 (consumemsg 60/60).
   → Para endpoint'i, coin endpoint'inden daha az korunuyor.

3) Eşzamanlılık kilidi?
$ grep -c 'GET_LOCK' <createSubscription gövdesi>
0
   Karşılaştırma — VAR: WalletController.php:96-98 (withdraw için GET_LOCK).

4) user_subscriptions'ta UNIQUE constraint?
$ awk '/CREATE TABLE.*`user_subscriptions`/,/^\) ENGINE/' api/database/schema.sql
  PRIMARY KEY (`id`), KEY `user_id`, KEY `chatbot_id`
   → (user_id, chatbot_id) üzerinde UNIQUE YOK.
```

**Nasıl tetiklenebilir:** Checkout butonuna çift tıklama, ya da aynı `items[]` payload'ının
kasıtlı olarak paralel gönderilmesi. İki istek de tüm kontrolleri geçer (bot yayında, satıcı
aktif, fiyat > 0), iki `user_subscriptions` satırı, iki `param_marketplace_payments` satırı
ve iki satıcı payı oluşur.

**Kısmi frenler (dürüstlük):** 100 ₺ üzeri botlarda PAY-003'teki UNIQUE constraint ikinci
isteği 500 ile düşürür — yani **hata mesajı yanlış olsa da** çift satın alma o durumda
kazara engellenir. 100 ₺ altındaki botlarda hiçbir fren yok. Bu, PAY-008'in MEDIUM
verilmesinin nedeni: etki gerçek ama bir kısmı başka bir bug tarafından maskeleniyor.

**Impact:** Çift ücretlendirme; satıcıya çift pay; ödeme mutabakatının bozulması.

**Önerilen çözüm:** İstemciden bir idempotency anahtarı almak ve
`param_marketplace_payments.order_id` üzerinde UNIQUE constraint ile ilk isteği kazandırmak;
`GET_LOCK('checkout_user_' . $userId)`; `checkRateLimit`.

**Çözüm önceliği:** Orta.

---

### PAY-009

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı

**Başlık:** Haftalık ve aylık fiyat arasındaki ilişki sunucuda hiç doğrulanmıyor — indirim formülü yalnızca istemcide uygulanıyor, sunucu iki fiyatı bağımsız kabul ediyor

**Dosya:** `web/src/shared/lib/pricing.js:34-37`, `api/src/Presentation/Controllers/ChatbotController.php:164-171`, `api/src/Presentation/Controllers/MarketplaceController.php:70-73`

**Problem:**

Aylık fiyat **yalnızca istemcide** haftalıktan türetiliyor:

```javascript
web/src/shared/lib/pricing.js:34-37
export function deriveMonthlyPrice(weeklyPrice) {
    const weekly = Number(weeklyPrice) || 0;
    return Math.round(weekly * 4 * MONTHLY_DISCOUNT_FACTOR);
}
```

Sunucu ikisini **ayrı ayrı** ve birbirinden bağımsız doğruluyor:

```php
api/src/Presentation/Controllers/ChatbotController.php:164-171
        $weekly  = isset($data['ucret_haftalik']) ? (float) $data['ucret_haftalik'] : 0;
        $monthly = isset($data['ucret_aylik'])    ? (float) $data['ucret_aylik']    : 0;
        ...
        self::assertValidPrice($weekly,  'Haftalık', AppConfig::MAX_WEEKLY_PRICE, AppConfig::MIN_WEEKLY_PRICE);
        self::assertValidPrice($monthly, 'Aylık',    AppConfig::MAX_WEEKLY_PRICE * 4, round(AppConfig::MIN_WEEKLY_PRICE * 4 * AppConfig::DISCOUNT_MONTHLY_FACTOR));
```

Yani `weekly = 1` ve `monthly = 20000` (= MAX*4) kombinasyonu **her iki kontrolü de geçiyor**.
Ters yön de geçiyor: `weekly = 5000`, `monthly = 4`.

Ve tahsilat mantığı depolanan aylık fiyatı **olduğu gibi** kullanıyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:70-73
    private static function linePrice(float $weekly, float $monthly, int $durationWeeks): float {
        $price = $durationWeeks >= 4 ? $monthly : $weekly * $durationWeeks;
        return InputSanitizer::price($price);
    }
```

**Kanıt (bölüm 24 — sunucuda türetme veya ilişki kontrolü olup olmadığı arandı):**

```
$ grep -rn 'DISCOUNT_MONTHLY_FACTOR' api/ --include=*.php | grep -v vendor
api/src/Shared/Constants/AppConfig.php:49    ← sabit tanımı
api/src/Presentation/Controllers/ChatbotController.php:171   ← yalnızca alt sınır hesabında
api/src/Presentation/Controllers/ChatbotController.php:294   ← aynı, updateChatbotPrice
   → ucret_aylik'i ucret_haftalik'tan TÜRETEN hiçbir PHP kodu yok.

$ pricing.js:8-12 yorumu bu tasarımı açıkça anlatıyor:
   // Applied EXACTLY ONCE, in deriveMonthlyPrice() below, whose
   // result is stored as chatbotlar.ucret_aylik. Nothing downstream may apply it
   // again: checkout displays, and MarketplaceController::linePrice() charges,
   // ucret_aylik as-is.
```

Yorum doğru bir kararı anlatıyor (indirimi iki kez uygulamamak — Tur 3'te bunun geçmişte
gerçek bir bug olduğu `MarketplaceController.php:43-47`'de belgeli). Ama sonucu şu: **iki
fiyat arasındaki tek bağ istemcide.**

Buna Tur 2 SEC-003 eklenince (mass assignment ile `updateChatbot`/`saveChatbot` üzerinden
`ucret_aylik`'in `assertValidPrice`'ı hiç görmeden yazılabilmesi), ilişki hiçbir katmanda
zorlanmıyor.

**Nasıl tetiklenebilir:** Satıcı `publishchatbot.php`'ye `{"ucret_haftalik":1,"ucret_aylik":20000}`
gönderir. Pazaryeri listesi 1 ₺/hafta gösterir; aylık seçen alıcı 20 000 ₺ ödeme ekranı görür.
Ters senaryoda satıcı kendi zararına satar (0,80 komisyonla 4 ₺'nin %80'i).

**Impact:** Yanıltıcı fiyatlandırma (tüketici tarafı) ve satıcının kazara zararına satış.
Doğrudan istismar "kendi zararına" olduğu için MEDIUM; ama alıcıya yanlış fiyat gösterme
tarafı ticari bir risk.

**Önerilen çözüm:** `ucret_aylik`'i istemciden hiç kabul etmemek; sunucuda
`round($weekly * 4 * AppConfig::DISCOUNT_MONTHLY_FACTOR)` ile türetmek. Bu aynı zamanda
SEC-003'ün bir kısmını da kapatır ve pricing.js'teki aynalamayı gereksiz kılar.

**Çözüm önceliği:** Orta.

---

### PAY-010

**Severity:** 🟡 MEDIUM
**TÜR:** bug + iş mantığı

**Başlık:** `duration_weeks` istemci kontrollü ve üst sınırsız; 4 ve üzeri her değer 30 güne sabitleniyor ama satır ve ödeme kaydı gönderilen değeri saklıyor

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:192, 222, 236-245, 253-259`

**Problem:**

```php
api/src/Presentation/Controllers/MarketplaceController.php:192, 222, 236-245
                $durationWeeks = InputSanitizer::positiveInt($item['duration_weeks'] ?? 0) ?: 4;
                ...
                $isMonthly = $durationWeeks >= 4;
                ...
                $days       = $isMonthly ? AppConfig::SUBSCRIPTION_MONTHLY : $durationWeeks * AppConfig::SUBSCRIPTION_WEEKLY;
                $expiryDate = date('Y-m-d H:i:s', $mysqlNow + $days * 86400);

                $subscriptionIds[] = $db->insert('user_subscriptions', [
                    'user_id'        => $userId,
                    'chatbot_id'     => $chatbotId,
                    'duration_weeks' => $durationWeeks,
                    'expiry_date'    => $expiryDate,
                    'status'         => 1,
                ]);
```

`positiveInt` yalnızca "pozitif mi" diyor; üst sınır ya da {1,2,3,4} beyaz listesi yok.

**Kanıt (bölüm 24 — bunun bir fiyat istismarı olup olmadığı ÖNCE test edildi; DEĞİL):**

```
duration_weeks = 52 gönderildiğinde:
  linePrice(weekly, monthly, 52)  → 52 >= 4 → $price = $monthly          (sabit aylık fiyat)
  $days = $isMonthly ? 30 : ...   → 30                                    (erişim 30 günle SINIRLI)
  → Alıcı 52 hafta talep edip 30 gün alıyor. Yani fiyat istismarı DEĞİL,
    alıcının aleyhine. "Bir yıllık erişimi bir aylık fiyata" senaryosu ÇALIŞMIYOR.
    Bu yönde bulgu yazılmadı.

Gerçek etki veri tutarlılığında:
  user_subscriptions.duration_weeks = 52   ama   expiry_date = now + 30 gün
  itemRows → 'duration_weeks' => 52, 'billing_period' => 'monthly'
             'unit_price'     => ucret_aylik,  'line_total' => ucret_aylik
  → items_json sütununa (varsa) "52 hafta / monthly / aylık fiyat" yazılıyor.
```

**Neden problem:** Üç ayrı tutarsızlık:
1. `user_subscriptions` satırı kendi kendisiyle çelişiyor: 52 hafta yazıyor, 30 gün sonra
   doluyor. Erişim `expiry_date` ile kontrol edildiği için (bkz. `userHasAccess`) işlev
   doğru çalışıyor, ama satır yanlış bilgi taşıyor.
2. `WalletController::getSubscription`'ın yorumu (satır 299-300) `duration_weeks`'in
   frontend tarafından kullanıldığını söylüyor — yani yanlış değer arayüze taşınıyor.
3. `items_json` ödeme kaydına gidiyor; mutabakat ve iade hesabı bu veriye bakacak.

**Ek gözlem:** 3 hafta talebi `weekly * 3` fiyatına 21 gün veriyor; 4 hafta talebi
`monthly` (= `weekly * 3.6`) fiyatına 30 gün. Yani 3 → 4 hafta geçişinde fiyat artışı
%20, süre artışı %43. Tutarlı bir indirim eğrisi, ama 5..∞ hafta aralığı tanımsız kalıyor:
kullanıcı arayüzünde bu seçenek yoksa bile endpoint kabul ediyor.

**Impact:** Veri bütünlüğü ve raporlama hatası; mutabakatın yanlış süreyle çalışması.

**Önerilen çözüm:** `$durationWeeks`'i açık bir beyaz listeyle sınırlamak
(`in_array($durationWeeks, [1,2,3,4], true)`), ve `>= 4` durumunda satıra 4 yazmak —
`expiry_date` ile tutarlı olsun.

**Çözüm önceliği:** Orta.

---

### PAY-011

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı + teknik borç

**Başlık:** `param_marketplace_details`'e `gross_amount` ile `payable_amount` aynı değer yazılıyor — platformun komisyonu hiçbir yerde kaydedilmiyor, mutabakat imkânsız

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:247-252, 336-345`

**Problem:**

Komisyon hesaplanıyor ve **yalnızca satıcı payı** saklanıyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:247-252
                $commissionRate = $isMonthly ? AppConfig::SELLER_COMMISSION_MONTHLY : AppConfig::SELLER_COMMISSION_WEEKLY;
                $detailRows[] = [
                    'seller_user_id'  => (int) $bot['author_user_id'],
                    'chatbot_id'      => $chatbotId,
                    'payable_amount'  => InputSanitizer::price($price * $commissionRate),
                ];
```

Sonra aynı değer iki sütuna yazılıyor:

```php
api/src/Presentation/Controllers/MarketplaceController.php:342-343
                'gross_amount'      => $row['payable_amount'],
                'payable_amount'    => $row['payable_amount'],
```

**Kanıt (bölüm 24 — komisyonun başka bir yerde kaydedildiği arandı):**

```
$ Şemadaki ilgili sütunlar:
  param_marketplace_details: gross_amount, payable_amount   (ikisi de decimal(10,2))
  param_marketplace_payments: amount, product_amount, service_fee (opsiyonel), net_amount (opsiyonel)

$ service_fee / net_amount yazılıyor mu?
api/src/Presentation/Controllers/MarketplaceController.php:306-308 (yorum)
   // service_fee is left alone too — SERVICE_FEE_PERCENT exists as a
   // constant but no service fee is charged anywhere today, and filling it
   // in would imply a fee model nobody has decided on yet.
$ grep -rn 'SERVICE_FEE_PERCENT' api/ --include=*.php | grep -v vendor
api/src/Shared/Constants/AppConfig.php:41    ← yalnızca tanım, hiç kullanılmıyor

$ Komisyon oranı satıra yazılıyor mu?
$ grep -n 'commission' <detailRows insert bloğu>
   → hayır. Oran yalnızca çarpım anında var, kaydedilmiyor.
```

**Neden problem:** `gross_amount` isminin anlamı "brüt" — yani satış tutarı (`$price`).
`payable_amount` satıcıya ödenecek net. İkisinin eşit yazılması şu bilgileri kaybediyor:
- Satışın brüt tutarı (`$price`) satır düzeyinde hiç yok. `param_marketplace_payments.amount`
  yalnızca **sepet toplamı**; çok kalemli bir siparişte kalem başına brüt geri hesaplanamıyor.
- Uygulanan komisyon oranı (0,85 mi 0,80 mi) kayıtsız. `billing_period` yalnızca
  `items_json`'a yazılıyor ve o sütun **opsiyonel** (satır 314-318: varsa yazılıyor).
- Platformun kazancı hiçbir sorguyla çıkarılamıyor.

`AppConfig`'teki komisyon oranları değiştirilirse geçmiş satırlar hangi oranla
hesaplandığını bilmez — muhasebe açısından geriye dönük tutarsızlık.

**Impact:** Mutabakat ve gelir raporlaması yapılamıyor; iade hesabı için gerekli brüt tutar
kalem düzeyinde yok.

**Önerilen çözüm:** `gross_amount = $price` (satış tutarı), `payable_amount = $price * $rate`
yazmak; uygulanan oranı da satıra eklemek (yeni bir `commission_rate` sütunu, migration ile).

**Çözüm önceliği:** Orta.

---

### PAY-012

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı + prod blocker

**Başlık:** `processRefund()` hiçbir şey yapmadan "başarılı" dönüyor; hiçbir kod yolu aboneliği iptal etmiyor veya satıcı payını `refunded`'a çevirmiyor — bakiye hesabındaki iade dalı ulaşılamaz

**Dosya:** `api/functions/checkout_payments.php:90-93`, `api/src/Presentation/Controllers/SellerController.php:220-228`, `api/src/Presentation/Controllers/WalletController.php:32-35`

**Problem:**

```php
api/functions/checkout_payments.php:90-93
function processRefund(Database $db, PDO $conn, array $data): void {
    error_log('[checkout_payments-stub] processRefund called');
    JsonResponse::success(['message' => 'İade işlemi simüle edildi (dev stub).']);
}
```

`JsonResponse::success()` `exit` ediyor (JsonResponse.php:17), yani çağıran hiçbir zaman
kontrolü geri almıyor ve **admin başarı yanıtı görüyor.**

Bakiye hesabında iade için bir dal var, ama onu tetikleyecek yazma yok:

```php
api/src/Presentation/Controllers/WalletController.php:32-35
            } elseif ($r['status'] === 'refunded') {
                $balance -= $amount;
                $transactions[] = ['amount' => -$amount, 'type' => 'refund', 'status' => $r['status'], 'created_at' => $r['created_at'], 'description' => 'Satış iadesi işlendi. #' . $r['order_id']];
            }
```

**Kanıt (bölüm 24 — `refunded` yazan ve aboneliği iptal eden her yol arandı):**

```
$ grep -rn "'refunded'\|refunded_at" api/ --include=*.php | grep -v vendor
api/src/Presentation/Controllers/WalletController.php:32   ← yalnızca OKUMA
   → 'refunded' yazan hiçbir kod yok. refunded_at sütunu (şemada var) hiç yazılmıyor.

$ İade sonrası abonelik iptali var mı?
$ grep -rn "user_subscriptions" api/src api/functions --include=*.php | grep -iE 'delete|status.*0|refund'
api/src/Presentation/Controllers/MarketplaceController.php:369   ← deleteSubscription (kullanıcının kendi iptali)
   → iade akışından tetiklenen bir iptal YOK.
```

**Neden problem — üç katmanlı:**
1. **Sahte başarı.** Admin "İade işlemi simüle edildi" mesajını görüyor; gerçek bir iade
   bekliyorsa yanlış bilgilendirilmiş oluyor. (Aynı kalıp `reconcilePayments()`'ta da var:
   `checkout_payments.php:85-88` → `'Mutabakat tamamlandı (dev stub).', 'processed' => 0`.)
2. **Refund abuse.** Alıcı ödeme ağ geçidi/bankası üzerinden iade alsa bile uygulama bunu
   hiç öğrenmiyor: `user_subscriptions` satırı canlı kalıyor, `expiry_date` değişmiyor,
   erişim sürüyor. denetim.md bölüm 7'nin "refund sonrası access" maddesi.
3. **Satıcı bakiyesi düşmüyor.** İade edilen bir satışın satıcı payı `approved` kalıyor ve
   çekilebilir bakiyeye dâhil olmayı sürdürüyor (PAY-001 ile birleşerek).

**Impact:** İade akışı uçtan uca yok; iade edilen satışların parası hem alıcıya hem satıcıya
gidiyor.

**Önerilen çözüm:** Stub kaldığı sürece `processRefund`'un **başarısız** dönmesi
(`buyProducerAccount` gibi — `producer_plan.php:12-15` doğru deseni kullanıyor: her zaman
`success: false`). Gerçek implementasyonda: `param_marketplace_details.status = 'refunded'`,
`refunded_at = NOW()`, ve ilgili `user_subscriptions.status = 0`.

**Çözüm önceliği:** Orta — ama gerçek ödeme bağlanmadan önce.

---

### PAY-013

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `addToCart` yinelenmeyen istisnalarda ham `$e->getMessage()`'ı istemciye yazıyor

**Dosya:** `api/src/Presentation/Controllers/MarketplaceController.php:28-33`

**Problem:**

```php
api/src/Presentation/Controllers/MarketplaceController.php:25-33
        try {
            $id = $db->insert('user_cart', ['user_id' => $userId, 'chatbot_id' => $chatbotId, 'order_weeks' => $orderWeeks]);
            JsonResponse::success(['message' => 'Ürün sepete eklendi', 'id' => $id]);
        } catch (Exception $e) {
            $msg = str_contains($e->getMessage(), 'Duplicate entry')
                ? 'Bu chatbot zaten sepetinizde bulunuyor.'
                : 'Hata: ' . $e->getMessage();
            JsonResponse::error($msg, 409, AppConfig::ERR_DUPLICATE);
        }
```

Duplicate dışındaki her istisnada PDO'nun ham mesajı (`SQLSTATE[...]`, sütun/tablo adları)
istemciye gidiyor.

**Kanıt (bölüm 24 — bunun Tur 2 ERR-001'den farklı bir yüzey olduğu doğrulandı):**

```
Tur 2 ERR-001: api/admin/ajax/*.php  → ADMIN oturumu arkasında
Bu bulgu:      api/api/marketplace/addtocart.php → HER oturum açmış kullanıcı

$ bootstrap.php'nin APP_DEBUG ayrımı bu yolu kapsıyor mu?
api/functions/bootstrap.php:93   set_exception_handler(...)
   → HAYIR: istisna burada YAKALANMIŞ, global handler'a hiç ulaşmıyor.
     APP_DEBUG=false olsa bile mesaj sızıyor.
```

**Ek kusur:** Duplicate olmayan bir hata için de `409` + `ERR_DUPLICATE` dönüyor — durum
kodu ve hata kodu yanlış (Tur 2 ERR-010 sınıfı).

**Impact:** Şema keşif bilgisi sızıntısı; yanlış hata kodu.

**Önerilen çözüm:** Duplicate dışındaki istisnaları yeniden fırlatıp global handler'a
bırakmak (`throw $e`), böylece `APP_DEBUG` ayrımı devreye girer.

**Çözüm önceliği:** Düşük.

---

### PAY-014

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `reconcile()` cron sırrını `$_GET['secret']` üzerinden de kabul ediyor ve `require_method` çağırmıyor — sır erişim loglarına ve tarayıcı geçmişine düşüyor

**Dosya:** `api/src/Presentation/Controllers/SellerController.php:195-214`

**Problem:**

```php
api/src/Presentation/Controllers/SellerController.php:200-201
        $cronSecret = $_ENV['PARAM_RECONCILE_SECRET'] ?? $_SERVER['PARAM_RECONCILE_SECRET'] ?? getenv('PARAM_RECONCILE_SECRET') ?: '';
        $provided   = $_GET['secret'] ?? $_POST['secret'] ?? $_SERVER['HTTP_X_RECONCILE_SECRET'] ?? '';
```

`require_method` yok, yani `GET /api/seller/marketplace_reconcile.php?secret=...` geçerli.

**Kanıt (bölüm 24 — sırrın karşılaştırmasının güvenli olup olmadığı ayrıca kontrol edildi;
o kısım DOĞRU yapılmış):**

```php
api/src/Presentation/Controllers/SellerController.php:208-214
        if ($cronSecret === '') {
            error_log('[reconcile] PARAM_RECONCILE_SECRET is not set — ...');
            JsonResponse::error('Yetkisiz.', 403, AppConfig::ERR_PERMISSION);
        }
        if (!hash_equals((string) $cronSecret, (string) $provided)) {
            JsonResponse::error('Yetkisiz.', 403, AppConfig::ERR_PERMISSION);
        }
```
   → hash_equals ✓, fail-closed ✓, ayırt edilemez yanıt ✓. Bu yönde bulgu yazılmadı.

**Neden yine de bir bulgu:** URL query string'i, POST gövdesinin aksine, web sunucusu erişim
loglarına, proxy loglarına, `Referer` başlığına ve tarayıcı geçmişine yazılır. Bu turda
Tur 2 SEC-001'in `api/admin/error_log`'un HTTP'den okunabildiğini gösterdiği düşünülünce,
log dosyalarına sır yazmak ek bir zincir halkası.

**Ek gözlem:** `$_SERVER['PARAM_RECONCILE_SECRET']` kaynağı ilginç — `$_SERVER` bazı
kurulumlarda CGI ortam değişkenlerini taşır, ama aynı zamanda `HTTP_*` dışındaki
istemci-kontrollü değerleri **taşımaz**, dolayısıyla güvenlik açığı değil.

**Impact:** Sırrın log dosyalarında ve tarayıcı geçmişinde birikmesi.

**Önerilen çözüm:** `require_method('POST')` eklemek ve `$_GET['secret']` kaynağını
kaldırmak; yalnızca `X-Reconcile-Secret` başlığını kabul etmek.

**Çözüm önceliği:** Düşük.

---

### PAY-015

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `chargeCard` kart numarasının son 4 hanesini ve tutarı `error_log`'a yazıyor

**Dosya:** `api/functions/checkout_payments.php:61`

**Problem:**

```php
api/functions/checkout_payments.php:61
    error_log('[checkout_payments-stub] chargeCard: simulated charge of ' . $amount . ' for card ending ' . substr($number, -4));
```

**Neden bir bulgu:** Son 4 hane tek başına PCI-DSS'te saklanabilir sayılır, yani bu **ihlal
değil**. Bulgu, Tur 2 SEC-001 ile zincirlenmesinden: `api/admin/error_log` HTTP üzerinden
okunabiliyor. Log'a düşen kayıt "kim, ne kadar, hangi kartla" bilgisini birleştiriyor
(kullanıcı kimliği aynı log satırında yok ama zaman damgası ile diğer kayıtlarla
eşleştirilebilir).

**Kanıt:**

```
$ Bu turda log'a yazan diğer para noktaları:
checkout_payments.php:61   chargeCard      → tutar + PAN son 4
checkout_payments.php:82   ensureParamMarketplaceTables
checkout_payments.php:86   reconcilePayments
checkout_payments.php:91   processRefund
checkout_payments.php:96   handleParamCallback
producer_plan.php:11,19    buyProducerAccount / getProducerPlanStatus (userId dâhil)
   → producer_plan.php:19 log satırı userId taşıyor:
     error_log("[producer_plan-stub] getProducerPlanStatus userId=$userId");
```

**Impact:** SEC-001 çözülmediği sürece ödeme meta verisinin sızması.

**Önerilen çözüm:** Stub loglarını `APP_DEBUG` koşuluna bağlamak; PAN parçasını hiç
loglamamak.

**Çözüm önceliği:** Düşük — SEC-001'in çözümü bu bulgunun etkisini de ortadan kaldırır.

---

## 2. COIN / KREDİ / LİMİT SİSTEMİ (denetim.md bölüm 8)

---

### COIN-001

**Severity:** 🔴 CRITICAL
**TÜR:** iş mantığı + güvenlik

**Başlık:** `generateReply` `consumeMessage()`'ı hiç çağırmıyor — mesaj hakkı tamamen istemcinin gönüllü olarak ayrı bir endpoint'i çağırmasına bağlı; istemci çağırmazsa limit yok

**Dosya:** `api/src/Presentation/Controllers/ChatController.php:179-207`, `api/src/Presentation/Controllers/MessageController.php:23-38`

**Fonksiyon/Class:** `ChatController::generateReply()` vs `MessageController::consumeMessage()`

**Problem:**

Coin tüketimi **ayrı bir endpoint**:

```php
api/src/Presentation/Controllers/MessageController.php:23-38
    public static function consumeMessage(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        // Bounded by the daily coin budget in normal use; this is the floor that
        // stops a client hammering the endpoint itself.
        checkRateLimit(Database::getInstance(), 'consumemsg:' . $userId, 60, 60);
        require_once __DIR__ . '/../../../functions/coin_engine.php';

        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $result = consumeMessage(Database::getInstance(), $userId, $chatbotId);
        echo json_encode(array_merge(['success' => true], $result));
        exit;
    }
```

Gerçek AI çağrısı bu endpoint'ten tamamen bağımsız ve **coin bakiyesine hiç bakmıyor:**

```php
api/src/Presentation/Controllers/ChatController.php:179-192
    public static function generateReply(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        // Each call is an upstream Gemini request billed against the project
        // quota, and nothing else throttled it — consumeMessage's daily coin
        // budget is a separate endpoint the client may simply not call.
        checkRateLimit(Database::getInstance(), 'genreply:' . $userId, 20, 60);

        $data              = json_decode($_POST['data'] ?? '', true) ?? null;
        $systemInstruction = $data['system_instruction'] ?? null;
        $message           = $data['message'] ?? null;
        if (!$data || $systemInstruction === null || $message === null) {
            JsonResponse::error('Eksik veri!', 400, AppConfig::ERR_VALIDATION);
        }
```

Satır 183-184'teki yorum sorunu **açıkça kabul ediyor**: *"consumeMessage's daily coin budget
is a separate endpoint the client may simply not call."*

**Kanıt (bölüm 24 — coin kontrolünün başka bir katmanda olup olmadığı arandı):**

```
$ grep -n 'consumeMessage\|coin_engine\|getOrInitCoinBalance\|getActivePurchaseCredit' \
      api/src/Presentation/Controllers/ChatController.php
183:        // quota, and nothing else throttled it — consumeMessage's daily coin
   → yalnızca YORUM. Tek bir çağrı yok.

$ Coin kontrolü yapan endpoint'ler:
api/api/message/consumemessage.php      → MessageController::consumeMessage
api/api/message/checkmessageallowance.php → MessageController::checkMessageAllowance (yalnızca OKUMA)
   → ikisi de istemcinin isteğine bağlı.

$ generateReply'ı koruyan tek şey:
ChatController.php:185   checkRateLimit(..., 'genreply:' . $userId, 20, 60)
   → 20 istek/dakika = 1200/saat = 28.800/gün
   → Amaçlanan limit: AppConfig::DAILY_FREE_MESSAGES = 10/gün
```

**Nasıl tetiklenebilir:** İstemci `POST /api/message/consumemessage.php` çağrısını hiç
yapmaz, doğrudan `POST /api/chat/generatereply.php` gönderir. Coin bakiyesi hiç azalmaz,
`chatbot_purchase_credits` hiç tüketilmez. Etkin limit 10/gün yerine 28.800/gün olur —
**2.880 kat.**

**Impact:** Ücretsiz katmanın tek kısıtı (günlük 10 mesaj) ve satın alınan bonus kredilerin
tüketim muhasebesi, ikisi de devre dışı. Gemini kotası/faturası korumasız. `coin_engine.php`'nin
titizlikle yazılmış atomik azaltma mantığı (satır 82-128) **hiçbir zorunlu yolda
çalışmıyor.**

**Dürüstlük notu:** Bu, Tur 2 SEC-015'in (`system_instruction` istemciden) kardeşi ve
raporun oradaki notunda "coin muhasebesiyle ilişkisi Tur 3" olarak işaretlenmişti. İkisi
aynı kök nedene bağlı: **`generateReply` botu tanımıyor.** `chatbot_id` istekte hiç yok,
bu yüzden `consumeMessage($db, $userId, $chatbotId)` çağrılamaz bile.

**Önerilen çözüm:** `generateReply`'ın isteğinden `chatbot_id` almak, `userHasAccess` ile
doğrulamak ve **Gemini çağrısından önce** `consumeMessage()`'ı sunucu tarafında çağırmak;
`allowed === false` ise 429/402 ile reddetmek. `consumemessage.php` endpoint'i o zaman
gereksiz hâle gelir (ya da yalnızca gösterim için `checkmessageallowance` kalır).

**Çözüm önceliği:** **Acil.**

---

### COIN-002

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** `getOrInitCoinBalance`'ın günlük sıfırlama yolu atomik değil — araya giren bir tüketim silinip kullanıcıya bedava mesaj veriyor

**Dosya:** `api/functions/coin_engine.php:22-80`

**Problem:**

Oku → karar ver → yaz dizisi, koşulsuz bir `UPDATE` ile bitiyor:

```php
api/functions/coin_engine.php:63-77
    if ($row['exhausted_at'] !== null) {
        $shouldReset = strtotime($row['exhausted_at']) <= (time() - 86400);
    } else {
        $lastReset   = is_string($row['last_reset_date']) ? substr($row['last_reset_date'], 0, 10) : null;
        $shouldReset = $lastReset !== $today;
    }

    if ($shouldReset) {
        $db->update(AppConfig::TABLE_COIN_BALANCES, [
            'coins_remaining' => AppConfig::DAILY_FREE_MESSAGES,
            'last_reset_date' => $today,
            'exhausted_at'    => null,
        ], 'user_id = ?', [$userId]);
        return ['coins_remaining' => AppConfig::DAILY_FREE_MESSAGES, 'exhausted_at' => null];
    }
```

`WHERE user_id = ?` — sıfırlamanın hâlâ gerekli olduğunu doğrulayan bir koşul yok
(`AND last_reset_date <> ?` gibi).

**Kanıt (bölüm 24 — aynı dosyanın tüketim yolunun bu sınıfı ÇÖZDÜĞÜ, sıfırlama yolunun
çözmediği doğrulandı):**

```php
api/functions/coin_engine.php:82-88 (docblock)
 * Both branches below decrement with an atomic
 * `UPDATE ... SET x = x - 1 WHERE x > 0` guarded by the affected row count,
 * rather than reading a value in PHP and writing back a computed one — two
 * concurrent requests racing on a read-then-write would otherwise both read
 * the same remaining count and both succeed, granting an extra free message
 * past what the user actually has left.
```

Tüketim doğru yapılmış (satır 111-120: `SET coins_remaining = coins_remaining - 1 WHERE ... > 0`
+ `rowCount()` kontrolü). Aynı akıl yürütme **sıfırlama** yoluna uygulanmamış.

Ayrıca ilk `INSERT` yolunda yarış **tanınmış ve çözülmüş**:

```php
api/functions/coin_engine.php:42-50 (yorum)
            // A concurrent first message from the same user (two tabs) beat us
            // to the INSERT. PRIMARY KEY(user_id) is what stopped the duplicate,
            ...
            // Deliberately NOT insert(..., updateOnDuplicate: true): that would
            // rewrite coins_remaining back to the daily allowance, and if the
            // winning request had already spent from it the loser would silently
            // hand out free messages.
```

Bu yorum tam olarak sıfırlama yolunda **gerçekleşen** senaryoyu anlatıyor ("coins_remaining'i
günlük hakka geri yazmak"), ama satır 71-75 tam olarak onu yapıyor.

**Nasıl tetiklenebilir (yarış dizisi):**
1. Gün değişmiş, `coins_remaining = 0`, `last_reset_date` = dün.
2. R1 satır 26'da satırı okur → `$shouldReset = true`.
3. R2 satır 26'da satırı okur → `$shouldReset = true`.
4. R2 sıfırlar → `coins_remaining = 10`. R2'nin `consumeMessage`'ı tüketir → 9.
5. R1 sıfırlar → `coins_remaining = 10`. **R2'nin tüketimi silindi.**

Her eşzamanlı çift için bir bedava mesaj. İki tarayıcı sekmesiyle tetiklenebilir.

**Impact:** Günlük mesaj limitinin aşılması. COIN-001 nedeniyle limit şu an hiç zorlanmadığı
için pratik etkisi şimdilik yok — ama COIN-001 düzeltildiğinde bu, kalan tek boşluk olur.

**Önerilen çözüm:** `UPDATE`'e koşul eklemek:
`... WHERE user_id = ? AND (last_reset_date <> ? OR (exhausted_at IS NOT NULL AND exhausted_at <= NOW() - INTERVAL 1 DAY))`
ve `rowCount()`'a göre dönüş değerini belirlemek — tüketim yolundaki desenin aynısı.

**Çözüm önceliği:** Orta (COIN-001 ile birlikte).

---

### COIN-003

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Coin sıfırlama penceresi PHP `time()`/`date()` ile MySQL `NOW()`'u karıştırıyor — iki sunucunun saat dilimi farklıysa 24 saatlik bekleme o fark kadar kayıyor

**Dosya:** `api/functions/coin_engine.php:23, 64, 114`

**Problem:** Üç farklı zaman kaynağı aynı karşılaştırmaya giriyor:

```php
api/functions/coin_engine.php:23           $today = date('Y-m-d');                 ← PHP saat dilimi
api/functions/coin_engine.php:64           $shouldReset = strtotime($row['exhausted_at']) <= (time() - 86400);
                                                          ↑ MySQL'in yazdığı değer, PHP olarak yorumlanıyor
api/functions/coin_engine.php:112-115
        'UPDATE ' . AppConfig::TABLE_COIN_BALANCES . '
         SET coins_remaining = coins_remaining - 1,
             exhausted_at = IF(coins_remaining - 1 = 0, NOW(), exhausted_at)   ← MySQL saat dilimi
         WHERE user_id = ? AND coins_remaining > 0'
```

`exhausted_at` MySQL `NOW()` ile yazılıyor (satır 114), sonra PHP `strtotime()` ile
okunuyor (satır 64) ve PHP'nin `time()`'ı ile karşılaştırılıyor.

**Kanıt (bölüm 24 — bu tam hatanın aynı kod tabanında BAŞKA bir yerde tanınıp çözüldüğü
doğrulandı):**

```php
api/src/Presentation/Controllers/AuthController.php:177-181 (yorum)
        // expires_at is computed by MySQL itself (NOW() + INTERVAL), not PHP's
        // date() — the app server and DB server can run in different
        // timezones (seen locally: PHP=UTC, MySQL=UTC+3), and comparing a
        // PHP-computed timestamp against MySQL's NOW() in a later query would
        // silently treat every code as already expired.
```

```php
api/src/Presentation/Controllers/MarketplaceController.php:177-182 (yorum)
        // Anchor expiry math to the DB server's clock, not PHP's — the app
        // server and DB server can run in different timezones (seen locally:
        // PHP=UTC, MySQL=UTC+3), ...
        $mysqlNowRow = $db->selectSingle('NOW() AS now_time');
        $mysqlNow    = strtotime($mysqlNowRow['now_time']);
```

Yani proje bu tuzağı **iki kez** tespit etmiş ve iki farklı yerde çözmüş
("PHP=UTC, MySQL=UTC+3" gözlemi gerçek bir ortamdan). `coin_engine.php` bu düzeltmeyi
almamış.

**Etki yönü:** MySQL PHP'den ileriyse (örnek: MySQL UTC+3, PHP UTC), `exhausted_at` 3 saat
ileride yazılır; `strtotime` onu PHP saat diliminde yorumlar → geçmiş 3 saat "henüz
olmamış" sayılır → 24 saatlik bekleme fiilen **27 saat** olur. Ters yönde 21 saat olur
(kullanıcı erken sıfırlanır).

Ayrıca satır 23'teki `$today = date('Y-m-d')` ile `last_reset_date` karşılaştırması: gün
sınırı PHP'nin saat dilimine göre, `exhausted_at` MySQL'in — iki kural farklı takvimlerde.

**Aynı hata ikinci bir yerde:**

```php
api/src/Presentation/Controllers/MessageController.php:17-19
            'retry_at' => (!$credit && (int) $balance['coins_remaining'] <= 0 && $balance['exhausted_at'])
                ? date('Y-m-d H:i:s', strtotime($balance['exhausted_at']) + 86400)
                : null,
```
Kullanıcıya gösterilen "tekrar dene" zamanı da aynı karışımdan geliyor.

**Impact:** Kullanıcı beklediğinden daha uzun (veya kısa) süre mesaj hakkı alamıyor;
gösterilen `retry_at` yanlış.

**Önerilen çözüm:** Karşılaştırmayı SQL'e taşımak:
`WHERE ... exhausted_at <= NOW() - INTERVAL 1 DAY`, ve `last_reset_date` karşılaştırması
için `CURDATE()` kullanmak. `MarketplaceController:181`'in `SELECT NOW()` deseni de
alternatif.

**Çözüm önceliği:** Orta.

---

### COIN-004

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı

**Başlık:** Başarısız bir AI isteğinden sonra tüketilen coin'i geri veren hiçbir yol yok

**Dosya:** `api/functions/coin_engine.php` (tamamı — iade fonksiyonu yok), `api/src/Presentation/Controllers/ChatController.php:253-271`

**Problem:** `generateReply` upstream hatasını yakalayıp SSE hata çerçevesi gönderiyor:

```php
api/src/Presentation/Controllers/ChatController.php:263-271
            // Never leak the upstream body (it can echo the API key back) —
            // send a stable code the client maps to its own wording.
            echo "event: error\n";
            echo 'data: ' . json_encode(
                ['error' => ['code' => $httpStatus ?: 502, 'status' => 'UPSTREAM_ERROR']],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ) . "\n\n";
            @flush();
        }
        exit;
```

Ama tüketilen coin'e dokunulmuyor.

**Kanıt (bölüm 24 — iade/geri alma fonksiyonu tüm projede arandı):**

```
$ grep -rniE 'refundCoin|restoreCoin|revertCoin|coins_remaining \+|credits_remaining \+' \
      api/ --include=*.php | grep -v vendor
(çıktı yok)

$ coin_engine.php'de tanımlı fonksiyonlar:
  getActivePurchaseCredit, getOrInitCoinBalance, consumeMessage,
  calculateMessageAllowance, grantPurchaseCredit
   → iade fonksiyonu YOK. Tek artırma yolu grantPurchaseCredit (satın alma) ve
     getOrInitCoinBalance'ın günlük sıfırlaması.
```

**Neden problem:** denetim.md bölüm 8 bu maddeyi açıkça soruyor: *"failed AI request sonrası
coin'in geri verilmesi"*. Sıralama açısından iki senaryo var ve **hangisinin geçerli olduğu
istemci koduna bağlı** (bu turda `chat/page.jsx` okunmadı — bkz. Doğrulanamayanlar):
- İstemci önce `consumemessage.php` çağırıp sonra `generatereply.php` çağırıyorsa: Gemini
  hatası kullanıcıya **coin kaybettiriyor**, cevap alamıyor.
- Tersi sıradaysa: başarısız cevap için coin harcanmıyor, ama başarılı cevap sonrası istemci
  çağrıyı atlayabilir (COIN-001).

**Impact:** Kullanıcının kendi hatası olmayan bir sunucu/kota hatasında hakkını kaybetmesi.
Ücretsiz katmanda 10 haktan biri; satın alınmış kredide parayla alınmış bir hak.

**Dürüstlük notu:** COIN-001 nedeniyle limit şu an hiç zorlanmadığından pratik etki bugün
yok. Bulgu, COIN-001 düzeltildikten sonra ortaya çıkacak tasarım boşluğunu işaretliyor —
sunucu tarafı tüketim uygulanırsa iade yolu da gerekecek.

**Önerilen çözüm:** COIN-001'in çözümüyle birlikte: tüketimi Gemini çağrısıyla aynı işlem
sınırına almak — çağrı başarısızsa `coins_remaining`/`credits_remaining` geri artırılmalı,
ya da tüketim başarılı yanıt sonrasına alınmalı (idempotency anahtarıyla).

**Çözüm önceliği:** Orta.

---

### COIN-005

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `consumeMessage` endpoint'i chatbot erişimini doğrulamıyor ve hak yetersizken de `success: true` dönüyor

**Dosya:** `api/src/Presentation/Controllers/MessageController.php:31-37`

**Problem:**

```php
api/src/Presentation/Controllers/MessageController.php:31-37
        $data      = json_decode($_POST['data'] ?? '', true) ?? null;
        $chatbotId = InputSanitizer::positiveInt($data['chatbot_id'] ?? 0);
        if (!$chatbotId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $result = consumeMessage(Database::getInstance(), $userId, $chatbotId);
        echo json_encode(array_merge(['success' => true], $result));
        exit;
```

İki kusur:
1. **Erişim kontrolü yok.** `$chatbotId` için `userHasAccess` çağrılmıyor. Kullanıcı
   erişimi olmayan bir bot id'si göndererek kendi günlük coin'ini harcayabilir. Zararı
   yalnızca kendisine olduğu için LOW.
2. **`success` her zaman `true`.** `consumeMessage()` `['allowed' => false, ...]`
   döndürdüğünde bile zarf `success: true` diyor. İstemci `result.success` kontrolü
   yaparsa hak bitmiş durumu fark etmez; `result.allowed`'a bakması gerekir.

**Kanıt (bölüm 24 — kardeş endpoint'in erişim kontrolü yapıp yapmadığı karşılaştırıldı):**

```
$ MessageController::checkMessageAllowance (satır 3-21) — aynı eksik:
  $chatbotId = InputSanitizer::positiveInt($_GET['chatbot_id'] ?? 0);
  ... getActivePurchaseCredit($db, $userId, $chatbotId);
   → userHasAccess çağrısı YOK.

$ Karşılaştırma — aynı projede doğru desen:
api/src/Presentation/Controllers/TrainingController.php:57
        if (!(new ChatbotRepository())->userHasAccess($botId, $userId)) {
```

**Impact:** Kendi hakkını boşa harcama (düşük); istemcide yanlış zarf yorumlaması.

**Önerilen çözüm:** `userHasAccess` kontrolü; `allowed === false` durumunda
`JsonResponse::error(..., 429, ERR_LIMIT_REACHED)`.

**Çözüm önceliği:** Düşük.

---

## 3. İŞ MANTIĞI (denetim.md bölüm 16)

---

### BIZ-001

**Severity:** 🔴 CRITICAL
**TÜR:** iş mantığı + prod blocker

**Başlık:** `upgradePlan` ücretli üyelik paketini **hiçbir ödeme almadan** yükseltiyor, plan adını doğrulamıyor, ve yazdığı kaydı hiçbir limit/kota okumuyor — dört ücretli paket fiyatlarıyla reklam edilirken hiçbiri işlev görmüyor

**Dosya:** `api/src/Presentation/Controllers/WalletController.php:219-289`, `api/src/Presentation/Controllers/UserController.php:13-14`, `api/functions/chatbot_limits.php:12-20`

**Fonksiyon/Class:** `WalletController::getPricing()` / `WalletController::upgradePlan()`

**Problem:**

Sunucu dört paketi fiyatlarıyla ilan ediyor:

```php
api/src/Presentation/Controllers/WalletController.php:231-244 (kesit)
            [
                'title'         => 'Gümüş',
                'monthly_price' => '₺149,00',
                ...
                'features'      => ['Artırılmış günlük mesaj hakkı', 'Daha fazla chatbot oluşturma limiti', 'Öncelikli destek'],
            ],
            [
                'title'         => 'Altın',
                'monthly_price' => '₺299,00',
                ...
            ],
            [
                'title'         => 'Elmas',
                'monthly_price' => '₺599,00',
```

Yükseltme endpoint'inde ödeme adına hiçbir şey yok:

```php
api/src/Presentation/Controllers/WalletController.php:266-289
    public static function upgradePlan(): void {
        require_method('POST');
        $userId   = AuthMiddleware::requireAuth();
        $data     = json_decode($_POST['data'] ?? '', true) ?? null;
        $planName = InputSanitizer::string($data['plan_name'] ?? '', 30);

        if (!$planName) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();
        $db->ensureTable('user_plan_selection', 'CREATE TABLE IF NOT EXISTS user_plan_selection (...)');
        $db->insert('user_plan_selection', [
            'user_id'     => $userId,
            'plan_name'   => $planName,
            'selected_at' => date('Y-m-d H:i:s'),
        ], true);

        JsonResponse::success(['message' => 'Üyelik paketiniz güncellendi.', 'plan_name' => $planName]);
    }
```

**Kanıt (bölüm 24 — dört ayrı soru tek tek arandı):**

```
1) chargeCard / ödeme çağrısı var mı?
$ grep -cE 'chargeCard|checkout_payments|param_marketplace' <upgradePlan gövdesi 266-289>
0    → ödeme YOK.

2) plan_name doğrulanıyor mu?
   InputSanitizer::string($data['plan_name'] ?? '', 30)  → yalnızca 30 karaktere kırpıyor.
   getPricing'in dört başlığıyla karşılaştıran bir kontrol YOK. "Süper Elmas Pro" da geçer.

3) Yazılan kaydı kim okuyor?
$ (Grep) user_plan_selection|plan_name    tüm repo
api/src/Presentation/Controllers/UserController.php:13-14
        $planRow  = $db->selectSingle('plan_name FROM user_plan_selection WHERE user_id = ?', [$userId]);
        $planName = $planRow['plan_name'] ?? 'Ücretsiz Plan';
   → TEK okuyucu: dashboard başlığında gösterim. Hiçbir limit/kota okumuyor.

4) Limitler planı hesaba katıyor mu?
api/functions/chatbot_limits.php:12-20
    function getIndependentBotLimit(Database $db, int $userId): int {
        // TODO: query user plan table when plans are active on prod.
        return AppConfig::FREE_INDEPENDENT_BOT_LIMIT;      ← her zaman 1
    }
    function getPublicBotLimit(Database $db, int $userId): int {
        // TODO: query user plan table when plans are active on prod.
        return AppConfig::FREE_PUBLIC_BOT_LIMIT;           ← her zaman 2
    }
$ grep -n 'DAILY_FREE_MESSAGES' api/functions/coin_engine.php
32, 36, 72, 76   → hepsi koşulsuz AppConfig sabiti; plana bakan dal YOK.
```

**Nasıl tetiklenebilir:**

```
POST /api/wallet/upgradeplan.php
data={"plan_name":"Elmas"}
→ 200 {"success":true,"message":"Üyelik paketiniz güncellendi.","plan_name":"Elmas"}
→ dashboard başlığı artık "Elmas" gösteriyor (UserController:14)
→ bot limiti hâlâ 1/2, günlük mesaj hâlâ 10
```

**Neden CRITICAL — iki yönlü zarar:**
1. **Ücretsiz yükseltme.** Ödeme entegrasyonu bağlandığı anda bu endpoint bir gelir deliği
   olur. Bugün bile "Elmas" etiketi ücretsiz alınabiliyor.
2. **Ödeme alınırsa hiçbir şey verilmiyor.** `getPricing` "Sınırsız mesaj hakkı",
   "Sınırsız chatbot oluşturma" vaat ediyor (satır 256). `chatbot_limits.php` ve
   `coin_engine.php` bu vaatlerin hiçbirini karşılamıyor. Yani akış tersine kurulsa
   (ödeme alınsa) kullanıcı **parayı ödeyip hiçbir şey almaz**. Tüketici hukuku açısından
   da sorunlu.

`AppConfig`'te `PRODUCER_INDEPENDENT_LIMIT = 10` ve `PRODUCER_PUBLIC_LIMIT = 20` sabitleri
tanımlı ama hiç okunmuyor:

```
$ grep -rn 'PRODUCER_INDEPENDENT_LIMIT\|PRODUCER_PUBLIC_LIMIT' api/ --include=*.php | grep -v vendor
api/src/Shared/Constants/AppConfig.php:18
api/src/Shared/Constants/AppConfig.php:19
   → yalnızca tanım. Hiçbir kullanım yok.
```

**Impact:** Ödeme almadan ücretli katman etiketi; ödeme alınsaydı karşılıksız satış.
Fiyatlandırma sayfasının tamamı işlevsiz.

**Önerilen çözüm:** Kısa vadede en dürüst hamle `upgradePlan`'ın **başarısız dönmesi** —
`producer_plan.php:12-15`'in doğru yaptığı şey:
```php
return ['success' => false, 'message' => '... henüz bu ortamda desteklenmiyor (dev stub).'];
```
Orta vadede: `plan_name`'i `getPricing` başlıklarıyla doğrulamak, `chargeCard` üzerinden
ödeme almak, ve `chatbot_limits.php` + `coin_engine.php`'nin planı gerçekten okuması.

**Çözüm önceliği:** **Acil** (en azından endpoint'in devre dışı bırakılması).

---

### BIZ-002

**Severity:** 🟠 HIGH
**TÜR:** prod blocker + iş mantığı

**Başlık:** `chatbot_limits.php` kullanıcının planını hiç sorgulamıyor — dosyanın kendi başlık yorumu bunun production'da gerçek mantıkla değiştirilmesi gerektiğini söylüyor

**Dosya:** `api/functions/chatbot_limits.php:1-24`

**Problem:**

```php
api/functions/chatbot_limits.php:1-20
<?php
/**
 * Chatbot limit helpers.
 * These functions check the user's subscription/plan to determine how many
 * bots they are allowed to create.
 *
 * NOTE: This file must be present on the production server with real plan logic.
 * The implementations below are development stubs that apply the free-tier limits
 * defined in AppConfig so local development and tests work without a plan table.
 */

function getIndependentBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_INDEPENDENT_BOT_LIMIT;
}

function getPublicBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_PUBLIC_BOT_LIMIT;
}
```

Docblock "These functions check the user's subscription/plan" diyor; gövdeler `$db` ve
`$userId` parametrelerini **hiç kullanmıyor**.

**Kanıt (bölüm 24 — bu fonksiyonların gerçekten kritik karar noktalarında kullanıldığı
doğrulandı):**

```
$ grep -rn 'getIndependentBotLimit\|getPublicBotLimit' api/ --include=*.php | grep -v vendor
api/functions/chatbot_limits.php:12,17                                    ← tanım
api/src/Presentation/Controllers/ChatbotController.php:38   ← saveChatbot: limit kontrolü
api/src/Presentation/Controllers/ChatbotController.php:184  ← publishChatbot: limit kontrolü
api/src/Presentation/Controllers/ChatbotController.php:231  ← getChatbotLimits: arayüze gösterim

$ Bu limitlere dayanan reddetme mesajı:
api/src/Presentation/Controllers/ChatbotController.php:43-48
            JsonResponse::error(
                $isIndependent
                    ? 'Ücretsiz bağımsız chatbot hakkınızı kullandınız.'
                    : 'Ücretsiz herkese açık chatbot hakkınızı kullandınız.',
                422, AppConfig::ERR_LIMIT_REACHED
            );
   → Mesaj "Ücretsiz ... hakkınızı" diyor; ücretli kullanıcı da aynı mesajı alır.

$ countUserChatbots kullanılıyor mu?
$ grep -rn 'countUserChatbots' api/ --include=*.php | grep -v vendor
api/functions/chatbot_limits.php:22    ← yalnızca tanım
   → ÖLÜ FONKSİYON. Sayım işini ChatbotRepository::countByOwner yapıyor.
```

**Neden ayrı bir bulgu (BIZ-001'den farkı):** BIZ-001 ödemenin alınmamasıyla ilgili;
bu bulgu **ödeme alınsa bile hakkın verilmeyecek olmasıyla** ilgili. İkisi bağımsız olarak
düzeltilmeli. `PRODUCER_INDEPENDENT_LIMIT = 10` / `PRODUCER_PUBLIC_LIMIT = 20` sabitleri
tam olarak bu fonksiyonlar için tanımlanmış ve hiç okunmuyor.

**Impact:** Ücretli plan sahibi kullanıcı 1 bağımsız + 2 herkese açık bot sınırında kalır.
`getChatbotLimits` arayüze de bu değerleri gönderdiği için kullanıcı yükseltmesinin hiçbir
etkisini görmez.

**Önerilen çözüm:** Fonksiyonların `user_plan_selection` (ya da `plans`/`plan_icerikler` —
şemada mevcut) tablosunu okuyup plana göre `PRODUCER_*` sabitlerini döndürmesi.
`countUserChatbots`'ın ya kullanılması ya silinmesi.

**Çözüm önceliği:** Yüksek — BIZ-001 ile birlikte.

---

### BIZ-003

**Severity:** 🟡 MEDIUM
**TÜR:** prod blocker + iş mantığı

**Başlık:** `producer_plan.php`'nin iki fonksiyonu da stub — üretici hesabı özelliği arayüzde varken uçtan uca çalışmıyor

**Dosya:** `api/functions/producer_plan.php:10-26`, `api/src/Presentation/Controllers/MarketplaceController.php:407-431`

**Problem:**

```php
api/functions/producer_plan.php:10-26
function buyProducerAccount(Database $db, array $data): array {
    error_log('[producer_plan-stub] buyProducerAccount called');
    return [
        'success' => false,
        'message' => 'Üretici hesabı satın alma işlemi henüz bu ortamda desteklenmiyor (dev stub).',
    ];
}

function getProducerPlanStatus(Database $db, int $userId): array {
    error_log("[producer_plan-stub] getProducerPlanStatus userId=$userId");
    return [
        'has_plan'    => false,
        'plan_name'   => null,
        'expiry_date' => null,
        'status'      => 'none',
    ];
}
```

**Kanıt (bölüm 24 — arayüzde gerçekten var mı, ve endpoint'lerin canlı olup olmadığı):**

```
$ Tur 1 envanterinden — frontend bileşeni VAR:
web/src/features/purchasing/BuyProducerAccountModal.jsx
   (Tur 1 DEAD-002'de "kullanılıyor" olarak doğrulandı:
    app/dashboard/chatbots/create/page.jsx import ediyor)

$ Endpoint'ler canlı mı?
api/api/marketplace/buyproduceraccount.php   → MarketplaceController::buyProducerAccount
api/api/marketplace/getproducerplanstatus.php → MarketplaceController::getProducerPlanStatus
   → Tur 1 DEAD-001'de getproducerplanstatus frontend'den ÇAĞRILIYOR olarak listelenmişti;
     buyproduceraccount da çağrılıyor (Tur 1 fe_refs listesinde var).
```

**Neden problem:** `buyProducerAccount` **her zaman başarısız** döndüğü için — bu aslında
doğru stub davranışı (BIZ-001'in `upgradePlan`'ının yapmadığı şey). Ama sonuç:
- Kullanıcı `BuyProducerAccountModal`'ı açar, satın almaya çalışır, her seferinde
  "bu ortamda desteklenmiyor" hatası alır.
- `getProducerPlanStatus` her zaman `'none'` döndüğü için hiçbir kullanıcı üretici planına
  sahip görünmez.
- Bu, BIZ-002'deki `PRODUCER_*` limitlerinin neden hiç kullanılmadığını da açıklıyor:
  üretici planı hiç var olamıyor.

**Impact:** Arayüzde tanıtılan bir özellik hiçbir zaman tamamlanamıyor. denetim.md
bölüm 21'in ("gerçekte çalışmayan özellikler") kapsamına giriyor — tam liste **Tur 7**'de.

**Dürüstlük notu:** README bu dosyayı "Development stubs" tablosunda listeliyor
(`README.md:707-719`) ve davranışı doğru anlatıyor. MEDIUM verilmesinin nedeni: fail-closed
olduğu için para/veri riski yok, yalnızca özellik eksikliği.

**Önerilen çözüm:** Ya gerçek implementasyon, ya arayüzden kaldırma. Arada kalması
kullanıcıyı çalışmayan bir akışa sokuyor.

**Çözüm önceliği:** Orta.

---

### BIZ-004

**Severity:** 🟡 MEDIUM
**TÜR:** mimari + güvenlik

**Başlık:** `BaseRepository`'de sütun beyaz listesi yok ve `Database::insert`'in sütun-adı doğrulaması buraya taşınmamış — Tur 2'nin SEC-002/003/014 bulguları tam olarak geçerli

**Dosya:** `api/src/Infrastructure/Database/BaseRepository.php:41-63`

**Bu bulgu Tur 2'nin devrettiği ilk iştir.** Tur 2, SEC-002 (abonelik süresi uzatma),
SEC-003 (publish gate bypass) ve SEC-014 (beş endpoint'te mass assignment) bulgularının
tamamının `self::insert`/`self::update` üzerinden geçtiğini not edip, bu sınıfta ek bir
filtre bulunması hâlinde üç bulgunun zayıflayacağını yazmıştı. **Filtre yok.**

**Problem:**

```php
api/src/Infrastructure/Database/BaseRepository.php:41-63
    protected static function insert(string $table, array $data): int {
        $cols         = array_keys($data);
        $placeholders = implode(', ', array_map(fn($c) => ":$c", $cols));
        $colList      = implode(', ', $cols);
        $sql          = "INSERT INTO `$table` ($colList) VALUES ($placeholders)";
        $stmt         = self::pdo()->prepare($sql);
        $stmt->execute($data);
        return (int) self::pdo()->lastInsertId();
    }
    ...
    protected static function update(string $table, array $data, string $where, array $whereParams = []): int {
        $setParts = implode(', ', array_map(fn($c) => "`$c` = :$c", array_keys($data)));
        $sql      = "UPDATE `$table` SET $setParts WHERE $where";
        $stmt     = self::pdo()->prepare($sql);
        $stmt->execute(array_merge($data, $whereParams));
        return $stmt->rowCount();
    }
```

Sütun listesi doğrudan `array_keys($data)`'dan geliyor; ne beyaz liste ne tanımlayıcı
doğrulaması var.

**Kanıt (bölüm 24 — kardeş sınıftaki korumanın varlığı ve buradaki yokluğu):**

```
$ Database sınıfı sütun adını DOĞRULUYOR:
api/functions/db.php:362-371
    private static function assertSafeColumnName($key) {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', (string) $key)) {
            throw new Exception('Geçersiz sütun adı: ' . $key);
        }
    }
    public function insert($table, $data, $updateOnDuplicate = false) {
        foreach (array_keys($data) as $key) {
            self::assertSafeColumnName($key);
        }

$ BaseRepository DOĞRULAMIYOR:
$ grep -cE 'assertSafeColumnName|preg_match|allowed|whitelist' api/src/Infrastructure/Database/BaseRepository.php
0

$ İstemci verisinin BaseRepository'ye ulaştığı yol:
ChatbotController::saveChatbot:61   $repo->create($data)
  → ChatbotRepository::create:  return self::insert(self::T, $data);
  → BaseRepository::insert
   → $data hâlâ istemcinin ham JSON'u (Tur 2 SEC-003'te doğrulandı).
```

Ayrıca `db.php:353-360`'daki yorum, korumanın **neden** eklendiğini anlatıyor:

```php
api/functions/db.php:353-360
    /**
     * insert()/update() build their column list from array_keys($data), and
     * many controllers pass a client-supplied JSON object straight through
     * as $data (e.g. NoteController::addDialogBook, ChatController, ...).
     * Only the values were ever parameterized — a key containing a backtick
     * breaks out of the `$key` identifier quoting and injects arbitrary SQL
     * via the column list itself. ...
     */
```

Aynı gerekçe `BaseRepository` için de birebir geçerli — hatta daha fazlası: satır 44'te
`$colList` **hiç backtick ile sarılmıyor** (`Database::insert` en azından sarıyor).

**SQL enjeksiyonu mu? Dürüst cevap: hayır, ama tesadüfen.** Sütun adı aynı zamanda PDO
adlandırılmış parametre olarak da kullanılıyor (`":$c"`). Bozuk bir tanımlayıcı gönderildiğinde
`prepare()` geçersiz bir placeholder yüzünden `PDOException` fırlatıyor — yani enjeksiyon
değil, **500 hatası** oluşuyor. Koruma tasarımdan değil, isim çakışmasından geliyor.

**Impact:**
1. Tur 2 SEC-002 (🔴), SEC-003 (🟠) ve SEC-014 (🟡) **tam olarak geçerli** — hiçbiri
   zayıflamıyor.
2. Kimlik doğrulanmış bir kullanıcı bozuk sütun adı göndererek 500 üretebilir (düşük).
3. Sertleştirme asimetrisi: iki paralel veritabanı erişim katmanından biri korumalı,
   diğeri değil. Yeni kod hangisini kullanırsa o kadar korunuyor.

**Önerilen çözüm:** `assertSafeColumnName` eşdeğerini `BaseRepository::insert/update`'e de
eklemek (asgari); doğrusu her repository'nin kendi yazılabilir sütun beyaz listesini
tanımlaması — `WalletController::saveBankInfo:150-156`'daki desen.

**Çözüm önceliği:** Orta — ama SEC-002/003 düzeltilirken zaten dokunulacak.

---

### BIZ-005

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `countUserChatbots` tanımlı ama hiç çağrılmıyor; aynı sayımı yapan `countByOwner` farklı bir sorgu kullanıyor

**Dosya:** `api/functions/chatbot_limits.php:22-24`, `api/src/Infrastructure/Repositories/ChatbotRepository.php:54-66`

**Problem:** İki ayrı sayım implementasyonu var, biri ölü:

```php
api/functions/chatbot_limits.php:22-24
function countUserChatbots(Database $db, int $userId, int $isIndependent): int {
    return $db->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ? AND is_independent = ?', [$userId, $isIndependent]);
}
```

```php
api/src/Infrastructure/Repositories/ChatbotRepository.php:54-66
    public function countByOwner(int $ownerId): array {
        $row = self::one(
            'SELECT
                SUM(is_independent = 1) AS independent_count,
                SUM(is_independent = 0) AS public_count
             FROM `chatbotlar` WHERE author_user_id = ?',
            [$ownerId]
        );
        return [
            'independent' => (int) ($row['independent_count'] ?? 0),
            'public'      => (int) ($row['public_count'] ?? 0),
        ];
    }
```

**Kanıt:**

```
$ grep -rn 'countUserChatbots' api/ --include=*.php | grep -v vendor
api/functions/chatbot_limits.php:22    ← yalnızca tanım

$ grep -rn 'countByOwner' api/ --include=*.php | grep -v vendor
api/src/Infrastructure/Repositories/ChatbotRepository.php:54           ← tanım
api/src/Domain/Interfaces/ChatbotRepositoryInterface.php:18            ← arayüz
api/src/Presentation/Controllers/ChatbotController.php:39, 185, 232    ← 3 kullanım
```

**Not — sayım ölçütü aynı:** İkisi de `author_user_id` kullanıyor, `owner_user_id`
kullanmıyor. Bu tutarlı: `buyChatbot` (sahiplik transferi) Tur 2'de devre dışı olarak
doğrulandığından `owner_user_id` her zaman `author_user_id`'ye eşit. Yani ölçüt farkından
kaynaklanan bir hata **yok** — bulgu yalnızca ölü kod.

**Impact:** Bakım gürültüsü; ileride limit mantığı değiştirilirken yanlış fonksiyonun
düzenlenmesi riski (BIZ-002'nin çözümü tam olarak bu dosyaya dokunacak).

**Önerilen çözüm:** `countUserChatbots`'ı silmek, ya da BIZ-002 çözülürken `countByOwner`'ı
çağıracak şekilde yeniden kullanmak.

**Çözüm önceliği:** Düşük.

---

## 4. ELENEN FALSE POSITIVE'LER (denetim.md bölüm 24)

| Aday | Neden bulgu değil | Doğrulama |
| --- | --- | --- |
| `duration_weeks = 52` ile "bir yıllık erişimi aylık fiyata almak" | Erişim süresi `$isMonthly` dalında **30 güne sabitlenmiş**; 52 hafta talebi 30 gün veriyor. Alıcının aleyhine, istismar değil | `MarketplaceController.php:236` → `$days = $isMonthly ? AppConfig::SUBSCRIPTION_MONTHLY : ...` (= 30) |
| İstemcinin gönderdiği fiyatla ödeme yapılması | Fiyat **her zaman** DB'den okunuyor; `$data['items']`'tan yalnızca `chatbot_id` ve `duration_weeks` alınıyor | `MarketplaceController.php:202-227` — `$bot` sorgusu `ucret_haftalik`/`ucret_aylik`'i DB'den çekiyor, `linePrice` onları kullanıyor |
| Aylık indirimin iki kez uygulanması | Geçmişte gerçek bir bug'mış, **düzeltilmiş**: `ucret_aylik` olduğu gibi kullanılıyor | `MarketplaceController.php:43-47` yorumu + `linePrice:71` (`$monthly` üzerinde çarpım yok) |
| Sepet ile ödeme ekranının farklı tutar göstermesi | Tek kaynağa indirilmiş: `getCart` ve `createSubscription` ikisi de `linePrice`'ı çağırıyor | `MarketplaceController.php:36-41` yorumu (216,00 vs 135,00 TL vakası) + `:97` ve `:223` çağrıları |
| `consumeMessage`'da coin azaltma yarışı | **Atomik**: `UPDATE ... SET x = x - 1 WHERE x > 0` + `rowCount()` kontrolü | `coin_engine.php:95-101` ve `:111-120` |
| İlk coin satırı oluşturulurken yarış | Tanınmış ve çözülmüş: `PRIMARY KEY(user_id)` + Duplicate yakalayıp yeniden okuma; `updateOnDuplicate` bilinçli olarak KULLANILMAMIŞ | `coin_engine.php:37-55` ve yorumu 42-50 |
| `withdraw()`'da bakiye yarışı | `GET_LOCK` + transaction + bakiye kontrolü var | `WalletController.php:96-124` (Tur 2'de de doğrulanmıştı) |
| Abonelik süresinin PHP saatiyle hesaplanması | DB saatine sabitlenmiş | `MarketplaceController.php:177-182` → `SELECT NOW()` ile `$mysqlNow` |
| `createSubscription`'ın sepeti doğrulamadan güvenmesi | Her kural yeniden kontrol ediliyor: `is_independent`, `seller_status`, `$price > 0` | `MarketplaceController.php:195-234` + yorumu 195-201 (ORD-2041EEC4 / 0,00 TL vakası) |
| Fiyatsız (NULL) botun 0 TL'ye satılması | Kapatılmış | `MarketplaceController.php:231-234` → `if ($price <= 0) rollBack + 422` |
| `reconcile()` sırrının zayıf karşılaştırılması | `hash_equals` + fail-closed + ayırt edilemez yanıt | `SellerController.php:208-214` |
| `refund()`'un yetkisiz erişime açık olması | `AuthMiddleware::requireAdmin()` var | `SellerController.php:222` |
| `countByOwner`'ın `owner_user_id` yerine `author_user_id` kullanması | Sahiplik transferi devre dışı olduğundan ikisi her zaman eşit | `MarketplaceController.php:155-157` (`buyChatbot` → 410) |
| pricing.js ↔ AppConfig sabitlerinin ayrışması | Beş sabit ve iki formül **birebir aynı** | `pricing.js:13,17,18,24,25,30-32,39-43` ↔ `AppConfig.php:49,50,51,61,62` + `coin_engine.php:133-141` |

---

## 5. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**Fiyat manipülasyonu.** Bu turun en olumlu alanı. denetim.md'nin *"kullanıcı browser'dan
fiyatı değiştirirse ne olur?"* sorusunun cevabı: hiçbir şey. `createSubscription` fiyatı
istemciden hiç almıyor, `chatbot_id`'den DB'ye gidip okuyor; `getCart` ile checkout aynı
`linePrice()` fonksiyonundan geçiyor; sıfır/NULL fiyat reddediliyor; aylık indirim tam olarak
bir kez uygulanıyor. Bu düzeltmelerin her birinin yanında hangi gerçek vakadan çıktığını
anlatan bir yorum var (216,00 TL gösterilip 135,00 TL tahsil edilmesi; ORD-2041EEC4'ün 0,00
TL'lik satışı). Kalan boşluk fiyatın **belirlenmesi** tarafında: haftalık ile aylık arasındaki
ilişki sunucuda hiç doğrulanmıyor (PAY-009) ve Tur 2 SEC-003'teki mass assignment fiyat
doğrulamasını tamamen atlatabiliyor.

**Eşzamanlılık ve atomiklik.** İki uçlu. `withdraw()` ve `consumeMessage()` örnek niteliğinde:
adlandırılmış MySQL kilidi, transaction, `UPDATE ... WHERE x > 0` + `rowCount()` kontrolü, ve
her birinin yanında yarışın nasıl oluştuğunu anlatan yorumlar. Buna karşılık checkout'un
kendisinde ne idempotency anahtarı, ne rate limit, ne kilit var (PAY-008) — yani para
endpoint'i, coin endpoint'inden daha az korunuyor. Daha ciddisi PAY-004: transaction'ın
içinde çalışan `ALTER TABLE`, MySQL'in örtük commit'i nedeniyle satır 184-188'de kurulan
atomiklik güvencesini sessizce iptal ediyor — yorumun çözdüğünü söylediği sorun geri geliyor.

**Coin sistemi.** `coin_engine.php` tek başına okunduğunda bu kod tabanının en iyi
dosyalarından biri: atomik azaltma, iki ayrı yenileme kuralının ayrıştırılması, ilk-insert
yarışının `updateOnDuplicate` tuzağıyla birlikte tartışılması. Ama tüm bu titizlik **hiçbir
zorunlu yolda çalışmıyor** (COIN-001): `generateReply` `consumeMessage`'ı çağırmıyor, ve
çağırması da mümkün değil çünkü istekte `chatbot_id` yok. Etkin limit 10/gün yerine
28.800/gün. Dosyanın kendi yorumu bunu kabul ediyor ama düzeltilmemiş. Bu, denetimin bulduğu
en net "mühendislik doğru, bağlantı eksik" örneği.

**Satıcı ve ödeme yaşam döngüsü.** Buradaki sorunlar kod kalitesi değil, **tamamlanmamış
durum makineleri**. `param_marketplace_details.status` şemada beş durumlu bir yaşam döngüsü
tanımlıyor (`pending_approval → approved → ... → refunded`); kod ilk durumu hiç kullanmıyor,
son duruma da hiçbir zaman geçmiyor. `para_cekme_talepleri.durum` yalnızca `beklemede` olarak
yazılıyor ve onu güncelleyen tek bir satır yok — tablo admin CRUD beyaz listesinde de olmadığı
için satıcı ödemesinin terminal durumu **mimari olarak erişilemez** (PAY-006). Sonuç: satıcı
bakiyesi talep açıldığı anda düşüyor, para hiç gelmiyor, talep iptal edilemiyor. Buna
`processRefund`'un sahte başarısı (PAY-012) eklenince, para akışının üç yönünden (tahsilat,
iade, ödeme) hiçbiri uçtan uca tamamlanmış değil.

**Plan / ücretli katman.** Bu alanın tamamı vaat düzeyinde. `getPricing` dört paketi
₺149/₺299/₺599 fiyatlarıyla ve "Sınırsız mesaj hakkı", "Sınırsız chatbot oluşturma"
vaatleriyle ilan ediyor; `upgradePlan` bunu ödeme almadan yazıyor; yazdığı kaydı yalnızca
dashboard başlığı okuyor; `chatbot_limits.php` ve `coin_engine.php` planı hiç sormuyor;
`PRODUCER_INDEPENDENT_LIMIT`/`PRODUCER_PUBLIC_LIMIT` sabitleri tanımlı ama hiç okunmuyor;
`producer_plan.php` üretici planını her zaman "yok" gösteriyor. Yani ücretli katman **her
katmanda** eksik ve katmanlar birbirini tutmuyor. İlginç bir asimetri: `producer_plan.php`
fail-closed davranıyor (her zaman başarısız — doğru stub davranışı), `upgradePlan` ise
fail-open (her zaman başarılı, ödeme almadan). Aynı projede aynı sorunun iki farklı ele alınışı.

**Stub'ların çevresindeki kod.** Turun ana örüntüsü bu. README stub'ları dürüstçe listeliyor
ve her stub dosyası kendini stub ilan ediyor — bu iyi. Sorun, **çevresindeki kodun stub
olduğunu bilmemesi**: `chargeCard`'ın simüle edilmiş `true`'su `status='paid'` ve
`status='approved'` yazan satırlara dönüşüyor, `approved` çekilebilir bakiyeye dönüşüyor,
ve `withdraw()` o bakiyeye karşı gerçek bir para çekme talebi açıyor. Stub'ın belgelenmiş
olması bu zincirin kurulmasını meşrulaştırmıyor. Şemanın `pending_approval` varsayılanı tam
olarak bu ayrımı yapmak için tasarlanmış ve kod onu atlıyor — en somut düzeltme fırsatı burada.

---

## 6. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| İstemcinin `consumemessage.php` ile `generatereply.php` çağrılarını hangi **sırayla** yaptığı (COIN-004'ün hangi yönde etki ettiği) | `web/src/app/dashboard/chat/page.jsx` bu turda okunmadı (Tur 4/6 kapsamı). Sıra bilinmeden "coin harcanıp cevap alınamıyor" mu "cevap alınıp coin harcanmıyor" mu olduğu söylenemez. |
| `param_marketplace_payments`'ın `items_json`, `seller_splits_json`, `product_amount` sütunlarının canlı veritabanında var olup olmadığı | Kod bunları `paymentsColumnExists()` ile koşullu yazıyor (`MarketplaceController.php:309-318`); `schema.sql`'de bu tabloyu incelemedim (yalnızca `param_marketplace_details` okundu). PAY-011'in "kalem başına brüt geri hesaplanamıyor" iddiası bu sütunların yokluğu varsayımına dayanıyor. |
| PAY-004'teki örtük commit'in gerçekten oluştuğu | MySQL/InnoDB'nin DDL'de örtük commit yaptığı belgeli davranış, ama bu kurulumda çalıştırarak doğrulanmadı (sunucu başlatılmadı). |
| `chargeCard`'ın production'da gerçekten farklı davrandığı | Dosyanın yorumu "production calls the real Param POS charge here" diyor; production kodu bu repoda yok. PAY-001 çalışma ağacındaki hâli denetliyor. |
| `plans` / `plan_icerikler` tablolarının içeriği ve `getPricing`'in neden onları okumadığı | İki tablo `schema.sql`'de var (Tur 1'de 50 tablo listesinde görüldü) ama sütunları bu turda okunmadı. `getPricing`'in sabit dizi döndürmesi bilinçli mi yoksa eksik mi, belirlenemedi → **Tur 5**. |
| `SellerController::register/status/update/delete/list`'in satıcı KYC durumunu nasıl yönettiği | Yalnızca `reconcile`, `refund`, `paramposCallback` okundu (satır 195-240). `param_marketplace_sellers.status`'un `'active'` olma koşulu doğrulanmadı — PAY-002'nin "yazarı aktif satıcı" dalının ne kadar kolay sağlandığı bilinmiyor. |
| `ParamPosMarketplace.php` içeriği | Okunmadı. README "her sub-merchant ve il/ilçe metodu başarısızlık veya boş liste döndürüyor" diyor; doğrulanmadı → **Tur 7**. |
| `chatbot_purchase_credits.expires_at`'in abonelik yenilendiğinde ne olduğu | PAY-003 nedeniyle ikinci satın alma hiç gerçekleşemediği için bu yol test edilemez durumda. |
| `api/admin/error_log` içeriğinin ödeme/coin verisi taşıyıp taşımadığı (PAY-015'in etkisi) | Tur 2'den devredilen soru; içerik kasıtlı olarak okunmadı (rapora sır yazmamak için). Hâlâ açık. |

---

## 7. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Ödeme/satıcı tarafı — kritik boşluklar:**
- **`api/functions/ParamPosMarketplace.php` — hiç okunmadı.** Ödeme ağ geçidi istemcisi.
  PAY-001 ve PAY-007'nin production karşılığı buradan geçecek.
- **`SellerController.php`'nin 9 metodu okunmadı** (`register`, `list`, `listRemote`,
  `update`, `delete`, `resubmit`, `status`, `listIller`, `listIlceler`). `register` 106
  satır ve satıcı KYC'sinin tek kapısı — PAY-002'nin ikinci dalı (`pms.status = 'active'`)
  buna bağlı.
- `MarketplaceController::buyProducerAccount` ve `getProducerPlanStatus` gövdeleri
  (satır 407-431) yalnızca stub çağrısı olarak grep'lendi, okunmadı.
- `WalletController::getMyPayments` (171-191) ve `getMySubscriptions` (192-218) okunmadı —
  ödeme geçmişi gösterimi ve abonelik listesi.
- `WalletController::getSubscription` (291-320) yalnızca ilk 10 satırı okundu.

**Coin/limit tarafı:**
- `ChatbotController::getChatbotLimits` (226-245) okunmadı — BIZ-002'nin arayüze ne
  gösterdiği doğrulanmadı.

**Şema:**
- `param_marketplace_payments` tablosunun sütun tanımı okunmadı (PAY-011 ve
  Doğrulanamayanlar'daki ilgili madde bundan).
- `plans`, `plan_icerikler`, `producer_plans`, `producer_self_use_credits`,
  `param_marketplace_refunds`, `param_marketplace_alerts`, `param_marketplace_soap_log`
  tabloları hiç incelenmedi → **Tur 5**. Bunlardan `producer_plans` ve
  `producer_self_use_credits`'in varlığı BIZ-003'ün "üretici planı hiç var olamıyor"
  tespitiyle çelişebilir — şemada tablo var, kodda kullanım yok.

**Frontend (bilinçli olarak Tur 4/6'ya bırakıldı):**
- `web/src/app/dashboard/checkout/page.jsx` — ödeme formu, kart doğrulaması, `items[]`
  payload'ının nasıl kurulduğu.
- `web/src/features/purchasing/BuyModal.jsx` — bonus kredi tanıtımı, `duration_weeks`
  seçimi.
- `web/src/app/dashboard/upgrade/page.jsx` — yalnızca satır 119 grep'lendi
  (`plan_name: planTitle`).
- `web/src/app/dashboard/wallet/*` — bakiye ve çekim arayüzü.
- `web/src/app/dashboard/chat/page.jsx` — COIN-004'ün yönünü belirleyecek dosya.

### Bölüm bazında boş kalan maddeler

**Bölüm 7** — şu maddeler hiç denetlenmedi:
- `payment reconciliation`: `reconcilePayments()` stub olarak görüldü ama mutabakatın
  **ne yapması gerektiği** (hangi tabloları karşılaştıracağı) incelenmedi.
- `refund abuse` yalnızca "iade aboneliği iptal etmiyor" yönüyle bakıldı; kısmi iade,
  çoklu iade, iade sonrası yeniden satın alma senaryoları düşünülmedi.
- `credit duplication` / `coin duplication`: PAY-003 üzerinden UNIQUE constraint'in
  duplikasyonu **engellediği** görüldü; `producer_self_use_credits` tablosu üzerinden
  ikinci bir kredi yolu olup olmadığı kontrol edilmedi.
- `seller balance correctness`: `computeBalanceAndTransactions` okundu, ama gelir
  sorgusunun (`JOIN param_marketplace_payments`) ödeme durumu `paid` olmayan satırları
  da sayıp saymadığı **kontrol edilmedi** — sorgu `p.status`'a hiç bakmıyor gibi
  görünüyor, bu potansiyel bir ek bulgu ama doğrulanmadı.

**Bölüm 8** — `expiration` maddesi kısmen: `chatbot_purchase_credits.expires_at` okuma
tarafında kontrol ediliyor (`coin_engine.php:16`), ama süresi dolmuş kredi satırlarının
temizlenip temizlenmediği incelenmedi. `negative balance` senaryosu test edilmedi
(atomik `WHERE x > 0` koruması nedeniyle olası görünmüyor, ama doğrulanmadı).

**Bölüm 16** — *"Bu işlemin tam ortasında sistem kapanırsa ne olur?"* sorusu yalnızca
`createSubscription` için soruldu (PAY-004). Diğer çok adımlı akışlar
(`SellerController::register`, `saveChatbot` + görsel yükleme, `withdraw`) bu açıdan
incelenmedi. `saveChatbot`'ta özellikle: `handleImageUploads` dosyayı diske yazdıktan
sonra `$repo->create($data)` başarısız olursa **yetim dosya** kalır — transaction yok.
Bu, incelenmemiş bir yaşam döngüsü boşluğu.
