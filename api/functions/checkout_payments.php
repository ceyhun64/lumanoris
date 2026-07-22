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

    // Dev stub — production calls the real Param POS charge here and
    // returns its actual success/failure. This environment has no gateway
    // credentials, so it only simulates a successful charge once the card
    // itself has passed every check above.
    error_log('[checkout_payments-stub] chargeCard: simulated charge of ' . $amount . ' for card ending ' . substr($number, -4));
    return ['success' => true];
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

function reconcilePayments(Database $db, PDO $conn): void {
    error_log('[checkout_payments-stub] reconcilePayments called');
    JsonResponse::success(['message' => 'Mutabakat tamamlandı (dev stub).', 'processed' => 0]);
}

function processRefund(Database $db, PDO $conn, array $data): void {
    error_log('[checkout_payments-stub] processRefund called');
    JsonResponse::success(['message' => 'İade işlemi simüle edildi (dev stub).']);
}

function handleParamCallback(Database $db, PDO $conn, array $post): void {
    error_log('[checkout_payments-stub] handleParamCallback called');
    http_response_code(200);
    echo 'OK';
    exit;
}
