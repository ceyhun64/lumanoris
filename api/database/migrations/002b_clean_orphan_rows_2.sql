-- 002b_clean_orphan_rows_2.sql   (DB-013 — 002'nin kapsamadığı yetimler)
--
-- READ THIS BEFORE RUNNING. Every statement here DELETES DATA.
--
-- 002_clean_orphan_rows.sql beş ilişkiyi temizliyor ("38 orphaned rows across
-- 5 relationships when measured"), ama 003_add_foreign_keys.sql **53** kısıt
-- tanımlıyor. Aradaki fark ölçülmemişti: 002 çalıştıktan sonra bile 3 ilişkide
-- 27 yetim satır kaldı ve 003 ilkinde durdu:
--
--     SQLSTATE[23000]: 1452 Cannot add or update a child row:
--     a foreign key constraint fails (`fk_chatbot_follows_user_id`)
--
-- Ölçüm: 2026-08-26, 001 ve 002 uygulandıktan SONRA, canlı `lumanoris`.
-- Üçü de aynı sınıf: sahibi silinmiş kullanıcıya ait satırlar — 002'nin
-- user_emails ve chatbot_chats için zaten sildiği şeyin aynısı.
--
-- Tekrar ölçmek için (003'ten önce hepsi 0 olmalı) dosyanın sonundaki
-- doğrulama sorgusunu çalıştırın.

-- ----------------------------------------------------------------
-- 1. chatbot_follows -> kullanicilar   (25 of 86 rows orphaned)
-- SELECT COUNT(*) FROM chatbot_follows x
--   LEFT JOIN kullanicilar k ON x.user_id = k.id WHERE k.id IS NULL;
-- Silinmiş kullanıcıların takip kayıtları: user_id = 8, 9, 12..20, 23..29,
-- 32..38 (her biri 1 satır). Bir takip, takip edeni olmadan anlamsız — aynı
-- gerekçeyle 002 user_emails'i siliyor. Delete.
DELETE x FROM chatbot_follows x
LEFT JOIN kullanicilar k ON x.user_id = k.id
WHERE k.id IS NULL;

-- ----------------------------------------------------------------
-- 2. chatbot_purchase_credits -> kullanicilar   (1 of 1 rows orphaned)
-- JUDGEMENT CALL — bu satır ÖDENMİŞ bir mesaj hakkını temsil ediyor:
--     id=4  user_id=31  chatbot_id=5  credits_remaining=150/150
--     expires_at=2026-08-18 14:56:11
-- Silmeden önce üç şey doğrulandı:
--   (a) user_id=31 `kullanicilar`da YOK — hesap silinmiş.
--   (b) expires_at bugünden (2026-08-26) ÖNCE — hak zaten süresi dolmuş,
--       yani hesap geri gelse bile kullanılamaz.
--   (c) 002 zaten aynı kullanıcının (31) sohbet kayıtlarını sildi.
-- Yani geri kazanılabilir bir değer yok. Delete.
--
-- Eğer bu satırı bir muhasebe kaydı olarak SAKLAMAK isterseniz: bu ifadeyi
-- atlayın ve `fk_chatbot_purchase_credits_user_id` kısıtını 003'ten çıkarın.
-- İkisini birden yapamazsınız — MySQL ihlal eden veriyle kısıt oluşturmaz.
DELETE x FROM chatbot_purchase_credits x
LEFT JOIN kullanicilar k ON x.user_id = k.id
WHERE k.id IS NULL;

-- ----------------------------------------------------------------
-- 3. user_plan_selection -> kullanicilar   (1 of 1 rows orphaned)
-- user_id=10, plan_name='Gold', selected_at=2026-07-04.
-- user_id=10, 002'nin bot #5'in owner'ını düzelttiği silinmiş kullanıcı.
-- Bu satırı yazan `upgradePlan` hiçbir zaman ödeme almıyordu (BIZ-001 🔴,
-- düzeltme turu 1'de fail-closed yapıldı), yani karşılığında bir tahsilat da
-- yok. Silinmiş bir kullanıcının karşılıksız plan seçimi. Delete.
DELETE x FROM user_plan_selection x
LEFT JOIN kullanicilar k ON x.user_id = k.id
WHERE k.id IS NULL;

-- ----------------------------------------------------------------
-- Verification: 003'ü çalıştırmadan önce her sayı 0 olmalı.
SELECT 'chatbot_follows.user_id'           AS relation, COUNT(*) AS orphans
  FROM chatbot_follows x           LEFT JOIN kullanicilar k ON x.user_id = k.id WHERE k.id IS NULL
UNION ALL SELECT 'chatbot_purchase_credits.user_id', COUNT(*)
  FROM chatbot_purchase_credits x  LEFT JOIN kullanicilar k ON x.user_id = k.id WHERE k.id IS NULL
UNION ALL SELECT 'user_plan_selection.user_id',      COUNT(*)
  FROM user_plan_selection x       LEFT JOIN kullanicilar k ON x.user_id = k.id WHERE k.id IS NULL;
