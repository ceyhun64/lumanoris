`AUDIT.md`'deki P0 maddelerini severity sırasıyla kapat.

Her madde için: root cause'u doğrula → en küçük güvenli değişiklik → doğrulama komutları → ilgili testi çalıştır → AUDIT.md'de "kapandı + kanıt" işaretle → sonraki.

Bütçe ve durma koşulu:

- Bu oturumda **en fazla 5 P0**. Beşi bitince dur, özet ver.
- Bir madde **3 denemede** kapanmıyorsa dur, neyi denediğini ve neden başarısız olduğunu yaz, sonrakine geç.
- Bir düzeltme başka bir testi kırarsa: değişikliği geri al, ikisini birlikte raporla, kendi başına ikinci bir düzeltme zinciri başlatma.
- "Onay bekle" kategorisine giren maddede uygulama, diff öner, sonrakine geç.
- Bir maddenin kökeni `BLOCKERS.md`'deki bir engelse kapatma — "B<n> bekliyor" olarak işaretle.

Yeni problem keşfedersen düzeltmeye başlama; `AUDIT.md`'ye yeni ID olarak ekle.
