-- 011 — user_plan_selection: paket bitiş tarihi
--
-- AUDIT D-05. `upgradePlan()` aylık fiyatı BİR KEZ tahsil edip
-- `user_plan_selection`'a yazıyordu; tabloda süre bilgisi yoktu
-- (`user_id`, `plan_name`, `selected_at`) ve `getUserPlan()` satırı
-- KOŞULSUZ okuyordu. Yani "aylık" etiketiyle satılan paket süresiz
-- veriliyordu: bir kez ödeyen kullanıcı sonsuza kadar Elmas kalıyordu.
--
-- İş kuralı kararı: paket 30 GÜNLÜK TEK SEFERLİK bir satıştır. Yinelenen
-- tahsilat YOK; süre bitince kullanıcı varsayılan (ücretsiz) plana düşer
-- ve dilerse elle yeniden satın alır.
--
-- NULL = SÜRESİZ. Bu yamadan ÖNCE yazılmış satırlar (varsa) süresiz
-- kabul edilir; kimsenin ödediği hak geriye dönük olarak iptal
-- edilmiyor. Ölçüm: bu migration yazıldığında canlıda `user_plan_selection`
-- 0 satırdı, yani pratikte geriye dönük etkisi yok.
--
-- Idempotent: sütun zaten varsa hiçbir şey yapmaz. Salt ekleme, veri
-- silmiyor, --allow-destructive gerektirmez.

SET @c1 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_plan_selection'
              AND COLUMN_NAME = 'expires_at');
SET @s1 := IF(@c1 = 0,
    'ALTER TABLE `user_plan_selection` ADD COLUMN `expires_at` DATETIME NULL DEFAULT NULL AFTER `selected_at`',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- Süresi dolmuş satırları elemek getUserPlan()'ın sıcak yolu; index işe yarar.
SET @c2 := (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_plan_selection'
              AND INDEX_NAME = 'idx_user_plan_expires');
SET @s2 := IF(@c2 = 0,
    'ALTER TABLE `user_plan_selection` ADD INDEX `idx_user_plan_expires` (`expires_at`)',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;


-- Doğrulama — iki satır da 1 döndürmeli
SELECT 'expires_at' AS nesne, COUNT(*) AS present FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_plan_selection' AND COLUMN_NAME = 'expires_at'
UNION ALL SELECT 'idx_user_plan_expires', COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_plan_selection' AND INDEX_NAME = 'idx_user_plan_expires';
