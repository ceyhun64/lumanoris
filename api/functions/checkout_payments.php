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
 */

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
