-- =====================================================================
-- Pazaryeri Onboarding manuel migrasyon
-- =====================================================================
-- Çalıştırma:
--   mysql -u USER -p DBNAME < manual_migration_pazaryeri_onboarding.sql
-- veya phpMyAdmin > SQL sekmesinde yapıştırıp çalıştır.
--
-- Idempotent: her ALTER, kolon yoksa eklenir; varsa atlanır.
-- Mevcut param_marketplace_sellers satırları silinmez.
-- Yeni status kolonu default 'not_started' atanır; istenirse manuel
-- olarak güncellenebilir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) param_marketplace_sellers tablosu yoksa oluştur
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_sellers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `guid_altuyeisyeri` VARCHAR(64) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2) param_marketplace_sellers yeni kolonlar
-- ---------------------------------------------------------------------
SET @tbl := 'param_marketplace_sellers';

SET @col := 'status';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `status` ENUM('not_started','pending','active','rejected','suspended') NOT NULL DEFAULT 'not_started'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'tip';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `tip` TINYINT NOT NULL DEFAULT 1 COMMENT '1=Bireysel, 3=Kurumsal'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'last_error';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `last_error` TEXT NULL"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'last_attempt_at';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `last_attempt_at` TIMESTAMP NULL DEFAULT NULL"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'param_payload_json';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `param_payload_json` JSON NULL COMMENT 'son submit edilen Param parametreleri'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mevcut guid'i olan satırları otomatik 'active' yap
UPDATE `param_marketplace_sellers`
SET `status` = 'active'
WHERE `status` = 'not_started' AND `guid_altuyeisyeri` IS NOT NULL AND `guid_altuyeisyeri` <> '';

-- ---------------------------------------------------------------------
-- 3) banka_bilgileri yeni kolonlar
-- ---------------------------------------------------------------------
SET @tbl := 'banka_bilgileri';

SET @col := 'il_kod';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `il_kod` INT NULL COMMENT 'Param IL kodu'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'ilce_kod';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `ilce_kod` INT NULL COMMENT 'Param ILCE kodu'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 4) Doğrulama
-- ---------------------------------------------------------------------
-- Kontrol sorguları:
--   SHOW COLUMNS FROM param_marketplace_sellers;
--   SHOW COLUMNS FROM banka_bilgileri LIKE 'il_kod';
--   SHOW COLUMNS FROM banka_bilgileri LIKE 'ilce_kod';
--   SELECT user_id, status, tip, guid_altuyeisyeri, last_error FROM param_marketplace_sellers;
