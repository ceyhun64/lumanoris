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
| B7  | Para çekme onayı için operasyonel süreç: talebi kim onaylar, banka transferini kim yapar, `ödendi` işaretini kim atar | Satıcı ödemesi (AUDIT D-01) | Süreç sahibi + banka hesabı erişimi (kod değil)    | AÇIK  |

## Ek notlar

- **B7 (2026-09-02, AUDIT D-01):** Bu blocker'ın yalnızca *operasyonel* yarısı dışarıdan gelmek zorunda. Kod tarafı — admin panelinde bir "Para Çekme Talepleri" sayfası — yazılabilir durumda; `WalletController::listWithdrawals()` ve `updateWithdrawalStatus()` hazır ama hiçbir yerden çağrılmıyor (`api/admin/index.php` route tablosunda karşılığı yok). Sayfa yazılana kadar her çekim talebi kalıcı olarak `beklemede` kalıyor ve `computeBalanceAndTransactions()` bekleyeni bakiyeden düştüğü için satıcının parası kilitli.
- **B1 (2026-09-02, AUDIT D-02):** Bulgu eklemesi — `ParamPosMarketplace::addSubMerchant()` stub'ının etkisi tek bir özellikle sınırlı değil. `param_marketplace_sellers.status = 'active'` olmadığı sürece `saveChatbot` (herkese açık bot), `publishChatbot`, `addToCart`, `createSubscription`, `ChatbotRepository::getPublished()` (INNER JOIN) ve `userHasAccess()`'in preview dalı kapalı kalıyor. Yani bu blocker açıkken pazaryeri hiçbir koşulda ürün gösteremez.
- **B5 (2026-09-02, AUDIT B-07):** Bulgu eklemesi — e-posta değiştirme akışına doğrulama eklenmesi (kalıcı hesap ele geçirme yolunu kapatan yama) SMTP hesabına bağlı; B5 kapanmadan uygulanamaz.
