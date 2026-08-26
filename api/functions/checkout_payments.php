<?php
/**
 * Param POS payment processing stubs.
 * Production server has the real reconciliation and callback logic.
 * These stubs allow endpoints to load without fatal errors in dev.
 *
 * ensureParamMarketplaceTables() — creates required DB tables if missing.
 * reconcilePayments()           — syncs payment status from Param API to DB.
 * processRefund()               — handles a refund request via Param API.
 * handleParamCallback()         — processes a Param POS async callback POST.
 * chargeCard()                  — validates + (in prod) charges a card before
 *                                  a subscription/payment row is ever written.
 */

/**
 * Root-cause gate for the "no card was ever validated" bug: previously
 * createSubscription() never looked at $data['card'] at all, so any
 * chatbot_id/duration_weeks pair succeeded with no card data whatsoever.
 * This dev stub can't call a real gateway (no Param credentials/API access
 * in this environment — see class comment on ParamPosMarketplace), but it
 * does the one thing fully verifiable without one: reject anything that
 * isn't even a well-formed card (missing fields, failed Luhn check, bad
 * CVV, expired date) *before* any DB row is written. Mirrors the same
 * Luhn/expiry rules CartConfirm.jsx already enforces client-side, so the
 * two layers agree instead of the backend silently trusting less than the
 * frontend already checks.
 */
function chargeCard(array $card, float $amount): array {
    $number = preg_replace('/\D/', '', (string) ($card['number'] ?? ''));
    $expiry = trim((string) ($card['expiry'] ?? ''));
    $cvv    = preg_replace('/\D/', '', (string) ($card['cvv'] ?? ''));
    $holder = trim((string) ($card['holder_name'] ?? ''));

    if ($holder === '' || $number === '' || $expiry === '' || $cvv === '') {
        return ['success' => false, 'message' => 'Kart bilgileri eksik.'];
    }
    if (strlen($number) < 13 || strlen($number) > 19 || !luhnCheck($number)) {
        return ['success' => false, 'message' => 'Kart numarası geçersiz.'];
    }
    if (!preg_match('/^\d{3,4}$/', $cvv)) {
        return ['success' => false, 'message' => 'CVV geçersiz.'];
    }
    if (!preg_match('/^(\d{2})\/(\d{2})$/', $expiry, $m)) {
        return ['success' => false, 'message' => 'Son kullanma tarihi geçersiz.'];
    }
    $month = (int) $m[1];
    $year  = (int) $m[2];
    if ($month < 1 || $month > 12) {
        return ['success' => false, 'message' => 'Son kullanma tarihi geçersiz.'];
    }
    $currentYear  = (int) date('y');
    $currentMonth = (int) date('n');
    if ($year < $currentYear || ($year === $currentYear && $month < $currentMonth)) {
        return ['success' => false, 'message' => 'Kartın son kullanma tarihi geçmiş.'];
    }

    // PAY-001 🔴 — Dev stub. Production calls the real Param POS charge here.
    //
    // Buradaki 'success' GERÇEK BİR TAHSİLAT DEĞİL. Eskiden yalnızca
    // ['success' => true] dönüyordu ve çağıran taraf bunu gerçek ödeme gibi
    // işliyordu: status='paid' ödeme satırı, status='approved' satıcı payı ve
    // withdraw() üzerinden ÇEKİLEBİLİR bakiye. Luhn-geçerli sahte bir kartla
    // satıcı hesabında gerçek para oluşturulabiliyordu.
    //
    // 'simulated' bayrağı bu bilgiyi çağırana taşıyor: MarketplaceController
    // bunu görünce ledger satırlarını şemanın zaten öngördüğü
    // 'pending_approval' durumuyla yazıyor, yani çekilebilir bakiye zinciri
    // kesiliyor. Gerçek entegrasyon geldiğinde bu bayrağı KALDIRMAK yeterli.
    error_log('[checkout_payments-stub] chargeCard: simulated charge of ' . $amount . ' for card ending ' . substr($number, -4));
    return ['success' => true, 'simulated' => true];
}

function luhnCheck(string $digits): bool {
    $sum          = 0;
    $shouldDouble = false;
    for ($i = strlen($digits) - 1; $i >= 0; $i--) {
        $digit = (int) $digits[$i];
        if ($shouldDouble) {
            $digit *= 2;
            if ($digit > 9) $digit -= 9;
        }
        $sum += $digit;
        $shouldDouble = !$shouldDouble;
    }
    return $sum % 10 === 0;
}

function ensureParamMarketplaceTables(PDO $conn): void {
    // Dev stub — tables assumed to exist (created via migration on prod).
    error_log('[checkout_payments-stub] ensureParamMarketplaceTables called');
}

/**
 * PAY-012 🟡 — bu üç stub **fail-open**'dı: hiçbir şey yapmadan
 * `JsonResponse::success(...)` dönüyorlardı. Admin "İade tamamlandı" ya da
 * "Mutabakat tamamlandı" görüyordu; hiçbir para hareket etmemişti, hiçbir
 * ledger satırı değişmemişti. Bir müşteri iade talebi kapatılmış sayılıp
 * gerçekte hiç iade almayabilirdi.
 *
 * Fail-closed stub zararsızdır; fail-open stub gerçek sonuç üretir. Üçü de
 * artık 503 ile açıkça "bu ortamda yapılamıyor" diyor.
 */
function reconcilePayments(Database $db, PDO $conn): void {
    error_log('[checkout_payments-stub] reconcilePayments çağrıldı — entegrasyon yok, reddedildi.');
    JsonResponse::error(
        'Mutabakat şu anda yapılamıyor: Param POS entegrasyonu devreye alınmadı.',
        503,
        AppConfig::ERR_UNAVAILABLE
    );
}

function processRefund(Database $db, PDO $conn, array $data): void {
    error_log('[checkout_payments-stub] processRefund çağrıldı — entegrasyon yok, reddedildi. data=' . json_encode(array_intersect_key($data, array_flip(['order_id', 'payment_id', 'amount']))));
    JsonResponse::error(
        'İade şu anda işlenemiyor: Param POS entegrasyonu devreye alınmadı. '
        . 'İade kaydı oluşturulmadı, müşteriye bilgi vermeyin.',
        503,
        AppConfig::ERR_UNAVAILABLE
    );
}

function handleParamCallback(Database $db, PDO $conn, array $post): void {
    // Bu stub bilinçli olarak 200/OK dönüyor: gerçek gateway 200 almadığında
    // bildirimi saatlerce yeniden dener. Ama HİÇBİR ŞEY işlemiyor ve bunu
    // logluyor — sahte bir "ödendi" ledger satırı üretmiyor.
    error_log('[checkout_payments-stub] handleParamCallback çağrıldı — entegrasyon yok, bildirim işlenmedi.');
    http_response_code(200);
    echo 'OK';
    exit;
}
