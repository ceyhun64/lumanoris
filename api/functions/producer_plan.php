<?php
/**
 * Üretici hesabı (750₺/ay) — BİLİNÇLİ OLARAK KAPALI.
 *
 * iyzico entegrasyonu tamamlandı ve `chargeCard()` artık gerçek tahsilat
 * yapıyor; yani burada para çekmek TEKNİK olarak mümkün. Açılmamasının
 * sebebi ödeme değil, karşılığın olmaması:
 *
 *   • `producer_plans` tablosuna yazılan satırı HİÇBİR kod okumuyor.
 *   • Bot limitleri yalnızca `functions/plans.php` üzerinden
 *     `user_plan_selection` + `plans` satırından geliyor
 *     (`chatbot_limits.php`); üretici planına bakan bir dal yok.
 *   • `AppConfig::PRODUCER_*_LIMIT` sabitleri de hiçbir yerde okunmuyor.
 *
 * Yani tahsilat açılsaydı kullanıcı 750₺ ödeyip modalın vaat ettiği
 * "5 herkese açık + 2 bağımsız chatbot" hakkını ALAMAYACAKTI. Bu, üyelik
 * paketlerinde (BIZ-001/BIZ-002) düzeltilen hatanın birebir aynısı olurdu.
 *
 * Açmak için gereken — ödeme DEĞİL:
 *   1. `getUserPlan()`'ın etkin üretici planını da hesaba katması,
 *   2. `producer_plans`'ta hangi planın alındığının saklanması (bugün tablo
 *      yalnızca "şu tarihe kadar üretici planı var" diyebiliyor),
 *   3. `getProducerPlanStatus()`'un gerçek satırı okuması.
 * Üçü tamamlanınca buradaki gövde `WalletController::upgradePlan()` ile
 * aynı desende yazılabilir (chargeCard + hata halinde cancelCharge).
 */

function buyProducerAccount(Database $db, array $data): array {
    error_log('[producer_plan] üretici hesabı satışı kapalı: satın alınan plan hiçbir limit üretmiyor (bkz. dosya başı yorumu).');
    return [
        'success' => false,
        'message' => 'Üretici hesabı satışı şu anda kapalı. Paket haklarınızı '
            . '"Hesabını Yükselt" sayfasındaki üyelik paketlerinden alabilirsiniz.',
    ];
}

function getProducerPlanStatus(Database $db, int $userId): array {
    error_log("[producer_plan-stub] getProducerPlanStatus userId=$userId");
    return [
        'has_plan'    => false,
        'plan_name'   => null,
        'expiry_date' => null,
        'status'      => 'none',
    ];
}
