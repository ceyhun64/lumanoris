-- 001_align_key_types.sql  (audit: RİSK-10)
--
-- One logical key, three storage types. chatbotlar.id is `int unsigned`
-- while chatbot_id is `int` in 9 tables and `bigint unsigned` in 7;
-- kullanicilar.id is `int` while user_id is `bigint unsigned` in 14.
-- MySQL refuses a foreign key whose column type does not match the
-- referenced one exactly, so RİSK-9 (no foreign keys anywhere) cannot be
-- fixed until this runs first.
--
-- Direction: children are converted to match their parent, not the other
-- way round — changing kullanicilar.id/chatbotlar.id would force every one
-- of these columns to change anyway, plus the primary keys.
--
-- Narrowing check (run against live data 2026-08-24): the largest value in
-- any of these 31 columns is 84, against an int limit of 2147483647.
-- No row can overflow. Re-verify before running on another database:
--     SELECT MAX(user_id), MAX(chatbot_id) FROM <table>;
--
-- Safe to re-run: converting a column to the type it already has is a no-op.


-- author_user_id
ALTER TABLE `chatbotlar` MODIFY COLUMN `author_user_id` INT NOT NULL;  -- was int unsigned

-- chatbot_id
ALTER TABLE `chatbot_chats` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `chatbot_comments` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_conversations` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `chatbot_dislikes` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_follows` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_hide` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_in_list` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `chatbot_likes` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_purchase_credits` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `chatbot_reports` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_visits` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was bigint unsigned
ALTER TABLE `param_marketplace_details` MODIFY COLUMN `chatbot_id` INT UNSIGNED NULL DEFAULT NULL;  -- was int
ALTER TABLE `producer_self_use_credits` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `user_cart` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `user_dialog_books` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int
ALTER TABLE `user_subscriptions` MODIFY COLUMN `chatbot_id` INT UNSIGNED NOT NULL;  -- was int

-- user_id
ALTER TABLE `chatbot_comments` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_dislikes` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_follows` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_hide` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_likes` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_reports` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_uninterested` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `chatbot_visits` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_comments` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_dislikes` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_hide` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_likes` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_reports` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
ALTER TABLE `dialog_uninterested` MODIFY COLUMN `user_id` INT NOT NULL;  -- was bigint unsigned
