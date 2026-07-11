<?php
/**
 * Coin / message-credit engine.
 *
 * getActivePurchaseCredit()    — returns active (non-expired) purchase credit row for a user+chatbot pair.
 * getOrInitCoinBalance()       — returns (creating/resetting as needed) the user's daily coin balance row.
 * consumeMessage()             — decrements the appropriate credit counter and returns result.
 * calculateMessageAllowance()  — bonus message credits granted for a given paid amount (PHP mirror
 *                                 of the same formula in web/src/features/purchasing/BuyModal.jsx).
 */

function getActivePurchaseCredit(Database $db, int $userId, int $chatbotId): ?array {
    return $db->selectSingle(
        'id, credits_remaining FROM ' . AppConfig::TABLE_PURCHASE_CREDITS . '
         WHERE user_id = ? AND chatbot_id = ? AND credits_remaining > 0
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY id ASC LIMIT 1',
        [$userId, $chatbotId]
    ) ?: null;
}

function getOrInitCoinBalance(Database $db, int $userId): array {
    $today = date('Y-m-d');
    $row   = $db->selectSingle(
        'coins_remaining, last_reset_date, exhausted_at FROM ' . AppConfig::TABLE_COIN_BALANCES . '
         WHERE user_id = ?',
        [$userId]
    );

    if (!$row) {
        $db->insert(AppConfig::TABLE_COIN_BALANCES, [
            'user_id'         => $userId,
            'coins_remaining' => AppConfig::DAILY_FREE_MESSAGES,
            'last_reset_date' => $today,
            'exhausted_at'    => null,
        ]);
        return ['coins_remaining' => AppConfig::DAILY_FREE_MESSAGES, 'exhausted_at' => null];
    }

    // One row per user — reset back to the daily allowance once the stored date has passed.
    $lastReset = is_string($row['last_reset_date']) ? substr($row['last_reset_date'], 0, 10) : null;
    if ($lastReset !== $today) {
        $db->update(AppConfig::TABLE_COIN_BALANCES, [
            'coins_remaining' => AppConfig::DAILY_FREE_MESSAGES,
            'last_reset_date' => $today,
            'exhausted_at'    => null,
        ], 'user_id = ?', [$userId]);
        return ['coins_remaining' => AppConfig::DAILY_FREE_MESSAGES, 'exhausted_at' => null];
    }

    return ['coins_remaining' => (int) $row['coins_remaining'], 'exhausted_at' => $row['exhausted_at']];
}

/**
 * Both branches below decrement with an atomic
 * `UPDATE ... SET x = x - 1 WHERE x > 0` guarded by the affected row count,
 * rather than reading a value in PHP and writing back a computed one — two
 * concurrent requests racing on a read-then-write would otherwise both read
 * the same remaining count and both succeed, granting an extra free message
 * past what the user actually has left.
 */
function consumeMessage(Database $db, int $userId, int $chatbotId): array {
    $credit = getActivePurchaseCredit($db, $userId, $chatbotId);

    if ($credit) {
        $conn = $db->getConnection();
        $stmt = $conn->prepare(
            'UPDATE ' . AppConfig::TABLE_PURCHASE_CREDITS . '
             SET credits_remaining = credits_remaining - 1
             WHERE id = ? AND credits_remaining > 0'
        );
        $stmt->execute([(int) $credit['id']]);
        if ($stmt->rowCount() > 0) {
            return ['allowed' => true, 'source' => 'purchase_credit', 'remaining' => (int) $credit['credits_remaining'] - 1];
        }
        // Exhausted by a concurrent request between the read above and this
        // update — fall through and try the daily coin balance instead.
    }

    getOrInitCoinBalance($db, $userId); // ensure today's balance row exists/has been reset

    $conn = $db->getConnection();
    $stmt = $conn->prepare(
        'UPDATE ' . AppConfig::TABLE_COIN_BALANCES . '
         SET coins_remaining = coins_remaining - 1,
             exhausted_at = IF(coins_remaining - 1 = 0, NOW(), exhausted_at)
         WHERE user_id = ? AND coins_remaining > 0'
    );
    $stmt->execute([$userId]);
    if ($stmt->rowCount() === 0) {
        return ['allowed' => false, 'source' => 'coins', 'remaining' => 0];
    }

    $remaining = (int) $db->selectSingle(
        'coins_remaining FROM ' . AppConfig::TABLE_COIN_BALANCES . ' WHERE user_id = ?',
        [$userId]
    )['coins_remaining'];

    return ['allowed' => true, 'source' => 'coins', 'remaining' => $remaining];
}

// Keep in sync with COIN_TIER_* in web/src/features/purchasing/BuyModal.jsx.
const COIN_TIER_BASE = 150;
const COIN_TIER_STEP = 100;
const COIN_TIER_CAP  = 1000;

function calculateMessageAllowance(float $totalPaid): int {
    if ($totalPaid < 100) return 0;
    $tier = (int) floor($totalPaid / 100);
    return min(COIN_TIER_CAP, COIN_TIER_BASE + ($tier - 1) * COIN_TIER_STEP);
}

/** Grants (or tops up) a purchase-credit allowance for a user+chatbot after a paid purchase. */
function grantPurchaseCredit(Database $db, int $userId, int $chatbotId, float $totalPaid, string $expiresAt): void {
    $allowance = calculateMessageAllowance($totalPaid);
    if ($allowance <= 0) return;

    $db->insert(AppConfig::TABLE_PURCHASE_CREDITS, [
        'user_id'           => $userId,
        'chatbot_id'        => $chatbotId,
        'credits_remaining' => $allowance,
        'credits_total'     => $allowance,
        'expires_at'        => $expiresAt,
    ]);
}
