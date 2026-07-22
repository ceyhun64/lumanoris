<?php
class NotificationController {
    public static function createNotification(): void {
        require_method('POST');
        // Only ever called client-side to notify the acting user themselves
        // (e.g. "your purchase succeeded") — force the target to be the
        // session user so this can't be used to spam arbitrary user ids.
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['type'], $data['title_tr'], $data['title_en'])) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $db = Database::getInstance();

        // Root-cause fix: the real `notifications` table never had
        // message_tr/message_en columns, but callers (e.g. the purchase-
        // success flow in CartConfirm.jsx) always sent them, and
        // NotificationPopup.jsx already reads notif.message_tr to render a
        // notification's body — so every insert with a message crashed
        // (500) and no notification could ever store real body text. Added
        // additively (nullable, doesn't touch existing rows), same
        // idempotent pattern already used for param_marketplace_details in
        // MarketplaceController::createSubscription().
        $conn = $db->getConnection();
        $columnCheck = $db->selectSingle(
            "COUNT(*) AS cnt FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'message_tr'"
        );
        if ((int) ($columnCheck['cnt'] ?? 0) === 0) {
            $conn->exec('ALTER TABLE notifications ADD COLUMN message_tr TEXT NULL AFTER title_en');
            $conn->exec('ALTER TABLE notifications ADD COLUMN message_en TEXT NULL AFTER message_tr');
        }

        // Whitelist so an unrelated/misspelled future field can't crash this
        // insert the same way — mirrors the pattern already used in
        // WalletController::saveBankInfo().
        $allowed  = ['type', 'title_tr', 'title_en', 'message_tr', 'message_en', 'is_read'];
        $filtered = array_intersect_key($data, array_flip($allowed));
        $filtered['user_id'] = $userId;
        $filtered['is_read'] = $filtered['is_read'] ?? false;

        $id = $db->insert('notifications', $filtered);
        JsonResponse::success(['message' => 'Bildirim oluşturuldu.', 'id' => $id]);
    }

    public static function getNotification(): void {
        $userId = AuthMiddleware::requireAuth();

        $rows = Database::getInstance()->selectMulti(
            '* FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [$userId]
        );
        JsonResponse::success(['notifications' => $rows]);
    }

    public static function readNotification(): void {
        require_method('POST');
        $userId = AuthMiddleware::requireAuth();
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        $id     = InputSanitizer::positiveInt($data['id'] ?? 0);
        if (!$data || !$id) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        Database::getInstance()->update('notifications', ['is_read' => true], 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Bildirim okundu olarak işaretlendi.']);
    }
}
