<?php
/**
 * Chatbot limit helpers.
 *
 * BIZ-002 🟠 / UX-002 🟡 — burası bir stub'dı ve plana HİÇ bakmıyordu:
 * herkese `AppConfig::FREE_*` (1 bağımsız / 2 herkese açık) döndürüyordu.
 * "TODO: query user plan table when plans are active on prod" yorumu
 * duruyordu ama sorgulanacak bir şey yoktu — `plans` tablosunda limit
 * sütunu bile yoktu (bkz. migration 007).
 *
 * Sonuç, kullanıcıya çelişkili iki ekran olarak görünüyordu: dashboard
 * başlığı `user_plan_selection.plan_name`'i okuyup "Elmas" derken, bot
 * ekranı buradan 1/2 alıyordu.
 *
 * Artık ikisi de `functions/plans.php` üzerinden aynı satırı okuyor.
 * Migration 007 uygulanmamışsa fonksiyon AppConfig değerlerine düşüyor,
 * yani davranış eskisiyle birebir aynı kalıyor.
 */

require_once __DIR__ . '/plans.php';

function getIndependentBotLimit(Database $db, int $userId): int {
    return (int) getUserPlan($db, $userId)['independent_bot_limit'];
}

function getPublicBotLimit(Database $db, int $userId): int {
    return (int) getUserPlan($db, $userId)['public_bot_limit'];
}


function countUserChatbots(Database $db, int $userId, int $isIndependent): int {
    return $db->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ? AND is_independent = ?', [$userId, $isIndependent]);
}
