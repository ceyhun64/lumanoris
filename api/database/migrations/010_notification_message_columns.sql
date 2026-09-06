-- 010 — notifications: message_tr / message_en sütunları
--
-- AUDIT E-03. Bu iki sütun `schema.sql`de VAR (satır 343 civarı) ama
-- `migrations/` altında onları ekleyen hiçbir dosya yoktu. Boşluk, istek
-- yolunda çalışan bir ALTER TABLE ile kapatılıyordu:
-- `NotificationController::createNotification()` her çağrıda
-- information_schema'yı sorguluyor, sütun yoksa ALTER çalıştırıyordu.
--
-- Bu üç açıdan yanlıştı:
--   1. Şema değişikliği bir kullanıcı isteğinin içinde, DDL yetkisiyle
--      çalışıyordu (uygulama kullanıcısının ALTER hakkı olmak zorundaydı).
--   2. ALTER TABLE MySQL'de örtük COMMIT yapar — çağıran bir transaction
--      içindeyse sessizce kesilirdi.
--   3. Her bildirim oluşturma isteği fazladan bir information_schema
--      sorgusu ödüyordu.
--
-- Migration uygulandıktan sonra controller'daki runtime DDL kaldırıldı.
--
-- Idempotent: sütun zaten varsa hiçbir şey yapmaz. Salt ekleme, veri
-- silmiyor, --allow-destructive gerektirmez.

SET @c1 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
              AND COLUMN_NAME = 'message_tr');
SET @s1 := IF(@c1 = 0,
    'ALTER TABLE `notifications` ADD COLUMN `message_tr` TEXT NULL AFTER `title_en`',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SET @c2 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
              AND COLUMN_NAME = 'message_en');
SET @s2 := IF(@c2 = 0,
    'ALTER TABLE `notifications` ADD COLUMN `message_en` TEXT NULL AFTER `message_tr`',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;


-- Doğrulama — iki satır da 1 döndürmeli
SELECT 'message_tr' AS col, COUNT(*) AS present FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'message_tr'
UNION ALL SELECT 'message_en', COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'message_en';
