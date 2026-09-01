# Lumanoris — Technical SEO Audit Prompt (Aşama 1)

> VS Code'da proje kökünde Claude'a gönder. Önce `[DOMAIN]` alanını doldur.

---

Sen kıdemli bir Technical SEO ve Next.js 15 App Router mühendisisin.
Production domain: `[DOMAIN]` — bunun dışında hiçbir domain/hostname/URL uydurma.

**`[DOMAIN]` hâlâ doldurulmamışsa Aşama 1'e başlama.** Önce benden production domain'i iste.
Yerine localhost, staging veya tahmini bir domain koyma.

## 0) Çalışma biçimi — her şeyin üstünde

**AŞAMA 1 (bu mesaj):** Yalnızca denetim ve ölçüm yap. Kaynak kodu **değiştirme**, dosya
oluşturma/silme, package veya config değiştirme. Sonunda bölüm 9'daki raporu ver ve **DUR**.

**Tek muafiyet:** Bölüm 5'teki ölçümler için build alman ve iki sunucuyu ayağa kaldırman
gerekiyor. `web/.next-verify/` altındaki build çıktısı ve geçici test dosyaları serbest;
bunlar kaynak kod değişikliği sayılmaz. Başka hiçbir dosyaya dokunma.

**AŞAMA 2:** Ben bölüm 8'deki soruları cevaplayıp açıkça "UYGULA" dedikten sonra, yalnızca
onayladığım kapsamda değişiklik yap.

## 1) Kapsam

**İncele:**

- `web/src/app/**`, `web/src/entities/**`, `web/src/features/**`, `web/src/shared/**`
- `web/next.config.mjs`, `web/server.js`, `web/package.json`, `web/public/**`
- `api/router.php`, `api/.htaccess`, `api/admin/.htaccess`
- `api/admin/ajax/seo.php`, `api/admin/ajax/sitemap.php` ve ilgili admin SEO sayfaları
- `api/api/content/**`, `api/api/chatbot/**` (SEO'ya girecek verinin kaynağını anlamak için)

**Kesinlikle tarama:** `.history/`, `web/.next/`, `node_modules/`, `api/vendor/`, `*.pack`, `*.map`.
Build çıktısını veya editör geçmişini kaynak kod olarak kullanma.

Bir endpoint'in veri kaynağını anlamak için çağırdığı repository/model/function dosyasına
ihtiyaç duyarsan **yalnızca o spesifik dosyayı** oku. Genel backend taraması yapma.

**Dokunma:** auth akışı, session, checkout/ödeme, `/api` proxy, `web/server.js` proxy sırası,
`api/router.php` ve `.htaccess` denylist'leri.

## 2) README'ye güvenme

Repodaki dokümantasyonun iddialarını doğru varsayma; her şeyi kaynak koddan doğrula.
Aşağıdaki hipotezleri **teker teker teyit et** ve raporunda doğru/yanlış + dosya:satır kanıtı ver.
Yanlışsa gerçeği yaz, bu listeye uyma:

1. `web/src/app/` altında yalnızca `auth/`, `dashboard/`, `forgot-password/`, `login/`,
   `register/`, `layout.js`, `page.jsx` var; hiçbir dinamik route (`[slug]`, `[id]`) yok.
2. `/` → `/dashboard` yönleniyor; `/register` → `/login?tab=register`.
3. `/auth` ve `/dashboard/market` bilinçli 404 (emekli route).
4. `app/layout.js` içinde `export const dynamic = 'force-static'` var; veri çekme tamamen client-side.
5. `/dashboard/*` koruması client-side (`router.replace('/login')`); sunucu tarafı guard yok.
6. `web/public/robots.txt` var; `app/robots.js` ve `app/sitemap.js` yok.
7. `not-found.jsx`, web manifest ve `opengraph-image` yok.
8. `api/api/content/` altında `getabout`, `getprivacy`, `gettermsofsale`, `getdelivery`,
   `getusage`, `getcontactinfo`, `getsocials`, `getowner`, `getlandingimages`, `getcategories`
   endpoint'leri var — **ama frontend'de bu içeriklerin hiçbir route'u yok**.
9. `api/api/chatbot/` altında `publishchatbot.php`, `unpublishchatbot.php`,
   `updatechatbotprice.php` var.

## 3) Route ve rendering envanteri

Tüm App Router yapısını koddan çıkar: route'lar, layout'lar, `use client` sınırı,
`generateMetadata`, `generateStaticParams`, `dynamic`, `revalidate`, `notFound()`,
`redirect()`, `next.config.mjs` içindeki `rewrites`/`headers`/`redirects`, middleware.

Sonra URL matrisi üret. Her URL için: path, HTTP status, auth durumu, rendering tipi
(static/SSR/client), initial HTML'de anlamlı içerik var mı, canonical, robots, sitemap durumu,
indekslenebilirlik.

**Canonical'ı "var/yok" olarak geçme.** Her canonical için hedef URL'yi doğrula:
absolute mı, hedefin HTTP status'u ne, hedef indekslenebilir mi, hedef redirect ediliyor mu,
hostname doğru production domain'i mi, trailing-slash davranışı tutarlı mı, sayfa kendi URL'ine
mi canonical veriyor, noindex sayfada canonical nasıl davranıyor, `localhost`/`127.0.0.1`/
staging sızıntısı var mı.

(Not: şu an hiç canonical tanımlı olmaması muhtemel. O durumda bu liste Aşama 2'nin kabul
kriteri olur — raporda böyle işaretle.)

Kategoriler: (A) public+indekslenebilir, (B) public ama noindex olmalı, (C) auth gerekli,
(D) admin, (E) API, (F) static asset, (G) emekli/404 olması gereken.

## 4) İçerik envanteri — hazır ama yayınlanmamış içerik

`api/api/content/**` endpoint'lerinin gerçekte ne döndürdüğünü incele (auth gerektiriyor mu,
içerik dolu mu, hangi tablodan geliyor).

Bunların hangileri için public bir sayfa açılmasının **teknik olarak mümkün** olduğunu raporla —
hakkımızda, gizlilik, mesafeli satış, teslimat/iade, kullanım koşulları, iletişim gibi.
Her biri için: içerik dolu mu, auth gerektiriyor mu, hangi tablodan geliyor.

Aşama 1'de bu sayfalar için route oluşturma veya "public yapılmalı" kararı verme; bulguyu
raporla ve bana sor. Raporunda ayrıca şunu belirt: bu sayfaların bir kısmı (gizlilik,
mesafeli satış sözleşmesi, teslimat/iade) Türkiye'de e-ticaret yapan bir site için mevzuat
gereği olabilir — bu bir hukuki değerlendirme değil, benim karar vermem için bir hatırlatma
olarak yaz.

`getsocials.php` ve `getowner.php` çıktısını incele: `Organization` JSON-LD ve `sameAs`
alanları için gerçek veri buradan gelebilir mi?

## 5) GERÇEK ÖLÇÜM — kod okuyarak tahmin etme

Bu bölüm bu denetimin en kritik parçası. Sunucuları **production modunda** ayağa kaldır.

**"Production modu" ≠ "production ortamı".** Bölüm 5'teki sunucular yalnızca localhost üzerinde
test ortamı olarak çalışır. Production domain'e deployment yapma, production servisine istek
atma, hiçbir yere veri yazma.

**Veritabanı uyarısı:** `api/.env` yerel PHP sunucusunun hangi MySQL'e bağlandığını belirler ve
bu **production veritabanı olabilir**. Ölçüme başlamadan önce hangi veritabanına bağlandığını
kontrol et ve bana söyle. Ölçümlerde **yalnızca GET isteği** at — POST/PUT/DELETE atma, form
gönderme, login denemesi yapma, hiçbir mutation endpoint'ini çağırma.

**Tuzaklar (bunlara dikkat et, yoksa yanlış ölçersin):**

- `npm start` `NODE_ENV` set **etmiyor** — dev modda başlar ve dev HTML'i production'dan farklıdır.
  `NODE_ENV=production` vererek başlat.
- PHP tarafı `php -S 127.0.0.1:8000 router.php` ile, `api/` klasörü içinden başlatılmalı;
  aksi halde `/admin` pretty URL'leri 404 döner.
- İki sunucu birden ayakta olmazsa `/api` proxy'si çöker ve her sayfa boş görünür —
  bunu "SEO sorunu" diye raporlama.
- Kabuğunu tespit et (PowerShell / cmd / bash / zsh) ve env değişkeni sözdizimini ona göre kur.

Build ve çalıştırma:

```bash
# terminal 1
cd api && php -S 127.0.0.1:8000 router.php

# terminal 2 (bash/zsh/Git Bash)
cd web
NEXT_DIST_DIR=.next-verify npm run build
NODE_ENV=production NEXT_DIST_DIR=.next-verify node server.js
```

PowerShell karşılığı: `$env:NEXT_DIST_DIR = ".next-verify"` … sonra `Remove-Item Env:NEXT_DIST_DIR`.
cmd karşılığı: `set NEXT_DIST_DIR=.next-verify`.

**Ölçüm 1 — Initial HTML (JS'siz):** her kritik URL için ham HTML al.

Redirect zincirindeki **her hop'u ayrı kaydet**; yalnızca final URL/status raporlama.
`301 → 302 → 200` ile `301 → 200` SEO açısından aynı şey değildir.

```bash
curl -s -o /dev/null -D - -L "https://.../path"   # zincirdeki her yanıtın header'ı
curl -s -L "https://.../path"                     # final gövde
```

`-D -` ile `-L` birlikte kullanıldığında ara hop'ların header'ları da basılır; doğrulanmıştır.
Her hop için şunları kaydet: HTTP status, `Location`, `Content-Type`, `X-Robots-Tag`.
Ham header dökümünü rapora yapıştırma; zinciri şu formatta özetle:

```
/register → 307 → /login?tab=register → 200
```

Bu komut ara hop'ları ayırmakta yetersiz kalırsa `curl -I` ile hop hop manuel istek at.

**PowerShell tuzağı:** PowerShell'de `curl`, `Invoke-WebRequest`'in takma adıdır; `-sL` gibi
parametreleri kabul etmez ve varsayılan olarak redirect'leri sessizce takip eder. Windows'ta
**`curl.exe`** yaz (Windows 10+ ile birlikte gelir).

Her URL için kaydet: HTTP status (her hop), final URL, `<title>`, meta description, canonical,
robots meta, `X-Robots-Tag`, H1, `<a href>` link sayısı, gövdedeki anlamlı metin uzunluğu, JSON-LD.

Ölçüm tablosunda **en az** şu sütunlar bulunmalı, hiçbiri atlanmadan:
URL · redirect chain · final status · final URL · Content-Type · title · description ·
canonical · canonical hedefinin status'u · robots meta · X-Robots-Tag · H1 · internal `<a>` sayısı ·
anlamlı metin uzunluğu · JSON-LD · localhost/staging sızıntısı · soft-404 değerlendirmesi.

Bir alanı ölçemediysen boş bırakma, "ölçülemedi + neden" yaz.

**Ölçüm 2 — Rendered DOM:** JS çalıştıktan sonraki hali. Playwright/Puppeteer/Chromium ortamda
**zaten kuruluysa** kullan. Kurulu değilse **Aşama 1'de dependency kurma** — bunun yerine ölçümü
yapamadığını açıkça yaz ve karşılaştırmayı kod okuyarak niteliksel olarak yap. Kurulum gerekiyorsa
bana sor.

**Ölçüm 3 — Fark raporu:** Googlebot'un ilk HTML'de göremediği kritik içeriği listele.
Bu tablo, `force-static` + client-side fetch'in gerçek maliyetini gösterecek tek kanıttır.
`force-static`'i bu ölçüm olmadan yorumlama ve kesinlikle kaldırma.

**Test edilecek URL'ler:** `/`, `/login`, `/register`, `/forgot-password`, `/dashboard`,
`/dashboard/chatbots`, `/auth`, `/dashboard/market`, olmayan bir route, trailing slash
varyantları, `/robots.txt`.

Sitemap'in gerçek production URL'sini `/sitemap.xml` olduğunu **varsayma**; kod, config,
`.htaccess` ve `router.php` davranışından keşfet, sonra o URL'i test et.

Beklenen ile gerçekleşen status kodu farklarını, redirect zincirlerini/döngülerini ve
soft-404'leri (olmayan sayfanın 200 dönmesi, boş shell'in 200 dönmesi) raporla.

## 6) Internal linking

Her public sayfanın başka bir public sayfadan gerçek `<a href>` / `next/link` ile
keşfedilebilir olup olmadığını kontrol et. JavaScript click handler'ına dayalı navigasyonu
SEO linki sayma. Orphan sayfaları listele.

Sitemap'te bulunmak ile internal link üzerinden keşfedilebilir olmak **ayrı iki durumdur**;
ikisini ayrı sütunda değerlendir. Sitemap'te olması internal link eksikliğini ortadan kaldırmaz.

## 7) Source-of-truth çatışması

Admin SEO sistemi ile frontend metadata sistemi arasında çakışma var mı, araştır:

- Admin panelinde tanımlanan SEO title/description alanları frontend'e ulaşıyor mu, yoksa
  iki bağımsız sistem mi var?
- `api/admin/ajax/sitemap.php` ne üretiyor, URL'leri nereden alıyor, hangi koşulda dahil
  ediyor, `lastmod` üretiyor mu, noindex/404 URL ekliyor mu, geçerli XML mi?
- `web/public/robots.txt` ile bu sistem çelişiyor mu?

Tek authoritative kaynak öner, ama seçimi bana bırak. İki paralel sistemi kontrolsüz bırakma.

## 8) Bana sorman gerekenler (varsayım yapma)

Önce veri modelini incele, sonra sor. Örneğin "chatbot detay URL'si `/chatbot/[slug]` olsun"
deme; `publishchatbot.php` ve chatbot tablosunu inceleyip "şu alan şu koşulda yayın durumunu
tutuyor, dolayısıyla şu mimariyi öneriyorum" de.

1. Chatbot detay sayfaları public olacak mı? Olacaksa hangi koşuldaki botlar
   (published / approved / satışta / aktif satıcı) indekslenebilir olmalı? Veri modelinde bu
   koşullar nasıl temsil ediliyor?
2. Marketplace listeleme ve kategori sayfaları public olacak mı? (`getcategories.php` var.)
3. Kullanıcı profilleri public olacak mı?
4. `/` pazarlama landing page'i mi olacak, `/dashboard` yönlendirmesi mi kalacak?
   (`getlandingimages.php` var — landing içeriği zaten backend'de mi?)
5. Bölüm 4'teki içerik sayfaları (hakkımızda, gizlilik, mesafeli satış vb.) açılsın mı?
6. Sitemap ve SEO metadata'nın tek authoritative kaynağı hangisi olacak?
7. Site tek dil (tr) mi? Gerçek localized URL planı var mı?
8. Marka adının kesin yazımı, site açıklaması, logo/OG görseli.
   (`getsocials.php`/`getowner.php` bunların bir kısmını zaten taşıyor olabilir — kontrol et.)

## 9) Aşama 1 rapor formatı

Yalnızca şu başlıklarla raporla:

1. **Executive summary** — P0 / P1 / P2 problemler.
2. **Hipotez doğrulama tablosu** — bölüm 2'deki 9 madde, kanıtla.
3. **URL / indexability matrisi** — bölüm 3.
4. **Ölçüm sonuçları** — bölüm 5: initial HTML vs rendered DOM farkı, status kodları,
   redirect zincirleri, soft-404'ler. Tablo halinde.
5. **İçerik envanteri** — bölüm 4: hazır ama yayınlanmamış içerik.
6. **Internal linking / orphan** — bölüm 6.
7. **Robots / sitemap / admin SEO çatışması** — bölüm 7.
8. **Metadata durumu** — mevcut title/description/canonical/OG envanteri.
9. **Güvenlik–SEO sınırı** — public sayfa açılacaksa backend'in public veri vermeye uygun
   olup olmadığı; auth'u SEO için gevşetme önerisi getirme.
10. **Ürün kararları** — bölüm 8'deki sorular, veri modeli bulgularıyla birlikte.
11. **Önerilen plan** — P0/P1/P2. Her madde: problem, çözüm, değişecek dosyalar, SEO etkisi,
    teknik risk, geri alma kolaylığı.
12. **"Kod değişikliği yapılmadı."**

## 10) Ölçülemeyeni ölçülmüş gibi yazma

Core Web Vitals (LCP/INP/CLS) statik kod okumayla ölçülemez. Lighthouse çalıştırmadıysan
sayı uydurma; "kod düzeyinde risk sinyali" olarak yaz (ör. LCP görselinde `priority` yok,
sayfa tamamen client component) ve ölçüm gerektiğini belirt.

Aynı kural her yerde geçerli: doğrulayamadığın şeye "doğrulandı" deme, "doğrulanamadı" de.

## 11) Bu turda sınırlı kapsam

**Sadece tespit et, strateji uygulama:** mevcut route'larda kullanılan query parameter'ları
listele. Her biri için nerede üretildiğini ve nerede tüketildiğini yaz.

`/login?tab=register` gibi mevcut varyantları HTTP status ve metadata açısından ayrı bir URL
olarak örnekle — ama bu aşamada canonical/noindex/robots stratejisi **önerme veya uygulama**;
public route kararı sonrasında detaylandırılacak.

**Hiç denetleme:** pagination/sort/filter duplicate stratejisi, breadcrumb, index bloat,
hreflang ve international SEO, mobile usability, `Product`/`Offer`/`AggregateRating` schema
tasarımı. Raporda tek satırla "public route kararı sonrası ele alınacak" diye geç.

## 12) Yasaklar

Anahtar kelime doldurma, gizli metin, doorway page, sahte backlink. Gerçek veri olmadan
`Offer`, `AggregateRating`, `FAQPage`, yorum veya fiyat schema'sı. Sayfada görünmeyen bilgiden
schema. Production domain'ini koda sabitleme. Auth'u SEO için gevşetme. Gereksiz PHP refactor.

`metadataBase` kaynağı yalnızca `NEXT_PUBLIC_SITE_URL` olacak; tanımlı değilse geliştirmede
`http://localhost:3000`, production build'de açık hatayla dur. Sessizce localhost'a düşme.

Production HTML çıktısında `localhost`, `127.0.0.1` veya staging hostname sızıntısı olup
olmadığını da kontrol et.

---

**İlk cevabında yalnızca Aşama 1 raporunu ver. Kod değiştirme. Önce ölç, sonra raporla, sonra sor.**
