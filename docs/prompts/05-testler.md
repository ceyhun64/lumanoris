Repoda hiç test yok. %100 kapsama hedefi yok; para ve veri kaybettirebilecek yolları koruyan minimum ağ.

CLAUDE.md'deki koşullu test kuralı burada geçerli:

- davranış doğruysa → kilitle
- yanlışsa → doğru davranışın testini yaz (kırmızı bırak, FAZ 5'te yeşile döner)
- belirsizse → test yazma, sor

1. Altyapı: PHP → PHPUnit, frontend → Vitest + React Testing Library. Minimum konfigürasyon.
2. Öncelik:
   a. **Sabit eşleşme testi** — `AppConfig.php` / `coin_engine.php` / `pricing.js` değerleri tutmuyorsa test KIRILSIN. Repodaki en kırılgan nokta.
   b. `coin_engine.php` — atomik tüketim, negatife düşme, eşzamanlılık
   c. `plans.php` — `plans` tablosu yok/boşken fallback
   d. `InputSanitizer` allowlist — mass assignment reddediliyor mu
   e. `checkRateLimit()` — pencere sınırı
   f. `shared/api/client.js` — 502 gövdesi, non-JSON yanıt, hata yolları
   g. FAZ 2'de uyguladığın her authorization yaması için ownership testi
3. Ödeme: gerçek çağrı YOK. `IyzicoClient` mock'lanır; imza üretimi ve `redact()` test edilir.
4. GitHub Actions: install + lint + build + `php -l` + testler. Deploy adımı YOK, gerçek secret YOK.

Kırmızı bıraktığın testleri `AUDIT.md`'deki ID'lerle eşleştir ve listele.
