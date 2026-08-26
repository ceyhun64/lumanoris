-- 008_missing_unique_keys.sql   (DB-005 🟡)
--
-- Bu dosya VERİ SİLMEZ. Üç UNIQUE kısıt ekler.
--
-- ── Sorun ────────────────────────────────────────────────────────────────
-- `chatbot_likes`, `chatbot_dislikes` ve `chatbot_follows` "aynı kullanıcı
-- aynı botu iki kez beğenemez" kuralını UNIQUE(user_id, chatbot_id) ile
-- zorluyor. Aynı sınıftaki üç tabloda ise bu kısıt yok:
--
--     chatbot_hide          (user_id, chatbot_id)
--     chatbot_uninterested  (user_id, category_id)
--     chatbot_in_list       (list_id, chatbot_id)
--
-- Yani "bu botu gizle" iki kez tıklanırsa iki satır oluşuyor, "bu kategoriyle
-- ilgilenmiyorum" tekrar tekrar birikiyor, aynı bot bir listeye defalarca
-- eklenebiliyor. Görünür sonucu: `getPublishedV2()`'nin "ilgilenmiyorum"
-- filtresi ve liste sayaçları şişiyor.
--
-- Uygulama öncesi ölçüm (2026-08-26): üç tabloda da **yinelenen kayıt yok**
-- (satır sayıları 0 / 0 / 4). Yani temizlik adımı gerekmiyor — kısıt doğrudan
-- eklenebilir. Başka bir veritabanında çalıştırmadan önce yeniden ölçün:
--
--     SELECT COUNT(*) FROM (SELECT 1 FROM chatbot_hide
--       GROUP BY user_id, chatbot_id HAVING COUNT(*) > 1) x;
--
-- Tekrar çalıştırılabilir: var olan kısıt atlanır.

-- chatbot_hide
SET @c1 := (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_hide'
              AND INDEX_NAME = 'uq_chatbot_hide_user_chatbot');
SET @s1 := IF(@c1 = 0,
    'ALTER TABLE `chatbot_hide` ADD UNIQUE KEY `uq_chatbot_hide_user_chatbot` (`user_id`, `chatbot_id`)',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- chatbot_uninterested
SET @c2 := (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_uninterested'
              AND INDEX_NAME = 'uq_chatbot_uninterested_user_category');
SET @s2 := IF(@c2 = 0,
    'ALTER TABLE `chatbot_uninterested` ADD UNIQUE KEY `uq_chatbot_uninterested_user_category` (`user_id`, `category_id`)',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- chatbot_in_list
SET @c3 := (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_in_list'
              AND INDEX_NAME = 'uq_chatbot_in_list_list_chatbot');
SET @s3 := IF(@c3 = 0,
    'ALTER TABLE `chatbot_in_list` ADD UNIQUE KEY `uq_chatbot_in_list_list_chatbot` (`list_id`, `chatbot_id`)',
    'DO 0');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;


-- Doğrulama — üç satır da 1 döndürmeli
SELECT 'chatbot_hide' AS t, COUNT(*) AS uq FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'uq_chatbot_hide_user_chatbot' AND SEQ_IN_INDEX = 1
UNION ALL SELECT 'chatbot_uninterested', COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'uq_chatbot_uninterested_user_category' AND SEQ_IN_INDEX = 1
UNION ALL SELECT 'chatbot_in_list', COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'uq_chatbot_in_list_list_chatbot' AND SEQ_IN_INDEX = 1;
