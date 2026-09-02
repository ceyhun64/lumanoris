Bu repoda production-readiness denetimi yapıyorsun. Bu fazda HİÇBİR dosyayı değiştirme.
Kapsam dışı: `.history/`, `node_modules/`, `vendor/`, `web/src/.next-verify/`.

## A — Mimari ve API contract

Frontend'deki her API çağrısını `api/api/**/*.php` altındaki gerçek endpoint ile eşleştir:

- frontend'in çağırdığı ama backend'de olmayan endpoint
- yanlış HTTP method / payload / response formatı
- frontend'in beklediği alan adı ile backend'in döndürdüğü alan adının uyuşmaması
- hiçbir yerden çağrılmayan endpoint → çağıran aramasını `web/src`, `api/admin`, `api/router.php` ÜÇÜNDE de yap. Üçünde de yoksa "silme adayı" olarak işaretle, SİLME.

## B — Güvenlik

Her biri için somut kanıt ara: IDOR · ownership kontrolü olmayan endpoint · auth'suz protected endpoint · privilege escalation · mass assignment · CSRF · XSS (özellikle `react-markdown` ile render edilen asistan yanıtları) · SQL injection · SSRF (`training/readurl.php` — private IP, localhost, cloud metadata, redirect abuse) · path traversal · insecure file upload (MIME/extension spoofing, SVG, boyut) · rate limit eksiği · session fixation · reset token tek kullanımlık mı / süreli mi · sensitive data leakage

Ownership kontrolünü şunların HEPSİ için ayrı doğrula:
chatbot · conversation · message · note · wallet · banka bilgisi · subscription · payment · withdrawal · training verisi · profil · yüklenen dosya

Her authorization bulgusu için **sömürü senaryosu** yaz: hangi istek, hangi parametre, kim neye erişiyor. Kanıtlayamıyorsan "ŞÜPHE" olarak işaretle.

## C — Race condition

"Aynı istek iki sekmeden aynı anda gelirse ne olur?" sorusunu tek tek cevapla:
coin tüketimi · purchase credits · cüzdan bakiyesi · withdrawal · subscription oluşturma · checkout · publish · like/follow/comment
Transaction içinde olması gerekip olmayan çok adımlı yazmaları listele.

## D — Stub ve yarım özellikler

Kelime araması (`TODO|FIXME|STUB|placeholder|not implemented|geçici|mock`) yeterli değil.
Her bulgu için tek soru: **kullanıcı bu yüzden tam olarak neyi yapamıyor?**
Şu iş akışı kırılmalarını özellikle araştır: satın alma var ama erişim yok · seller kayıt olamıyor · bot publish edilemiyor · training başarılı görünüyor ama veri yazılmıyor · ödeme başarılı ama subscription yok · bakiye yanlış · coin negatife düşüyor.
Bir stub'ın kökeni dış entegrasyon eksikliğiyse → `BLOCKERS.md`'ye madde olarak ekle, `AUDIT.md`'de o blocker ID'sine referans ver.

## E — Veri bütünlüğü

`AppConfig.php` / `coin_engine.php` / `pricing.js` içindeki fiyat, komisyon ve mesaj kotası değerlerini **yan yana tablo** halinde göster. Uyuşmayan tek değer bile P0.
`schema.sql` ↔ `migrations/` tutarsızlıkları.

## F — Error handling, frontend, build

Yutulan exception · boş catch · `res.ok` kontrol edilmeden `JSON.parse` · kullanıcıya sızan SQL/stack trace/dosya yolu · sonsuz loading · double submit · broken auth guard · `NODE_ENV` bağımlı yanlış davranış · dev-only varsayımlar.

## Çıktı: `AUDIT.md`

| ID | Kategori | Severity | Dosya:satır | Problem | Kanıt | Kullanıcı etkisi | Önerilen çözüm | Blocker? | Efor |

Severity: **P0** production'a çıkmayı engeller · **P1** çıkılır ama kısa sürede patlar · **P2** teknik borç · **P3** iyileştirme
Kategoriler: Broken functionality · Security · Authentication · Authorization · Data integrity · Payments · Marketplace · Chat/AI · Training · File handling · Error handling · Race conditions · Frontend · API contract · Build · Deployment · Environment · Observability · Testing · Dead code · Stubs · Documentation

Kurallar: "Muhtemelen" yazma — ya kanıtla ya "DOĞRULANAMADI". Sayı şişirmek için stil şikayeti ekleme.
Sonda iki başlık: **"Bakamadığım yerler"** ve **"Karar vermem gereken belirsizlikler"**.
