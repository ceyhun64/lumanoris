-- 003_add_foreign_keys.sql  (audit: RİSK-9)
--
-- All 50 tables, zero foreign keys. Referential integrity was left entirely
-- to application code, and it did not hold: rows outlived the users and
-- chatbots they pointed at (38 orphaned rows across 5 relationships when
-- measured).
--
-- RUN ORDER: 001 (types must match) then 002 (orphans must be gone), then
-- this file. Running it first will fail with errno 150 / 1452.
--
-- ON DELETE choices:
--   CASCADE   for rows that are meaningless without their parent — a like,
--             a cart line, a chat message, a subscription.
--   RESTRICT  for chatbotlar.author_user_id: deleting an author who still
--             has published bots should fail loudly, not silently erase the
--             bots (and the subscriptions other people bought).
--
-- Constraint names are explicit so this file is reversible; see the DROP
-- block at the end.

-- DB-014: her ifade information_schema kontrolüyle sarıldı. 003'ün ilk
-- sürümü düz `ADD CONSTRAINT` listesiydi; MySQL'de her DDL örtük COMMIT
-- yaptığı için ortada başarısız olduğunda ilk N kısıt kalıcı oluyor ve
-- dosya bir daha çalıştırılamıyordu (errno 1826, duplicate constraint name).
-- Bu hâliyle tekrar çalıştırmak güvenli: var olan kısıt atlanır.

-- fk_banka_bilgileri_user_id
SET @c0 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'banka_bilgileri' AND CONSTRAINT_NAME = 'fk_banka_bilgileri_user_id');
SET @s0 := IF(@c0 = 0,
    'ALTER TABLE `banka_bilgileri` ADD CONSTRAINT `fk_banka_bilgileri_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st0 FROM @s0; EXECUTE st0; DEALLOCATE PREPARE st0;

-- fk_chatbot_chats_chatbot_id
SET @c1 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_chats' AND CONSTRAINT_NAME = 'fk_chatbot_chats_chatbot_id');
SET @s1 := IF(@c1 = 0,
    'ALTER TABLE `chatbot_chats` ADD CONSTRAINT `fk_chatbot_chats_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- fk_chatbot_chats_user_id
SET @c2 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_chats' AND CONSTRAINT_NAME = 'fk_chatbot_chats_user_id');
SET @s2 := IF(@c2 = 0,
    'ALTER TABLE `chatbot_chats` ADD CONSTRAINT `fk_chatbot_chats_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- fk_chatbot_comments_chatbot_id
SET @c3 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_comments' AND CONSTRAINT_NAME = 'fk_chatbot_comments_chatbot_id');
SET @s3 := IF(@c3 = 0,
    'ALTER TABLE `chatbot_comments` ADD CONSTRAINT `fk_chatbot_comments_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

-- fk_chatbot_comments_user_id
SET @c4 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_comments' AND CONSTRAINT_NAME = 'fk_chatbot_comments_user_id');
SET @s4 := IF(@c4 = 0,
    'ALTER TABLE `chatbot_comments` ADD CONSTRAINT `fk_chatbot_comments_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

-- fk_chatbot_conversations_chatbot_id
SET @c5 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_conversations' AND CONSTRAINT_NAME = 'fk_chatbot_conversations_chatbot_id');
SET @s5 := IF(@c5 = 0,
    'ALTER TABLE `chatbot_conversations` ADD CONSTRAINT `fk_chatbot_conversations_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st5 FROM @s5; EXECUTE st5; DEALLOCATE PREPARE st5;

-- fk_chatbot_conversations_user_id
SET @c6 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_conversations' AND CONSTRAINT_NAME = 'fk_chatbot_conversations_user_id');
SET @s6 := IF(@c6 = 0,
    'ALTER TABLE `chatbot_conversations` ADD CONSTRAINT `fk_chatbot_conversations_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st6 FROM @s6; EXECUTE st6; DEALLOCATE PREPARE st6;

-- fk_chatbot_dislikes_chatbot_id
SET @c7 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_dislikes' AND CONSTRAINT_NAME = 'fk_chatbot_dislikes_chatbot_id');
SET @s7 := IF(@c7 = 0,
    'ALTER TABLE `chatbot_dislikes` ADD CONSTRAINT `fk_chatbot_dislikes_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st7 FROM @s7; EXECUTE st7; DEALLOCATE PREPARE st7;

-- fk_chatbot_dislikes_user_id
SET @c8 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_dislikes' AND CONSTRAINT_NAME = 'fk_chatbot_dislikes_user_id');
SET @s8 := IF(@c8 = 0,
    'ALTER TABLE `chatbot_dislikes` ADD CONSTRAINT `fk_chatbot_dislikes_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st8 FROM @s8; EXECUTE st8; DEALLOCATE PREPARE st8;

-- fk_chatbot_follows_chatbot_id
SET @c9 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_follows' AND CONSTRAINT_NAME = 'fk_chatbot_follows_chatbot_id');
SET @s9 := IF(@c9 = 0,
    'ALTER TABLE `chatbot_follows` ADD CONSTRAINT `fk_chatbot_follows_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st9 FROM @s9; EXECUTE st9; DEALLOCATE PREPARE st9;

-- fk_chatbot_follows_user_id
SET @c10 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_follows' AND CONSTRAINT_NAME = 'fk_chatbot_follows_user_id');
SET @s10 := IF(@c10 = 0,
    'ALTER TABLE `chatbot_follows` ADD CONSTRAINT `fk_chatbot_follows_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st10 FROM @s10; EXECUTE st10; DEALLOCATE PREPARE st10;

-- fk_chatbot_hide_chatbot_id
SET @c11 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_hide' AND CONSTRAINT_NAME = 'fk_chatbot_hide_chatbot_id');
SET @s11 := IF(@c11 = 0,
    'ALTER TABLE `chatbot_hide` ADD CONSTRAINT `fk_chatbot_hide_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st11 FROM @s11; EXECUTE st11; DEALLOCATE PREPARE st11;

-- fk_chatbot_hide_user_id
SET @c12 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_hide' AND CONSTRAINT_NAME = 'fk_chatbot_hide_user_id');
SET @s12 := IF(@c12 = 0,
    'ALTER TABLE `chatbot_hide` ADD CONSTRAINT `fk_chatbot_hide_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st12 FROM @s12; EXECUTE st12; DEALLOCATE PREPARE st12;

-- fk_chatbot_in_list_chatbot_id
SET @c13 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_in_list' AND CONSTRAINT_NAME = 'fk_chatbot_in_list_chatbot_id');
SET @s13 := IF(@c13 = 0,
    'ALTER TABLE `chatbot_in_list` ADD CONSTRAINT `fk_chatbot_in_list_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st13 FROM @s13; EXECUTE st13; DEALLOCATE PREPARE st13;

-- fk_chatbot_likes_chatbot_id
SET @c14 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_likes' AND CONSTRAINT_NAME = 'fk_chatbot_likes_chatbot_id');
SET @s14 := IF(@c14 = 0,
    'ALTER TABLE `chatbot_likes` ADD CONSTRAINT `fk_chatbot_likes_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st14 FROM @s14; EXECUTE st14; DEALLOCATE PREPARE st14;

-- fk_chatbot_likes_user_id
SET @c15 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_likes' AND CONSTRAINT_NAME = 'fk_chatbot_likes_user_id');
SET @s15 := IF(@c15 = 0,
    'ALTER TABLE `chatbot_likes` ADD CONSTRAINT `fk_chatbot_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st15 FROM @s15; EXECUTE st15; DEALLOCATE PREPARE st15;

-- fk_chatbot_purchase_credits_chatbot_id
SET @c16 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_chatbot_id');
SET @s16 := IF(@c16 = 0,
    'ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st16 FROM @s16; EXECUTE st16; DEALLOCATE PREPARE st16;

-- fk_chatbot_purchase_credits_user_id
SET @c17 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_user_id');
SET @s17 := IF(@c17 = 0,
    'ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st17 FROM @s17; EXECUTE st17; DEALLOCATE PREPARE st17;

-- fk_chatbot_reports_chatbot_id
SET @c18 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_reports' AND CONSTRAINT_NAME = 'fk_chatbot_reports_chatbot_id');
SET @s18 := IF(@c18 = 0,
    'ALTER TABLE `chatbot_reports` ADD CONSTRAINT `fk_chatbot_reports_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st18 FROM @s18; EXECUTE st18; DEALLOCATE PREPARE st18;

-- fk_chatbot_reports_user_id
SET @c19 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_reports' AND CONSTRAINT_NAME = 'fk_chatbot_reports_user_id');
SET @s19 := IF(@c19 = 0,
    'ALTER TABLE `chatbot_reports` ADD CONSTRAINT `fk_chatbot_reports_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st19 FROM @s19; EXECUTE st19; DEALLOCATE PREPARE st19;

-- fk_chatbot_uninterested_user_id
SET @c20 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_uninterested' AND CONSTRAINT_NAME = 'fk_chatbot_uninterested_user_id');
SET @s20 := IF(@c20 = 0,
    'ALTER TABLE `chatbot_uninterested` ADD CONSTRAINT `fk_chatbot_uninterested_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st20 FROM @s20; EXECUTE st20; DEALLOCATE PREPARE st20;

-- fk_chatbot_visits_chatbot_id
SET @c21 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_visits' AND CONSTRAINT_NAME = 'fk_chatbot_visits_chatbot_id');
SET @s21 := IF(@c21 = 0,
    'ALTER TABLE `chatbot_visits` ADD CONSTRAINT `fk_chatbot_visits_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st21 FROM @s21; EXECUTE st21; DEALLOCATE PREPARE st21;

-- fk_chatbot_visits_user_id
SET @c22 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_visits' AND CONSTRAINT_NAME = 'fk_chatbot_visits_user_id');
SET @s22 := IF(@c22 = 0,
    'ALTER TABLE `chatbot_visits` ADD CONSTRAINT `fk_chatbot_visits_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st22 FROM @s22; EXECUTE st22; DEALLOCATE PREPARE st22;

-- fk_chatbotlar_author_user_id
SET @c23 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND CONSTRAINT_NAME = 'fk_chatbotlar_author_user_id');
SET @s23 := IF(@c23 = 0,
    'ALTER TABLE `chatbotlar` ADD CONSTRAINT `fk_chatbotlar_author_user_id` FOREIGN KEY (`author_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE st23 FROM @s23; EXECUTE st23; DEALLOCATE PREPARE st23;

-- fk_chatbotlar_owner_user_id
SET @c24 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND CONSTRAINT_NAME = 'fk_chatbotlar_owner_user_id');
SET @s24 := IF(@c24 = 0,
    'ALTER TABLE `chatbotlar` ADD CONSTRAINT `fk_chatbotlar_owner_user_id` FOREIGN KEY (`owner_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st24 FROM @s24; EXECUTE st24; DEALLOCATE PREPARE st24;

-- fk_dialog_comments_user_id
SET @c25 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_comments' AND CONSTRAINT_NAME = 'fk_dialog_comments_user_id');
SET @s25 := IF(@c25 = 0,
    'ALTER TABLE `dialog_comments` ADD CONSTRAINT `fk_dialog_comments_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st25 FROM @s25; EXECUTE st25; DEALLOCATE PREPARE st25;

-- fk_dialog_dislikes_user_id
SET @c26 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_dislikes' AND CONSTRAINT_NAME = 'fk_dialog_dislikes_user_id');
SET @s26 := IF(@c26 = 0,
    'ALTER TABLE `dialog_dislikes` ADD CONSTRAINT `fk_dialog_dislikes_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st26 FROM @s26; EXECUTE st26; DEALLOCATE PREPARE st26;

-- fk_dialog_hide_user_id
SET @c27 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_hide' AND CONSTRAINT_NAME = 'fk_dialog_hide_user_id');
SET @s27 := IF(@c27 = 0,
    'ALTER TABLE `dialog_hide` ADD CONSTRAINT `fk_dialog_hide_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st27 FROM @s27; EXECUTE st27; DEALLOCATE PREPARE st27;

-- fk_dialog_likes_user_id
SET @c28 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_likes' AND CONSTRAINT_NAME = 'fk_dialog_likes_user_id');
SET @s28 := IF(@c28 = 0,
    'ALTER TABLE `dialog_likes` ADD CONSTRAINT `fk_dialog_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st28 FROM @s28; EXECUTE st28; DEALLOCATE PREPARE st28;

-- fk_dialog_reports_user_id
SET @c29 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_reports' AND CONSTRAINT_NAME = 'fk_dialog_reports_user_id');
SET @s29 := IF(@c29 = 0,
    'ALTER TABLE `dialog_reports` ADD CONSTRAINT `fk_dialog_reports_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st29 FROM @s29; EXECUTE st29; DEALLOCATE PREPARE st29;

-- fk_dialog_uninterested_user_id
SET @c30 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_uninterested' AND CONSTRAINT_NAME = 'fk_dialog_uninterested_user_id');
SET @s30 := IF(@c30 = 0,
    'ALTER TABLE `dialog_uninterested` ADD CONSTRAINT `fk_dialog_uninterested_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st30 FROM @s30; EXECUTE st30; DEALLOCATE PREPARE st30;

-- fk_notifications_user_id
SET @c31 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'notifications' AND CONSTRAINT_NAME = 'fk_notifications_user_id');
SET @s31 := IF(@c31 = 0,
    'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st31 FROM @s31; EXECUTE st31; DEALLOCATE PREPARE st31;

-- fk_para_cekme_talepleri_user_id
SET @c32 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'para_cekme_talepleri' AND CONSTRAINT_NAME = 'fk_para_cekme_talepleri_user_id');
SET @s32 := IF(@c32 = 0,
    'ALTER TABLE `para_cekme_talepleri` ADD CONSTRAINT `fk_para_cekme_talepleri_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st32 FROM @s32; EXECUTE st32; DEALLOCATE PREPARE st32;

-- fk_param_marketplace_alerts_user_id
SET @c33 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_alerts' AND CONSTRAINT_NAME = 'fk_param_marketplace_alerts_user_id');
SET @s33 := IF(@c33 = 0,
    'ALTER TABLE `param_marketplace_alerts` ADD CONSTRAINT `fk_param_marketplace_alerts_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st33 FROM @s33; EXECUTE st33; DEALLOCATE PREPARE st33;

-- fk_param_marketplace_details_chatbot_id
SET @c34 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_details' AND CONSTRAINT_NAME = 'fk_param_marketplace_details_chatbot_id');
SET @s34 := IF(@c34 = 0,
    'ALTER TABLE `param_marketplace_details` ADD CONSTRAINT `fk_param_marketplace_details_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st34 FROM @s34; EXECUTE st34; DEALLOCATE PREPARE st34;

-- fk_param_marketplace_payments_user_id
SET @c35 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_payments' AND CONSTRAINT_NAME = 'fk_param_marketplace_payments_user_id');
SET @s35 := IF(@c35 = 0,
    'ALTER TABLE `param_marketplace_payments` ADD CONSTRAINT `fk_param_marketplace_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st35 FROM @s35; EXECUTE st35; DEALLOCATE PREPARE st35;

-- fk_param_marketplace_sellers_user_id
SET @c36 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_sellers' AND CONSTRAINT_NAME = 'fk_param_marketplace_sellers_user_id');
SET @s36 := IF(@c36 = 0,
    'ALTER TABLE `param_marketplace_sellers` ADD CONSTRAINT `fk_param_marketplace_sellers_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st36 FROM @s36; EXECUTE st36; DEALLOCATE PREPARE st36;

-- fk_password_resets_user_id
SET @c37 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'password_resets' AND CONSTRAINT_NAME = 'fk_password_resets_user_id');
SET @s37 := IF(@c37 = 0,
    'ALTER TABLE `password_resets` ADD CONSTRAINT `fk_password_resets_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st37 FROM @s37; EXECUTE st37; DEALLOCATE PREPARE st37;

-- fk_producer_plans_user_id
SET @c38 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'producer_plans' AND CONSTRAINT_NAME = 'fk_producer_plans_user_id');
SET @s38 := IF(@c38 = 0,
    'ALTER TABLE `producer_plans` ADD CONSTRAINT `fk_producer_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st38 FROM @s38; EXECUTE st38; DEALLOCATE PREPARE st38;

-- fk_producer_self_use_credits_chatbot_id
SET @c39 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'producer_self_use_credits' AND CONSTRAINT_NAME = 'fk_producer_self_use_credits_chatbot_id');
SET @s39 := IF(@c39 = 0,
    'ALTER TABLE `producer_self_use_credits` ADD CONSTRAINT `fk_producer_self_use_credits_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st39 FROM @s39; EXECUTE st39; DEALLOCATE PREPARE st39;

-- fk_producer_self_use_credits_user_id
SET @c40 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'producer_self_use_credits' AND CONSTRAINT_NAME = 'fk_producer_self_use_credits_user_id');
SET @s40 := IF(@c40 = 0,
    'ALTER TABLE `producer_self_use_credits` ADD CONSTRAINT `fk_producer_self_use_credits_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st40 FROM @s40; EXECUTE st40; DEALLOCATE PREPARE st40;

-- fk_user_cart_chatbot_id
SET @c41 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_cart' AND CONSTRAINT_NAME = 'fk_user_cart_chatbot_id');
SET @s41 := IF(@c41 = 0,
    'ALTER TABLE `user_cart` ADD CONSTRAINT `fk_user_cart_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st41 FROM @s41; EXECUTE st41; DEALLOCATE PREPARE st41;

-- fk_user_cart_user_id
SET @c42 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_cart' AND CONSTRAINT_NAME = 'fk_user_cart_user_id');
SET @s42 := IF(@c42 = 0,
    'ALTER TABLE `user_cart` ADD CONSTRAINT `fk_user_cart_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st42 FROM @s42; EXECUTE st42; DEALLOCATE PREPARE st42;

-- fk_user_coin_balance_user_id
SET @c43 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_coin_balance' AND CONSTRAINT_NAME = 'fk_user_coin_balance_user_id');
SET @s43 := IF(@c43 = 0,
    'ALTER TABLE `user_coin_balance` ADD CONSTRAINT `fk_user_coin_balance_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st43 FROM @s43; EXECUTE st43; DEALLOCATE PREPARE st43;

-- fk_user_dialog_books_chatbot_id
SET @c44 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_dialog_books' AND CONSTRAINT_NAME = 'fk_user_dialog_books_chatbot_id');
SET @s44 := IF(@c44 = 0,
    'ALTER TABLE `user_dialog_books` ADD CONSTRAINT `fk_user_dialog_books_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st44 FROM @s44; EXECUTE st44; DEALLOCATE PREPARE st44;

-- fk_user_dialog_books_user_id
SET @c45 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_dialog_books' AND CONSTRAINT_NAME = 'fk_user_dialog_books_user_id');
SET @s45 := IF(@c45 = 0,
    'ALTER TABLE `user_dialog_books` ADD CONSTRAINT `fk_user_dialog_books_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st45 FROM @s45; EXECUTE st45; DEALLOCATE PREPARE st45;

-- fk_user_emails_user_id
SET @c46 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_emails' AND CONSTRAINT_NAME = 'fk_user_emails_user_id');
SET @s46 := IF(@c46 = 0,
    'ALTER TABLE `user_emails` ADD CONSTRAINT `fk_user_emails_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st46 FROM @s46; EXECUTE st46; DEALLOCATE PREPARE st46;

-- fk_user_lists_user_id
SET @c47 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_lists' AND CONSTRAINT_NAME = 'fk_user_lists_user_id');
SET @s47 := IF(@c47 = 0,
    'ALTER TABLE `user_lists` ADD CONSTRAINT `fk_user_lists_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st47 FROM @s47; EXECUTE st47; DEALLOCATE PREPARE st47;

-- fk_user_phones_user_id
SET @c48 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_phones' AND CONSTRAINT_NAME = 'fk_user_phones_user_id');
SET @s48 := IF(@c48 = 0,
    'ALTER TABLE `user_phones` ADD CONSTRAINT `fk_user_phones_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st48 FROM @s48; EXECUTE st48; DEALLOCATE PREPARE st48;

-- fk_user_plan_selection_user_id
SET @c49 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_plan_selection' AND CONSTRAINT_NAME = 'fk_user_plan_selection_user_id');
SET @s49 := IF(@c49 = 0,
    'ALTER TABLE `user_plan_selection` ADD CONSTRAINT `fk_user_plan_selection_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st49 FROM @s49; EXECUTE st49; DEALLOCATE PREPARE st49;

-- fk_user_subscriptions_chatbot_id
SET @c50 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_chatbot_id');
SET @s50 := IF(@c50 = 0,
    'ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st50 FROM @s50; EXECUTE st50; DEALLOCATE PREPARE st50;

-- fk_user_subscriptions_user_id
SET @c51 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_user_id');
SET @s51 := IF(@c51 = 0,
    'ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st51 FROM @s51; EXECUTE st51; DEALLOCATE PREPARE st51;

-- fk_user_tokens_user_id
SET @c52 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_tokens' AND CONSTRAINT_NAME = 'fk_user_tokens_user_id');
SET @s52 := IF(@c52 = 0,
    'ALTER TABLE `user_tokens` ADD CONSTRAINT `fk_user_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE st52 FROM @s52; EXECUTE st52; DEALLOCATE PREPARE st52;

-- ALTER TABLE `banka_bilgileri` DROP FOREIGN KEY `fk_banka_bilgileri_user_id`;
-- ALTER TABLE `chatbot_chats` DROP FOREIGN KEY `fk_chatbot_chats_chatbot_id`;
-- ALTER TABLE `chatbot_chats` DROP FOREIGN KEY `fk_chatbot_chats_user_id`;
-- ALTER TABLE `chatbot_comments` DROP FOREIGN KEY `fk_chatbot_comments_chatbot_id`;
-- ALTER TABLE `chatbot_comments` DROP FOREIGN KEY `fk_chatbot_comments_user_id`;
-- ALTER TABLE `chatbot_conversations` DROP FOREIGN KEY `fk_chatbot_conversations_chatbot_id`;
-- ALTER TABLE `chatbot_conversations` DROP FOREIGN KEY `fk_chatbot_conversations_user_id`;
-- ALTER TABLE `chatbot_dislikes` DROP FOREIGN KEY `fk_chatbot_dislikes_chatbot_id`;
-- ALTER TABLE `chatbot_dislikes` DROP FOREIGN KEY `fk_chatbot_dislikes_user_id`;
-- ALTER TABLE `chatbot_follows` DROP FOREIGN KEY `fk_chatbot_follows_chatbot_id`;
-- ALTER TABLE `chatbot_follows` DROP FOREIGN KEY `fk_chatbot_follows_user_id`;
-- ALTER TABLE `chatbot_hide` DROP FOREIGN KEY `fk_chatbot_hide_chatbot_id`;
-- ALTER TABLE `chatbot_hide` DROP FOREIGN KEY `fk_chatbot_hide_user_id`;
-- ALTER TABLE `chatbot_in_list` DROP FOREIGN KEY `fk_chatbot_in_list_chatbot_id`;
-- ALTER TABLE `chatbot_likes` DROP FOREIGN KEY `fk_chatbot_likes_chatbot_id`;
-- ALTER TABLE `chatbot_likes` DROP FOREIGN KEY `fk_chatbot_likes_user_id`;
-- ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_chatbot_id`;
-- ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_user_id`;
-- ALTER TABLE `chatbot_reports` DROP FOREIGN KEY `fk_chatbot_reports_chatbot_id`;
-- ALTER TABLE `chatbot_reports` DROP FOREIGN KEY `fk_chatbot_reports_user_id`;
-- ALTER TABLE `chatbot_uninterested` DROP FOREIGN KEY `fk_chatbot_uninterested_user_id`;
-- ALTER TABLE `chatbot_visits` DROP FOREIGN KEY `fk_chatbot_visits_chatbot_id`;
-- ALTER TABLE `chatbot_visits` DROP FOREIGN KEY `fk_chatbot_visits_user_id`;
-- ALTER TABLE `chatbotlar` DROP FOREIGN KEY `fk_chatbotlar_author_user_id`;
-- ALTER TABLE `chatbotlar` DROP FOREIGN KEY `fk_chatbotlar_owner_user_id`;
-- ALTER TABLE `dialog_comments` DROP FOREIGN KEY `fk_dialog_comments_user_id`;
-- ALTER TABLE `dialog_dislikes` DROP FOREIGN KEY `fk_dialog_dislikes_user_id`;
-- ALTER TABLE `dialog_hide` DROP FOREIGN KEY `fk_dialog_hide_user_id`;
-- ALTER TABLE `dialog_likes` DROP FOREIGN KEY `fk_dialog_likes_user_id`;
-- ALTER TABLE `dialog_reports` DROP FOREIGN KEY `fk_dialog_reports_user_id`;
-- ALTER TABLE `dialog_uninterested` DROP FOREIGN KEY `fk_dialog_uninterested_user_id`;
-- ALTER TABLE `notifications` DROP FOREIGN KEY `fk_notifications_user_id`;
-- ALTER TABLE `para_cekme_talepleri` DROP FOREIGN KEY `fk_para_cekme_talepleri_user_id`;
-- ALTER TABLE `param_marketplace_alerts` DROP FOREIGN KEY `fk_param_marketplace_alerts_user_id`;
-- ALTER TABLE `param_marketplace_details` DROP FOREIGN KEY `fk_param_marketplace_details_chatbot_id`;
-- ALTER TABLE `param_marketplace_payments` DROP FOREIGN KEY `fk_param_marketplace_payments_user_id`;
-- ALTER TABLE `param_marketplace_sellers` DROP FOREIGN KEY `fk_param_marketplace_sellers_user_id`;
-- ALTER TABLE `password_resets` DROP FOREIGN KEY `fk_password_resets_user_id`;
-- ALTER TABLE `producer_plans` DROP FOREIGN KEY `fk_producer_plans_user_id`;
-- ALTER TABLE `producer_self_use_credits` DROP FOREIGN KEY `fk_producer_self_use_credits_chatbot_id`;
-- ALTER TABLE `producer_self_use_credits` DROP FOREIGN KEY `fk_producer_self_use_credits_user_id`;
-- ALTER TABLE `user_cart` DROP FOREIGN KEY `fk_user_cart_chatbot_id`;
-- ALTER TABLE `user_cart` DROP FOREIGN KEY `fk_user_cart_user_id`;
-- ALTER TABLE `user_coin_balance` DROP FOREIGN KEY `fk_user_coin_balance_user_id`;
-- ALTER TABLE `user_dialog_books` DROP FOREIGN KEY `fk_user_dialog_books_chatbot_id`;
-- ALTER TABLE `user_dialog_books` DROP FOREIGN KEY `fk_user_dialog_books_user_id`;
-- ALTER TABLE `user_emails` DROP FOREIGN KEY `fk_user_emails_user_id`;
-- ALTER TABLE `user_lists` DROP FOREIGN KEY `fk_user_lists_user_id`;
-- ALTER TABLE `user_phones` DROP FOREIGN KEY `fk_user_phones_user_id`;
-- ALTER TABLE `user_plan_selection` DROP FOREIGN KEY `fk_user_plan_selection_user_id`;
-- ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_chatbot_id`;
-- ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_user_id`;
-- ALTER TABLE `user_tokens` DROP FOREIGN KEY `fk_user_tokens_user_id`;
