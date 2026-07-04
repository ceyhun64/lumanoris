<?php
/**
 * Producer account / plan management stubs.
 * Production server has the real plan purchase and status logic.
 *
 * buyProducerAccount()    — initiates a producer plan purchase via Param POS.
 * getProducerPlanStatus() — returns active producer plan details for a user.
 */

function buyProducerAccount(Database $db, array $data): array {
    error_log('[producer_plan-stub] buyProducerAccount called');
    return [
        'success' => false,
        'message' => 'Üretici hesabı satın alma işlemi henüz bu ortamda desteklenmiyor (dev stub).',
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
