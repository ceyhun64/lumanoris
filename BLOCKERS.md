# Blockers — kod yazarak çözülemeyecek maddeler

Claude bu maddeleri kapatamaz. Sadece bulgu ekleyebilir.

| ID  | Blocker                                                 | Engellediği özellik                                 | Bende olması gereken                               | Durum |
| --- | ------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- | ----- |
| B1  | Gerçek KYC / sub-merchant sağlayıcı entegrasyonu        | Satıcı olma → bot yayınlama → marketplace'in yarısı | Sağlayıcı hesabı + API dokümanı + kimlik bilgileri | AÇIK  |
| B2  | Producer plan iş kuralı: satın alınan plan neyi açacak? | Producer plan satın alma                            | İş kararı (kod değil)                              | AÇIK  |
| B3  | iyzico production kimlik bilgileri                      | Gerçek ödeme                                        | Sağlayıcı onayı                                    | AÇIK  |
| B4  | Gemini production API anahtarı ve kota                  | Sohbet                                              | Google Cloud hesabı                                | AÇIK  |
| B5  | SMTP hesabı                                             | Şifre sıfırlama, işlemsel e-posta                   | Sağlayıcı hesabı                                   | AÇIK  |
| B6  | Hosting / process manager / TLS / DNS kararı            | Deployment                                          | Altyapı kararı                                     | AÇIK  |
