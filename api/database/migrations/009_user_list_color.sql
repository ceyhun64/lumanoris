-- 009 — user_lists: renk vurgusu ve açıklama sütunları
--
-- "Yeni Liste Oluştur" modali kullanıcıya renk seçtiriyor ve açıklama
-- yazdırıyor, ama tablonun bu iki alanı hiç yoktu; frontend de değerleri
-- isteğe koymadan atıyordu. Seçilen renk hiçbir yerde görünmüyordu.
--
-- Idempotent: sütun zaten varsa hiçbir şey yapmaz.

SET @c1 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_lists'
              AND COLUMN_NAME = 'color');
SET @s1 := IF(@c1 = 0,
    "ALTER TABLE `user_lists` ADD COLUMN `color` VARCHAR(20) NOT NULL DEFAULT 'violet' AFTER `name`",
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SET @c2 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_lists'
              AND COLUMN_NAME = 'description');
SET @s2 := IF(@c2 = 0,
    "ALTER TABLE `user_lists` ADD COLUMN `description` VARCHAR(500) NULL AFTER `color`",
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;


-- Doğrulama — iki satır da 1 döndürmeli
SELECT 'color' AS col, COUNT(*) AS present FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_lists' AND COLUMN_NAME = 'color'
UNION ALL SELECT 'description', COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_lists' AND COLUMN_NAME = 'description';
