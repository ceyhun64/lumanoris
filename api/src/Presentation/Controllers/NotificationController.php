<?php
class NotificationController {
    public static function createNotification(): void {
        require_method('POST');
        $data = json_decode($_POST['data'] ?? '', true) ?? null;
        if (!$data || !isset($data['user_id'], $data['type'], $data['title_tr'], $data['title_en'])) {
            JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);
        }

        $data['is_read'] = $data['is_read'] ?? false;
        $id = Database::getInstance()->insert('notifications', $data);
        JsonResponse::success(['message' => 'Bildirim oluşturuldu.', 'id' => $id]);
    }

    public static function getNotification(): void {
        $userId = InputSanitizer::positiveInt($_GET['user_id'] ?? 0);
        if (!$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        $rows = Database::getInstance()->selectMulti(
            '* FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [$userId]
        );
        JsonResponse::success(['notifications' => $rows]);
    }

    public static function readNotification(): void {
        require_method('POST');
        $data   = json_decode($_POST['data'] ?? '', true) ?? null;
        $id     = InputSanitizer::positiveInt($data['id'] ?? 0);
        $userId = InputSanitizer::positiveInt($data['user_id'] ?? 0);
        if (!$data || !$id || !$userId) JsonResponse::error('Eksik parametre.', 400, AppConfig::ERR_VALIDATION);

        Database::getInstance()->update('notifications', ['is_read' => true], 'id = ? AND user_id = ?', [$id, $userId]);
        JsonResponse::success(['message' => 'Bildirim okundu olarak işaretlendi.']);
    }
}
