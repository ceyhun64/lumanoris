-- Add Param-compatible numeric city/district codes to bank info table.
-- Idempotent.

SET @tbl := 'banka_bilgileri';

SET @col := 'il_kod';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `il_kod` INT NULL COMMENT 'Param IL kodu'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'ilce_kod';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `ilce_kod` INT NULL COMMENT 'Param ILCE kodu'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'kisi_dogum_tarihi';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `kisi_dogum_tarihi` VARCHAR(10) NULL COMMENT 'Kisi dogum tarihi dd.MM.yyyy (Param)'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := 'yetkili_kisi_dogum_tarihi';
SET @s := (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = @col) = 0,
  CONCAT("ALTER TABLE `", @tbl, "` ADD COLUMN `yetkili_kisi_dogum_tarihi` VARCHAR(10) NULL COMMENT 'Yetkili kisi dogum tarihi dd.MM.yyyy (Param)'"),
  'SELECT 1'
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
