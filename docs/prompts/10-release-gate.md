Kod değiştirme. Sadece doğrula ve raporla.

1. `AUDIT.md`'deki her ID: kapandı / kısmen / açık / blocker bekliyor. "Kapandı" diyorsan dosya:satır kanıtı ver.

2. **Temiz checkout doğrulaması.** Mevcut çalışma ağacında YAPMA — geliştirici makinesindeki `.env`, `node_modules`, `vendor` testi sahte geçirir. Şunu yap:

```bash
   git clone . /tmp/lumanoris-clean && cd /tmp/lumanoris-clean
   ls -la          # .env yok, node_modules yok, vendor yok olmalı — doğrula
```

Sonra README'deki kurulum adımlarını sıfırdan takip et. Her adım için: çalıştı mı, hangi hatayı verdi, README'de eksik olan ne.
Çalışmayan adımı README'de düzelt. `/tmp/lumanoris-clean`'i sonunda sil.

3. `docs/SMOKE-TEST.md`: kayıt → giriş → bot oluşturma → training (PDF/URL/OCR) → sohbet → sepet → ödeme (sandbox) → subscription → bota erişim → cüzdan → şifre sıfırlama → admin girişi. Her adım için beklenen sonuç.

4. Şu kategorilerin her birine **PASS / FAIL**:
   Build · Runtime · Authentication · Authorization · Security · Data integrity · Payments · Marketplace · Chat · Training · Wallet · Subscriptions · Seller · Admin · File uploads · API contracts · Error handling · Logging · Environment · Tests · CI · Deployment · Documentation

5. `BLOCKERS.md`'yi kontrol et. **Açık bir blocker'a bağlı her kategori otomatik FAIL'dir** — o özelliğin kodu doğru yazılmış olsa bile. Örnek: B1 açıkken Seller kategorisi FAIL.

6. Açık kalan her P0/P1 için tek cümle: "bu açıkken production'a çıkarsam ne olur?"

`RELEASE-READINESS.md` sonunda tek satır:
READY FOR PRODUCTION
NOT READY FOR PRODUCTION

NOT READY ise: P0 listesi · P1 listesi · açık blocker listesi · çıkılırsa ne olacağı · çözülmesi gereken minimum iş.
"Büyük ölçüde hazır", "neredeyse hazır", "küçük eksikler var" yasak.
