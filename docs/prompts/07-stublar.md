`api/functions/ParamPosMarketplace.php` stub'ı. Bu dosya yüzünden kimse satıcı olamıyor,
dolayısıyla hiçbir bot yayınlanamıyor — marketplace'in yarısı ölü. (BLOCKERS.md → B1)

Bu oturumda kod YAZMA:

1. Dosyayı ve çağıran her yeri oku. Hangi metot, hangi imza, dönüş değeri nasıl tüketiliyor — tam contract.
2. Gerçek entegrasyon için dışarıdan ne gerekiyor: sağlayıcı, kimlik bilgileri, KYC alanları, endpoint'ler.
3. Sağlayıcı dokümanı olmadan yazılamayacak kısımları işaretle.
4. `docs/seller-onboarding-plan.md`: mevcut durum → hedef → adım adım plan → her adımın doğrulama kriteri.
5. `BLOCKERS.md`'deki B1 maddesine, bulduğun somut gereksinimleri ekle. Maddeyi kapatma.

Uydurma endpoint adı kullanma. Stub'ı varsayılan değerle doldurup "çalışıyor" yapma.
