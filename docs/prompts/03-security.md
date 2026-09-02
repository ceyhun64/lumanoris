`AUDIT.md`'deki Security / Authentication / Authorization P0-P1 maddeleri.

1. Sır dosyaları: `google.txt`, `customserver.txt`, `chatbot_table.txt`, `api/.env.bak-*`.
   İçerikleri bana gösterme, koda yazma, terminale bastırma.
   `SECURITY-ROTATION.md`: hangi dosya, hangi TÜR sır (değer değil), git geçmişinde var mı, rotasyon için hangi panel.
   Dosyaları çalışma ağacından sil, `.gitignore` kapsamını doğrula.
   Geçmiş temizleme komutunu (`git filter-repo`/BFG) YAZ ama ÇALIŞTIRMA.

2. Denylist üçlüsünü eşitle. Farkları önce tablo göster, onay al, sonra uygula.

3. Authorization bulguları: CLAUDE.md'deki kademeli kurala göre işle. İzole olanları uygula, olmayanları diff olarak öner. Her biri için sömürü senaryosunu AUDIT.md'ye yaz.

4. Rate limit eksikleri: mevcut `checkRateLimit()` desenini uygula, limit değerlerini öner.

5. Düz metin `ADMIN_PASSWORD` desteğini deprecate et (`ADMIN_PASSWORD_HASH` lehine); kullanılıyorsa açılışta error log uyarısı. Geriye dönük uyumluluğu kırma.
