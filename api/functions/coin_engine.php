<?php
/**
 * Coin / message-credit engine stubs.
 * Production server has the real implementations.
 * These stubs allow endpoints to load without fatal errors in dev.
 *
 * getActivePurchaseCredit()  — returns active purchase credit row for a user+chatbot pair.
 * getOrInitCoinBalance()     — returns (and auto-creates) the user's daily coin balance row.
 * consumeMessage()           — decrements the appropriate credit counter and returns result.
 */

function getActivePurchaseCredit(Database $db, int $userId, int $chatbotId): ?array {
    return $db->selectSingle(
        'id, credits_remaining FROM ' . AppConfig::TABLE_PURCHASE_CREDITS . '
         WHERE user_id = ? AND chatbot_id = ? AND credits_remaining > 0 AND status = 1
         ORDER BY id ASC LIMIT 1',
        [$userId, $chatbotId]
    ) ?: null;
}

function getOrInitCoinBalance(Database $db, int $userId): array {
    $today = date('Y-m-d');
    $row   = $db->selectSingle(
        'id, coins_remaining, exhausted_at FROM ' . AppConfig::TABLE_COIN_BALANCES . '
         WHERE user_id = ? AND balance_date = ?',
        [$userId, $today]
    );

    if (!$row) {
        $db->insert(AppConfig::TABLE_COIN_BALANCES, [
            'user_id'        => $userId,
            'balance_date'   => $today,
            'coins_remaining' => AppConfig::DAILY_FREE_MESSAGES,
            'exhausted_at'   => null,
        ]);
        return ['coins_remaining' => AppConfig::DAILY_FREE_MESSAGES, 'exhausted_at' => null];
    }

    return $row;
}

function consumeMessage(Database $db, int $userId, int $chatbotId): array {
    $credit = getActivePurchaseCredit($db, $userId, $chatbotId);

    if ($credit) {
        $remaining = (int) $credit['credits_remaining'] - 1;
        $db->update(AppConfig::TABLE_PURCHASE_CREDITS, ['credits_remaining' => $remaining], 'id = ?', [(int) $credit['id']]);
        return ['source' => 'purchase_credit', 'remaining' => $remaining];
    }

    $balance = getOrInitCoinBalance($db, $userId);
    if ((int) $balance['coins_remaining'] <= 0) {
        return ['allowed' => false, 'source' => 'coins', 'remaining' => 0];
    }

    $newCoins = (int) $balance['coins_remaining'] - 1;
    $today    = date('Y-m-d');
    $db->update(
        AppConfig::TABLE_COIN_BALANCES,
        ['coins_remaining' => $newCoins, 'exhausted_at' => $newCoins === 0 ? date('Y-m-d H:i:s') : null],
        'user_id = ? AND balance_date = ?',
        [$userId, $today]
    );

    return ['allowed' => true, 'source' => 'coins', 'remaining' => $newCoins];
}
