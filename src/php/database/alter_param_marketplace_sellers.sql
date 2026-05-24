-- Param sub-merchant onboarding state.
-- Idempotent: each statement guards with INFORMATION_SCHEMA check, so re-run is safe.

SET @tbl := 'param_marketplace_sellers';

SET @col := 'status';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `status` ENUM('not_started','pending','active','rejected','suspended') NOT NULL DEFAULT 'not_started'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'tip';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `tip` TINYINT NOT NULL DEFAULT 1 COMMENT '1=Bireysel, 3=Kurumsal'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'last_error';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `last_error` TEXT NULL"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'last_attempt_at';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `last_attempt_at` TIMESTAMP NULL DEFAULT NULL"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'param_payload_json';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `param_payload_json` JSON NULL COMMENT 'son submit edilen Param parametreleri'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
