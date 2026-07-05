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

function consumeMessage(Database $db, int $userId, int $chatbotId): array {
    $credit = getActivePurchaseCredit($db, $userId, $chatbotId);

    if ($credit) {
        $remaining = (int) $credit['credits_remaining'] - 1;
        $db->update(AppConfig::TABLE_PURCHASE_CREDITS, ['credits_remaining' => $remaining], 'id = ?', [(int) $credit['id']]);
        return ['allowed' => true, 'source' => 'purchase_credit', 'remaining' => $remaining];
    }

    $balance = getOrInitCoinBalance($db, $userId);
    if ((int) $balance['coins_remaining'] <= 0) {
        return ['allowed' => false, 'source' => 'coins', 'remaining' => 0];
    }

    $newCoins = (int) $balance['coins_remaining'] - 1;
    $db->update(
        AppConfig::TABLE_COIN_BALANCES,
        ['coins_remaining' => $newCoins, 'exhausted_at' => $newCoins === 0 ? date('Y-m-d H:i:s') : null],
        'user_id = ?',
        [$userId]
    );

    return ['allowed' => true, 'source' => 'coins', 'remaining' => $newCoins];
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
