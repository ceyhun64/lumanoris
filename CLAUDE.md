# Lumanoris — Çalışma Kuralları

## Proje

Monorepo: `web/` (Next.js 15 App Router, React 19, Tailwind 3) + `api/` (PHP 8.1+, PDO/MySQL, `/admin` altında ayrı server-rendered panel).
`web/server.js` Express ile Next.js'i sarar; `/api`, `/admin`, `/assets` PHP'ye proxy'lenir. Tek origin.
`README.md` mimariyi ayrıntılı anlatır. Kod ile README çelişirse **kod esastır**; README'yi düzelt.

## Bu repoda bilmen gereken tuzaklar

- `.history/`, `node_modules/`, `vendor/`, `web/src/.next-verify/`: okuma, yazma, arama sonuçlarından çıkar.
- **Sabitler üç yerde kopyalanmış, elle senkronize ediliyor:** `api/src/Shared/Constants/AppConfig.php`, `api/functions/coin_engine.php`, `web/src/shared/lib/pricing.js`. Senkron tutan hiçbir mekanizma yok; uyuşmazlık doğrudan para kaybı.
- **Denylist üç yerde:** `api/.htaccess`, `api/admin/.htaccess`, `api/router.php`. Üçü üç farklı deployment şeklini kapsar; birine eklenip diğerine eklenmeyen kural sessizce hiçbir şey yapmaz.
- **Bir endpoint'in `web/src`'te çağıranı olmaması, kullanılmadığı anlamına GELMEZ.** Admin paneli (`api/admin/`) kendi endpoint'lerini çağırır. Çağıran araması üç yerde birden yapılır: `web/src`, `api/admin`, `api/router.php`.
- DB ve payload alan adları Türkçe (`kullanicilar`, `chatbotlar`, `eposta`, `sifre`, `ucret_haftalik`). Yeniden adlandırma. `AppConfig`'in `TABLE_*` sabitleri haritadır.
- `web/src/app/auth/page.jsx` ve `dashboard/market/page.jsx` bilerek `notFound()` çağırır — emekli route'lar, hata değil.
- `next lint` Next 16'da kaldırılıyor; deprecation uyarısı beklenen davranış.

## Mutlak kurallar

1. **Tahmin etme, oku.** Var olduğundan emin olmadığın fonksiyon/endpoint/paket kullanma; bulamazsan "bulunamadı" de.
2. **Sır sızdırma.** `.env`, `.env.bak-*`, `google.txt`, `customserver.txt`, `chatbot_table.txt` içeriğini ne çıktına ne koda yaz. Bu dosyaların değerlerini terminale bastıran komut da çalıştırma. Gerçek anahtar gördüğünde dur ve bildir.
3. **Küçük adım, sık doğrulama.** Tek seferde 10+ dosyayı topluca yeniden yazma.

## Test kuralı (dikkat: koşullu)

- Mevcut davranışın **doğru olduğu kanıtlanabiliyorsa** → düzeltmeden önce regresyon testi yaz.
- Mevcut davranış **zaten yanlışsa** → yanlış davranışı testle kilitleme. Önce doğru davranışı tarif eden testi yaz (kırmızı), sonra düzelt (yeşil).
- Davranışın doğru mu yanlış mı olduğu **belirsizse** → test yazma, bana sor. Belirsizliği testle kesinleştirme.
- Test geçsin diye kodun davranışını değiştirme.

## Otonomi sözleşmesi

### Sormadan yap

syntax/lint hatası · eksik error handling · eksik input validation · frontend loading/error/empty state · bozuk `fetch` hata yolu · eksik rate limit (mevcut `checkRateLimit()` desenini kullanarak) · dokümantasyon · test yazımı · geri alınabilir izole refactor · kanıtlanmış ölü kod (aşağıdaki 3'lü çağıran araması yapılmışsa)

### Authorization — kademeli

Eksik ownership/auth kontrolü bulduğunda sırayla:

1. **Kanıtla.** Somut sömürü senaryosu yaz: hangi istek, hangi parametre, hangi kullanıcı başkasının neyine erişiyor. Kanıtlayamıyorsan bulgu değil, şüphedir — öyle işaretle.
2. **Minimal yamayı çıkar.** Mevcut auth helper'ıyla, yeni mekanizma icat etmeden.
3. **İzole mi?** Yama yalnızca tek endpoint'i etkiliyorsa ve `web/src` + `api/admin` + `api/router.php` üçünde de çağıran araması yapılmışsa → **uygula.**
4. Yama birden fazla endpoint'i, ortak bir helper'ı, session/oturum davranışını veya API contract'ını etkiliyorsa → **uygulama, diff olarak öner.**
   Her iki durumda da `AUDIT.md`'ye sömürü senaryosuyla birlikte yaz.

### Önce raporla, onay bekle

- Ödeme yolları: `IyzicoClient.php`, `checkout_payments.php`, `api/marketplace/createsubscription.php` — canlı anahtarla gerçek para hareket ediyor.
- Veritabanı şeması · API contract'ında kırıcı değişiklik · bilinmeyen dış sağlayıcı entegrasyonu · iş kuralı belirsizse doğru davranışa kendin karar verme

### Asla yapma

`migrate.php --apply` · `--allow-destructive` · `db_backup.php mode=restore` · `mysqldump` restore · `DROP`/`TRUNCATE`/`DELETE FROM` · gerçek ödeme çağrısı · production deploy · secret rotasyonu · git geçmişi yeniden yazma
Migration dosyası **yazabilirsin**, **uygulayamazsın**.

## BLOCKERS.md

Repo kökünde `BLOCKERS.md` var: senin kod yazarak çözemeyeceğin, dışarıdan hesap/karar/kimlik bilgisi gerektiren maddeler.

- Bu dosyadaki hiçbir maddeyi "çözüldü" olarak işaretleme yetkin yok. Sadece madde ekleyebilir, mevcut maddeye bulgu ekleyebilirsin.
- Bir özelliği "çalışıyor" ilan etmeden önce `BLOCKERS.md`'yi kontrol et: o özellik açık bir blocker'a bağlıysa "çalışıyor" diyemezsin.
- Bir blocker'ı stub/mock/varsayılan değerle doldurup üstünü örtme.

## Doğrulama komutları

```bash
cd web && NEXT_DIST_DIR=.next-verify npm run build
cd web && npm run lint
find api -name "*.php" -not -path "*/vendor/*" -print0 | xargs -0 -n1 php -l
php api/database/iyzico_selftest.php     # A bölümü anahtarsız da geçmeli
```

Bir değişiklik bunlardan birini bozuyorsa geri al ve nedenini raporla.

## Her turun sonunda

Değiştirdiğin her dosya için tek satır: **ne değişti · hangi AUDIT ID'sini kapattı · nasıl doğrulandı.**
