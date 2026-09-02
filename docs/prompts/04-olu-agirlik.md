Sadece erişilemezliği kanıtlanmış dosyalar. Her biri için silmeden ÖNCE kanıtı göster:

1. `web/public/api/*.php` — var olmayan yolu require ediyor VE proxy her `/api/*` isteğini Next.js görmeden PHP'ye gönderiyor, yani runtime'da ulaşılamaz. İki kanıtı da doğrula.
2. `web/src/app/css/global.scss` (11.004 satır) + `global.css.map` — `web/package.json`'da Sass derleyicisi yok VE hiçbir JS `.scss` import etmiyor. `grep -r` ile ikisini de doğrula. `global.css` (808 satır) KALIR, `app/layout.js` onu import ediyor.
3. `scripts/phpify.js` + `package.json`'daki `phpify` scripti — `web/src/php` mevcut değil, script ENOENT veriyor. Sil ya da çalışır hale getir; hangisini önerdiğini gerekçelendir.
4. `export` scripti: `next export` Next 15'te kaldırıldı → `NEXT_EXPORT=1 next build`.

Bu fazda npm bağımlılığı KALDIRMA, endpoint SİLME, `TODO.md` kararı VERME — onlar FAZ 3b'de.
Her silmeden sonra build + lint. Build bozulursa geri al ve raporla.
