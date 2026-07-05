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

        $data['user_id'] = $userId;
        $data['is_read'] = $data['is_read'] ?? false;
        $id = Database::getInstance()->insert('notifications', $data);
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
