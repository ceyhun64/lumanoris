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

/**
 * "Sınırsız" kotanın tek temsili. Sayım karşılaştırmaları (`$used >= $limit`)
 * değişmeden çalışsın diye sayı; arayüze ayrıca `*_unlimited` bayrağı gider.
 */
const BOT_LIMIT_UNLIMITED = PHP_INT_MAX;

/**
 * Madde 2 / GK-5 / GK-6 — onaylanmış (`active`) pazaryeri satıcısının
 * herkese açık bot hakkı sınırsız. Yalnızca herkese açık botlar için; bağımsız
 * bot limiti plandan gelmeye devam eder. Başvuru yapmış ama onaylanmamış
 * kullanıcı (pending/rejected) bu hakkı ALMAZ.
 *
 * B1 açıkken hiçbir satıcı `active` olamıyor; yani bugün bu dal kimse için
 * çalışmıyor. Kural yine de sunucuda: B1 kapandığında ayrıca kod gerekmesin.
 */
function isActiveMarketplaceSeller(Database $db, int $userId): bool {
    try {
        $row = $db->selectSingle('status FROM ' . AppConfig::TABLE_SELLERS . ' WHERE user_id = ?', [$userId]);
    } catch (Throwable $e) {
        // Tablo henüz oluşturulmamış bir kurulumda (ensureParamMarketplaceTables
        // tembel çalışıyor) satıcı yok demektir.
        error_log('[chatbot_limits] satıcı durumu okunamadı: ' . $e->getMessage());
        return false;
    }
    return ($row['status'] ?? null) === 'active';
}

function getPublicBotLimit(Database $db, int $userId): int {
    if (isActiveMarketplaceSeller($db, $userId)) {
        return BOT_LIMIT_UNLIMITED;
    }
    return (int) getUserPlan($db, $userId)['public_bot_limit'];
}

function isUnlimitedBotLimit(int $limit): bool {
    return $limit === BOT_LIMIT_UNLIMITED;
}


function countUserChatbots(Database $db, int $userId, int $isIndependent): int {
    return $db->count(AppConfig::TABLE_CHATBOTS, 'author_user_id = ? AND is_independent = ?', [$userId, $isIndependent]);
}
