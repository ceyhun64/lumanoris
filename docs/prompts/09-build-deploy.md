1. `web/package.json` → `start` scripti `NODE_ENV=production` set etmiyor; Next.js dev modunda açılıyor ve 127.0.0.1'e bağlanıyor. Cross-platform düzelt.
2. `.env.example` dosyalarını gerçekte okunan tüm değişkenlerle karşılaştır. Eksiği ekle; okunmayanı (`PARAM_*`) "kullanılmıyor" diye işaretle.
3. Açılışta zorunlu env doğrulaması: eksikse anlaşılır hatayla erken kapansın, ilk isteğe kadar beklemesin. Node ve PHP için ayrı.
4. `/healthz`: Node uptime + PHP erişilebilirliği + DB bağlantısı. Sır, sürüm detayı, stack trace döndürme.
5. Loglar: timestamp + request id + endpoint + method + user id + hata tipi. Parola, token, API key, kart verisi ASLA.
6. `docs/DEPLOY.md`, `docs/ENVIRONMENT.md`, `docs/ARCHITECTURE.md`. Repoda kanıtı olmayan hosting sağlayıcısı/process manager uydurma — bilinmeyenleri `KARAR VERİLMELİ` bırak ve `BLOCKERS.md` B6'ya bağla.
