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

        // E-03 — burada bir ÇALIŞMA ZAMANI ALTER TABLE vardı.
        //
        // `notifications.message_tr` / `message_en` `schema.sql`de tanımlı ama
        // hiçbir migration onları eklemiyordu; boşluk her istekte
        // information_schema'yı sorgulayıp gerekirse ALTER çalıştıran bu
        // blokla kapatılıyordu. Üç sorunu vardı: şema değişikliği kullanıcı
        // isteğinin içinde ve DDL yetkisiyle çalışıyordu; MySQL'de ALTER
        // örtük COMMIT yaptığı için çağıranın transaction'ını sessizce
        // kesiyordu; ve her bildirimde fazladan bir katalog sorgusu ödeniyordu.
        //
        // Sütunlar artık `migrations/010_notification_message_columns.sql` ile
        // geliyor. Burada yalnızca VARLIK KONTROLÜ kaldı: yoksa şema
        // sessizce değiştirilmiyor, migration'ın uygulanması gerektiğini
        // söyleyen açık bir hata dönüyor.
        if (!self::messageColumnsExist($db)) {
            error_log('[notification] notifications.message_tr/message_en yok — migration 010 uygulanmamış.');
            JsonResponse::error(
                'Bildirim altyapısı henüz hazır değil. Lütfen daha sonra tekrar deneyin.',
                503,
                AppConfig::ERR_UNAVAILABLE
            );
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

    /**
     * E-03: migration 010 uygulandı mı? İstek başına bir kez sorulup
     * hatırlanıyor — eski kod bu sorguyu her çağrıda tekrarlıyordu.
     */
    private static function messageColumnsExist(Database $db): bool {
        static $exists = null;
        if ($exists !== null) {
            return $exists;
        }

        $row = $db->selectSingle(
            "COUNT(*) AS cnt FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = 'notifications'
               AND column_name IN ('message_tr', 'message_en')"
        );

        return $exists = ((int) ($row['cnt'] ?? 0) === 2);
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
