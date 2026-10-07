# Lumanoris — Hoppa'ya sorularımız

Lumanoris, kullanıcıların yapay zekâ sohbet botları oluşturup paylaştığı bir platformdur. İki tür ödeme alacağız:

- **Üyelik paketleri:** Kullanıcıların aylık paket satın alması (Gümüş 149 ₺, Altın 299 ₺, Elmas 849 ₺).
- **Pazaryeri satışları:** Kullanıcıların başka satıcıların botlarını haftalık ya da aylık satın alması. Satış tutarının bir kısmı satıcıya, bir kısmı platforma kalır.

**Tercihimiz:** Kart bilgilerinin bizim sunucumuzdan geçmemesini istiyoruz; Hoppa'nın Ortak Ödeme Sayfası'nı kullanıyoruz. Geliştirici dokümanınızı (developer.esnekpos.com) inceledik ve test ortamında Ortak Ödeme Sayfası ile ödeme ve ödeme sorgulamayı denedik. Aşağıda yalnızca dokümanda cevabını bulamadığımız sorular var.

## Öncelikli

1. Ortak Ödeme Sayfası (CommonPaymentDealer) isteğine SubMerchantDetails eklenerek pazaryeri bölüştürmesi yapılabilir mi? Kart bilgisinin bizim sunucumuzdan geçmesini istemiyoruz.
2. PROCCESS_QUERY yanıtındaki AUTH_HASH doğrulama algoritmasını paylaşabilir misiniz?

## Ödeme

3. Test üye işyerinde 149,00 TL'lik siparişte ödeme sayfası 151,25 TL gösterdi; komisyon alıcıya yansıtıldı. Komisyonun alıcıya mı yansıtılacağını yoksa bizim tarafımızdan mı karşılanacağını hesap bazında seçebiliyor muyuz? Kart ödemeleri ve pazaryeri hizmeti için komisyon oranları ve ücretler nedir?
4. Ödeme sonucu, kullanıcının tarayıcısıyla BACK_URL'e gelen form dışında, sunucudan sunucuya bir bildirimle (webhook) de iletiliyor mu?
5. Ortak Ödeme Sayfası bağlantısı ne kadar süre geçerli kalıyor? Süresi dolan ya da kullanıcının yarıda bıraktığı ödeme, sorgulamada hangi durumla görünüyor?
6. Aynı ORDER_REF_NUMBER ile ikinci kez ödeme başlatılırsa ne oluyor? Çift çekim engelleniyor mu?
7. Ödeme sayfası sitemizin içinde (iframe) gösterilebiliyor mu?
8. Asgari ve azami ödeme tutarı var mı? Yurt dışında çıkarılmış kartlar kabul ediliyor mu?

## Pazaryeri ve satıcılar

9. Satıcıları SubMerchantSet ile kaydederken şahıs, şahıs şirketi ve limited/anonim şirket için hangi bilgi ve belgeler gerekiyor? Vergi kaydı olmayan bireyler satıcı olabiliyor mu?
10. Satıcı kaydı (ve IBAN değişikliği) sizin tarafınızda ayrıca onaylanıyor mu? Ne kadar sürüyor ve sonucu bize nasıl bildiriliyor?
11. PaymentConfirm'den sonra satıcının payı IBAN'ına ne zaman aktarılıyor?

## İade

12. İade için bir süre sınırı var mı?

## Canlıya geçiş

13. Canlı ortam MERCHANT / MERCHANT_KEY bilgilerini ne zaman alabiliriz? Canlıya geçmeden önce sizin tarafınızda bir kontrol veya onay süreci var mı?

## Güvenlik ve yasal yükümlülükler

14. Ortak Ödeme Sayfası'nı kullandığımızda kart güvenliği (PCI-DSS) açısından bizden hangi belge ya da beyan isteniyor?
15. Kişisel verilerin işlenmesi (KVKK) için ayrıca bir sözleşme imzalanması gerekiyor mu?
16. Sitemizde bulunması gereken yasal metinler ve şirket bilgileri için bir koşulunuz var mı?
