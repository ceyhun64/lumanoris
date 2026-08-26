-- 002_clean_orphan_rows.sql  (prerequisite for RİSK-9)
--
-- READ THIS BEFORE RUNNING. Every statement here DELETES OR REWRITES DATA.
--
-- With no foreign keys ever enforced, rows survived the deletion of the user or
-- chatbot they belonged to. Those rows must go (or be repointed) before
-- 003_add_foreign_keys.sql can succeed — MySQL will refuse to create a
-- constraint that existing data already violates.
--
-- Counts measured against the live `lumanoris` database on the date this file
-- was generated. Re-measure before running anywhere else; the SELECTs that
-- produced them are included above each statement so you can.
--
-- Nothing here is guesswork about intent, but two of the five are judgement
-- calls and are marked as such. Review them, then run inside a transaction:
--     START TRANSACTION;  -- ... statements ...  -- check, then COMMIT or ROLLBACK

-- ----------------------------------------------------------------
-- 1. user_emails -> kullanicilar   (32 of 76 rows orphaned)
-- SELECT COUNT(*) FROM user_emails e
--   LEFT JOIN kullanicilar k ON e.user_id = k.id WHERE k.id IS NULL;
-- An e-mail history row for a user that no longer exists has no reader and no
-- meaning. Delete.
DELETE e FROM user_emails e
LEFT JOIN kullanicilar k ON e.user_id = k.id
WHERE k.id IS NULL;

-- ----------------------------------------------------------------
-- 2. chatbot_chats -> kullanicilar   (2 of 121 rows orphaned)
-- Chat transcript belonging to a deleted user. Delete.
DELETE c FROM chatbot_chats c
LEFT JOIN kullanicilar k ON c.user_id = k.id
WHERE k.id IS NULL;

-- ----------------------------------------------------------------
-- 3. chatbot_chats -> chatbotlar   (2 of 121 rows orphaned)
-- Chat transcript for a deleted bot. Delete.
DELETE c FROM chatbot_chats c
LEFT JOIN chatbotlar b ON c.chatbot_id = b.id
WHERE b.id IS NULL;

-- ----------------------------------------------------------------
-- 4. chatbotlar.owner_user_id -> kullanicilar   (1 of 14 rows orphaned)
-- JUDGEMENT CALL. The orphan is owner_user_id = 10, a user that no longer
-- exists, on chatbot #5 "LUMANORIS AI" — the default bot the product ships
-- with. Deleting the bot would remove a live product feature, so the owner is
-- repointed to the row's own author_user_id instead, which has zero orphans.
-- If you would rather the bot be ownerless, make the column nullable first
-- (ALTER TABLE chatbotlar MODIFY owner_user_id INT NULL) and set NULL here;
-- 003 already declares this constraint ON DELETE SET NULL for that case.
UPDATE chatbotlar c
JOIN kullanicilar a ON a.id = c.author_user_id
LEFT JOIN kullanicilar o ON o.id = c.owner_user_id
SET c.owner_user_id = c.author_user_id
WHERE o.id IS NULL;

-- ----------------------------------------------------------------
-- 5. user_dialog_books.chatbot_id -> chatbotlar   (1 of 4 rows orphaned)
-- JUDGEMENT CALL. The orphan value is literally 0 — not a deleted bot but the
-- "no bot selected" sentinel the chat page used to send (audit KOZMETİK-12,
-- fixed in web/src/app/dashboard/chat/page.jsx). The row records a dialogue
-- against a bot that never existed, so it cannot be repaired. Delete.
DELETE u FROM user_dialog_books u
LEFT JOIN chatbotlar c ON u.chatbot_id = c.id
WHERE c.id IS NULL;

-- ----------------------------------------------------------------
-- Verification: every count below must be 0 before running 003.
SELECT 'user_emails'            AS relation, COUNT(*) AS orphans FROM user_emails e       LEFT JOIN kullanicilar k ON e.user_id = k.id    WHERE k.id IS NULL
UNION ALL SELECT 'chatbot_chats.user_id',    COUNT(*) FROM chatbot_chats c                LEFT JOIN kullanicilar k ON c.user_id = k.id    WHERE k.id IS NULL
UNION ALL SELECT 'chatbot_chats.chatbot_id', COUNT(*) FROM chatbot_chats c                LEFT JOIN chatbotlar b   ON c.chatbot_id = b.id WHERE b.id IS NULL
UNION ALL SELECT 'chatbotlar.owner_user_id', COUNT(*) FROM chatbotlar c                   LEFT JOIN kullanicilar k ON c.owner_user_id = k.id WHERE k.id IS NULL
UNION ALL SELECT 'user_dialog_books',        COUNT(*) FROM user_dialog_books u            LEFT JOIN chatbotlar c   ON u.chatbot_id = c.id WHERE c.id IS NULL;
