<?php
/**
 * Chatbot limit helpers.
 * These functions check the user's subscription/plan to determine how many
 * bots they are allowed to create.
 *
 * NOTE: This file must be present on the production server with real plan logic.
 * The implementations below are development stubs that apply the free-tier limits
 * defined in AppConfig so local development and tests work without a plan table.
 */

function getIndependentBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_INDEPENDENT_BOT_LIMIT;
}

function getPublicBotLimit(Database $db, int $userId): int {
    // TODO: query user plan table when plans are active on prod.
    return AppConfig::FREE_PUBLIC_BOT_LIMIT;
}

function countUserChatbots(Database $db, int $userId, int $isIndependent): int {
    return $db->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ? AND is_independent = ?', [$userId, $isIndependent]);
}
