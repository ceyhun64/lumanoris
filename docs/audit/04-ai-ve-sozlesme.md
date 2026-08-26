# Tur 4 — AI / Gemini Entegrasyonu, API Sözleşmesi ve Frontend API

Kapsanan `docs/denetim.md` bölümleri: **9** (AI / Gemini), **11** (API Contract), **4** (yalnızca "Frontend API" alt bölümü).

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

**Tam okunanlar (1):**
`api/src/Presentation/Controllers/ContentController.php:1-50`

**Kısmi okunanlar (belirtilen satır aralıkları):**
`web/src/app/dashboard/chat/page.jsx:150-180, 222-250, 455-530, 541-592, 590-670` (873 satırın ~200'ü),
`web/src/app/dashboard/checkout/page.jsx:155-212` + fetch/payload haritası,
`web/src/app/dashboard/page.jsx:735-800`,
`web/src/app/dashboard/settings/page.jsx:378-400`,
`web/src/widgets/info/{UsagePopup,TermsOfUse,PrivacyPolicy2,PrivacyPolicy,TeslimatIadePopup,MesafeliSatisPopup}.jsx:8-22`,
`api/src/Presentation/Controllers/ChatbotController.php:73-108`,
`api/src/Presentation/Controllers/SocialController.php:220-232, 316-351`

**Mekanik taramalar (grep/sayım, içerik okumadan):**
51 dosyadaki `fetch` çağrılarının `res.ok`/`success`/`catch` kapsamı;
20+ GET ve 37 POST'ta gönderilen kimlik parametreleri; `use_3d` kullanımı;
`parts` değişkeninin yaşam döngüsü

---

## 1. AI / GEMINI ENTEGRASYONU (denetim.md bölüm 9)

---

### AI-001

**Severity:** 🟠 HIGH
**TÜR:** güvenlik + iş mantığı

**Başlık:** Sistem talimatı istemcide kuruluyor ve botun **tüm** eğitim metni her mesajda Gemini'ye gönderiliyor — hiçbir katmanda boyut/token sınırı yok

**Dosya:** `web/src/app/dashboard/chat/page.jsx:155-180, 592-609`, `api/src/Presentation/Controllers/ChatController.php:187-210`

**Fonksiyon/Class:** `loadFullTrainingPrompt()` → `generateReply()` (istemci) → `ChatController::generateReply()`

**Problem:**

İstemci eğitim metnini sayfalayarak **tamamını** belleğe alıyor:

```javascript
web/src/app/dashboard/chat/page.jsx:155-176
    const loadFullTrainingPrompt = async (id) => {
        let currentOffset = 0;
        let accumulatedPrompt = "";
        let hasMore = true;
        const CHUNK_LIMIT = 10000; // PHP'deki limit ile aynı olmalı

        try {
            while (hasMore) {
                const response = await fetch(`/api/training/get_training_chunks.php?botId=${id}&offset=${currentOffset}`);
                const data = await response.json();

                if (data.success) {
                    accumulatedPrompt += data.chunk;
                    currentOffset += CHUNK_LIMIT;
                    hasMore = data.hasMore;
                ...
            setFullTrainingPrompt(accumulatedPrompt);
```

Sonra her mesajda o metnin tamamını sistem talimatına gömüyor:

```javascript
web/src/app/dashboard/chat/page.jsx:592-609
      const systemInstruction = `GÖREV: Aşağıdaki [BİLGİ KAYNAĞI] kısmına %100 sadık kalarak cevap ver.
Bilgi kaynağı dışına çıkma. [KİŞİLİK/STİL] direktiflerini uygula.

[BİLGİ KAYNAĞI]:
${fullTrainingPrompt || "Bilgi kaynağı yok, kullanıcının sana sorduğu sorulara cevap ver."}

[KİŞİLİK/STİL]:
${bot?.style_prompt}`;

      const geminiRes = await fetch("/api/chat/generatereply.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
        body: new URLSearchParams({
          data: JSON.stringify({ system_instruction: systemInstruction, message: userText }),
        }),
      });
```

**Kanıt (bölüm 24 — dört ayrı katmanda boyut sınırı arandı, hiçbirinde yok):**

```
1) Sunucu tarafı: generateReply girdiyi ölçüyor mu?
$ grep -nE 'strlen|mb_strlen|MAX_|substr' <ChatController::generateReply gövdesi 179-272>
(çıktı yok)
   → $systemInstruction ve $message uzunluğu hiç kontrol edilmiyor.

2) training_prompt yazma tarafında sınır var mı?
   Tur 2 bulgusu: TrainingController::updateTrainingChunk $chunk'a uzunluk sınırı
   uygulamıyor, CONCAT ile sınırsız ekliyor (ChatController alıntısı Tur 2'de).

3) Şemada sütun tipi?
$ awk '/CREATE TABLE.*`chatbotlar`/,/^\) ENGINE/' api/database/schema.sql | grep training_prompt
  `training_prompt` longtext          → 4 GB'a kadar

4) Gemini'ye gönderilen payload sınırlanıyor mu?
api/src/Presentation/Controllers/ChatController.php:199-207
        $payload = json_encode([
            'contents' => [[ 'role' => 'user', 'parts' => [
                    ['text' => $systemInstruction],
                    ['text' => $message],
            ]]],
        ]);
   → doğrudan aktarım, kırpma yok.
```

**Nasıl tetiklenebilir:** Bir bot sahibi `update_training_chunk.php` ile botunun
`training_prompt`'una yüzlerce KB metin yazar. Tur 3 PAY-002 gereği o bot satışa açıldığında
**her oturum açmış kullanıcı** onunla sohbet edebilir. Her mesaj, o metnin tamamını Gemini'ye
gönderir. `checkRateLimit(..., 'genreply:' . $userId, 20, 60)` dakikada 20 istek veriyor.

500 KB'lık bir eğitim metni ≈ 125.000 token. Dakikada 20 istek → **2,5 milyon token/dakika**,
tek kullanıcıdan. Birden fazla hesapla çarpılabilir (kayıt ücretsiz).

**Impact — denetim.md bölüm 9'un üç maddesi birden:**
- **`token abuse` / `cost abuse`:** Gemini faturası kullanıcı tarafından belirleniyor.
- **`context limits`:** Model bağlam penceresi aşıldığında upstream 400 döner → SSE hata
  çerçevesi → kullanıcı jenerik hata görür, ve coin **zaten harcanmıştır** (bkz. AI-005).
  Hiçbir kırpma/özetleme yok.
- **`request size limits`:** `post_max_size`/`memory_limit` dışında sınır yok.

**Ek boyut — `prompt injection` ve `system prompt leakage`:** Sistem talimatı istemcide
kurulduğu için "sistem talimatı" kavramı bu mimaride anlamsız. Tur 2 SEC-015 ve Tur 3
PAY-002 bunun güvenlik sonucunu (ücretsiz LLM proxy + ödeme duvarı bypass) raporladı; bu
bulgu **maliyet** boyutunu ekliyor. Ayrıca `[BİLGİ KAYNAĞI]` / `[KİŞİLİK/STİL]` sınırlayıcıları
düz metin: kullanıcının mesajı (`$message`) aynı `contents` dizisinde ikinci bir `text` parçası
olarak gidiyor, yani kullanıcı `[BİLGİ KAYNAĞI]:` yazarak sınırlayıcıyı taklit edebilir —
klasik prompt injection. Bu, istemci kaynaklı talimat sorunu düzeltilse bile kalacak ayrı
bir konu.

**Önerilen çözüm:**
1. Sistem talimatını sunucuda kurmak (Tur 2 SEC-015'in çözümü) — `chatbot_id` alıp
   `style_prompt` + `training_prompt`'u DB'den okumak.
2. `training_prompt`'a hem yazma (`updateTrainingChunk`) hem okuma tarafında sabit bir
   üst sınır koymak; aşan kısmı reddetmek (kırpmak değil — sessiz kırpma botun davranışını
   sessizce değiştirir).
3. Sunucuda toplam istek boyutu kontrolü ve token tahmini; aşımda 413 ile reddetmek.

**Çözüm önceliği:** Yüksek — SEC-015 ile aynı düzeltmeden çıkıyor.

---

### AI-002

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** İstemci akışı 15 saniyede iptal ediyor, sunucunun cURL zaman aşımı 30 saniye — yavaş bir üretim kullanıcıya coin'ini kaybettiriyor, sunucu ise isteği ödemeye devam ediyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:589-590`, `api/src/Presentation/Controllers/ChatController.php:232` (`CURLOPT_TIMEOUT => 30`)

**Problem:**

İstemci tarafı:

```javascript
web/src/app/dashboard/chat/page.jsx:588-590
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000);
```

Sunucu tarafı (Tur 2'de okundu):

```php
api/src/Presentation/Controllers/ChatController.php:228-233 (kesit)
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 30,
```

**Kanıt (bölüm 24 — iki değerin gerçekten aynı isteği kapsadığı ve aralarında başka bir
zaman aşımı olmadığı kontrol edildi):**

```
$ grep -rnE 'timeout|Timeout|TIMEOUT' web/server.js web/next.config.mjs
(çıktı yok — proxy katmanında ayrı bir zaman aşımı tanımı yok)

$ İstemci abort'unun etkisi:
web/src/app/dashboard/chat/page.jsx:605   signal: controller.signal
   → abort yalnızca TARAYICI tarafındaki okumayı kesiyor. PHP süreci
     curl_exec'i tamamlamaya devam eder (CURLOPT_TIMEOUT=30'a kadar).
```

**Neden problem — üç sonuç:**
1. **Coin kaybı.** Coin, Gemini çağrısından **önce** tüketiliyor (satır 464, bkz. AI-005).
   15. saniyede abort edilen bir istek kullanıcının hakkını yakmış olur, cevap gelmez, ve
   iade yolu yok (Tur 3 COIN-004).
2. **Maliyet devam eder.** Sunucu Gemini isteğini 30 saniyeye kadar sürdürür; token ücreti
   tahakkuk eder. Kimse cevabı görmez.
3. **Kısmi cevap kaydı.** 15 saniyede biriken `fullText` boş değilse satır 647'deki
   `if (fullText)` koşulu sağlanır ve **yarım cevap tam cevap gibi** DB'ye yazılır
   (bkz. AI-007).

AI-001 ile birleşince olasılık artıyor: büyük eğitim metni → yavaş üretim → 15 saniyeyi
aşma → her mesajda coin kaybı.

**Önerilen çözüm:** İstemci zaman aşımını sunucudan **büyük** tutmak (örn. 35 s) ki iptal
kararı sunucuda verilsin; ya da her ikisini tek bir yapılandırma değerinden türetmek. Abort
durumunda tüketilen coin'in iadesi (COIN-004 ile birlikte).

**Çözüm önceliği:** Orta.

---

### AI-003

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** İstemci `generatereply.php` yanıtını koşulsuz SSE varsayıyor — `res.ok` kontrolü yok, dolayısıyla 429/401/500 JSON yanıtları sessizce "servise ulaşılamıyor" mesajına dönüşüyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:602-643, 664-671`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:609-622
      });

      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let upstreamError = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
```

`geminiRes.ok` hiç kontrol edilmiyor; gövde doğrudan `getReader()` ile okunuyor.

**Kanıt (bölüm 24 — sunucunun bu endpoint'ten SSE dışında ne döndürebileceği tek tek çıkarıldı):**

```
generatereply.php'nin SSE OLMAYAN yanıt yolları (ChatController.php):
:180  require_method('POST')          → 405 {"success":false,"message":"Method not allowed"}
:181  AuthMiddleware::requireAuth()   → 401 {"success":false,...,"error_code":"AUTH_REQUIRED"}
:185  checkRateLimit(20/60)           → 429 {"success":false,...}   ← EN OLASI
:190  eksik veri                      → 400 {"success":false,...}
:196  API anahtarı yok                → 500 {"success":false,...}
        (bootstrap.php:93 global handler) → 500 {"success":false,...}

   → Bu altı yolun HEPSİ JSON döndürüyor; hiçbiri "data: " ile başlayan satır içermiyor.
     Döngü hiçbir şey ayıklamaz, fullText boş kalır, upstreamError null kalır.

$ Kullanıcıya ne gösterilir?
web/src/app/dashboard/chat/page.jsx:667-670
      const failureText = upstreamError
        ? (upstreamError.code === 429
            ? "Yapay zeka servisi şu anda yoğun. Lütfen biraz sonra tekrar deneyin."
            : "Yapay zeka servisine şu anda ulaşılamıyor. Sorun sürerse yöneticinize bildirin.")
   → upstreamError null olduğu için ELSE dalına düşer (satır 671+, okunmadı) —
     yani gerçek nedenden bağımsız tek bir jenerik mesaj.
```

**İronik ayrıntı:** Satır 664-666'daki yorum tam olarak bu ayrımı yapmayı amaçlıyor:

```javascript
web/src/app/dashboard/chat/page.jsx:664-666
      // Stream finished without throwing but produced no content. If the server
      // told us why (upstream 4xx/5xx), say so instead of the generic wording —
      // a suspended key and a transient outage need different user action.
```

Ama bu ayrım yalnızca **Gemini'nin** hatası için çalışıyor (sunucunun ürettiği SSE `error`
çerçevesi, `ChatController:265-269`). **Sunucunun kendi** hata yanıtları (401/429/500) SSE
olmadığı için hiç görülmüyor.

**Nasıl tetiklenebilir:** En kolay yol rate limit — 1 dakikada 20'den fazla mesaj gönderin.
Sunucu 429 döner, kullanıcı "Yapay zeka servisine şu anda ulaşılamıyor" görür. Doğru mesaj
("çok hızlısınız, bekleyin") satır 668'de **zaten yazılmış** ama o dala hiç girilmiyor.

Aynı şekilde oturum düşmesi (401) de "AI servisi bozuk" gibi görünür — kullanıcı yeniden
giriş yapmayı denemez.

**Ek risk:** `geminiRes.body` `null` olabilir (204 veya bazı hata durumları) →
`getReader()` TypeError → satır 588'deki `try` yakalar, ama neden kaybolur.

**Önerilen çözüm:** `getReader()`'dan önce `if (!geminiRes.ok) { const err = await
geminiRes.json().catch(() => null); ... }` ile sunucunun `message`/`error_code` alanını
kullanmak. `error_code` sözleşmesi (`AppConfig::ERR_*`) tam bu amaç için var ve bu endpoint'te
hiç kullanılmıyor.

**Çözüm önceliği:** Orta.

---

### AI-004

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** SSE ayrıştırıcısı parça sınırları arasında satır tamponlaması yapmıyor ve ayrıştırma hatasını boş `catch` ile yutuyor — akışın ortasındaki metin parçaları sessizce kaybolabiliyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:616-643`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:616-642
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.replace("data: ", "").trim();
              const gData = JSON.parse(jsonStr);
              ...
              const textChunk = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (textChunk) {
                fullText += textChunk;
                ...
              }
            } catch (e) {}
          }
        }
      }
```

Her `read()` sonucu **bağımsız** olarak satırlara bölünüyor. Bir `data: {...}` satırı iki
ayrı TCP parçasına bölündüğünde:
- İlk parçadaki yarım satır `data: ` ile başlar, `JSON.parse` geçersiz JSON'da fırlatır →
  **satır 640'taki boş `catch` onu yutar** → o parça kaybolur.
- İkinci parçadaki kalan kısım `data: ` ile başlamadığı için `if` koşuluna hiç girmez →
  o da kaybolur.

`decoder.decode(value, { stream: true })` çok baytlı UTF-8 karakterlerinin bölünmesini
çözüyor — ama **satır** bölünmesini çözmüyor. İki farklı problem.

**Kanıt (bölüm 24 — bir tampon değişkeni olup olmadığı ve sunucunun parçalama davranışı
kontrol edildi):**

```
$ Döngü dışında satır tamponu var mı?
web/src/app/dashboard/chat/page.jsx:611-614
      const reader  = geminiRes.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText  = "";
      let upstreamError = null;
   → `buffer` benzeri bir birikim değişkeni YOK. Yalnızca sonuç metni (fullText).

$ Sunucu parçaları satır sınırında mı gönderiyor?
api/src/Presentation/Controllers/ChatController.php:233-243
            CURLOPT_WRITEFUNCTION  => static function ($handle, string $chunk) ... {
                ...
                echo $chunk;
                @flush();
   → cURL'ün verdiği ham parça olduğu gibi echo ediliyor. Parça sınırları
     Gemini'nin/ağın belirlediği yere düşer; satır sınırına hizalanacağının
     garantisi YOK.
```

**Neden bu bir bulgu ve neden MEDIUM:** Küçük yanıtlarda tek parçada gelir ve sorun görünmez —
bu yüzden CRITICAL değil. Ama uzun yanıtlarda (ki AI-001 nedeniyle bağlam büyük olduğunda
yanıtlar da uzun olur) parça sayısı artar ve her sınır bir kayıp riski. Sonuç **sessiz**:
kullanıcı eksik bir cevap görür, hata mesajı yoktur, ve eksik metin `if (fullText)`
(satır 647) ile **DB'ye kalıcı olarak** yazılır.

Boş `catch (e) {}` bu kaybı görünmez kılan ikinci kusur — bölüm 12'nin "empty catch" maddesi.

**Önerilen çözüm:** Klasik SSE tamponlaması: `buffer += chunk;` sonra
`const lines = buffer.split("\n"); buffer = lines.pop();` — son (tamamlanmamış) satırı
tamponda bırakmak. `catch` bloğunda en azından `console.warn` ile kaybı görünür kılmak.

**Çözüm önceliği:** Orta.

---

### AI-005

**Severity:** 🟡 MEDIUM
**TÜR:** bug + iş mantığı

**Başlık:** Coin, Gemini çağrısından **önce** tüketiliyor ve başarısızlıkta iade edilmiyor — Tur 3 COIN-004'ün yönü kesinleşti

**Dosya:** `web/src/app/dashboard/chat/page.jsx:463-483` (tüketim) vs `:602` (Gemini çağrısı)

**Bu bulgu Tur 3'ün devrettiği açık sorunun cevabıdır.** Tur 3 COIN-004, iade yolunun
olmadığını tespit etmiş ama sıralamayı belirleyemediğini "Doğrulanamayanlar"a yazmıştı.
Sıra artık kesin: **coin önce yanıyor.**

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:461-479
      // Mesaj hakkı kontrolü (Sohbet Luma Coini): önce bu bota özel satın alma
      // bonusu, yoksa günlük ortak coin havuzu. Hak yoksa Gemini'ye gidilmez.
      try {
        const allowanceRes = await fetch("/api/message/consumemessage.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            data: JSON.stringify({ user_id: userId, chatbot_id: botId }),
          }),
        });
        const allowanceResult = await allowanceRes.json();
        if (!allowanceResult.allowed) {
          setLimitReached(true);
          checkMessageAllowance(userId, botId);
          return;
        }
        if (allowanceResult.source === "coins" && typeof allowanceResult.remaining === "number") {
          setCoinsRemaining(allowanceResult.remaining);
        }
```

Satır 464 (tüketim) → satır 567 `await generateReply(data.text)` → satır 602 (Gemini).
Yani sıra: **tüket → çağır**.

**Kanıt (bölüm 24 — iade yolu tekrar arandı, hâlâ yok):**

```
$ Tur 3'te doğrulanmıştı:
$ grep -rniE 'refundCoin|restoreCoin|coins_remaining \+|credits_remaining \+' api/ --include=*.php
(çıktı yok)

$ İstemci tarafında başarısızlıkta bir telafi çağrısı var mı?
$ grep -n 'consumemessage' web/src/app/dashboard/chat/page.jsx
464:        const allowanceRes = await fetch("/api/message/consumemessage.php", {
   → tek çağrı. Hata yolunda (satır 664-671) coin'e dokunulmuyor.
```

**Başarısızlık senaryoları — hepsinde coin yanıyor, cevap gelmiyor:**
| Senaryo | Kaynak |
| --- | --- |
| Gemini 4xx/5xx (kota, askıya alınmış anahtar, bağlam aşımı) | `ChatController:253-271` → SSE error frame |
| 15 saniye zaman aşımı | AI-002 |
| Rate limit 429 (sunucunun kendi limiti) | AI-003 — üstelik coin **zaten** tüketilmiş, çünkü `consumemessage` ayrı bir endpoint ve kendi limiti (60/60) daha gevşek |
| Ağ kopması / parça kaybı | AI-004 |

Son satır özellikle dikkat çekici: `consumemessage` limiti dakikada 60,
`generatereply` limiti dakikada 20. Yani 21.–60. mesajlarda **coin tüketilir ama Gemini'ye
hiç gidilmez.** İki limitin uyumsuzluğu, dakikada 40 coin'in karşılıksız yanmasına yol
açabiliyor.

**Impact:** Kullanıcı kendi hatası olmayan durumlarda ücretsiz hakkını ve satın aldığı
bonus kredilerini kaybediyor. Satın alınmış kredide bu, parayla alınmış bir hakkın kaybı.

**Dürüstlük notu:** Tur 3 COIN-001 nedeniyle limit şu an istemci tarafından atlanabildiği
için (istemci `consumemessage`'ı çağırmayı bırakabilir) pratik şikâyet düşük. Ama uygulamanın
**kendi** istemcisi bu sırayı kullandığı için gerçek kullanıcılar bu kaybı yaşıyor.

**Önerilen çözüm:** COIN-001'in çözümüyle birlikte: tüketimi sunucuya taşıyıp Gemini
çağrısıyla aynı işlem sınırına almak — upstream başarısızsa sayaç geri alınmalı. Ayrıca iki
endpoint'in rate limitlerini eşitlemek (20/60).

**Çözüm önceliği:** Orta.

---

### AI-006

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Eğitim metni sayfalama adımı istemci ile sunucu arasında elle senkron tutulan bir sabit — sapma sessiz veri kaybı veya tekrarı üretir

**Dosya:** `web/src/app/dashboard/chat/page.jsx:159, 168`, `api/src/Presentation/Controllers/TrainingController.php:53`

**Problem:**

İstemci:

```javascript
web/src/app/dashboard/chat/page.jsx:159, 167-169
        const CHUNK_LIMIT = 10000; // PHP'deki limit ile aynı olmalı
        ...
                    accumulatedPrompt += data.chunk;
                    currentOffset += CHUNK_LIMIT; // 10.000 birim ilerle
                    hasMore = data.hasMore;
```

Sunucu:

```php
api/src/Presentation/Controllers/TrainingController.php:51-53
        $botId  = InputSanitizer::positiveInt($_GET['botId'] ?? 0);
        $offset = InputSanitizer::positiveInt($_GET['offset'] ?? 0);
        $limit  = 10000;
```

İki tarafta iki ayrı literal `10000`. İstemcinin yorumu bağımlılığı kabul ediyor
("PHP'deki limit ile aynı olmalı") ama zorlayan bir mekanizma yok.

**Kanıt (bölüm 24 — sunucunun `limit`'i yanıtta bildirip bildirmediği kontrol edildi):**

```php
api/src/Presentation/Controllers/TrainingController.php:70-76
        if ($result) {
            $totalLength = (int) $result['total_length'];
            JsonResponse::success([
                'chunk'       => $result['chunk'] ?? '',
                'totalLength' => $totalLength,
                'hasMore'     => ($offset + $limit) < $totalLength,
            ]);
```
   → Yanıt `chunk`, `totalLength`, `hasMore` içeriyor; kullanılan `limit` bildirilmiyor.
     İstemci onu tahmin etmek zorunda.
```

**Sapma senaryoları:**
- Sunucu `$limit`'i 5000'e düşürürse: istemci 10000 adımlarla ilerler → her parçanın ikinci
  yarısı **atlanır**. Eğitim metni sessizce yarıya iner, bot yanlış cevaplar verir.
- Sunucu 20000'e çıkarırsa: istemci 10000 adımlarla ilerler → içerik **tekrar eder**.
  `SUBSTRING` tabanlı olduğu için tekrar eden metin sistem talimatına iki kez girer.

Her iki durumda da hata mesajı yok; `hasMore` sunucudan geldiği için döngü doğru sayıda
tur atar ama yanlış konumlardan okur.

**Ek gözlem — döngü sonlanma güvencesi:** `hasMore` sunucuda `($offset + $limit) < $totalLength`
ile hesaplandığı ve `$offset` monoton arttığı için döngü sonlanır. Yani sonsuz döngü riski
**yok** (bu yönde bulgu yazılmadı).

**Impact:** Şu an doğru çalışıyor (iki sabit eşit). Risk, ileride bir tarafın değişmesinde.

**Önerilen çözüm:** Sunucunun yanıtta `limit` (veya `nextOffset`) alanını döndürmesi ve
istemcinin onu kullanması — tek gerçek kaynağı sunucuya taşımak.

**Çözüm önceliği:** Düşük.

---

### AI-007

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** Kısmi akış tam cevap gibi kalıcı olarak kaydediliyor ve `sent_by` alanı istemci tarafından belirleniyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:645-661`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:645-661
      clearTimeout(timeoutId);

      if (fullText) {
        // Akış bittikten sonra BOT cevabını DB'ye kaydet
        await fetch("/api/chat/addchat.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            data: JSON.stringify({
              chatbot_id: botId,
              user_id: userId,
              sent_by: "bot",
              message: fullText,
            }),
          }),
        });
        return;
      }
```

`if (fullText)` yalnızca "boş değil mi" diye soruyor. Akış yarıda kesildiyse (AI-002 abort,
AI-004 parça kaybı, ağ kopması) `fullText` **kısmi** olur ve tam cevap olarak kaydedilir.
Kalıcı sohbet geçmişi bozuk cevabı taşır; kullanıcı sayfayı yenilediğinde yarım cevabı
kaldığı yerden değil, **kesin** cevap olarak görür.

**Kanıt (bölüm 24 — akışın tamamlandığını gösteren bir sinyal var mı diye bakıldı):**

```
$ Gemini'nin bitiş sinyali (finishReason) okunuyor mu?
$ grep -n 'finishReason\|finish_reason' web/src/app/dashboard/chat/page.jsx
(çıktı yok)
   → Gemini SSE yanıtında candidates[].finishReason alanı var (STOP / MAX_TOKENS / SAFETY);
     istemci onu hiç okumuyor. Yani "cevap gerçekten bitti mi" bilgisi mevcut ama
     kullanılmıyor.

$ upstreamError durumunda kayıt yapılıyor mu?
   Satır 629-631: upstreamError set edilir, `continue` ile döngü sürer.
   Satır 647: fullText doluysa KAYDEDİLİR — upstreamError kontrol EDİLMEZ.
   → Kısmi metin + upstream hatası kombinasyonunda hem hata mesajı gösterilmez
     (satır 667 fullText dolu olduğu için hiç çalışmaz, 661'de return edilir)
     hem de kısmi cevap kaydedilir.
```

**İkinci kusur — `sent_by` istemci kontrollü:** `sent_by: "bot"` payload'da geliyor ve
Tur 2 SEC-014'te `ChatController::addChat`'in mass assignment yaptığı doğrulanmıştı (yalnızca
`user_id` sunucu tarafından ezilir). Yani istemci `sent_by`'ı serbestçe belirliyor —
kullanıcı kendi geçmişine istediği "bot cevabı"nı yazabilir. Etkisi kendi geçmişiyle sınırlı
olduğu için LOW.

**Impact:** Bozuk sohbet geçmişi; hata durumunda kullanıcıya hata gösterilmemesi.

**Önerilen çözüm:** `finishReason === 'STOP'` kontrolü; `upstreamError` varsa kaydetmemek
(veya kısmi olarak işaretlemek); `sent_by`'ı sunucuda `'bot'`/`'user'` beyaz listesine
sokmak.

**Çözüm önceliği:** Düşük.

---

## 2. API SÖZLEŞMESİ (denetim.md bölüm 11)

---

### API-001

**Severity:** 🟠 HIGH
**TÜR:** bug + mimari

**Başlık:** `getchatbot.php` başarıda zarfsız, hatada zarflı yanıt döndürüyor — istemci ikisini ayırt edemiyor ve 404 tamamen sessiz kalıyor

**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:73-94`, `web/src/app/dashboard/chat/page.jsx:225-243`

**Problem — sunucu tarafı asimetrik:**

```php
api/src/Presentation/Controllers/ChatbotController.php:77-93
        if (!$id) {
            JsonResponse::error('Chatbot ID gerekli.', 400, AppConfig::ERR_VALIDATION);
        }
        ...
        if (!$chatbot) {
            JsonResponse::error('Chatbot bulunamadı veya bu bota erişim izniniz yok.', 404, AppConfig::ERR_NOT_FOUND);
        }

        $comments = $repo->getComments($id);
        echo json_encode([
            'chatbot'  => $chatbot,
            'comments' => ['count' => count($comments), 'list' => $comments],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
```

Hata yolları `{"success":false,"message":...,"error_code":...}` döndürüyor.
Başarı yolu `{"chatbot":{...},"comments":{...}}` döndürüyor — **`success` anahtarı yok.**

**İstemci tarafı bunun sonucunu yaşıyor:**

```javascript
web/src/app/dashboard/chat/page.jsx:225-243
    fetch(`/api/chatbot/getchatbot.php?id=${botIdd}&user_id=${userId}`)
      .then((res) => res.text())
      .then(async (tdata) => {
        let data = JSON.parse(tdata);
        const botData = data.chatbot;
        const commentsData = data.comments;

        if (commentsData && commentsData.list) { ... }
        if (botData) {
          setBot(botData);
        }
      });
```

Ne `res.ok`, ne `data.success`, ne `.catch()` var. 404 geldiğinde `data.chatbot` `undefined`
olur, `setBot` hiç çağrılmaz — ve **hiçbir hata gösterilmez.**

**Kanıt (bölüm 24 — istemcinin başka bir yerde hata yakalayıp yakalamadığı ve bu şeklin
başka tüketicisi olup olmadığı arandı):**

```
$ getchatbot.php'nin tüm tüketicileri:
$ grep -rn -A6 'getchatbot.php' web/src --include=*.jsx | grep -E 'success|\.chatbot|catch'
web/src/app/dashboard/chat/page.jsx-229-        const botData = data.chatbot;
web/src/app/dashboard/chat/page.jsx-230-        const commentsData = data.comments;
   → tek tüketici bu; success kontrolü ve catch YOK.

$ bot state'i başka bir yerden set ediliyor mu (fallback var mı)?
$ grep -n 'setBot(' web/src/app/dashboard/chat/page.jsx
241:          setBot(botData);
   → tek atama. Başarısızlıkta `bot` null kalır.

$ bot null kalınca ne olur?
web/src/app/dashboard/chat/page.jsx:248   if (!bot) return;
   → sonraki tüm effect'ler sessizce çıkar. Sayfa boş/yükleniyor durumunda takılır.
```

**Nasıl tetiklenebilir:** Var olmayan bir `id` ile `/dashboard/chat?botId=999999`, ya da
Tur 3 PAY-002'nin erişim politikasının reddettiği bir bot (bağımsız/özel bir bot).
`userHasAccess` false döner → `getDetail` null → 404 → kullanıcı **sonsuz boş sayfa** görür,
hiçbir açıklama olmadan.

**Neden HIGH:** Bu, Tur 2 ERR-003'ün (28 noktada `JsonResponse` atlanması) somut kullanıcı
etkisi. Sunucu doğru durum kodunu ve açıklayıcı mesajı **zaten üretiyor** (satır 85), ama
zarf tutarsızlığı yüzünden istemci onu okuyamıyor ve okumaya çalışmıyor. Sohbet, ürünün ana
işlevi; ana işlevin giriş noktası sessizce başarısız oluyor.

**Önerilen çözüm:** Başarı yolunu da `JsonResponse::success(['chatbot' => ..., 'comments' => ...])`
yapmak (tek satır) ve istemcide `if (!res.ok || !data.success)` kontrolü + kullanıcıya
`data.message` göstermek.

**Çözüm önceliği:** Yüksek — düzeltmesi küçük, etkisi ürünün ana akışında.

---

### API-002

**Severity:** 🟡 MEDIUM
**TÜR:** mimari + teknik borç

**Başlık:** Aynı kaynak için iki endpoint, iki uyumsuz zarf: `getchatbots.php` zarflı, `getchatbots_v2.php` çıplak dizi — ve v2 hiçbir yerden çağrılmıyor

**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:96-108`

**Problem:**

```php
api/src/Presentation/Controllers/ChatbotController.php:96-108
    public static function getChatbots(): void {
        $search = InputSanitizer::string($_GET['search'] ?? '');
        $repo   = new ChatbotRepository();
        JsonResponse::success(['bots' => $repo->getPublished(['search' => $search !== '' ? $search : null])]);
    }

    public static function getChatbotsV2(): void {
        $userId = AuthMiddleware::optionalAuth();
        $search = InputSanitizer::string($_GET['search'] ?? '');
        $repo   = new ChatbotRepository();
        echo json_encode($repo->getPublishedV2($userId, ['search' => $search !== '' ? $search : null]));
        exit;
    }
```

Üç fark:
| | `getChatbots` | `getChatbotsV2` |
| --- | --- | --- |
| Zarf | `{"success":true,"bots":[...]}` | `[...]` (çıplak dizi) |
| Kimlik | yok | `optionalAuth()` |
| Repository | `getPublished()` | `getPublishedV2($userId, ...)` |

**Bu, Tur 1'in devrettiği açık sorunun cevabıdır.** Tur 1 DEAD-001, `getchatbots_v2.php`'nin
frontend'den hiç çağrılmadığını tespit etmiş, davranış farkını Tur 4'e bırakmıştı.

**Kanıt (bölüm 24 — v2'nin gerçekten hiç kullanılmadığı tekrar doğrulandı):**

```
$ grep -rn 'getchatbots_v2' web/src api/admin --include=*.jsx --include=*.js --include=*.php
(çıktı yok)

$ v1 kullanımı:
web/src/app/dashboard/page.jsx:761        fetch(`/api/chatbot/getchatbots.php`)
web/src/app/dashboard/page.jsx:785        if (Array.isArray(botsData?.bots)) {
   → istemci `bots` anahtarını bekliyor; v1 ile uyumlu.
   → v2 çağrılsa `botsData.bots` undefined olur, liste sessizce boş kalır.

$ İki repository metodu da mevcut mu?
api/src/Infrastructure/Repositories/ChatbotRepository.php:76   getPublished()
api/src/Infrastructure/Repositories/ChatbotRepository.php:105  getPublishedV2()
   → ikisi de var; gövdeleri bu turda OKUNMADI (bkz. Doğrulanamayanlar).
```

**Neden problem:** Bir "v2" endpoint'inin varlığı ileriye dönük bir geçiş niyeti belirtiyor,
ama v2 **daha az** sözleşme uyumlu (zarfsız). Yani geçiş yapılırsa istemcinin
`botsData?.bots` kontrolü sessizce boş liste üretir — hata değil, **boş ana sayfa**.
Sözleşme açısından v2 bir gerileme.

**Impact:** Ölü kod + gelecekteki bir geçişte sessiz kırılma tuzağı. Şu an kullanıcı etkisi yok.

**Önerilen çözüm:** Ya v2'yi silmek (Tur 1 DEAD-001'in önerisi), ya da v2'yi
`JsonResponse::success(['bots' => ...])` yapıp v1'i ona yönlendirmek. Aradaki hâl en kötüsü.

**Çözüm önceliği:** Orta.

---

### API-003

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç

**Başlık:** İstemci 20'den fazla GET çağrısında ve 37 POST payload'ında sunucunun **yok saydığı** kimlik parametresi gönderiyor — üstelik üç farklı isim altında

**Dosya:** 20+ frontend dosyası; sunucu tarafı örneği `api/src/Presentation/Controllers/SocialController.php:327-350`

**Problem:** Sunucu kimliği her zaman oturumdan alıyor:

```php
api/src/Presentation/Controllers/SocialController.php:327-332, 345-350
    public static function getHide(): void {
        $userId = AuthMiddleware::requireAuth();

        $rows = Database::getInstance()->selectMulti('chatbot_id FROM chatbot_hide WHERE user_id = ?', [$userId]);
        JsonResponse::success(['hidden' => array_column($rows, 'chatbot_id')]);
    }
    ...
    public static function getUninterest(): void {
        $userId = AuthMiddleware::requireAuth();

        $rows = Database::getInstance()->selectMulti('category_id FROM chatbot_uninterested WHERE user_id = ?', [$userId]);
        JsonResponse::success(['categories' => array_column($rows, 'category_id')]);
    }
```

Hiçbiri `$_GET`'e bakmıyor. Ama istemci gönderiyor — ve **aynı sayfada iki farklı isimle**:

```javascript
web/src/app/dashboard/page.jsx:763-769
            ? fetch(`/api/social/getuninterest.php?id=${userId}`)      ← "id"
            ? fetch(`/api/social/gethide.php?user_id=${userId}`)       ← "user_id"
            ? fetch(`/api/social/getuserlists.php?id=${userId}`)       ← "id"
```

**Kanıt (bölüm 24 — kapsamı ölçmek için sistematik tarama):**

```
$ Sunucunun yok saydığı kimlik parametresi gönderen GET çağrıları (kısaltılmış liste):
chat/page.jsx           → getchat.php?...&user_id=      getconversation.php?...&user_id=
                          getchatbot.php?id=..&user_id=  getsubscription.php?user_id=
chatbots/create/page.jsx→ getchatbotlimits.php?user_id=  getproducerplanstatus.php?user_id=
following/page.jsx      → getfollowedbots.php?user_id=
history/page.jsx        → gethistory.php?user_id=
notes/page.jsx          → gethide.php?user_id=
dashboard/page.jsx      → gethide.php?user_id=  getuninterest.php?id=  getuserlists.php?id=
purchased/page.jsx      → getmysubscriptions.php?user_id=
wallet/page.jsx         → getmypayments.php?user_id=
ProfileCard.jsx         → gethistory.php?user_id=  getcart.php?user_id=
NotificationPopup.jsx   → getnotification.php?user_id=
EmailEditor.jsx         → getuseremail.php?id=
ChatbotCard.jsx         → getsubscription.php?user_id=
   (20 satır)

$ POST payload'ında user_id gönderenler:
$ grep -rn 'user_id: userId\|user_id: uId' web/src --include=*.jsx --include=*.js | wc -l
37
```

**Neden problem — üç ayrı maliyet:**
1. **Yanlış IDOR sinyali.** Bir denetçi (veya yeni geliştirici) `getmypayments.php?user_id=5`
   görünce endpoint'in parametreyle çalıştığını sanır ve gerçek olmayan bir IDOR arar.
   Tersi daha tehlikeli: parametrenin **çalıştığını** varsayıp bir yerde ona güvenmek.
2. **Terk edilmiş tasarımın kalıntısı.** Tur 2, birçok controller'da "Previously had no
   ownership check — anyone could ... by id" biçiminde yorumlar buldu. Bu parametreler o
   eski tasarımdan kalma; sertleştirme sunucuda yapıldı, istemci temizlenmedi.
3. **İsimlendirme tutarsızlığı.** `user_id` (GET), `id` (GET), `user_id` (POST payload) —
   aynı kavram için üç kullanım, hatta aynı `useEffect` içinde ikisi birlikte.

**Impact:** Runtime etkisi yok (parametreler yok sayılıyor). Bakım ve denetim maliyeti;
yanlış güvenlik varsayımı riski.

**Dürüstlük notu:** Bunun bir güvenlik açığı **olmadığını** doğruladım — `requireAuth()`
her zaman oturumdan okuyor. Bulgu teknik borç olarak raporlanıyor, güvenlik olarak değil.

**Önerilen çözüm:** İstemciden kaldırmak. Kaldırmadan önce her endpoint'in gerçekten
oturumdan okuduğunu doğrulamak (bu turda yalnızca `getHide`/`getUninterest`/`getUserLists`
gövdeleri okundu — diğerleri Tur 2/3'te okunanlarla sınırlı).

**Çözüm önceliği:** Orta.

---

### API-004

**Severity:** 🟡 MEDIUM
**TÜR:** bug + doküman

**Başlık:** `use_3d` bayrağı iki ödeme akışında gönderiliyor ama hiçbir PHP kodu okumuyor — biri `true` göndererek 3-D Secure kullanıldığını varsayıyor

**Dosya:** `web/src/app/dashboard/checkout/page.jsx:173`, `web/src/features/purchasing/BuyProducerAccountModal.jsx:39`

**Problem:**

```javascript
web/src/app/dashboard/checkout/page.jsx:162-174
        const payload = {
          items: confirmedItems.map((item) => ({
            chatbot_id: item.chatbot_id,
            duration_weeks: item.duration_weeks || 4,
          })),
          card: {
            number: cardInfo.number.replace(/\s/g, ""),
            expiry: cardInfo.expiry,
            cvv: cardInfo.cvv,
            holder_name: cardInfo.holderName.trim(),
          },
          use_3d: false,
        };
```

**Kanıt (bölüm 24 — tüm repoda arandı):**

```
$ (Grep) use_3d    tüm repo, vendor hariç
web/src/app/dashboard/checkout/page.jsx:173        use_3d: false,
web/src/features/purchasing/BuyProducerAccountModal.jsx:39                use_3d: true,
   → PHP tarafında SIFIR eşleşme. Ne createSubscription ne buyProducerAccount okuyor.

$ createSubscription $data'dan neyi okuyor?
api/src/Presentation/Controllers/MarketplaceController.php:165, 190-192, 280
        if (!$data || empty($data['items']) ...      → items
            $chatbotId     = ... $item['chatbot_id']
            $durationWeeks = ... $item['duration_weeks']
        $card = is_array($data['card'] ?? null) ? $data['card'] : [];
   → items, card. use_3d yok.
```

**Neden problem:** `BuyProducerAccountModal.jsx:39` `use_3d: true` gönderiyor — yani istemci
bu satın alma için 3-D Secure doğrulaması yapılacağını varsayıyor. Sunucuda ne 3-D Secure
uygulaması ne de bu bayrağı okuyan kod var; üstelik `buyProducerAccount` her zaman
başarısız dönen bir stub (Tur 3 BIZ-003). Yani bayrak hem okunmuyor hem de akış hiç
tamamlanmıyor.

`checkout/page.jsx` ise `use_3d: false` gönderiyor — 3-D Secure **olmadan** ödeme.
Türkiye'de kart ödemelerinde 3-D Secure fiilen zorunlu; bu bayrağın sunucuda hiç
karşılığı olmaması, gerçek gateway bağlanırken atlanacak bir gereksinimi işaretliyor.

**Impact:** Ölü payload alanı; ödeme akışında sunucu-istemci varsayım uyuşmazlığı; gerçek
entegrasyonda 3-D Secure'un hiç planlanmamış olduğunun göstergesi.

**Önerilen çözüm:** Bayrağı ya sunucuda uygulamak ya istemciden kaldırmak. Tur 3 PAY-007
(callback güvenliği) ile birlikte değerlendirilmeli — 3-D Secure akışı zaten bir callback
gerektirir.

**Çözüm önceliği:** Orta — gerçek ödeme entegrasyonundan önce.

---

### API-005

**Severity:** 🟡 MEDIUM
**TÜR:** bug + mimari

**Başlık:** `res.ok` 51 dosyanın yalnızca 8'inde kontrol ediliyor; baskın desen `try/catch` + `result.success`, ama 28 endpoint `success` anahtarı hiç göndermiyor

**Dosya:** Sistematik — 51 dosya; ölçüm aşağıda

**Problem:** İstemcinin hata tespiti iki mekanizmaya dayanıyor: `try/catch` (ağ hatası) ve
`result.success` (uygulama hatası). Tur 2 ERR-003, 11 controller'da 28 noktada
`JsonResponse`'un atlandığını ve `success` anahtarının hiç gönderilmediğini tespit etmişti.
Bu iki gerçek birleşince: **o 28 endpoint için istemcinin hiçbir hata tespiti yok.**

**Kanıt (bölüm 24 — mekanik ölçüm):**

```
$ Her fetch içeren dosya için res.ok / .success / catch sayımı (ilk 12, fetch sayısına göre):
app/dashboard/chat/page.jsx                    fetch=15  res.ok=2   success=2   catch=15
app/dashboard/settings/page.jsx                fetch=12  res.ok=0   success=12  catch=12
entities/user/ui/ProfileCard.jsx               fetch=11  res.ok=0   success=8   catch=12
features/wallet/BankInfo.jsx                   fetch=7   res.ok=0   success=6   catch=7
features/notes/DialogueModal.jsx               fetch=7   res.ok=0   success=5   catch=8
entities/chatbot/ui/ChatbotCard.jsx            fetch=7   res.ok=0   success=6   catch=7
app/dashboard/chatbots/create/page.jsx         fetch=6   res.ok=0   success=4   catch=5
widgets/DashboardHeader.jsx                    fetch=5   res.ok=2   success=3   catch=5
features/seller/SellerOnboardingWizard.jsx     fetch=5   res.ok=0   success=4   catch=5
app/dashboard/page.jsx                         fetch=5   res.ok=0   success=0   catch=4
app/login/page.jsx                             fetch=4   res.ok=0   success=4   catch=5
app/dashboard/checkout/page.jsx                fetch=3   res.ok=0   success=3   catch=3

$ res.ok kontrolü olan dosya sayısı: 8 / 51
$ Toplam fetch: ~156 (Tur 1'de sayılmıştı)
```

**Neden `try/catch` yeterli değil:** `fetch()` HTTP hata durumlarında (4xx/5xx) **reject
etmez** — yalnızca ağ hatasında reject eder. Yani 401/404/429/500 yanıtları `catch`'e hiç
düşmez, `try` bloğu normal akışa devam eder. `result.success` kontrolü bu boşluğu kapatır —
**ama yalnızca sunucu o anahtarı gönderiyorsa.**

**Somut zarar örnekleri (bu turda doğrulananlar):**
| Yer | Sonuç |
| --- | --- |
| `chat/page.jsx:225` `getchatbot.php` | 404 sessiz; sayfa boş kalır (API-001) |
| `chat/page.jsx:611` `generatereply.php` | 429/401 "servise ulaşılamıyor"a dönüşür (AI-003) |
| `dashboard/page.jsx:773-785` | `res.ok=0, success=0` — ama `Array.isArray(botsData?.bots)` guard'ı sayesinde **zarafetle boş listeye** düşer (aşağıya bakın) |

**Önemli nüans — `dashboard/page.jsx` bir false positive değil ama bulgu da değil:**

```javascript
web/src/app/dashboard/page.jsx:778-785
        const uninterestedCategoryIds = Array.isArray(unData?.categories)
          ? unData.categories.map(Number)
          : [];
        const hiddenBotIds = Array.isArray(hideData?.hidden)
          ? hideData.hidden.map(Number)
          : [];

        if (Array.isArray(botsData?.bots)) {
```

Optional chaining + `Array.isArray` guard'ları hata yanıtında **çökmek yerine boş listeye**
düşüyor. Yani `res.ok`/`success` kontrolü olmaması burada crash üretmiyor — sadece
kullanıcıya "bot yok" gösteriyor, "yüklenemedi" demiyor. Şekle göre savunma; kabul edilebilir
ama hata mesajı kaybı devam ediyor.

**Impact:** Hata durumlarının kullanıcıya hiç yansımaması; teşhis edilemeyen "boş sayfa"
şikâyetleri.

**Önerilen çözüm:** Tur 1 DOC-004'te tespit edilen `shared/api/client.js` (0 importer)
tam bu iş için yazılmış. Onu benimseyip `res.ok` + `success` + `error_code` kontrolünü tek
yere almak, 156 çağrıyı kademeli taşımak.

**Çözüm önceliği:** Orta — mimari karar gerektiriyor.

---

### API-006

**Severity:** 🔵 LOW
**TÜR:** mimari

**Başlık:** `ContentController` aynı türden veri için iki farklı zarf kullanıyor: 9 metot çıplak, 2 metot `JsonResponse` sarmalı

**Dosya:** `api/src/Presentation/Controllers/ContentController.php:3-50`

**Problem:**

```php
api/src/Presentation/Controllers/ContentController.php:24-45 (kesit)
    public static function getTermsOfSale(): void {
        echo json_encode(Database::getInstance()->getGlobalVars('satis_kosullari'));
        exit;
    }

    public static function getDelivery(): void {
        echo json_encode(Database::getInstance()->getGlobalVars('teslimat_iade_sartlari'));
        exit;
    }
    ...
    public static function getPrivacy(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('gizlilik_politikasi')]);
    }

    public static function getUsage(): void {
        JsonResponse::success(['content' => Database::getInstance()->getGlobalVars('kullanim_kosullari')]);
    }
```

Dördü de aynı işi yapıyor (bir `global_vars` metni okumak), ama `getTermsOfSale`/`getDelivery`
çıplak `{anahtar: değer}` döndürürken `getPrivacy`/`getUsage` `{success:true, content:{anahtar: değer}}`
döndürüyor.

**Kanıt (bölüm 24 — istemcinin bu farkı doğru ele aldığı doğrulandı; ilk hipotezim YANLIŞ çıktı):**

```
İlk şüphem: PrivacyPolicy.jsx `result.content?.gizlilik_politikasi` okuyor,
            sunucu çıplak dönüyorsa bu bozuk olurdu.
$ ContentController.php:39-41 okundu → getPrivacy GERÇEKTEN 'content' ile sarıyor.
   → İstemci DOĞRU. Bu yönde bulgu YAZILMADI.

İstemci tarafı eşleşmeler (dördü de doğru):
MesafeliSatisPopup.jsx:15   result.satis_kosularini            ← çıplak, doğru
TeslimatIadePopup.jsx:15    result.teslimat_iade_sartlari      ← çıplak, doğru
UsagePopup.jsx:15           result.content?.kullanim_kosullari ← sarmalı, doğru
PrivacyPolicy2.jsx          result.success && result.content?.gizlilik_politikasi ← sarmalı, doğru
```

**Neden yine de bir bulgu:** İstemci bugün doğru eşleşiyor çünkü her bileşen kendi
endpoint'ine özel yazılmış. Ama iki zarf aynı controller içinde yan yana durduğu için:
- Yeni bir içerik endpoint'i eklerken hangi deseni izleyeceği belirsiz.
- `PrivacyPolicy2.jsx` `result.success` kontrolü yapıyor, `TeslimatIadePopup.jsx` yapamıyor
  (anahtar yok) — yani hata tespiti endpoint'e göre değişiyor (API-005'in kök nedeni).

**Impact:** Sözleşme öngörülemezliği; kopyala-yapıştır ile yanlış deseni benimseme riski.

**Önerilen çözüm:** 11 metodun tamamını tek bir zarfa (`JsonResponse::success`) almak.
README'nin bu istisnaları belgeleyen bölümünü (README:405-410) güncellemek.

**Çözüm önceliği:** Düşük.

---

## 3. FRONTEND API (denetim.md bölüm 4, yalnızca "Frontend API" alt bölümü)

---

### FE-001

**Severity:** 🟠 HIGH
**TÜR:** iş mantığı + doküman

**Başlık:** Ayarlar sayfasında kullanıcıya gösterilen gizlilik politikası ve kullanım koşulları sabit kodlu iki cümlelik yer tutucu — admin panelinden yönetilen gerçek hukuki metin hiçbir kullanıcıya ulaşmıyor

**Dosya:** `web/src/app/dashboard/settings/page.jsx:380-400, 826, 841`

**Problem:** Ayarlar sayfası, aynı isimli bileşenleri **kendi içinde yeniden tanımlıyor** ve
API'ye hiç gitmiyor:

```javascript
web/src/app/dashboard/settings/page.jsx:380-400
function PrivacyPolicy2() {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 leading-relaxed">
      <h4 className="text-sm font-semibold text-white">Gizlilik Politikası</h4>
      <p>
        Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (KVKK) uyarınca güvenle işlenmekte ve saklanmaktadır. Detaylı bilgi için
        destek ekibimizle görüşebilirsiniz.
      </p>
    </div>
  );
}

function TermsOfUse() {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 leading-relaxed">
      <h4 className="text-sm font-semibold text-white">Kullanım Koşulları</h4>
      <p>
        Platformumuzu kullanarak tüm hizmet şartlarını, telif hakları
        sözleşmesini ve topluluk kurallarını kabul etmiş sayanırsınız.
```

**Kanıt (bölüm 24 — gerçek metni çeken bileşenlerin canlı olup olmadığı ve zincirin nerede
koptuğu adım adım izlendi):**

```
1) Gerçek metni çeken bileşenler VAR ve doğru yazılmış:
web/src/widgets/info/PrivacyPolicy2.jsx:12-20
        const res = await fetch("/api/content/getprivacy.php");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success && result.content?.gizlilik_politikasi) {
            setInfo(result.content.gizlilik_politikasi);
web/src/widgets/info/TermsOfUse.jsx:8-17   (aynı desen, getusage.php)

2) Ama bu dosyalar ÖLÜ (Tur 1 DEAD-004'te doğrulanmıştı):
$ for f in AboutPopup GizlilikPopup PrivacyPolicy PrivacyPolicy2 TermsOfUse UsagePopup; do
    grep -rn "widgets/info/$f" web/src | grep -v "widgets/info/$f.jsx" | wc -l; done
0 0 0 0 0 0     → altısının da importer'ı yok.

3) settings/page.jsx neyi render ediyor?
web/src/app/dashboard/settings/page.jsx:826, 841
                  <PrivacyPolicy2 />
                  <TermsOfUse />
   → satır 380 ve 393'te YEREL olarak tanımlanan sabit metinli sürümler.

4) Backend zinciri sağlam mı? EVET:
api/src/Presentation/Controllers/ContentController.php:39-45   getPrivacy / getUsage
api/functions/db.php:322-337                                   getGlobalVars
api/admin/gizlilikpolitikasi.php, api/admin/kullanimkosullari.php  (Tur 1 envanteri)
   → admin sayfası var, API var, sadece kullanıcı arayüzü onları tüketmiyor.
```

**Neden HIGH:** Bu bir "ölü kod" bulgusu değil — **çalışan bir yönetim özelliğinin sonuçsuz
kalması.** Sonuçları:
1. Admin `gizlilikpolitikasi.php` sayfasından KVKK metnini günceller, kaydeder, başarı
   mesajı alır — kullanıcı arayüzünde **hiçbir şey değişmez.** Değişikliğin etkisiz olduğuna
   dair bir uyarı yok.
2. Kullanıcıya gösterilen metin "Detaylı bilgi için destek ekibimizle görüşebilirsiniz"
   diyor — yani gizlilik politikası olarak sunulan şey, politikanın kendisi değil.
   Türkiye'de KVKK aydınlatma metni ve mesafeli satış sözleşmesi içerik olarak zorunlu;
   yer tutucu metin bu yükümlülüğü karşılamıyor.
3. `MesafeliSatisPopup` ve `TeslimatIadePopup` (Tur 1'de canlı olduğu doğrulanan ikisi)
   **gerçek metni** çekiyor. Yani aynı üründe iki hukuki metin API'den, ikisi sabit kodlu —
   tutarsız.

**Dürüstlük notu:** Bunun bilinçli bir geçici çözüm olma olasılığını değerlendirdim. Aleyhine
kanıt: `widgets/info/PrivacyPolicy2.jsx` ve `TermsOfUse.jsx` **aynı isimlerle** ve tam
çalışan fetch mantığıyla mevcut; yani sabit sürümler onların yerine geçmiş görünüyor,
kasıtlı bir tasarım değil. Yine de "geçici olarak böyle bırakıldı" olasılığını
Doğrulanamayanlar'a koyuyorum.

**Impact:** Yönetilen hukuki içerik kullanıcıya ulaşmıyor; admin değişiklikleri sessizce
etkisiz.

**Önerilen çözüm:** `settings/page.jsx:380-400`'deki yerel tanımları kaldırıp
`@/widgets/info/PrivacyPolicy2` ve `@/widgets/info/TermsOfUse`'u import etmek. Bu aynı
zamanda Tur 1 DEAD-004'ün 6 ölü dosyasından 2'sini canlandırır.

**Çözüm önceliği:** Yüksek — hukuki içerik.

---

### FE-002

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı

**Başlık:** Sohbet başlatmadan önceki abonelik kontrolü istemcide yorum satırına alınmış — Tur 3 PAY-002'nin (ödeme duvarı yok) istemci tarafı yarısı

**Dosya:** `web/src/app/dashboard/chat/page.jsx:455-458`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:455-459
    /*if (!hasSubscription) {
      alert("Bu chatbot ile konuşmak için aktif bir aboneliğiniz bulunmuyor.");
      return;
    }*/
    if (!data.text.trim() && !data.fileName && !data.audioUrl) return;
```

**Kanıt (bölüm 24 — `hasSubscription` state'inin gerçekten hesaplandığı ve başka bir yerde
kullanılıp kullanılmadığı kontrol edildi):**

```
$ grep -n 'hasSubscription' web/src/app/dashboard/chat/page.jsx
(yalnızca satır 455 — yorum içinde)

$ Abonelik verisi çekiliyor mu?
web/src/app/dashboard/chat/page.jsx:93
          const res = await fetch(`/api/wallet/getsubscription.php?user_id=${uId}&chatbot_id=${bId}`);
   → EVET, endpoint çağrılıyor. Sonucun hangi state'e gittiği bu turda okunmadı
     (satır 93 çevresi okundu, atama satırı okunmadı) — bkz. Doğrulanamayanlar.

$ Sunucu tarafı bu kontrolü yapıyor mu?
   Tur 3 PAY-002: userHasAccess() satır 9 → satıştaki her bot için abonelik GEREKTİRMİYOR.
   generateReply: chatbot_id hiç almıyor, dolayısıyla kontrol edemiyor (Tur 2 SEC-015).
```

**Neden problem:** İki katmanın **ikisi de** aboneliği kontrol etmiyor. İstemci tarafı
kontrolü tek başına güvenlik sağlamaz (kullanıcı isteği doğrudan gönderebilir) — o yüzden
bu bir güvenlik açığı olarak değil, **ürün niyeti kanıtı** olarak önemli: yorum satırının
varlığı, abonelik zorunluluğunun tasarımda **var olduğunu** ama uygulanmadığını gösteriyor.
Tur 3 PAY-002'de "bu erişim politikası bilinçli bir önizleme tercihi mi?" sorusunu açık
bırakmıştım; bu yorum satırı, kontrolün bir noktada var olup **kaldırıldığını** gösteren
doğrudan kanıt.

**Impact:** Kendi başına düşük (istemci kontrolü zaten atlatılabilir). Değeri, PAY-002'nin
niyet analizini netleştirmesinde.

**Önerilen çözüm:** Kontrolü istemcide geri getirmek (UX için) **ve** sunucuda uygulamak
(PAY-002'nin çözümü). İstemci tarafı tek başına yeterli değil.

**Çözüm önceliği:** Orta — PAY-002 ile birlikte.

---

### FE-003

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Sohbette dosya eki base64'e çevriliyor, `parts` dizisine ekleniyor ve sonra **hiç kullanılmadan atılıyor** — dosya Gemini'ye asla ulaşmıyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:555-567`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:554-567
      // Gemini akışını başlat
      let parts = [{ text: data.text }];
      if (data.file) {
        try {
          const base64Data = await fileToBase64(data.file);
          parts.push({
            inline_data: { mime_type: data.file.type, data: base64Data },
          });
        } catch (err) {
          console.error("Dosya hatası:", err);
        }
      }

      await generateReply(data.text);
```

Satır 555-565 `parts` dizisini kuruyor (metin + `inline_data` ile dosya), satır 567 ise
`generateReply(data.text)` çağırıyor — **yalnızca metni.** `parts` bir daha kullanılmıyor.

**Kanıt (bölüm 24 — `parts`'ın tüm yaşam döngüsü ve sunucunun multimodal desteği kontrol edildi):**

```
$ grep -n 'parts' web/src/app/dashboard/chat/page.jsx
555:      let parts = [{ text: data.text }];
559:          parts.push({
633:            const textChunk = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
   → 633 ilgisiz (Gemini YANITINI ayrıştırıyor). Yani `parts` yazılıyor, hiç okunmuyor.

$ generateReply imzası ne alıyor?
web/src/app/dashboard/chat/page.jsx:583   const generateReply = async (userText) => {
   → tek parametre: metin.

$ Sunucu multimodal destekliyor mu?
api/src/Presentation/Controllers/ChatController.php:199-207
        $payload = json_encode([
            'contents' => [[ 'role' => 'user', 'parts' => [
                    ['text' => $systemInstruction],
                    ['text' => $message],
            ]]],
        ]);
   → HAYIR. Yalnızca iki `text` parçası. inline_data için yol yok.
```

**Neden problem:** Kullanıcı arayüzü dosya eki kabul ediyor (`MessageInput.jsx` bir dosya
seçici sunuyor — Tur 1 envanterinde mevcut, bu turda okunmadı), dosya okunuyor, base64'e
çevriliyor (büyük dosyalarda pahalı bir işlem, ana thread'i bloklar), sonra **sessizce
atılıyor.** Kullanıcı dosyasının analiz edildiğini sanır; AI onu hiç görmemiştir ve
göremediğini de söylemez — çünkü dosyadan haberi yoktur.

Bu, denetim.md bölüm 4'ün "payload doğru mu?" sorusunun net bir "hayır"ı: istemci bir
payload kuruyor, gönderdiği payload farklı.

**Impact:** Çalışmayan özellik; kullanıcı yanıltması. Gemini'ye gitmeyen dosya için
kullanıcı coin harcamış olur (AI-005).

**Dürüstlük notu:** `data.fileName` satır 459'daki koşulda mesaj gönderme ölçütü olarak
kullanılıyor — yani dosya-yalnızca mesaj gönderilebiliyor. O durumda `data.text` boş olur
ve Gemini'ye boş bir mesaj gider.

**Önerilen çözüm:** Ya sunucuya multimodal desteği eklemek (`$data['parts']` alıp Gemini
payload'ına aktarmak, boyut sınırıyla — AI-001), ya arayüzden dosya ekini kaldırmak.
Şu anki hâl en kötüsü.

**Çözüm önceliği:** Orta.

---

### FE-004

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Kullanıcı mesajının kaydı `await` edilmeden gönderiliyor ve etrafındaki `try/catch` hiçbir şey yakalamıyor — sohbet geçmişinde mesaj sırası bozulabiliyor

**Dosya:** `web/src/app/dashboard/chat/page.jsx:544-552`

**Problem:**

```javascript
web/src/app/dashboard/chat/page.jsx:544-552
      try {
        fetch("/api/chat/addchat.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: JSON.stringify(userPayload) }),
        });
      } catch (error) {
        console.error("Kullanıcı mesajı DB hatası:", error);
      }
```

İki ayrı kusur:

1. **`await` yok.** `fetch` bir promise döndürüyor ve beklenmiyor. Bot cevabının kaydı ise
   `await` ediliyor (satır 649). Yani iki insert yarışıyor: kullanıcı mesajı ateşle-ve-unut,
   bot cevabı beklenerek. Ağ gecikmesine göre **bot cevabı kullanıcı mesajından önce**
   veritabanına yazılabilir.

2. **`try/catch` ölü kod.** `await` olmadığı için `fetch`'in reddi bu bloğa **düşmez** —
   yakalanmayan bir promise reddi (unhandled rejection) olur. Satır 550-552 hiçbir zaman
   çalışmaz. Kullanıcı mesajının kaydedilememesi tamamen sessiz kalır.

**Kanıt (bölüm 24 — sıralamanın gerçekten `sent_time`'a bağlı olduğu ve karşılaştırma
noktasının doğru olduğu kontrol edildi):**

```
$ Bot cevabı await ediliyor mu?
web/src/app/dashboard/chat/page.jsx:649        await fetch("/api/chat/addchat.php", {
   → EVET. Asimetri doğrulandı.

$ Geçmiş hangi alana göre sıralanıyor?
api/src/Presentation/Controllers/ChatController.php:158-159 (getHistory alt sorgusu)
   (SELECT bc_inner.message FROM chatbot_chats bc_inner WHERE ... ORDER BY bc_inner.sent_time DESC LIMIT 1)
   → sent_time. 

$ sent_time nereden geliyor?
$ awk '/CREATE TABLE.*`chatbot_chats`/,/^\) ENGINE/' api/database/schema.sql | grep sent_time
  `sent_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
   → INSERT anında sunucuda atanıyor. Yani INSERT sırası = sent_time sırası.
     İstemci sırayı garanti etmediği için geçmiş sırası da garanti değil.

$ getChat sıralama yapıyor mu?
api/src/Presentation/Controllers/ChatController.php:19-22
            'message, sent_by FROM chatbot_chats WHERE chatbot_id = ? AND user_id = ?',
   → ORDER BY YOK. Sıralama tamamen InnoDB'nin döndürme sırasına bağlı (pratikte
     birincil anahtar sırası = insert sırası). Yani yarış doğrudan görünür hâle gelir.
```

**Nasıl tetiklenebilir:** Yavaş bir bağlantıda kullanıcı mesajının POST'u, Gemini akışı
tamamlanana kadar sürerse (akış 15 saniyeye kadar sürebilir — AI-002), sıra normalde korunur.
Ama kullanıcı mesajının POST'u başarısız olup yeniden denenirse ya da bağlantı havuzunda
sıraya girerse, bot cevabı önce yazılabilir. Sayfa yenilendiğinde kullanıcı **cevabı sorudan
önce** görür.

**Impact:** Bozuk sohbet geçmişi; kullanıcı mesajı kaybının tamamen sessiz kalması.

**Önerilen çözüm:** `await fetch(...)` yapmak (sıra garantisi) veya sunucuda tek bir
endpoint'e hem soruyu hem cevabı sıralı yazmak. `getChat`'e `ORDER BY sent_time, id`
eklemek — sıralama garantisi olmayan bir sorgu her hâlükârda kırılgan.

**Çözüm önceliği:** Orta.

---

### FE-005

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** Ham kart numarası, CVV ve son kullanma tarihi uygulamanın kendi backend'ine gönderiliyor — ödeme ağ geçidi tokenizasyonu/hosted alanı kullanılmıyor

**Dosya:** `web/src/app/dashboard/checkout/page.jsx:167-172`

**Problem:**

```javascript
web/src/app/dashboard/checkout/page.jsx:167-181
          card: {
            number: cardInfo.number.replace(/\s/g, ""),
            expiry: cardInfo.expiry,
            cvv: cardInfo.cvv,
            holder_name: cardInfo.holderName.trim(),
          },
          use_3d: false,
        };
        const formData = new FormData();
        formData.append("data", JSON.stringify(payload));
        const res = await fetch("/api/marketplace/createsubscription.php", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
```

**Kanıt (bölüm 24 — kartın sunucuda ne olduğu izlendi):**

```
api/src/Presentation/Controllers/MarketplaceController.php:280-281
        $card = is_array($data['card'] ?? null) ? $data['card'] : [];
        $chargeResult = chargeCard($card, $totalAmount);

api/functions/checkout_payments.php:29-31, 61
    $number = preg_replace('/\D/', '', (string) ($card['number'] ?? ''));
    $cvv    = preg_replace('/\D/', '', (string) ($card['cvv'] ?? ''));
    ...
    error_log('[checkout_payments-stub] chargeCard: simulated charge of ' . $amount . ' for card ending ' . substr($number, -4));

   → Kart PHP sürecinin belleğine giriyor; DB'ye YAZILMIYOR (doğrulandı — 
     $paymentRow'da kart alanı yok, MarketplaceController:291-296).
     error_log'a yalnızca son 4 hane düşüyor (Tur 3 PAY-015).
```

**Neden LOW ve neden yine de bir bulgu:** Kart **saklanmıyor** — bu önemli ve olumlu.
Bulgu, mimari tercihle ilgili: ham PAN'ın uygulama sunucusundan geçmesi, o sunucuyu
PCI-DSS kapsamına sokar. Param POS gibi ağ geçitleri bunu önlemek için hosted ödeme
sayfası veya istemci-taraflı tokenizasyon sunar (`use_3d` bayrağının varlığı böyle bir
akışın düşünüldüğünü ama uygulanmadığını gösteriyor — API-004).

Ayrıca Tur 2 SEC-001 ile zincir: `api/admin/error_log` HTTP'den okunabiliyorsa, oraya
düşen son-4 + tutar kayıtları erişilebilir hâle gelir.

**Impact:** Uyum (compliance) kapsamının gereksiz genişlemesi; gerçek gateway
entegrasyonunda mimari değişiklik gerektirecek.

**Önerilen çözüm:** Gerçek entegrasyonda kartı hiç backend'e göndermemek — gateway'in
hosted alanı veya tokenizasyon SDK'sı kullanmak. `chargeCard` yalnızca token almalı.

**Çözüm önceliği:** Düşük — ama gerçek ödeme entegrasyonu tasarımında dikkate alınmalı.

---

## 4. ELENEN FALSE POSITIVE'LER (denetim.md bölüm 24)

| Aday | Neden bulgu değil | Doğrulama |
| --- | --- | --- |
| `PrivacyPolicy.jsx` `result.content?.gizlilik_politikasi` okuyor, sunucu çıplak dönüyor olabilir | Sunucu **gerçekten** `content` ile sarıyor — istemci doğru | `ContentController.php:39-41` → `JsonResponse::success(['content' => ...])` |
| `dashboard/page.jsx` 5 fetch'te ne `res.ok` ne `success` kontrol ediyor → çökme | Optional chaining + `Array.isArray` guard'ları hata yanıtında **boş listeye** düşürüyor, çökmüyor | `dashboard/page.jsx:778-785` |
| `dashboard/page.jsx`'in `unData?.categories` / `hideData?.hidden` / `botsData?.bots` beklentisi sunucuyla uyuşmuyor olabilir | Üçü de birebir eşleşiyor | `SocialController.php:331` `['hidden' => ...]`, `:349` `['categories' => ...]`, `ChatbotController.php:99` `['bots' => ...]` |
| `consumemessage` her zaman `success:true` döndüğü için istemci hakkın bittiğini fark etmiyor (Tur 3 COIN-005) | İstemci `success` değil **`allowed`** okuyor — doğru alan | `chat/page.jsx:472` → `if (!allowanceResult.allowed)` |
| `application/x-www-form-urlencoded` kullanımı README'nin belgelediği `multipart/form-data` sözleşmesini bozuyor | PHP `$_POST`'u her iki içerik tipi için de dolduruyor; `parse_post_data()` `$_POST['data']` okuyor → çalışıyor. README'nin ifadesi eksik, kod hatalı değil | `bootstrap.php:76-85`; `chat/page.jsx:466` ve `checkout/page.jsx:175-176` iki farklı tip kullanıyor, ikisi de çalışıyor |
| `loadFullTrainingPrompt`'un `while (hasMore)` döngüsü sonsuza girebilir | `hasMore` sunucuda `($offset + $limit) < $totalLength` ile hesaplanıyor ve `$offset` monoton artıyor → sonlanır | `TrainingController.php:75` |
| Checkout istemcide fiyatı yeniden hesaplıyor olabilir | Sunucudan gelen `lineTotal` olduğu gibi kullanılıyor; yorum bunu açıkça koruyor | `checkout/page.jsx:107-109`, `:214-221` |
| Checkout `success` kontrolü ve hata gösterimi eksik | `result.success` kontrolü, `result.message` gösterimi ve `catch` bloğu **var** | `checkout/page.jsx:182-207` |
| `get_training_chunks.php` `data.success` kontrolü yapılmıyor olabilir | Yapılıyor ve sunucu `JsonResponse::success` kullanıyor → uyumlu | `chat/page.jsx:166`, `TrainingController.php:72` |
| `getchat.php` başka kullanıcıların mesajlarını döndürebilir | Sorgu `chatbot_id = ? AND user_id = ?` ile kapsıyor (Tur 2'de de doğrulanmıştı) | `ChatController.php:19-22` |

---

## 5. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**AI entegrasyonunun mimari tercihi.** Tek bir karar bu turun bulgularının çoğunu üretiyor:
**sistem talimatının istemcide kurulması.** Bu karar, botun kimliğini (persona + eğitim
metni) bir sunucu kavramı olmaktan çıkarıp istemci sözleşmesinin parçası yapıyor. Sonuçları
zincirleme: sunucu hangi bot için çağrı yapıldığını bilmediği için erişim kontrolü yapamıyor
(Tur 2 SEC-015), coin tüketimini bağlayamıyor (Tur 3 COIN-001), boyut/token sınırı
koyamıyor (AI-001), ve ödeme duvarı işlevsiz kalıyor (Tur 3 PAY-002). Tek bir düzeltme —
`chatbot_id` alıp talimatı sunucuda kurmak — dört turda tespit edilmiş beş bulgunun kökünü
kesiyor. Bu, denetimin bulduğu en yüksek getirili tek değişiklik.

**Akış (streaming) işleyişi.** Sunucu tarafı özenli: SSE başlıkları, buffer boşaltma,
upstream hatasını yakalayıp yapılandırılmış bir `error` çerçevesine çevirme, ve API
anahtarını istemciye sızdırmama konusunda açık bir yorum. İstemci tarafı ise üç yerde
eksik: `res.ok` kontrolü yok (AI-003), satır tamponlaması yok (AI-004), ve zaman aşımı
sunucunun yarısı (AI-002). Üçünün ortak sonucu aynı: **hata sessizleşiyor.** Sunucu
"neden başarısız olduğunu" özenle iletiyor, istemci onu okuyamıyor. Satır 664-666'daki
yorum bu ayrımı yapmayı hedefliyor ama yalnızca Gemini'nin hatalarını kapsıyor, sunucunun
kendi hatalarını değil.

**Zarf tutarlılığı.** Tur 2 ERR-003'ün (28 noktada `JsonResponse` atlanması) kullanıcı
etkisi bu turda ölçüldü. En keskin örnek API-001: `getchatbot.php` başarıda zarfsız,
hatada zarflı. İstemci bu asimetri karşısında hiç kontrol yapmamayı seçmiş — ve sonuç,
ürünün ana akışında (sohbet) 404'ün tamamen sessiz kalması. `res.ok`'un 51 dosyanın
8'inde kontrol edilmesi (API-005) bir disiplin eksikliği değil, sözleşmenin
öngörülemezliğine verilen rasyonel bir tepki: `success` anahtarının var olup olmadığı
endpoint'e göre değiştiğinde, istemci geliştiricisi kontrolü tamamen bırakıyor. Tur 1
DOC-004'te tespit edilen `shared/api/client.js` (0 importer) tam bu iş için yazılmış ve
kullanılmıyor.

**İstemci-sunucu payload uyumu.** Üç ayrı sızıntı bulundu ve üçü farklı türden:
`use_3d` gönderiliyor, okunmuyor (API-004); `parts` kuruluyor, gönderilmiyor (FE-003);
kimlik parametreleri gönderiliyor, yok sayılıyor (API-003). İlk ikisi kullanıcıya yanlış
bir yetenek vaat ediyor (3-D Secure, dosya analizi); üçüncüsü zararsız ama denetimde
yanlış IDOR sinyali üretiyor. Hiçbiri runtime hatası vermediği için hiçbiri fark
edilmemiş — sessiz uyuşmazlıklar.

**Yönetilen içeriğin kullanıcıya ulaşması.** FE-001 tek bir bulgu ama tipik bir kalıbı
gösteriyor: backend zinciri eksiksiz (admin sayfası → `global_vars` → API endpoint →
fetch yapan bileşen), ama son halka kopmuş — ayarlar sayfası o bileşeni import etmek
yerine aynı isimle sabit metinli bir yerel sürüm tanımlamış. Tur 1 DEAD-004 bu dosyaları
"ölü kod" olarak işaretlemişti; Tur 4 aynı gerçeğin diğer yüzünü gösteriyor: ölü olan
kod, **çalışan** olandı. Hukuki metin bağlamında bu, silinecek ölü kod değil, geri
bağlanacak canlı kod.

---

## 6. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| `getPublished()` ile `getPublishedV2()` arasındaki **veri** farkı (API-002) | `ChatbotRepository.php:76` ve `:105` satırlarının varlığı doğrulandı, gövdeleri okunmadı. İki endpoint'in zarf farkı kesin; döndürdükleri alanların farkı bilinmiyor. |
| `chat/page.jsx:93`'teki `getsubscription.php` yanıtının hangi state'e yazıldığı (FE-002) | Satır 93 çevresi okundu, atama satırı okunmadı. `hasSubscription` state'inin hiç tanımlanmadığı doğrulandı (yalnızca yorum içinde geçiyor), ama abonelik verisinin başka bir state'e gidip başka bir yerde kullanılıp kullanılmadığı belirsiz. |
| FE-001'in bilinçli geçici bir çözüm olup olmadığı | Aleyhine kanıt güçlü (`widgets/info/` altında tam çalışan aynı isimli bileşenler var). Yine de "geçici olarak sabitlendi" olasılığı kod okumasıyla dışlanamaz. |
| `chat/page.jsx:671` sonrasındaki hata gösterim dalının tam metni (AI-003) | Satır 670'e kadar okundu; `upstreamError` null olduğunda gösterilen jenerik metnin kendisi okunmadı. Jenerik olduğu satır 667'deki üçlü operatörün yapısından çıkarıldı. |
| `MessageInput.jsx`'in dosya seçiciyi gerçekten sunduğu (FE-003) | Dosya okunmadı (260 satır). `data.file` ve `data.fileName`'in `chat/page.jsx`'te kullanılması dolaylı kanıt; arayüzde gerçekten bir dosya butonu olup olmadığı doğrulanmadı. |
| AI-004'ün pratikte ne sıklıkta gerçekleştiği | Parça sınırlarının nereye düştüğü ağ/Gemini davranışına bağlı; çalıştırmadan ölçülemez. Kod yolunun var olduğu kesin, tetiklenme sıklığı değil. |
| `getchatbotlimits.php`'nin arayüze ne gösterdiği (Tur 3 BIZ-002'den devredilen) | `ChatbotController:226-245` bu turda **okunmadı**. Tur 3'ten devredilen soru hâlâ açık. |
| Gemini'nin `finishReason` alanını gerçekten gönderdiği (AI-007) | Gemini API davranışı; repodan doğrulanamaz. Bulgu "istemci bu alanı okumuyor" tespitiyle sınırlı. |

---

## 7. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Frontend — kısmi okunanlar (bilinçli sınır):**
- `chat/page.jsx` 873 satırın ~200'ü okundu. Okunmayan bölgeler: satır 1-45 (state/import),
  180-222, 250-455 (konuşma yükleme, `getconversation`/`getchat` tüketimi),
  530-541, 671-873 (hata gösterimi, render, `VoiceModal`/`DialogNotebookModal` entegrasyonu).
- `checkout/page.jsx` 725 satırın ~60'ı okundu. `validateCard` (satır 43-60) ve
  `getcart.php` tüketimi (satır 93-127) yalnızca grep ile görüldü; render katmanı okunmadı.
- `dashboard/page.jsx` 735-800 arası okundu; kalan ~1000 satır okunmadı.
- `settings/page.jsx` 378-400 okundu; 12 fetch'in hiçbirinin tüketimi incelenmedi.

**Frontend — hiç okunmayanlar:**
- `MessageInput.jsx` (260), `VoiceModal.jsx`, `BuyModal.jsx` (192) — Tur 3'ten
  devredilen `BuyModal` incelemesi **yapılamadı**.
- `ProfileCard.jsx` (11 fetch), `BankInfo.jsx` (7), `DialogueModal.jsx` (7),
  `ChatbotCard.jsx` (7), `chatbots/create/page.jsx` (6), `SellerOnboardingWizard.jsx` (5),
  `DashboardHeader.jsx` (5) — toplam 48 fetch içeren yedi dosyanın hiçbiri okunmadı.
  Bunlar API-005'in mekanik sayımına dâhil, ama **sözleşme karşılaştırması yapılmadı**.
- `shared/api/client.js` — Tur 1'de okunmuştu; bu turda benimsenme durumu yeniden
  kontrol edilmedi.

**Backend — hiç okunmayanlar:**
- `ChatbotRepository::getPublished()` / `getPublishedV2()` gövdeleri (API-002'nin veri
  farkı bu yüzden bilinmiyor).
- `ChatbotController::getChatbotLimits`, `getSuggested`, `getDefaultBot`,
  `getChatbotsMenu` — dördü de frontend tarafından çağrılan veya çağrılmayan endpoint'ler.
- `NoteController` (8 metot), `UserController`'ın 7 metodu, `SellerController`'ın
  9 metodu — sözleşme karşılaştırması yapılmadı.

### Bölüm bazında boş kalan maddeler

**Bölüm 9** — şu maddeler denetlenmedi:
- `retry`: İstemcide "Tekrar Dene" mekanizması olduğu satır 575-577'deki yorumdan biliniyor
  (`generateReply`'ın `handleSendMessage`'dan ayrılma gerekçesi), ama **kodu okunmadı**.
  Yeniden denemede coin'in tekrar tüketilip tüketilmediği (yorum "tüketmeden" diyor)
  doğrulanmadı.
- `malicious prompts` / `prompt injection`: AI-001'de sınırlayıcı taklidi riski işaret
  edildi ama sistematik olarak denenmedi (çalıştırma gerektirir).
- `user content isolation`: `getchat.php`'nin kapsaması doğrulandı; `chatbot_conversations`
  ve `chatbot_chats` arasındaki ilişki (Tur 2'de "conversation başına sütun yok" notu)
  bu turda AI bağlamında yeniden değerlendirilmedi.
- `failed generation sonrası database state`: AI-007'de kısmi kayıt tespit edildi;
  `chatbot_conversations` satırının cevapsız kaldığı durumda temizlenip temizlenmediği
  incelenmedi.

**Bölüm 11** — denetim.md'nin istediği **tam sözleşme tablosu** (her endpoint için
Method / Auth / Input / Validation / Output / Errors / HTTP status / Side effects /
Database changes) **üretilmedi.** 120 endpoint için bu tablo tek turda çıkarılamazdı;
bunun yerine sözleşme **uyumsuzluklarına** odaklandım. Tam tablo hâlâ eksik ve
üretilecekse ayrı bir tur gerektirir. Karşılaştırma yapılan endpoint sayısı: 14
(`getchatbot`, `getchatbots`, `getchatbots_v2`, `get_training_chunks`, `generatereply`,
`consumemessage`, `checkmessageallowance`, `addchat`, `addconversation`, `getcart`,
`createsubscription`, `gethide`, `getuninterest`, `getuserlists`, `getprivacy`,
`getusage`, `getdelivery`, `gettermsofsale`, `getcategories`) — yani 120'nin ~%16'sı.

**Bölüm 4 (Frontend API)** — "authentication gerektiren endpoint'ler gerçekten korunuyor mu?"
maddesi bu turda **denetlenmedi**; Tur 2'de sunucu tarafı guard kapsamı ölçülmüştü
(controller başına `requireAuth` sayımı), ama istemcinin korumasız sandığı bir endpoint'i
çağırıp çağırmadığı karşılaştırılmadı. `FormData` formatı ve JSON encoding maddeleri
false positive bölümünde kısmen ele alındı (iki farklı content-type kullanımının ikisinin
de çalıştığı doğrulandı), ama 156 çağrının tamamı taranmadı.
