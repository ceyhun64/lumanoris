# Lumanoris — Hoppa'ya sorularımız

Lumanoris, kullanıcıların yapay zekâ sohbet botları oluşturup paylaştığı bir platformdur. İki tür ödeme alacağız:

- **Üyelik paketleri:** Kullanıcıların aylık paket satın alması (Gümüş 149 ₺, Altın 299 ₺, Elmas 849 ₺).
- **Pazaryeri satışları:** Kullanıcıların başka satıcıların botlarını haftalık ya da aylık satın alması. Satış tutarının bir kısmı satıcıya, bir kısmı platforma kalır.

**Tercihimiz:** Kart bilgilerinin bizim sunucumuzdan geçmemesini istiyoruz; Hoppa'nın ödeme sayfası (hosted payment page) veya 3D Secure yönlendirmeli akışını kullanmak istiyoruz.

## 1. Pazaryeri ve satıcılar

1. Pazaryeri satışlarında satıcının payı, platformun hesabına girmeden doğrudan satıcıya aktarılabiliyor mu?
2. Satıcılarımızı Hoppa'ya "alt üye işyeri" olarak kaydedebiliyor muyuz?
3. Her satışta satıcı payını ve platform komisyonunu biz mi belirliyoruz, yoksa sabit bir oran mı uygulanıyor?
4. Satıcılara ödeme ne zaman ve nasıl yapılıyor; IBAN'larına otomatik mi aktarılıyor?
5. Şahıs şirketi ve limited/anonim şirket satıcılar için hangi bilgi ve belgeler isteniyor?
6. Vergi kaydı olmayan bireyler satıcı olabiliyor mu?
7. Satıcı kaydının onayı ne kadar sürüyor ve sonucu bize otomatik olarak bildiriliyor mu?
8. Satıcı IBAN ya da adres bilgisini sonradan değiştirebiliyor mu, bunun için ayrıca onay gerekiyor mu?

## 2. Ödeme alma

9. Kullanıcıyı Hoppa'nın ödeme sayfasına yönlendirip, ödeme bitince sonucu sitemize geri alabiliyor muyuz?
10. Ödeme sayfası sitemizin içinde (çerçeve olarak) gösterilebiliyor mu, yoksa ayrı bir sayfaya mı yönlendirme gerekiyor?
11. Tüm ödemelerde 3D Secure zorunlu mu?
12. Ödeme sonucu bize anlık bildirim olarak (webhook) da iletiliyor mu?
13. Tek bir ödemede farklı satıcılara ait birden fazla ürün satılabiliyor mu?
14. Alıcıdan hangi bilgiler zorunlu olarak isteniyor (T.C. kimlik no, telefon, adres gibi)?
15. Asgari ve azami ödeme tutarı var mı?
16. Taksitli ödeme sunuluyor mu, sunuluyorsa komisyonu kim karşılıyor?
17. Yurt dışında çıkarılmış kartlar kabul ediliyor mu?

## 3. İptal ve iade

18. Bir ödeme aynı gün içinde tamamen iptal edilebiliyor mu?
19. Ödemenin tamamı ya da bir kısmı sonradan iade edilebiliyor mu?
20. Birden fazla ürün içeren bir ödemede yalnızca tek bir ürünün iadesi yapılabiliyor mu?
21. İade için bir süre sınırı var mı?
22. Pazaryeri satışında iade yapılınca satıcının payı da otomatik olarak geri alınıyor mu?

## 4. Paketler ve yenileme

23. Aylık paketlerin her ay otomatik yenilenmesi için kart saklama ve otomatik çekim destekleniyor mu?

## 5. Ödeme durumunu takip etme

24. Bir ödemenin durumunu sonradan sipariş numaramızla sorgulayabiliyor muyuz?
25. Ödeme sırasında bağlantı koparsa ödemenin gerçekleşip gerçekleşmediğini nasıl öğrenebiliyoruz?
26. Aynı sipariş yanlışlıkla iki kez gönderilirse çift çekim engelleniyor mu?

## 6. Test, entegrasyon ve sözleşme

27. Test ortamı, test kartları ve test satıcı hesapları sağlanıyor mu?
28. Teknik API dokümanını ve canlı ortam erişim bilgilerini ne zaman alabiliriz?
29. Canlıya geçmeden önce Hoppa tarafında bir kontrol veya onay süreci var mı?
30. Kart ödemeleri, pazaryeri hizmeti ve satıcı ödemeleri için komisyon oranları ve ücretler nedir?
31. Entegrasyon sırasında teknik destek hangi kanaldan ve ne kadar sürede veriliyor?

## 7. Güvenlik ve yasal yükümlülükler

32. Hoppa'nın ödeme sayfasını kullandığımızda, kart güvenliği (PCI-DSS) açısından bizden hangi belge ya da beyan isteniyor?
33. Kişisel verilerin işlenmesi (KVKK) için Hoppa ile ayrıca bir sözleşme imzalanması gerekiyor mu?
34. Sitemizde bulunması gereken yasal metinler ve şirket bilgileri (ünvan, adres, vergi no gibi) için Hoppa'nın bir koşulu var mı?
