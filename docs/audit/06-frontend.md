# Tur 6 — React / Next.js, UX, SEO / Erişilebilirlik ve Kod Kalitesi

Kapsanan `docs/denetim.md` bölümleri: **4** (yalnızca React ve Next.js alt bölümleri —
"Frontend API" Tur 4'te yapıldı), **17** (UX / Product), **18** (SEO / Accessibility),
**19** (Code Quality).

---

## BU RAPORUN KURALLARI

- **HİÇBİR KAYNAK DOSYA DEĞİŞTİRİLMEDİ.** Yazma işlemi yalnızca `docs/audit/` altına yapıldı.
- Her bulgu `dosya:satır` + en fazla 15 satırlık kod alıntısı içerir. Okunmayan dosya hakkında bulgu yazılmadı.
- Bulgu formatı `denetim.md` bölüm 23; severity ölçeği bölüm 22.
- `denetim.md` bölüm 24 (false positive kontrolü) her bulgudan önce uygulandı; arama komutu ve sonucu bulgunun içinde.
- Her bulguya bölüm 27'ye göre **TÜR** etiketi verildi (bug / güvenlik / iş mantığı / mimari / teknik borç / doküman / prod blocker).
- **Bölüm 26'daki X/10 puanlama üretilmedi.** Yerine gerekçeli değerlendirme yazıldı.
- Emin olunamayan her şey "Doğrulanamayanlar" başlığında, nedeniyle birlikte.
- **Kozmetik/stil notu yazılmadı.** Bölüm 19 bunu ayrıca vurguluyor ("Sırf 'ben farklı
  yazardım' diye sorun üretme") — bu turda birkaç aday bu gerekçeyle elendi, listesi
  false positive bölümünde.

---

## 0. ÖNCEKİ TURLARIN AÇIK SORULARINA CEVAPLAR

Üç devredilen soru bu turda kapandı ve **üçü de temiz çıktı**. Bölüm 27 gereği olumsuz
sonuçlar da kayda geçiyor.

### Teyit 1 — Admin sayfalarındaki `echo` çıktıları: kullanıcı→admin stored XSS **yok**

Tur 2, admin PHP sayfalarının `echo` çıktılarını hiç denetleyemedi ve bunu "en olası
stored-XSS yeri" olarak Tur 6'ya bıraktı. Sonuç: **kullanıcı kontrollü alanların hepsi
escape ediliyor.**

```
$ grep -rnE '<\?=[^?]*\$[a-z_]+\[.(isim|aciklama|kullanici_adi|ad_soyad|eposta|comment|report_detail|conversation_name|message)' \
      api/admin --include=*.php
api/admin/adminler.php:24            <?= htmlspecialchars($admin['kullanici_adi'] ?? '') ?>
api/admin/chatbotistatistik.php:14   <?= htmlspecialchars($chatbot['isim'] ?? '') ?>
api/admin/chatbotlar.php:15          <?= htmlspecialchars($chatbot['isim'] ?? '') ?>
api/admin/kullanicilar.php:14        <?= htmlspecialchars($kullanici['ad_soyad'] ?? '') ?>
   → 4/4 escape edilmiş. Kullanıcı kontrollü bir alanın escape'siz basıldığı yer
     bulunamadı.
```

Tur 2 SEC-014'te "`addComment` hiçbir sanitizasyon yapmıyor" tespiti geçerliliğini
koruyor — ama yorumlar admin panelinde hiç render edilmiyor, dolayısıyla o yönde bir XSS
zinciri **oluşmuyor**. Kalan tek escape'siz nokta CQ-001'de (admin kontrollü veri, düşük).

### Teyit 2 — Tur 5 BE-003: parola hash'leri HTML'e **düşmüyor**

Tur 5'te `admin/kullanicilar.php:2`'nin `SELECT *` ile tüm kullanıcıların `sifre`
sütununu çektiğini tespit ettim ama render kısmını okumadığım için sızıntı iddiası
yapmadım. Şimdi okundu:

```php
api/admin/kullanicilar.php:12-16
                    <?php foreach ($kullanicilar as $kullanici): ?>
                        <li class="..." data-id="<?= $kullanici['id'] ?>">
                            <span class="font-medium"><?= htmlspecialchars($kullanici['ad_soyad'] ?? '') ?></span>
                        </li>
                    <?php endforeach; ?>
```

`$kullanicilar` dizisi yalnızca burada kullanılıyor (313 satırlık dosyada tek kullanım) ve
yalnızca `id` + `ad_soyad` basılıyor. **`sifre` hiçbir yere yazılmıyor.** BE-003'ün
"gereksiz çekiliyor + sayfalama yok" kısmı geçerli kalıyor; sızıntı yok. Tur 5'teki
temkinli ifade doğruymuş.

### Teyit 3 — Tur 1: `notFound()` route'ları amaçlandığı gibi çalışıyor

```jsx
web/src/app/dashboard/market/page.jsx (tamamı)
import { notFound } from "next/navigation";

// Retired — superseded by /dashboard/explore. Kept as an explicit 404
// rather than removing the route outright.
export default function Market() {
    notFound();
}
```

`auth/page.jsx` de aynı desende ve neden emekliye ayrıldığını açıklıyor. İkisi de doğru
ve belgeli. Bu yönde bulgu yazılmadı.

---

## 1. Bu turda gerçekten okunan dosyalar

**Tam okunanlar (6):**
`web/next.config.mjs`, `web/src/app/layout.js`, `web/src/app/dashboard/layout.jsx`,
`web/src/app/page.jsx`, `web/src/app/dashboard/market/page.jsx`,
`web/src/app/auth/page.jsx`, `web/src/robots.txt`,
`web/src/app/dashboard/chat/layout.jsx`

**Kısmi okunanlar:**
`api/src/Presentation/Controllers/ChatbotController.php:226-244` (`getChatbotLimits` —
üç turdur bekliyordu), `api/admin/kullanicilar.php:1-40`,
`web/src/app/dashboard/chatbots/create/page.jsx:315-340, 273, 582-597`,
`web/src/features/notes/DialogueModal.jsx:79-90`,
`web/src/entities/user/ui/ProfileCard.jsx:242-251`

**Mekanik taramalar:** 7 bileşende `useEffect`/cleanup/listener/timer/AbortController
sayımı; BOM taraması (tüm `web/src/**/*.{js,jsx}`); `<img>` vs `alt` sayımı; `aria-*` ve
`disabled=` dosya sayımı; TODO/FIXME taraması; per-route `metadata` envanteri;
admin `htmlspecialchars` taraması

---

## 2. NEXT.JS / REACT (denetim.md bölüm 4)

---

### NEXT-001

**Severity:** 🟠 HIGH
**TÜR:** güvenlik

**Başlık:** `next.config.mjs`'de hiçbir güvenlik başlığı tanımlı değil — CSP, X-Frame-Options, Referrer-Policy, HSTS yok

**Dosya:** `web/next.config.mjs:6-40`, `web/server.js`

**Problem:** Yapılandırmanın tamamı 40 satır ve bir `headers()` fonksiyonu içermiyor:

```javascript
web/next.config.mjs:6-19
const nextConfig = {
  ...(isStaticExport && { output: 'export' }),

  // Statik export'ta route uyumu için (custom server'da gereksiz ama zararsız)
  trailingSlash: true,

  // Statik export'ta Next'in image optimizasyon API route'u çalışmaz (Node.js
  // süreci yok), o yüzden orada unoptimized zorunlu. ...
  images: {
    unoptimized: isStaticExport,
  },

  reactStrictMode: false,
```

**Kanıt (bölüm 24 — başlıkların başka bir katmanda ayarlanıp ayarlanmadığı arandı):**

```
$ grep -rniE 'Content-Security-Policy|X-Frame-Options|Strict-Transport|X-Content-Type|Referrer-Policy|Permissions-Policy|async headers' \
      web/next.config.mjs web/server.js api/functions/bootstrap.php api/admin/.htaccess
(çıktı yok)

$ next.config.mjs'de tanımlı fonksiyonlar:
web/next.config.mjs:30    async rewrites() {
   → yalnızca rewrites. headers() YOK.

$ server.js'de manuel başlık ekleniyor mu?
web/server.js — setHeader çağrısı yalnızca hata yolunda:
web/server.js:39          res.writeHead(502, { 'Content-Type': 'application/json' });
   → güvenlik başlığı yok.
```

**Neden HIGH — bu turun bulgusu değil, önceki turların eksik katmanı:**

Bu tek başına bir açık değil; **başka açıkların azaltıcı katmanının yokluğu**:

| Önceki bulgu | Bir CSP ne yapardı |
| --- | --- |
| Tur 2 SEC-017 — 6 bileşende `dangerouslySetInnerHTML` (admin→kullanıcı stored XSS) | `script-src 'self'` enjekte edilen script'i çalıştırmazdı |
| Tur 2 SEC-005/009 + Tur 5 BE-001 — session fixation yolları | `frame-ancestors 'none'` clickjacking'i keserdi |
| Tur 4 FE-005 — ham PAN uygulama sunucusuna gidiyor | `form-action`/`connect-src` veri sızdırmayı sınırlardı |
| Tur 2 SEC-001 — `.env` ve DB dökümü HTTP'den okunabiliyor | (CSP yardımcı olmaz — ama HSTS aktarımı korurdu) |

Ayrıca `_login.php:34` admin panelinde `https://cdn.tailwindcss.com`'dan script yüklüyor
ve `:38` `cdnjs.cloudflare.com`'dan CSS — yani üçüncü taraf CDN'ler CSP olmadan tam
yetkiyle çalışıyor.

**Impact:** XSS bulunduğunda hiçbir ikinci savunma katmanı yok; clickjacking'e karşı
koruma yok; HTTPS zorlaması yok.

**Önerilen çözüm:** `next.config.mjs`'e `async headers()` eklemek:
`Content-Security-Policy` (en azından `frame-ancestors 'none'; object-src 'none'`),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security` (HTTPS ardında). CSP'nin `script-src`'ı `layout.js:18`'deki
satır içi `<style>` ve admin CDN'leri nedeniyle kademeli uygulanmalı.

**Çözüm önceliği:** Yüksek — düşük maliyetli, geniş kapsamlı.

---

### NEXT-002

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç

**Başlık:** `reactStrictMode: false` — açıklaması olmayan tek yapılandırma satırı, ve önceki turlarda bulunan effect hatalarını yüzeye çıkaracak tek mekanizma

**Dosya:** `web/next.config.mjs:19`

**Problem:**

```javascript
web/next.config.mjs:19
  reactStrictMode: false,
```

**Kanıt (bölüm 24 — bunun bilinçli ve gerekçeli olup olmadığı arandı):**

```
$ next.config.mjs'deki diğer ayarların hepsinin yorumu VAR:
:2-3    NEXT_EXPORT açıklaması
:9      trailingSlash açıklaması
:12-14  images.unoptimized açıklaması (3 satır)
:21-28  rewrites açıklaması (8 satır)
:19     reactStrictMode: false          ← TEK yorumsuz satır

$ Strict Mode'un kapatılmasını gerektiren bilinen bir kütüphane var mı?
   Bağımlılıklar (Tur 1): next, react 19, radix-ui, lucide-react, react-markdown,
   tesseract.js, express, http-proxy-middleware, tailwind
   → React 19 ile Strict Mode uyumsuzluğu bilinen bir paket yok.
```

Bu dosyada her karar yorumla gerekçelendirilmiş — bu satır hariç. Kalıptan sapma,
kararın tartışılmamış olabileceğini düşündürüyor.

**Neden problem — önceki turların bulgularıyla doğrudan bağlantılı:** Strict Mode,
geliştirme modunda effect'leri **iki kez** çalıştırarak eksik cleanup ve yan etki
hatalarını görünür kılar. Bu denetimde bulunan şu hatalar tam olarak Strict Mode'un
yakaladığı sınıftan:

| Bulgu | Strict Mode ne yapardı |
| --- | --- |
| Tur 4 FE-004 — `await`siz `fetch` + ölü `try/catch` (`chat/page.jsx:544-552`) | Effect'in iki kez koşması çift insert üretir, sıra sorunu anında görünür |
| Tur 4 AI-004 — SSE tamponlaması yok | Çift abonelik/çift okuma yüzeye çıkar |
| REACT-001 (bu tur) — 7 bileşende cleanup yok | Çift mount/unmount döngüsü sızıntıyı gösterir |

**Impact:** Geliştirme sırasında yakalanabilecek hataların production'a taşınması.
Doğrudan bir çalışma zamanı hatası **değil** — bu yüzden MEDIUM.

**Önerilen çözüm:** `true` yapmak ve çıkan uyarıları düzeltmek. Bunun **davranış
değiştirici** olduğunu not etmek gerekir: açıldığında dev modunda bazı akışlar iki kez
çalışacak ve mevcut hatalar görünür hâle gelecek — amaç bu, ama bir seferlik bir
temizlik işi doğurur.

**Çözüm önceliği:** Orta.

---

### NEXT-003

**Severity:** 🟡 MEDIUM
**TÜR:** teknik borç

**Başlık:** 12 frontend dosyası UTF-8 BOM ile başlıyor; bunların bir kısmı `'use client'` direktifiyle açılıyor

**Dosya:** 12 dosya (tam liste aşağıda)

**Problem:**

```jsx
web/src/app/dashboard/layout.jsx:1
﻿'use client';
↑ görünmez BOM karakteri (EF BB BF), direktiften ÖNCE
```

**Kanıt (bölüm 24 — hangi dosyaların etkilendiği ve etkinin gerçek olup olmadığı):**

```
$ for f in $(find web/src -name '*.jsx' -o -name '*.js'); do
    [ "$(head -c3 "$f" | od -An -tx1 | tr -d ' ')" = "efbbbf" ] && echo "  BOM: ${f#web/src/}"; done
  BOM: app/dashboard/chat/page.jsx
  BOM: app/dashboard/chatbots/create/page.jsx
  BOM: app/dashboard/checkout/page.jsx
  BOM: app/dashboard/following/page.jsx
  BOM: app/dashboard/layout.jsx
  BOM: app/dashboard/notes/page.jsx
  BOM: entities/chatbot/ui/BotCard.jsx
  BOM: entities/chatbot/ui/ChatbotCard.jsx
  BOM: features/chatbot-mgmt/ChatbotForm.jsx
  BOM: features/settings/PhoneEditor.jsx
  BOM: shared/hooks/useSellerStatus.js
  BOM: widgets/DashboardHeader.jsx
   → 12 dosya. Kalan ~78 dosya BOM'suz.

$ Karşılaştırma — BOM'suz olanlar:
app/layout.js         → 65 78 70  ("exp"ort)
app/dashboard/page.jsx → 22 75 73  ('"us'e client)
```

**Neden problem ve neden abartmıyorum:** `'use client'` direktifinin dosyanın **ilk
ifadesi** olması gerekir. Next.js'in SWC ayrıştırıcısı BOM'u genellikle atlıyor ve README
build'in çalıştığını iddia ediyor (Tur 1'de doğrulanamadı, hâlâ doğrulanmadı) — yani
**şu an bir şeyi kırdığına dair kanıtım yok.** Bulgu iki gerçek üzerine:
1. **Tutarsızlık:** 12/90 dosya farklı kodlanmış. Aynı editör/araç zincirinden geçmediğini
   gösteriyor.
2. **Latent risk:** BOM, `'use client'` tespiti, ESLint ayrıştırması ve bazı bundler
   yapılandırmalarında sorun çıkarabilen bilinen bir tuzak. Etkilenen dosyalar arasında
   `dashboard/layout.jsx` (route koruması) ve `chat/page.jsx` (ana akış) var.

**Impact:** Şu an gözlenen etki yok; araç zinciri değişiminde sessiz kırılma riski ve
`git diff` gürültüsü.

**Önerilen çözüm:** 12 dosyayı BOM'suz UTF-8 olarak yeniden kaydetmek; editör
yapılandırmasına (`.editorconfig`) `charset = utf-8` eklemek — repoda `.editorconfig`
yok (Tur 1 envanteri).

**Çözüm önceliği:** Orta.

---

### REACT-001

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** Yedi bileşende async işlem temizliği yok — `AbortController` hiçbirinde kullanılmıyor, `ProfileCard` 7 effect'in hiçbirinde cleanup döndürmüyor

**Dosya:** `web/src/entities/user/ui/ProfileCard.jsx`, `web/src/entities/chatbot/ui/ChatbotCard.jsx`, `web/src/features/notes/DialogueModal.jsx`, `web/src/app/dashboard/chatbots/create/page.jsx`

**Problem — ölçüm:**

```
$ 7 bileşende lifecycle hijyeni (Tur 4'ten devredilen okunmamış dosyalar):
dosya                                    useEffect  deps[]  cleanup  AbortController
entities/user/ui/ProfileCard.jsx             7        7        0            0
entities/chatbot/ui/ChatbotCard.jsx          3        3        0            0
features/notes/DialogueModal.jsx             2        1        0            0
app/dashboard/chatbots/create/page.jsx       3        3        0            0
features/wallet/BankInfo.jsx                 3        3        2            0
features/seller/SellerOnboardingWizard.jsx   3        3        3            0
widgets/DashboardHeader.jsx                  6        7        6            0
```

**Kanıt (bölüm 24 — iki aday elendi, biri gerçek çıktı):**

```
1) DashboardHeader sızdırıyor mu? HAYIR — temiz:
$ grep -c 'addEventListener' web/src/widgets/DashboardHeader.jsx   → 5
$ grep -c 'removeEventListener' web/src/widgets/DashboardHeader.jsx → 5
$ grep -c 'setInterval\|setTimeout' ...                             → 2
$ grep -c 'clearInterval\|clearTimeout' ...                         → 2
   → 5/5 listener, 2/2 timer, 6 cleanup. Bu dosya doğru yazılmış; bulgu DEĞİL.

2) ProfileCard / create-page'deki temizlenmeyen timer'lar effect'te mi? HAYIR:
web/src/entities/user/ui/ProfileCard.jsx:245-247
            setTimeout(() => {
                setCartAdded(false);
            }, 2000);
   → useEffect içinde değil, olay işleyicisinde. Klasik lifecycle sızıntısı değil.
     React 18 unmount sonrası setState'i sessizce yutar. Bu yönde ayrı bulgu yazılmadı.

3) DialogueModal'ın ikinci effect'i dep array'siz mi? HAYIR:
web/src/features/notes/DialogueModal.jsx:79-85
    useEffect(() => { checkSession(); }, []);          ← dep array VAR
    useEffect(() => {
        const dialogId = selectedHistory.id;
        if (dialogId) {
   → ikinci effect'in dep array'i satır 85'ten sonra (grep -A2 penceresi dışında kaldı).
     "her render'da çalışıyor" iddiası doğrulanamadı → Doğrulanamayanlar.
```

**Gerçek bulgu — iptal edilebilirlik:** 51 fetch içeren dosyanın **hiçbirinde**
`AbortController` yok. Tek istisna Tur 4'te bulunan `chat/page.jsx:589` (Gemini akışı
için). Sonuç:
- Kullanıcı bir sayfadan hızlıca çıkarsa uçuştaki istekler tamamlanır ve unmount olmuş
  bileşende `setState` çağırır. React 18 bunu sessizce yutar (uyarı yok, çökme yok) —
  yani **görünmez** bir kaynak israfı.
- Daha somut sorun **yarış koşulu**: `ProfileCard` 7 effect'ten 7 fetch başlatıyor;
  bağımlılık değişince (örneğin `bot.id`) yeni istek eskisini iptal etmediği için
  **eski yanıt sonra dönerse yeni state'i ezer**. Bu, denetim.md bölüm 4'ün
  "race condition" ve "stale state" maddelerinin klasik hâli.

**Impact:** Hızlı gezinme sırasında yanlış verinin ekranda kalması; gereksiz ağ ve
sunucu yükü.

**Dürüstlük notu:** Bu yarışın **gerçekleştiğini gözlemlemedim** — kod yapısından
çıkarıldı ve `ProfileCard`'ın 7 effect'inin bağımlılık dizileri tek tek okunmadı
(yalnızca sayıldı). Somut bir tetikleme senaryosu üretilmedi.

**Önerilen çözüm:** Fetch yapan effect'lerde `AbortController` + cleanup'ta `abort()`;
veya en azından `let cancelled = false` + cleanup'ta `cancelled = true` deseni.
Tur 1 DOC-004'te tespit edilen `shared/api/client.js` (0 importer) bunu merkezîleştirmek
için doğal yer.

**Çözüm önceliği:** Orta.

---

### NEXT-004

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** `<img>` ve `next/image` karışık kullanılıyor — 4 dosyada 7 ham `<img>` etiketi Next optimizasyonunu atlıyor

**Dosya:** `web/src/entities/user/ui/ProfileCard.jsx` (2), `web/src/features/chatbot-mgmt/ChatbotForm.jsx` (3), `web/src/features/user-profile/ProfilePopup.jsx` (1), `web/src/widgets/Navbar.jsx` (1)

**Kanıt:**

```
$ next/image kullanan dosya sayısı: 6
$ ham <img> kullanan dosyalar:
web/src/entities/user/ui/ProfileCard.jsx:2
web/src/features/chatbot-mgmt/ChatbotForm.jsx:3
web/src/features/user-profile/ProfilePopup.jsx:1
web/src/widgets/Navbar.jsx:1
   → toplam 7 ham <img>
```

**Neden problem (ve neden LOW):** `next/image` boyutlandırma, lazy loading ve format
dönüşümü yapıyor; ham `<img>` yapmıyor. Ancak:
- `ProfileCard.jsx:412` ham `<img src={avatarSrc}>` kullanıyor ve `avatarSrc`
  kullanıcı tarafından belirlenen serbest bir string (Tur 2 SEC-016) — `next/image`
  yapılandırılmamış uzak alan adlarını reddeder, yani ham `<img>` burada bilinçli bir
  tercih **olabilir**.
- `next.config.mjs`'de `images.remotePatterns`/`domains` tanımlı değil, dolayısıyla
  `next/image` yalnızca yerel içe aktarımlarla çalışıyor.

Yani karışıklık teknik bir zorunluluktan doğmuş olabilir. Bunu doğrulayamadım —
bu yüzden LOW ve "kozmetik değil ama küçük".

**Impact:** Optimize edilmemiş görsel yüklemesi; tutarsız yükleme davranışı.

**Önerilen çözüm:** Uzak görseller için `images.remotePatterns` tanımlayıp `next/image`'a
geçmek, ya da ham `<img>` kullanımının yanına gerekçe yorumu koymak.

**Çözüm önceliği:** Düşük.

---

### NEXT-005

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Kök layout'un `<head>`inde, kurulu olmayan bir kütüphanenin 45 satırlık CSS değişkeni gömülü — her sayfa yüklemesinde taşınıyor

**Dosya:** `web/src/app/layout.js:18-61`

**Problem:**

```jsx
web/src/app/layout.js:18-24
        <style>{`
        .rdp-root {
    --rdp-accent-color: #FF66C4;
    --rdp-accent-background-color: rgba(255, 102, 196, 0.1);
    --rdp-animation_duration: 0.3s;
    --rdp-animation_timing: cubic-bezier(0.4, 0, 0.2, 1);
    --rdp-day-height: 35px;
```

`rdp-` öneki `react-day-picker` kütüphanesine ait.

**Kanıt (bölüm 24 — kütüphanenin gerçekten kullanılmadığı doğrulandı):**

```
$ grep -c 'react-day-picker' web/package.json
0
$ grep -rn 'DayPicker\|day-picker' web/src --include=*.jsx --include=*.js
(çıktı yok)
$ grep -rn 'rdp' web/src --include=*.jsx --include=*.js
web/src/app/layout.js:19-60     ← yalnızca bu blok
   → Kütüphane bağımlılık değil, hiçbir yerde import edilmiyor, `.rdp-root` sınıfını
     kullanan bir bileşen yok.
```

**Neden problem:** Bu blok kök layout'ta olduğu için **her sayfanın** HTML'ine gömülüyor.
~1,5 KB ölü CSS, kritik render yolunda. Ayrıca Tur 1'in ölü kod envanterinin
(DEAD-005: `global.scss`) tamamlanmamış olduğunu gösteriyor — o tur `app/css/` klasörüne
baktı, `layout.js` içindeki satır içi stili görmedi.

**Ek gözlem:** Satır 57'deki `[data-theme="light"] .rdp-root` seçicisi bir açık/koyu tema
altyapısını ima ediyor. Tur 1'de projenin "dark-only" olduğu not edilmişti. `data-theme`
özniteliğini set eden bir kod var mı — bu turda **kontrol edilmedi**.

**Impact:** Her sayfada gereksiz ~1,5 KB; ölü kodun ölü olduğunun anlaşılmasını zorlaştırma.

**Önerilen çözüm:** Bloğu kaldırmak. Takvim bileşeni ileride eklenirse kütüphanenin kendi
CSS'i ile gelir.

**Çözüm önceliği:** Düşük.

---

## 3. UX / ÜRÜN (denetim.md bölüm 17)

---

### UX-001

**Severity:** 🟠 HIGH
**TÜR:** iş mantığı

**Başlık:** Bot oluşturma sayfasındaki "Önizleme Asistanı" sahte — cevapları `setTimeout` ile üretilen sabit bir şablon, yapay zekâya hiç gitmiyor

**Dosya:** `web/src/app/dashboard/chatbots/create/page.jsx:322-339, 582-597`

**Problem:**

```jsx
web/src/app/dashboard/chatbots/create/page.jsx:322-339
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setInputMsg("");
    setSimulatedChat((prev) => [...prev, { sender: "user", text: userText }]);

    setTimeout(() => {
      setSimulatedChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `"${userText}" sorunuzu sistem talimatıma [${systemPrompt.slice(0, 30)}...] göre yanıtlıyorum!`,
        },
      ]);
    }, 800);
  };
```

Bu panel arayüzde bir sohbet penceresi olarak sunuluyor:

```jsx
web/src/app/dashboard/chatbots/create/page.jsx:582, 597
                  {botName || "Önizleme Asistanı"}
            {simulatedChat.map((msg, i) => (
```

**Kanıt (bölüm 24 — gerçekten AI'ya gitmediği ve "simülasyon" olduğunun kullanıcıya
söylenip söylenmediği arandı):**

```
$ Bu sayfa generatereply.php'yi çağırıyor mu?
$ grep -n 'generatereply\|fetch(' web/src/app/dashboard/chatbots/create/page.jsx
   → 6 fetch var (Tur 4'te sayıldı): getchatbot, getchatbotlimits,
     getproducerplanstatus, savechatbot, readpdf, update_training_chunk
   → generatereply.php YOK.

$ 800 ms gecikme neyi taklit ediyor?
   setTimeout(..., 800) — gerçek bir ağ/üretim gecikmesi değil, sabit bir bekleme.
   Yani "düşünüyor" hissi kasıtlı olarak taklit ediliyor.

$ Değişken adı ne diyor?
web/src/app/dashboard/chatbots/create/page.jsx:273
  const [simulatedChat, setSimulatedChat] = useState([
   → "simulated" — geliştirici bunun simülasyon olduğunu biliyor.
     Ama arayüzde satır 582 botun ADINI gösteriyor ("Önizleme Asistanı" yalnızca
     bot adı boşsa). Kullanıcıya "bu bir simülasyondur" denmiyor.
```

**Neden HIGH:** Bu panelin işlevi, kullanıcının yazdığı **sistem talimatını test
etmesi**. Ama üretilen cevap, talimatın içeriğinden bağımsız olarak her zaman aynı
şablon — üstelik talimatın yalnızca ilk 30 karakterini gösteriyor
(`systemPrompt.slice(0, 30)`). Yani:
- Kullanıcı kötü bir prompt yazar → önizleme "çalışıyor" gibi görünür.
- Kullanıcı prompt'u değiştirir → cevap yapısı değişmez, yalnızca alıntılanan 30 karakter
  değişir.
- Kullanıcı botu yayınlar, gerçek sohbette tamamen farklı bir davranış görür.

Tur 4 AI-001'de gerçek sohbetin **tüm** eğitim metnini Gemini'ye gönderdiğini
doğrulamıştım. Yani önizleme ile gerçek arasında hiçbir ortaklık yok.

denetim.md bölüm 17'nin "confusing UX" ve "success feedback" maddelerinin doğrudan
karşılığı: kullanıcı sahte bir başarı geri bildirimi alıyor.

**Impact:** Kullanıcı botunun davranışını test ettiğini sanıyor; yayınladıktan sonra
farklı sonuçla karşılaşıyor. Bot kalitesi ve kullanıcı güveni üzerinde doğrudan etki.

**Önerilen çözüm:** İki dürüst seçenek — (a) paneli gerçek `generatereply.php`'ye
bağlamak (coin tüketimi ve Tur 4 AI-005'in iade sorunu düşünülerek), (b) panelin
üstüne açıkça "Bu bir örnek görünümdür, gerçek yanıt üretilmez" etiketi koymak.
Şu anki hâl ikisinin de kötüsü.

**Çözüm önceliği:** Yüksek — kullanıcıyı doğrudan yanıltıyor.

---

### UX-002

**Severity:** 🟡 MEDIUM
**TÜR:** iş mantığı

**Başlık:** `getChatbotLimits` ücretli plan sahibi kullanıcıya da ücretsiz katman limitlerini bildiriyor — Tur 3 BIZ-002'nin arayüz tarafı

**Dosya:** `api/src/Presentation/Controllers/ChatbotController.php:226-244`

**Bu, üç turdur (3, 4, 5) sıraya giren ve bağlam bütçesine takılan açık sorunun
cevabıdır.**

**Problem:**

```php
api/src/Presentation/Controllers/ChatbotController.php:226-243
    public static function getChatbotLimits(): void {
        require_once __DIR__ . '/../../../functions/chatbot_limits.php';
        $userId = AuthMiddleware::requireAuth();

        $db   = Database::getInstance();
        $repo = new ChatbotRepository();
        $counts = $repo->countByOwner($userId);
        $independentLimit = getIndependentBotLimit($db, $userId);
        $publicLimit      = getPublicBotLimit($db, $userId);

        JsonResponse::success([
            'independent_used'       => $counts['independent'],
            'independent_limit'      => $independentLimit,
            'public_used'            => $counts['public'],
            'public_limit'           => $publicLimit,
            'can_create_independent' => $counts['independent'] < $independentLimit,
            'can_create_public'      => $counts['public'] < $publicLimit,
        ]);
    }
```

Endpoint kendisi doğru yazılmış — sorunu `chatbot_limits.php`'den devralıyor:

```php
api/functions/chatbot_limits.php:12-20 (Tur 3 BIZ-002'de raporlandı)
function getIndependentBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_INDEPENDENT_BOT_LIMIT;      // her zaman 1
}
function getPublicBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_PUBLIC_BOT_LIMIT;           // her zaman 2
}
```

**Kanıt (bölüm 24 — arayüzde ayrı bir düzeltme/geçersiz kılma olup olmadığı arandı):**

```
$ İstemci bu değerleri nasıl kullanıyor?
web/src/app/dashboard/chatbots/create/page.jsx → getchatbotlimits.php çağırıyor (Tur 4'te sayıldı)
$ can_create_* alanlarını geçersiz kılan bir istemci mantığı var mı?
$ grep -rn 'can_create_independent\|can_create_public\|independent_limit' web/src --include=*.jsx
   → (bu turda tam okunmadı — bkz. Doğrulanamayanlar)

$ Ama sunucu tarafı kesin: değerler koşulsuz sabitler.
$ grep -rn 'PRODUCER_INDEPENDENT_LIMIT\|PRODUCER_PUBLIC_LIMIT' api/ --include=*.php | grep -v vendor
api/src/Shared/Constants/AppConfig.php:18
api/src/Shared/Constants/AppConfig.php:19
   → tanım dışında sıfır kullanım (Tur 3'te de doğrulanmıştı).
```

**Sonuç:** Kullanıcı Tur 3 BIZ-001'deki `upgradePlan` ile "Elmas" planına geçse bile —
ki o endpoint ödeme almadan bunu yapıyor — bot oluşturma ekranında hâlâ **1 bağımsız /
2 herkese açık** limitini görüyor. Dashboard başlığı "Elmas" yazarken
(`UserController:13-14`), bot ekranı ücretsiz limiti gösteriyor. İki ekran birbiriyle
çelişiyor.

**Impact:** Ücretli kullanıcı satın aldığı hakkın hiçbir yansımasını görmüyor; iki arayüz
bölgesi tutarsız bilgi veriyor.

**Önerilen çözüm:** BIZ-002'nin çözümüyle aynı — `chatbot_limits.php`'nin planı gerçekten
okuması. Endpoint'te değişiklik gerekmiyor.

**Çözüm önceliği:** Orta (BIZ-001/BIZ-002 ile birlikte).

---

### UX-003

**Severity:** 🔵 LOW
**TÜR:** iş mantığı + teknik borç

**Başlık:** Kök route doğrudan kimlik doğrulamalı sayfaya yönlendiriyor — public bir tanıtım sayfası yok, ama varlıkları ve API'si duruyor

**Dosya:** `web/src/app/page.jsx`

**Problem:**

```jsx
web/src/app/page.jsx (tamamı)
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

`/dashboard` ise `dashboard/layout.jsx:21-37`'deki oturum kontrolüyle korunuyor ve
oturum yoksa `/login`'e atıyor. Yani `/` → `/dashboard` → `/login` zinciri.

**Kanıt (bölüm 24 — bir tanıtım sayfasının var olup kaldırıldığına dair izler arandı):**

```
$ Tanıtım sayfası varlıkları duruyor mu? EVET (Tur 1 envanteri):
web/public/images/blok1.png … blok5.png, blokAll.png
web/public/images/yorumlar.png          ("yorumlar" = müşteri yorumları)
web/public/images/modelolusturmasureci.png ("model oluşturma süreci")
web/src/images/ aynı dosyalar + sample-bot-page.png, ai-pic.png

$ Tanıtım içeriği sunan bir API var mı? EVET:
api/api/content/getlandingimages.php → ContentController::getLandingImages()
api/src/Presentation/Controllers/ContentController.php:9-12
    public static function getLandingImages(): void {
        echo json_encode(Database::getInstance()->getGlobalVars('anasayfa_resim1', 'anasayfa_resim2', 'anasayfa_resim3'));
$ Bu endpoint çağrılıyor mu?
   Tur 1 DEAD-001: getlandingimages.php → "frontend'den hiç çağrılmıyor" listesinde.

$ Admin tarafında yönetiliyor mu? EVET:
api/admin/anasayfa.php   ("anasayfa" = ana sayfa) — Tur 1 envanterinde, admin route
tablosunda '/admin/anasayfa' => 'anasayfa.php' (admin/index.php:44)
```

**Neden bir bulgu:** Bu, denetimde tekrar eden kalıbın (Tur 4 FE-001, Tur 5 BE-002) bir
örneği daha: **yönetilen içerik → API → kullanıcıya ulaşmıyor.** Admin `/admin/anasayfa`
sayfasından ana sayfa görsellerini yönetebiliyor, endpoint onları sunuyor, ama onları
gösterecek bir sayfa yok.

**Impact:** Sıfır indekslenebilir içerik (bkz. SEO-003); yönetim özelliği sonuçsuz;
tanıtım varlıkları ölü ağırlık.

**Dürüstlük notu:** Ana sayfanın **kasıtlı olarak kaldırılmış** olması tamamen makul bir
ürün kararı olabilir (kapalı beta, davetli erişim). Bulgu, kararın kendisini değil,
**yarım bırakılmış olmasını** işaretliyor: karar verildiyse admin sayfası ve endpoint de
kaldırılmalıydı.

**Önerilen çözüm:** Karar netleştirilmeli. Public sayfa istenmiyor ise `anasayfa.php`,
`getlandingimages.php` ve tanıtım görselleri temizlenmeli (Tur 1 DEAD-001 listesine
eklenir).

**Çözüm önceliği:** Düşük.

---

## 4. SEO / ERİŞİLEBİLİRLİK (denetim.md bölüm 18)

---

### SEO-001

**Severity:** 🟡 MEDIUM
**TÜR:** bug

**Başlık:** `robots.txt` App Router'ın servis etmediği bir konumda (`web/src/robots.txt`) — hiçbir zaman yayınlanmıyor

**Dosya:** `web/src/robots.txt`

**Problem:** Dosyanın içeriği doğru ve anlamlı:

```
web/src/robots.txt (tamamı)
User-agent: *
Disallow: /admin/
Disallow: /api/
```

Ama konumu yanlış. Next.js App Router `robots.txt`'i iki yerden servis eder:
`app/robots.ts`/`app/robots.js` (üretilmiş) veya `public/robots.txt` (statik).
`src/robots.txt` bunların hiçbiri değil.

**Kanıt (bölüm 24 — doğru konumlarda bir kopya olup olmadığı kontrol edildi):**

```
$ ls -la web/src/robots.txt web/public/robots.txt web/src/app/robots.* web/src/app/sitemap.*
-rw-r--r-- 49 web/src/robots.txt
ls: cannot access 'web/public/robots.txt': No such file or directory
ls: cannot access 'web/src/app/robots.*': No such file or directory
ls: cannot access 'web/src/app/sitemap.*': No such file or directory
   → tek kopya yanlış yerde; sitemap üretimi de yok.

$ Sitemap başka bir yerden mi geliyor?
api/admin/ajax/sitemap.php   (Tur 1 envanteri, 76 satır — bu turda OKUNMADI)
   → admin tarafında bir sitemap üreticisi var; ürettiği dosyanın nereye yazıldığı
     ve servis edilip edilmediği bilinmiyor.
```

**Neden problem:** `Disallow: /admin/` ve `/api/` kuralları, tam da Tur 2 SEC-001'de
tespit edilen açık yüzeyi (`/admin/.env`, `/admin/db_backup/*.sql`, `/admin/error_log`)
arama motorlarından uzak tutmayı amaçlıyor. Dosya servis edilmediği için **bu koruma
hiç devrede değil**. SEC-001'in asıl çözümü dosyaları doküman kökünden çıkarmak, ama
robots.txt de kaybolmuş bir savunma katmanı.

**Impact:** Yönetim ve API yolları arama motorlarına kapatılmamış; SEC-001'in
etkisi genişliyor (indekslenen bir `.sql` dökümü).

**Önerilen çözüm:** Dosyayı `web/public/robots.txt`'e taşımak (tek adım) veya
`app/robots.js` olarak üretmek.

**Çözüm önceliği:** Orta — düzeltmesi bir `mv` komutu.

---

### SEO-002

**Severity:** 🔵 LOW
**TÜR:** bug

**Başlık:** `/dashboard/notes` route'unun layout dosyası yok — sayfa başlığı kök layout'un genel başlığına düşüyor

**Dosya:** `web/src/app/dashboard/notes/` (yalnızca `page.jsx` var)

**Kanıt:**

```
$ ls web/src/app/dashboard/notes/
page.jsx
   → layout.jsx YOK.

$ Diğer 17 route'un hepsinde metadata VAR:
$ grep -rln 'export const metadata\|generateMetadata' web/src/app
web/src/app/auth/layout.jsx                       web/src/app/dashboard/chat/layout.jsx
web/src/app/dashboard/chatbots/create/layout.jsx  web/src/app/dashboard/chatbots/layout.jsx
web/src/app/dashboard/checkout/layout.jsx         web/src/app/dashboard/explore/layout.jsx
web/src/app/dashboard/following/layout.jsx        web/src/app/dashboard/history/layout.jsx
web/src/app/dashboard/list/layout.jsx             web/src/app/dashboard/market/layout.jsx
web/src/app/dashboard/purchased/layout.jsx        web/src/app/dashboard/settings/layout.jsx
web/src/app/dashboard/upgrade/layout.jsx          web/src/app/dashboard/wallet/layout.jsx
web/src/app/forgot-password/layout.jsx            web/src/app/layout.js
web/src/app/login/layout.jsx                      web/src/app/register/layout.jsx
   → 17 route + kök. `notes` ve `dashboard` (kök dashboard sayfası) listede YOK.

$ Örnek route layout'unun içeriği:
web/src/app/dashboard/chat/layout.jsx:1-3
export const metadata = {
    title: "Chat | Lumanoris",
};
```

**Neden problem:** `/dashboard/notes` ve `/dashboard` sekmelerinin tarayıcı başlığı
"Lumanoris Dashboard" olarak kalıyor; diğer 17 sayfa "Chat | Lumanoris" gibi ayırt edici
başlık gösteriyor. Birden fazla sekme açıkken kullanıcı hangisinin hangisi olduğunu
ayırt edemiyor.

**Ek gözlem — ilginç bir tutarsızlık:** `market/layout.jsx` ve `auth/layout.jsx` **var**
ve metadata içeriyor, oysa o iki route `notFound()` döndürüyor (bölüm 0, Teyit 3). Yani
emekli route'ların metadata'sı var, canlı `notes` route'unun yok.

**Impact:** Sekme ayırt edilebilirliği. Bu route'lar kimlik doğrulamalı olduğu için SEO
etkisi yok.

**Önerilen çözüm:** `notes/layout.jsx` (ve `dashboard` kök sayfası için) metadata
eklemek.

**Çözüm önceliği:** Düşük.

---

### SEO-003

**Severity:** 🔵 LOW
**TÜR:** teknik borç

**Başlık:** Metadata yalnızca `title` + `description`; canonical, OpenGraph ve robots meta yok — ama uygulamanın public yüzeyi zaten iki sayfayla sınırlı

**Dosya:** `web/src/app/layout.js:6-9`, 17 route layout'u

**Problem:**

```jsx
web/src/app/layout.js:6-9
export const metadata = {
  title: 'Lumanoris Dashboard',
  description: 'Yapay zeka destekli arayüz',
};
```

Route layout'ları yalnızca `title` geçersiz kılıyor (`chat/layout.jsx:1-3` örneği
SEO-002'de). Hiçbirinde `description`, `alternates.canonical`, `openGraph`, `robots`,
`twitter` yok.

**Kanıt ve ölçek değerlendirmesi (bölüm 24 — bunun gerçekten önemli olup olmadığı
sorgulandı):**

```
$ Public (kimlik doğrulaması gerektirmeyen) route'lar hangileri?
web/src/app/page.jsx              → redirect("/dashboard")  → public içerik YOK
web/src/app/login/page.jsx        → public
web/src/app/forgot-password/page.jsx → public
web/src/app/register/page.jsx     → /login?tab=register'a yönlendirme (README)
web/src/app/dashboard/**          → dashboard/layout.jsx ile korumalı
   → indekslenebilir gerçek içerik: yalnızca /login ve /forgot-password.

$ Kök layout force-static mi?
web/src/app/layout.js:1    export const dynamic = 'force-static';
   → tüm route'lar statik; veri istemci tarafında çekiliyor (Tur 1 README teyidi).
     Yani dashboard sayfalarının HTML'inde zaten içerik yok.
```

**Neden LOW ve neden yine de bir bulgu:** SEO yüzeyi iki giriş sayfasından ibaret olduğu
için eksik OpenGraph/canonical'ın ticari etkisi düşük. Ancak `description` alanı
("Yapay zeka destekli arayüz") tüm sayfalar için tek ve genel — bir pazaryeri ürünü için
arama sonuçlarında ve link önizlemelerinde (WhatsApp, Slack, X) görünen tek metin bu.
`openGraph.image` olmadığı için paylaşımlarda görsel de çıkmıyor.

**Impact:** Link paylaşımlarında zayıf önizleme. Organik arama etkisi minimal.

**Önerilen çözüm:** Kök metadata'ya `openGraph` (title/description/image/url) ve
`metadataBase` eklemek; `/login` ve `/forgot-password` için ayrı `description`.

**Çözüm önceliği:** Düşük.

---

## 5. KOD KALİTESİ (denetim.md bölüm 19)

---

### CQ-001

**Severity:** 🔵 LOW
**TÜR:** güvenlik

**Başlık:** `admin/chatbotlar.php:71`'de kategori adı `htmlspecialchars` olmadan basılıyor — aynı dosyanın 15. satırı escape ediyor

**Dosya:** `api/admin/chatbotlar.php:71` (escape yok) vs `:15` (escape var)

**Problem:**

```php
api/admin/chatbotlar.php:15
                            <span class="font-medium"><?= htmlspecialchars($chatbot['isim'] ?? '') ?></span>
```

```php
api/admin/chatbotlar.php:71
                                <option value="<?= $kategori['id'] ?>"><?= $kategori['kategori_adi_tr'] ?></option>
```

Aynı dosyada iki farklı yaklaşım: bot adı (kullanıcı kontrollü) escape ediliyor,
kategori adı (admin kontrollü) edilmiyor.

**Kanıt (bölüm 24 — `kategori_adi_tr`'nin kim tarafından yazıldığı izlendi):**

```
$ chatbot_kategoriler tablosuna kim yazıyor?
api/functions/db.php:288-292 (ADMIN_ALLOWED_PLAIN_TABLES — Tur 2'de okundu)
        'plans', 'plan_icerikler', 'chatbotlar', 'chatbot_kategoriler',  ← beyaz listede
   → admin/ajax/create.php ve update.php üzerinden YALNIZCA admin yazabiliyor.
   → Son kullanıcının bu tabloya yazma yolu YOK.

$ Frontend bu alanı nasıl gösteriyor?
web/src/app/dashboard/chatbots/page.jsx:32   if (Array.isArray(data)) setCategories(data);
   → React JSX otomatik escape ediyor; frontend tarafında risk yok.
```

**Neden LOW:** Veri admin kontrollü olduğu için son kullanıcıdan gelen bir XSS yükü
buraya ulaşamıyor. Risk yalnızca "kötü niyetli/ele geçirilmiş admin → başka bir admin"
senaryosunda gerçekleşir — ki o senaryoda saldırganın zaten daha doğrudan yolları var
(Tur 2 SEC-007: `db_backup.php?mode=restore`).

Bulgu, **tutarsızlık** olarak değerli: aynı dosyada 56 satır arayla iki farklı standart
var. Bu, escape kuralının bilinçli bir politika değil, dosya dosya alınmış kararlar
olduğunu gösteriyor — yeni eklenen bir alanın escape edilmeme olasılığı yüksek.

**Impact:** Düşük doğrudan risk; escape politikasının tutarsızlığı.

**Önerilen çözüm:** `htmlspecialchars($kategori['kategori_adi_tr'] ?? '')`. Uzun vadede
admin şablonlarında varsayılan-escape eden bir yardımcı fonksiyon.

**Çözüm önceliği:** Düşük.

---

## 6. ELENEN FALSE POSITIVE'LER (denetim.md bölüm 24)

Bölüm 19 ayrıca *"Sırf 'ben farklı yazardım' diye sorun üretme"* diyor — aşağıdakilerin
bir kısmı bu gerekçeyle de elendi.

| Aday | Neden bulgu değil | Doğrulama |
| --- | --- | --- |
| Admin sayfalarında kullanıcı verisi escape'siz (Tur 2 devri) | 4/4 kullanıcı kontrollü alan `htmlspecialchars` ile escape ediliyor | `adminler.php:24`, `chatbotistatistik.php:14`, `chatbotlar.php:15`, `kullanicilar.php:14` |
| `admin/kullanicilar.php` bcrypt hash'leri HTML'e basıyor (Tur 5 BE-003 devri) | `$kullanicilar` yalnızca satır 12-16'da kullanılıyor; `id` + `ad_soyad` basılıyor, `sifre` hiçbir yere yazılmıyor | `kullanicilar.php:12-16`, dosyanın tamamında tek kullanım |
| `notFound()` route'ları yanlış/eksik (Tur 1 devri) | İkisi de doğru, tek satırlık ve neden emekli olduklarını açıklayan yorumları var | `market/page.jsx`, `auth/page.jsx` |
| `DashboardHeader.jsx` listener/timer sızdırıyor | 5/5 `addEventListener`↔`removeEventListener`, 2/2 timer↔clear, 6 cleanup | mekanik sayım |
| `ProfileCard`/`create-page`'deki temizlenmeyen `setTimeout` | İkisi de `useEffect` içinde değil, olay işleyicisinde. React 18 unmount sonrası setState'i sessizce yutar | `ProfileCard.jsx:245-247`, `create/page.jsx:330-338` |
| `DialogueModal`'ın ikinci `useEffect`'i dep array'siz | Grep penceresi dışında kaldı; dep array'in yokluğu **doğrulanamadı** → Doğrulanamayanlar'a taşındı, bulgu yazılmadı | `DialogueModal.jsx:83-90` |
| `dashboard/layout.jsx` route koruması yetersiz | `authReady` gate'i children'ı render etmeden önce oturum kontrolünü bekletiyor — doğru desen | `dashboard/layout.jsx:39-45` |
| Erişilebilirlik: `alt` eksik görseller | 7 ham `<img>`'in **hepsinde** `alt` var; 0 eksik | `grep '<img ' | grep -v 'alt='` → boş |
| Erişilebilirlik: klavye/atlama bağlantısı yok | Skip-link mevcut ve doğru uygulanmış (`sr-only focus-visible:not-sr-only`), `<main>` landmark ve hedef `id` var | `dashboard/layout.jsx:49-54, 86-88` |
| Başlık hiyerarşisi bozuk (`login/page.jsx`) | h1→h2→h3→h4 sırası atlanmadan mevcut (1/2/1/7). h4'ün 7 kez kullanılması görsel tercih; bölüm 19'un uyardığı "ben farklı yazardım" alanı | `grep -oE '<h[1-6]'` sayımı |
| TODO/FIXME borcu yüksek | Tüm repoda **2** TODO, ikisi de aynı bilinen konuda (`chatbot_limits.php`, Tur 3 BIZ-002). Kayda değer TODO borcu yok | `grep -rn 'TODO\|FIXME\|HACK\|XXX'` |
| `trailingSlash: true` + rewrites API çağrılarını 308'e düşürüyor | `server.js` proxy'si `/api`'yi Next'e ulaşmadan yakalıyor. `next start`/Vercel modunda ne olacağı **doğrulanamadı** → Doğrulanamayanlar | `server.js:29` `pathFilter` |

---

## 7. GEREKÇELİ DEĞERLENDİRME (bölüm 26 yerine — puanlama üretilmedi)

**Erişilebilirlik.** Bu turun en olumlu sürprizi. Denetim.md bölüm 18'in listesindeki
maddelerin çoğu gerçekten karşılanmış: `<html lang="tr">`, doğru uygulanmış bir skip-link
(`sr-only focus-visible:not-sr-only` deseniyle — bu, yanlış yapılması kolay bir
detaydır), `<main>` landmark'ı ve hedef `id`'si, 7/7 `<img>`'de `alt`, 25 dosyada
`aria-*`, 20 dosyada `disabled` ile çift tıklama koruması. Bunlar tesadüf değil, bilinçli
çalışma. Erişilebilirlik yönünde yazılacak bir bulgu bulamadım.

**React lifecycle hijyeni iki uçlu.** `DashboardHeader.jsx` (5/5 listener, 2/2 timer,
6 cleanup) ve `SellerOnboardingWizard.jsx` (3/3 cleanup) örnek niteliğinde. Buna karşılık
`ProfileCard.jsx` 7 effect'in hiçbirinde cleanup döndürmüyor ve **51 fetch dosyasının
hiçbirinde `AbortController` yok** (tek istisna Tur 4'te bulunan Gemini akışı). Yani
desen biliniyor, tutarlı uygulanmıyor — bu, dört turdur tekrar eden aynı örüntü.
`reactStrictMode: false` bu tutarsızlığın neden fark edilmediğini açıklıyor: Strict Mode
tam da bu sınıfı yüzeye çıkarır ve kapalı.

**Next.js kullanımı.** App Router doğru kullanılmış: 17 route'ta metadata, `notFound()`
ile bilinçli emeklilik, `redirect()` ile kök yönlendirme, `force-static` + istemci
tarafı veri çekme tutarlı bir tercih. Route koruması (`dashboard/layout.jsx`) `authReady`
gate'iyle doğru yazılmış — korumasız içerik flash'ı yok. Eksik olan tek yapısal şey
güvenlik başlıkları (NEXT-001): `next.config.mjs`'de `headers()` yok, ve bu, önceki üç
turda bulunan XSS/clickjacking risklerinin azaltıcı katmanının hiç olmaması demek.

**"Yönetiliyor ama ulaşmıyor" kalıbı — dördüncü örnek.** Bu denetimde tekrar eden en
belirgin ürün sorunu: admin panelinde yönetilen bir içerik, çalışan bir API endpoint'i,
ve onu tüketmeyen bir arayüz. Sırasıyla: Tur 4 FE-001 (gizlilik/kullanım metinleri sabit
kodlu), Tur 5 BE-002 (tema seçimi `intval(dizi)` yüzünden sabit), Tur 6 UX-003 (ana sayfa
görselleri yönetiliyor, sayfa yok), ve UX-002 (plan limitleri stub'tan geliyor). Dört
farklı teknik neden, tek bir sonuç: **yönetim panelindeki değişiklikler kullanıcıya
yansımıyor.** Bu, tek tek bakıldığında küçük görünen ama toplamda yönetim panelinin
güvenilirliğini ortadan kaldıran bir örüntü.

**Sahte geri bildirim.** UX-001 (önizleme asistanı) bu denetimde bulunan üçüncü "sahte
başarı" mekanizması — diğer ikisi Tur 3 PAY-012 (`processRefund` no-op ama başarı
döndürüyor) ve Tur 3 BIZ-001 (`upgradePlan` ödeme almadan "güncellendi" diyor). Üçünün
ortak noktası: sistem, gerçekleşmeyen bir işlem için olumlu geri bildirim veriyor.
Bunlar kullanıcı güvenini doğrudan hedef alan hatalar ve teknik olarak düzeltilmeleri
kolay — ya işlemi gerçekleştirmek ya da dürüstçe "bu henüz çalışmıyor" demek.

**Kod kalitesi borcu düşük.** Bölüm 19'un istediği ölçümlerin çoğu iyi çıktı: 2 TODO
(tüm repoda), yanıltıcı yorum bulamadım — aksine bu kod tabanının yorumları alışılmadık
biçimde açıklayıcı ve çoğu "önceden şöyleydi, şu yüzden değişti" biçiminde gerçek
tarihçe taşıyor. Tespit ettiğim kalite sorunları (12 dosyada BOM, ölü CSS bloğu, tek bir
escape tutarsızlığı) bakım maliyeti yaratan gerçek şeyler ama küçük. Bölüm 19'un
uyardığı "ben farklı yazardım" alanına girmemek için başlık hiyerarşisi, Türkçe/İngilizce
karışık adlandırma ve bileşen boyutları gibi adayları eledim — bunlar tutarlı bir
konvansiyon içinde kalıyor ve gerçek risk üretmiyor.

---

## 8. DOĞRULANAMAYANLAR

| Konu | Neden doğrulanamadı |
| --- | --- |
| `DialogueModal.jsx`'in ikinci `useEffect`'inin dep array'i var mı (REACT-001) | Grep penceresi (`-A2`) dep array'i kesti; dosyanın 83-95 satır aralığı okunmadı. "Her render'da çalışıyor" iddiası **yapılmadı**. |
| BOM'un build'i gerçekten etkilemediği (NEXT-003) | `npm run build` çalıştırılmadı (kaynak değiştirmeme kuralı + süre). README "build verified working" diyor ama Tur 1'den beri doğrulanmadı. Bulgu "latent risk" olarak yazıldı. |
| `trailingSlash: true`'nun rewrites moduyla etkileşimi | `next start`/Vercel modu çalıştırılmadı. `server.js` modunda proxy `/api`'yi önce yakaladığı için sorun yok; diğer modda 308 yönlendirmesi olup olmayacağı bilinmiyor. |
| İstemcinin `can_create_independent`/`public_limit` alanlarını nasıl gösterdiği (UX-002) | `chatbots/create/page.jsx`'in ilgili render bölümü okunmadı (yalnızca 273, 315-340, 582-597 aralıkları). Sunucu tarafı kesin; arayüzün bunları geçersiz kılmadığı **varsayıldı**. |
| `ProfileCard`'ın 7 effect'inin bağımlılık dizilerinin doğruluğu (REACT-001) | Sayıldı (7 effect / 7 dep array) ama içerikleri okunmadı. Yarış koşulu iddiası yapı üzerinden çıkarıldı, somut senaryo üretilmedi. |
| `api/admin/ajax/sitemap.php`'nin ürettiği dosyanın nereye yazıldığı (SEO-001) | Dosya okunmadı (76 satır). Sitemap'in servis edilip edilmediği bilinmiyor. |
| `[data-theme="light"]` seçicisini kullanan bir tema anahtarı var mı (NEXT-005) | `layout.js:57`'de seçici mevcut; `data-theme` özniteliğini set eden kod aranmadı. |
| `images.remotePatterns` yokluğunun ham `<img>` kullanımını zorunlu kılıp kılmadığı (NEXT-004) | `next.config.mjs`'de tanımlı olmadığı doğrulandı; 4 dosyadaki `<img>` kullanımının bu nedenle mi seçildiği kod yorumlarından anlaşılamadı. |

---

## 9. KAPSANMAYANLAR

### Bu turda okunmayan dosyalar

**Tur 4'ten devredilen 7 dosya — yalnızca mekanik olarak tarandı, okunmadı:**
`ProfileCard.jsx` (11 fetch), `BankInfo.jsx` (7), `DialogueModal.jsx` (7),
`entities/.../ChatbotCard.jsx` (7), `chatbots/create/page.jsx` (6, yalnızca 3 bölge
okundu), `SellerOnboardingWizard.jsx` (5), `DashboardHeader.jsx` (5). Bunların
`useEffect`/cleanup/timer/listener **sayımları** yapıldı ve REACT-001 buradan çıktı, ama
**sözleşme karşılaştırması ve mantık denetimi yapılmadı** — Tur 4'ün bıraktığı asıl iş
(48 fetch'in backend'le karşılaştırılması) hâlâ yapılmadı.

**Hiç okunmayanlar:**
- `web/src/features/purchasing/BuyModal.jsx` (192 satır) — **dört turdur** sırada
  (Tur 3, 4, 6). Bonus kredi tanıtımı ve `duration_weeks` seçimi hâlâ denetlenmedi.
- `web/src/features/chat/MessageInput.jsx` (260 satır) — Tur 4 FE-003'ün (dosya eki
  sessizce atılıyor) arayüz tarafı; dosya seçicinin gerçekten sunulduğu **doğrulanmadı**.
- `chat/page.jsx`'in "Tekrar Dene" mekanizması (satır 575-577 yorumundan bilindiği hâliyle)
  — yeniden denemede coin'in tekrar tüketilip tüketilmediği hâlâ bilinmiyor.
- `web/src/app/dashboard/settings/page.jsx` (12 fetch), `explore/page.jsx`,
  `following/page.jsx`, `history/page.jsx`, `list/page.jsx`, `purchased/page.jsx`,
  `wallet/page.jsx`, `upgrade/page.jsx` — sekiz sayfanın hiçbiri bu turda okunmadı.
- `web/src/widgets/Sidebar.jsx`, `Navbar.jsx`, `MarketplaceToolbar.jsx`,
  `CategoryFilter.jsx` — navigasyon bileşenleri.
- `web/src/shared/ui/` altındaki 23 primitive — Tur 1'de 5'inin ölü olduğu bulunmuştu;
  kalan 18'in kalitesi/erişilebilirliği incelenmedi.
- `web/tailwind.config.js` — tasarım token'ları, kontrast oranları (bölüm 18'in
  "contrast" maddesi) hiç incelenmedi.
- `api/admin/partials/_header.php` + `_sidebar.php` — Tur 5 BE-002'nin `$current_theme`
  null riski bunlara bağlıydı, **hâlâ okunmadı**.
- `api/admin/assets/` altındaki 7 dosya — Tur 5 BE-007'de `login.js`'in yetim olduğu
  bulunmuştu, diğerleri taranmadı.
- `api/admin/ajax/sitemap.php` — SEO-001 ile doğrudan ilgili, okunmadı.

### Bölüm bazında boş kalan maddeler

**Bölüm 4 (React)** — şu maddeler denetlenmedi:
- `unnecessary re-render`: memoizasyon (`useMemo`/`useCallback`/`React.memo`) kullanımı
  hiç incelenmedi. `dashboard/page.jsx` (~1000 satır, okunmadı) bu açıdan en olası yer.
- `stale closure`: sistematik olarak aranmadı.
- `prop drilling`: `UserContext` mevcut (`dashboard/layout.jsx:48`), ama hangi prop'ların
  hâlâ elden ele geçtiği ölçülmedi. `Sidebar userId={userId} account={account}` gibi
  çiftler görüldü ama analiz edilmedi.
- `component responsibility` / `large components`: satır sayıları biliniyor
  (`chat/page.jsx` 873, `checkout/page.jsx` 725, `dashboard/page.jsx` ~1000) ama
  sorumluluk analizi yapılmadı. Bölüm 19'un "large components" maddesi bu yüzden boş.

**Bölüm 4 (Next.js)** — denetlenmeyenler:
- `hydration problemleri`: `force-static` + istemci tarafı veri çekimi hydration
  uyuşmazlığı riski taşır; hiç incelenmedi (çalıştırma gerektirir).
- `caching`: Next'in fetch cache davranışı, `revalidate` kullanımı aranmadı.
- `production build davranışı`: build çalıştırılmadı (Tur 1'den beri açık).
- `loading/error states`: `loading.jsx`/`error.jsx` dosyalarının varlığı **kontrol
  edilmedi** — App Router'ın hata sınırı mekanizması kullanılıyor mu bilinmiyor.

**Bölüm 17** — denetlenmeyenler:
- `mobile responsive`: Tailwind breakpoint kullanımı görüldü (`md:`, `lg:`) ama gerçek
  mobil davranış test edilmedi.
- `empty state`: Tur 1 envanterinde `empty-state.jsx` (6 importer), `NotesEmpty.jsx`,
  `EmptyHistory.jsx`, `AddToListModalEmpty.jsx` mevcut — yani boş durum bileşenleri var,
  ama hangi listelerin bunları kullandığı ve hangilerinin boş ekran gösterdiği
  incelenmedi.
- `optimistic update problemleri`: hiç aranmadı.
- `dead-end screens`: Tur 4 API-001'de bir örnek bulundu (404'te boş sohbet sayfası);
  sistematik tarama yapılmadı.

**Bölüm 18** — `contrast` ve `focus states` maddeleri incelenmedi (`tailwind.config.js`
okunmadı). `sitemap` maddesi kısmen (SEO-001'de yokluğu tespit edildi, admin tarafındaki
üretici okunmadı).

**Bölüm 19** — `duplication` ve `complexity` ölçülmedi. Tur 1 DEAD-002/DEAD-004'te
dosya düzeyinde duplikasyon bulunmuştu (`ChatbotCard` × 2, `WithdrawalModal` × 2,
`widgets/info/` × 6); **fonksiyon içi** mantık tekrarı bu turda da incelenmedi —
Tur 1'de de açık bırakılmıştı.
