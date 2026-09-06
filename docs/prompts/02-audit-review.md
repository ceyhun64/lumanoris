Bu repoda daha önce yapılmış bir denetimin çıktısı `AUDIT.md`'de. O denetimi ben yapmadım
ve gerekçelerini görmüyorum. Görevim bulguları doğrulamak değil, **ÇÜRÜTMEK.**

Bu fazda HİÇBİR dosyayı değiştirme. Yeni bulgu arama — sadece mevcut bulguları yargıla.
Kapsam dışı: `.history/`, `node_modules/`, `vendor/`, `web/src/.next-verify/`.

## Yöntem

`AUDIT.md`'deki her bulgu için sırayla:

1. **İddiayı yanlışlamaya çalış.** Kodu oku. Bulguyu geçersiz kılacak bir mekanizma var mı —
   üst katmanda bir guard, bir middleware, bir `.htaccess` kuralı, bir bilinçli tasarım kararı,
   ya da daha önceki bir denetim turunda kapatılmış olması?
2. **Ancak yanlışlayamazsan** doğrulanmış say.

Bu repo daha önce birkaç denetim turundan geçmiş ve bazı bulgular zaten kapatılmış.
`AUDIT.md`'yi yazan oturum bunu biliyordu ama sen bilmiyorsun — kapatılmış bir açığın
tekrar bulgu olarak yazılmış olma ihtimalini de yanlışlama gerekçesi olarak değerlendir.

## Karar

Her bulguya şunlardan **birini** ver:

- **DOĞRULANDI** — sömürü/kırılma yolunu yeniden ürettim. Kanıt: `<dosya:satır>`
- **YANLIŞ POZİTİF** — geçersiz kılan mekanizma: `<dosya:satır>`
- **KISMEN** — problem var ama severity yanlış / etkisi abartılmış. Doğrusu: `<...>`
- **DOĞRULANAMADI** — ne doğrulayabildim ne çürütebildim. Eksik olan: `<...>`

## Bulgu olarak kabul etme — bunlar bilinçli tasarım kararı

`README.md`'de gerekçeleri yazılı:

- `web/src/app/auth/page.jsx` ve `dashboard/market/page.jsx` bilerek `notFound()` çağırır
- iyzico / SMTP / callback yollarının anahtarsızken hata vermesi **fail-closed tasarım**, bug değil
- HSTS ve `upgrade-insecure-requests`'in dev'de kapalı olması bilinçli
- güvenlik header'larının `/api`, `/admin`, `/assets`'i atlaması bilinçli (admin panel CDN kullanıyor)
- `next lint` deprecation uyarısı beklenen davranış
- `web/src`'te çağıranı olmayan endpoint ≠ ölü endpoint; `api/admin/` içinde de ara
- Türkçe tablo/alan adları (`kullanicilar`, `eposta`, `ucret_haftalik`) tasarım tercihi

## İki kategoriye ekstra sert davran

**Authorization / IDOR:** sömürü senaryosunu somut isteğe indirgeyemiyorsan **DOĞRULANAMADI** yaz.
"Ownership kontrolü görünmüyor" bir iddia değildir. Hangi kullanıcı, hangi endpoint'e, hangi
parametreyle, kimin hangi kaynağına eriştiğini göster. Üst katmanda bir guard olup olmadığını
(`AuthMiddleware`, `_guard.php`, controller başındaki oturum kontrolü) mutlaka kontrol et.

**Sabit uyuşmazlığı** (`AppConfig.php` / `coin_engine.php` / `pricing.js`): iki değerin farklı
olması tek başına hata değil. Önce **aynı iş kuralını temsil ettiklerini kanıtla:**

- aynı birim mi (TL / kuruş / adet / gün / hafta)?
- biri gösterim, diğeri hesaplama değeri olabilir mi?
- biri diğerinden türetiliyor olabilir mi (ör. komisyon sonrası net)?
- biri varsayılan, diğeri override olabilir mi?
  Bunları eleyemeden "uyuşmazlık" deme.

## Çıktı: `AUDIT-REVIEW.md`

| AUDIT ID | Orijinal severity | Karar | Gerekçe (dosya:satır) | Düzeltilmiş severity |

Sonda:

1. **Sayım:** doğrulanan / yanlış pozitif / kısmen / doğrulanamayan.
2. **Yanlış pozitif kalıpları:** birden fazla bulguda tekrarlanan hatalı akıl yürütme varsa adlandır.
3. **Severity düzeltmeleri:** yükselttiğin veya düşürdüğün her bulgu ve nedeni.
4. **Gözden kaçmış olabilecek alanlar:** orijinal denetimin "Bakamadığım yerler" listesini oku;
   oradaki bir boşluk mevcut bulgulardan birini geçersiz kılıyor mu?

`AUDIT.md`'yi değiştirme. Yeni bulgu ekleme. Kod yazma.
