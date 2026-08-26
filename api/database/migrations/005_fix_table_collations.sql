-- 005_fix_table_collations.sql   (DB-017 🟠 — DB-004'ün canlı veritabanındaki kalıntısı)
--
-- Bu dosya VERİ SİLMEZ. Yalnızca tablo ve sütun collation'larını dönüştürür.
--
-- ── Sorun ────────────────────────────────────────────────────────────────
-- DB-004 🟡 "9 tablo `utf8mb4_0900_ai_ci` kullanıyor, bu collation MySQL 8'e
-- özgü ve MariaDB'de yok" diyordu. Düzeltme turu 1'de iki şey yapıldı:
--   • `schema.sql`'deki 9 tanım `utf8mb4_general_ci`'ye çevrildi,
--   • `Database::ensureTable()` artık açık `COLLATE` yazıyor.
--
-- İkisi de GELECEKTEKİ kurulumlar için doğruydu ama **canlı veritabanına
-- hiç dokunmadı.** Çalışma zamanında `ensureTable()` ile (eski hâliyle)
-- oluşturulmuş tablolar hâlâ sunucu varsayılanını taşıyor.
--
-- ── Nasıl yakalandı ──────────────────────────────────────────────────────
-- Plan sistemi (BIZ-002) `user_plan_selection.plan_name` ile `plans.name_tr`
-- arasında JOIN yapmak istedi. Sonuç hata:
--
--     SQLSTATE[HY000]: 1267 Illegal mix of collations
--     (utf8mb4_general_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT)
--     for operation '='
--
-- Yani bu yalnızca "MariaDB'ye taşınamaz" sorunu değil; MySQL 8'de de iki
-- tablo arasında JOIN yapmayı imkânsız kılıyor. Ölçüm (2026-08-26):
-- **10 tablo, 38 sütun.**
--
-- Etkilenen tablolar — hepsi ödeme/oturum altyapısı:
--   param_marketplace_alerts, param_marketplace_details,
--   param_marketplace_payments, param_marketplace_refunds,
--   param_marketplace_sellers, param_marketplace_soap_log,
--   password_resets, rate_limits, schema_migrations, user_plan_selection
--
-- ── Risk ─────────────────────────────────────────────────────────────────
-- `CONVERT TO CHARACTER SET` sütun verisini yeniden kodlar. Karakter kümesi
-- ZATEN utf8mb4 (yalnızca collation farklı), yani bayt düzeyinde dönüşüm
-- yok — sıralama/karşılaştırma kuralı değişiyor. Veri kaybı riski yok.
--
-- İki collation da case-insensitive. Fark: `0900_ai_ci` Unicode 9.0
-- normalizasyonu yapar, `general_ci` yapmaz. Etkilenen sütunların hiçbiri
-- kullanıcıya gösterilen serbest metin değil — hash, GUID, durum kodu,
-- JSON blob ve dosya adı. Sıralama farkının görünür bir sonucu yok.
--
-- İndeksler yeniden kurulur (MySQL bunu kendisi yapar).
--
-- Tekrar çalıştırılabilir: zaten doğru collation'daki tablo atlanır.

-- ═══════════════════════════════════════════════════════════════════════

-- param_marketplace_alerts
SET @c1 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_alerts');
SET @s1 := IF(@c1 IS NOT NULL AND @c1 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_alerts` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- param_marketplace_details
SET @c2 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_details');
SET @s2 := IF(@c2 IS NOT NULL AND @c2 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_details` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- param_marketplace_payments
SET @c3 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_payments');
SET @s3 := IF(@c3 IS NOT NULL AND @c3 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_payments` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

-- param_marketplace_refunds
SET @c4 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_refunds');
SET @s4 := IF(@c4 IS NOT NULL AND @c4 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_refunds` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

-- param_marketplace_sellers  (status ENUM'u da dönüşür)
SET @c5 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_sellers');
SET @s5 := IF(@c5 IS NOT NULL AND @c5 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_sellers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st5 FROM @s5; EXECUTE st5; DEALLOCATE PREPARE st5;

-- param_marketplace_soap_log
SET @c6 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'param_marketplace_soap_log');
SET @s6 := IF(@c6 IS NOT NULL AND @c6 <> 'utf8mb4_general_ci',
    'ALTER TABLE `param_marketplace_soap_log` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st6 FROM @s6; EXECUTE st6; DEALLOCATE PREPARE st6;

-- password_resets
SET @c7 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_resets');
SET @s7 := IF(@c7 IS NOT NULL AND @c7 <> 'utf8mb4_general_ci',
    'ALTER TABLE `password_resets` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st7 FROM @s7; EXECUTE st7; DEALLOCATE PREPARE st7;

-- rate_limits
SET @c8 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limits');
SET @s8 := IF(@c8 IS NOT NULL AND @c8 <> 'utf8mb4_general_ci',
    'ALTER TABLE `rate_limits` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st8 FROM @s8; EXECUTE st8; DEALLOCATE PREPARE st8;

-- schema_migrations  (migrate.php'nin kendi tablosu)
SET @c9 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations');
SET @s9 := IF(@c9 IS NOT NULL AND @c9 <> 'utf8mb4_general_ci',
    'ALTER TABLE `schema_migrations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st9 FROM @s9; EXECUTE st9; DEALLOCATE PREPARE st9;

-- user_plan_selection  (007'nin ön koşulu: plans.name_tr ile JOIN edilecek)
SET @c10 := (SELECT TABLE_COLLATION FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_plan_selection');
SET @s10 := IF(@c10 IS NOT NULL AND @c10 <> 'utf8mb4_general_ci',
    'ALTER TABLE `user_plan_selection` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci', 'DO 0');
PREPARE st10 FROM @s10; EXECUTE st10; DEALLOCATE PREPARE st10;


-- ═══════════════════════════════════════════════════════════════════════
-- Doğrulama — her iki sorgu da 0 satır döndürmeli
-- ═══════════════════════════════════════════════════════════════════════
SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_COLLATION <> 'utf8mb4_general_ci';

SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLLATION_NAME IS NOT NULL AND COLLATION_NAME <> 'utf8mb4_general_ci';
