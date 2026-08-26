-- 006_fix_fk_delete_rules.sql   (DB-015 🟠 + DB-016 🟡)
--
-- Bu dosya VERİ SİLMEZ. Yalnızca kısıt kuralı değiştirir, kısıt ekler ve üç
-- sütunun tipini hizalar.
--
-- ── DB-015 ───────────────────────────────────────────────────────────────
-- 003 elli üç kısıtın elli ikisini CASCADE yaptı. Para/muhasebe tablolarında
-- bu yanlış: kullanıcı ya da bot silinince ödeme geçmişi, abonelikler ve
-- satın alınmış mesaj hakları zincirleme siliniyordu. 003'ün kendi yorumu
-- doğru sezgiyi yazmış ama uygulamamıştı:
--     "not silently erase the bots (and the subscriptions other people bought)"
-- Burada 11 kısıt doğru kurala çekiliyor (9 RESTRICT, 2 SET NULL).
--
-- Sınıf D (kişisel veri: banka_bilgileri, user_emails, user_phones,
-- password_resets, user_tokens, notifications) ve sınıf E (davranış verisi,
-- 32 kısıt) bilinçli olarak CASCADE kalıyor — hesap silinince gitmeleri
-- gerekiyor (KVKK md. 7) ve saklama yükümlülükleri yok.
--
-- ── DB-016 ───────────────────────────────────────────────────────────────
-- Ledger'ın kendi iç bağlarında FK yoktu: param_marketplace_details'in
-- payment_id ve seller_user_id sütunları korumasızken, en önemsiz bağı
-- (chatbot_id) hem FK'lı hem CASCADE'liydi. Burada 11 kısıt ekleniyor.
--
-- Uygulama ÖNCESİ ölçüm (2026-08-26, canlı): 11 adayın hepsinde 0 yetim.
-- Bu yüzden 002/002b gibi bir temizlik adımı yok.
--
-- ── Tip hizalaması ───────────────────────────────────────────────────────
-- 001 user_id ve chatbot_id'yi hizaladı ama category_id/kategori_id'ye hiç
-- dokunmadı. MySQL tipleri birebir eşleşmeyen FK'yı reddeder (errno 150),
-- bu yüzden üç sütun önce hizalanıyor. Daraltma ölçüldü:
--     chatbotlar.kategori_id            14 satır  MAX=32  (4 NULL)
--     chatbot_uninterested.category_id   0 satır
--     dialog_uninterested.category_id    0 satır
-- int sınırı 2.147.483.647 — taşma yok.
--
-- ── Çalıştırma notu ──────────────────────────────────────────────────────
-- DB-014'ün dersi: MySQL'de her DDL örtük COMMIT yapar, rollback YOKTUR.
-- Bu yüzden her blok information_schema kontrolüyle sarılı ve tekrar
-- çalıştırılabilir. Dosya ortasında durursa, tamamlanan bloklar kalıcı olur
-- ve dosyayı yeniden çalıştırmak kaldığı yerden devam eder.
--
-- Durumu görmek için (her satır beklenen kuralı göstermeli):
--     SELECT rc.TABLE_NAME, kcu.COLUMN_NAME, rc.DELETE_RULE
--     FROM information_schema.REFERENTIAL_CONSTRAINTS rc
--     JOIN information_schema.KEY_COLUMN_USAGE kcu
--       ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
--      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
--     WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
--     ORDER BY rc.TABLE_NAME, kcu.COLUMN_NAME;


-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 1 — Tip hizalaması (FK'ların ön koşulu)
-- ═══════════════════════════════════════════════════════════════════════

-- chatbotlar.kategori_id — int unsigned -> int (chatbot_kategoriler.id ile eşleşsin)
SET @t1 := (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND COLUMN_NAME = 'kategori_id');
SET @s1 := IF(@t1 <> 'int',
    'ALTER TABLE `chatbotlar` MODIFY COLUMN `kategori_id` INT NULL DEFAULT NULL',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- chatbot_uninterested.category_id — bigint unsigned -> int
SET @t2 := (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_uninterested' AND COLUMN_NAME = 'category_id');
SET @s2 := IF(@t2 <> 'int',
    'ALTER TABLE `chatbot_uninterested` MODIFY COLUMN `category_id` INT NOT NULL',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- dialog_uninterested.category_id — bigint unsigned -> int
SET @t3 := (SELECT COLUMN_TYPE FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_uninterested' AND COLUMN_NAME = 'category_id');
SET @s3 := IF(@t3 <> 'int',
    'ALTER TABLE `dialog_uninterested` MODIFY COLUMN `category_id` INT NOT NULL',
    'DO 0');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;


-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 2 — DB-015: mevcut kısıtların ON DELETE kuralı düzeltiliyor
--
-- Her blok: kısıt varsa DROP, sonra doğru kuralla ADD. DROP ile ADD arası
-- korumasız bir an yaratır ama tek bağlantıda saniyeler sürer; alternatifi
-- (ALTER ile kural değiştirmek) MySQL'de yok.
-- ═══════════════════════════════════════════════════════════════════════

-- fk_para_cekme_talepleri_user_id : A: para çıkışı kaydı; iban+miktar başka yerde yok
SET @d4 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'para_cekme_talepleri' AND CONSTRAINT_NAME = 'fk_para_cekme_talepleri_user_id');
SET @dr4 := IF(@d4 > 0, 'ALTER TABLE `para_cekme_talepleri` DROP FOREIGN KEY `fk_para_cekme_talepleri_user_id`', 'DO 0');
PREPARE dt4 FROM @dr4; EXECUTE dt4; DEALLOCATE PREPARE dt4;
SET @a4 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'para_cekme_talepleri' AND CONSTRAINT_NAME = 'fk_para_cekme_talepleri_user_id');
SET @ad4 := IF(@a4 = 0,
    'ALTER TABLE `para_cekme_talepleri` ADD CONSTRAINT `fk_para_cekme_talepleri_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at4 FROM @ad4; EXECUTE at4; DEALLOCATE PREPARE at4;

-- fk_param_marketplace_payments_user_id : A: tahsilat başlığı
SET @d5 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_payments' AND CONSTRAINT_NAME = 'fk_param_marketplace_payments_user_id');
SET @dr5 := IF(@d5 > 0, 'ALTER TABLE `param_marketplace_payments` DROP FOREIGN KEY `fk_param_marketplace_payments_user_id`', 'DO 0');
PREPARE dt5 FROM @dr5; EXECUTE dt5; DEALLOCATE PREPARE dt5;
SET @a5 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_payments' AND CONSTRAINT_NAME = 'fk_param_marketplace_payments_user_id');
SET @ad5 := IF(@a5 = 0,
    'ALTER TABLE `param_marketplace_payments` ADD CONSTRAINT `fk_param_marketplace_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at5 FROM @ad5; EXECUTE at5; DEALLOCATE PREPARE at5;

-- fk_user_subscriptions_user_id : A: ödenmiş erişim hakkı
SET @d6 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_user_id');
SET @dr6 := IF(@d6 > 0, 'ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_user_id`', 'DO 0');
PREPARE dt6 FROM @dr6; EXECUTE dt6; DEALLOCATE PREPARE dt6;
SET @a6 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_user_id');
SET @ad6 := IF(@a6 = 0,
    'ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at6 FROM @ad6; EXECUTE at6; DEALLOCATE PREPARE at6;

-- fk_user_subscriptions_chatbot_id : A: bot silinince BAŞKALARININ ödediği abonelik gidiyordu
SET @d7 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_chatbot_id');
SET @dr7 := IF(@d7 > 0, 'ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_chatbot_id`', 'DO 0');
PREPARE dt7 FROM @dr7; EXECUTE dt7; DEALLOCATE PREPARE dt7;
SET @a7 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'user_subscriptions' AND CONSTRAINT_NAME = 'fk_user_subscriptions_chatbot_id');
SET @ad7 := IF(@a7 = 0,
    'ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at7 FROM @ad7; EXECUTE at7; DEALLOCATE PREPARE at7;

-- fk_chatbot_purchase_credits_user_id : A: ödenmiş mesaj hakkı
SET @d8 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_user_id');
SET @dr8 := IF(@d8 > 0, 'ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_user_id`', 'DO 0');
PREPARE dt8 FROM @dr8; EXECUTE dt8; DEALLOCATE PREPARE dt8;
SET @a8 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_user_id');
SET @ad8 := IF(@a8 = 0,
    'ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at8 FROM @ad8; EXECUTE at8; DEALLOCATE PREPARE at8;

-- fk_chatbot_purchase_credits_chatbot_id : A: aynı
SET @d9 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_chatbot_id');
SET @dr9 := IF(@d9 > 0, 'ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_chatbot_id`', 'DO 0');
PREPARE dt9 FROM @dr9; EXECUTE dt9; DEALLOCATE PREPARE dt9;
SET @a9 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_purchase_credits' AND CONSTRAINT_NAME = 'fk_chatbot_purchase_credits_chatbot_id');
SET @ad9 := IF(@a9 = 0,
    'ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at9 FROM @ad9; EXECUTE at9; DEALLOCATE PREPARE at9;

-- fk_param_marketplace_sellers_user_id : A: KYC + ödeme yapılan sub-merchant
SET @d10 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_sellers' AND CONSTRAINT_NAME = 'fk_param_marketplace_sellers_user_id');
SET @dr10 := IF(@d10 > 0, 'ALTER TABLE `param_marketplace_sellers` DROP FOREIGN KEY `fk_param_marketplace_sellers_user_id`', 'DO 0');
PREPARE dt10 FROM @dr10; EXECUTE dt10; DEALLOCATE PREPARE dt10;
SET @a10 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_sellers' AND CONSTRAINT_NAME = 'fk_param_marketplace_sellers_user_id');
SET @ad10 := IF(@a10 = 0,
    'ALTER TABLE `param_marketplace_sellers` ADD CONSTRAINT `fk_param_marketplace_sellers_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at10 FROM @ad10; EXECUTE at10; DEALLOCATE PREPARE at10;

-- fk_param_marketplace_details_chatbot_id : A: sütun zaten nullable; gelir kaydı kalsın, bot bilgisi düşsün
SET @d11 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_details' AND CONSTRAINT_NAME = 'fk_param_marketplace_details_chatbot_id');
SET @dr11 := IF(@d11 > 0, 'ALTER TABLE `param_marketplace_details` DROP FOREIGN KEY `fk_param_marketplace_details_chatbot_id`', 'DO 0');
PREPARE dt11 FROM @dr11; EXECUTE dt11; DEALLOCATE PREPARE dt11;
SET @a11 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_details' AND CONSTRAINT_NAME = 'fk_param_marketplace_details_chatbot_id');
SET @ad11 := IF(@a11 = 0,
    'ALTER TABLE `param_marketplace_details` ADD CONSTRAINT `fk_param_marketplace_details_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE at11 FROM @ad11; EXECUTE at11; DEALLOCATE PREPARE at11;

-- fk_producer_plans_user_id : B: ücretli üretici planı
SET @d12 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'producer_plans' AND CONSTRAINT_NAME = 'fk_producer_plans_user_id');
SET @dr12 := IF(@d12 > 0, 'ALTER TABLE `producer_plans` DROP FOREIGN KEY `fk_producer_plans_user_id`', 'DO 0');
PREPARE dt12 FROM @dr12; EXECUTE dt12; DEALLOCATE PREPARE dt12;
SET @a12 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'producer_plans' AND CONSTRAINT_NAME = 'fk_producer_plans_user_id');
SET @ad12 := IF(@a12 = 0,
    'ALTER TABLE `producer_plans` ADD CONSTRAINT `fk_producer_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at12 FROM @ad12; EXECUTE at12; DEALLOCATE PREPARE at12;

-- fk_chatbotlar_owner_user_id : C: author RESTRICT iken owner CASCADE tutarsızdı
SET @d13 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND CONSTRAINT_NAME = 'fk_chatbotlar_owner_user_id');
SET @dr13 := IF(@d13 > 0, 'ALTER TABLE `chatbotlar` DROP FOREIGN KEY `fk_chatbotlar_owner_user_id`', 'DO 0');
PREPARE dt13 FROM @dr13; EXECUTE dt13; DEALLOCATE PREPARE dt13;
SET @a13 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND CONSTRAINT_NAME = 'fk_chatbotlar_owner_user_id');
SET @ad13 := IF(@a13 = 0,
    'ALTER TABLE `chatbotlar` ADD CONSTRAINT `fk_chatbotlar_owner_user_id` FOREIGN KEY (`owner_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE at13 FROM @ad13; EXECUTE at13; DEALLOCATE PREPARE at13;

-- fk_param_marketplace_alerts_user_id : F: nullable; operasyon kaydı kalmalı
SET @d14 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_alerts' AND CONSTRAINT_NAME = 'fk_param_marketplace_alerts_user_id');
SET @dr14 := IF(@d14 > 0, 'ALTER TABLE `param_marketplace_alerts` DROP FOREIGN KEY `fk_param_marketplace_alerts_user_id`', 'DO 0');
PREPARE dt14 FROM @dr14; EXECUTE dt14; DEALLOCATE PREPARE dt14;
SET @a14 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_alerts' AND CONSTRAINT_NAME = 'fk_param_marketplace_alerts_user_id');
SET @ad14 := IF(@a14 = 0,
    'ALTER TABLE `param_marketplace_alerts` ADD CONSTRAINT `fk_param_marketplace_alerts_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE at14 FROM @ad14; EXECUTE at14; DEALLOCATE PREPARE at14;


-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 3 — DB-016: hiç FK'sı olmayan sütunlara kısıt ekleniyor
-- Uygulama öncesi 11 adayın hepsinde yetim sayısı 0 ölçüldü.
-- ═══════════════════════════════════════════════════════════════════════

-- fk_param_marketplace_details_payment_id : ledger satırı başlığından koparılamaz
SET @n15 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_details' AND CONSTRAINT_NAME = 'fk_param_marketplace_details_payment_id');
SET @nd15 := IF(@n15 = 0,
    'ALTER TABLE `param_marketplace_details` ADD CONSTRAINT `fk_param_marketplace_details_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `param_marketplace_payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE nt15 FROM @nd15; EXECUTE nt15; DEALLOCATE PREPARE nt15;

-- fk_param_marketplace_details_seller_user_id : satıcının gelir kaydı
SET @n16 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_details' AND CONSTRAINT_NAME = 'fk_param_marketplace_details_seller_user_id');
SET @nd16 := IF(@n16 = 0,
    'ALTER TABLE `param_marketplace_details` ADD CONSTRAINT `fk_param_marketplace_details_seller_user_id` FOREIGN KEY (`seller_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE nt16 FROM @nd16; EXECUTE nt16; DEALLOCATE PREPARE nt16;

-- fk_param_marketplace_refunds_payment_id : iade kaydı
SET @n17 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_refunds' AND CONSTRAINT_NAME = 'fk_param_marketplace_refunds_payment_id');
SET @nd17 := IF(@n17 = 0,
    'ALTER TABLE `param_marketplace_refunds` ADD CONSTRAINT `fk_param_marketplace_refunds_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `param_marketplace_payments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE nt17 FROM @nd17; EXECUTE nt17; DEALLOCATE PREPARE nt17;

-- fk_param_marketplace_refunds_detail_id : iade kaydı
SET @n18 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_refunds' AND CONSTRAINT_NAME = 'fk_param_marketplace_refunds_detail_id');
SET @nd18 := IF(@n18 = 0,
    'ALTER TABLE `param_marketplace_refunds` ADD CONSTRAINT `fk_param_marketplace_refunds_detail_id` FOREIGN KEY (`detail_id`) REFERENCES `param_marketplace_details` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
    'DO 0');
PREPARE nt18 FROM @nd18; EXECUTE nt18; DEALLOCATE PREPARE nt18;

-- fk_param_marketplace_refunds_requested_by_user_id : nullable; iade kalsın, talep eden düşsün
SET @n19 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_refunds' AND CONSTRAINT_NAME = 'fk_param_marketplace_refunds_requested_by_user_id');
SET @nd19 := IF(@n19 = 0,
    'ALTER TABLE `param_marketplace_refunds` ADD CONSTRAINT `fk_param_marketplace_refunds_requested_by_user_id` FOREIGN KEY (`requested_by_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE nt19 FROM @nd19; EXECUTE nt19; DEALLOCATE PREPARE nt19;

-- fk_param_marketplace_alerts_seller_user_id : nullable; operasyon kaydı
SET @n20 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'param_marketplace_alerts' AND CONSTRAINT_NAME = 'fk_param_marketplace_alerts_seller_user_id');
SET @nd20 := IF(@n20 = 0,
    'ALTER TABLE `param_marketplace_alerts` ADD CONSTRAINT `fk_param_marketplace_alerts_seller_user_id` FOREIGN KEY (`seller_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE nt20 FROM @nd20; EXECUTE nt20; DEALLOCATE PREPARE nt20;

-- fk_chatbot_in_list_list_id : liste silinince içindekiler gider
SET @n21 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_in_list' AND CONSTRAINT_NAME = 'fk_chatbot_in_list_list_id');
SET @nd21 := IF(@n21 = 0,
    'ALTER TABLE `chatbot_in_list` ADD CONSTRAINT `fk_chatbot_in_list_list_id` FOREIGN KEY (`list_id`) REFERENCES `user_lists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE nt21 FROM @nd21; EXECUTE nt21; DEALLOCATE PREPARE nt21;

-- fk_plan_icerikler_plan_id : plan içeriği plandan türer
SET @n22 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'plan_icerikler' AND CONSTRAINT_NAME = 'fk_plan_icerikler_plan_id');
SET @nd22 := IF(@n22 = 0,
    'ALTER TABLE `plan_icerikler` ADD CONSTRAINT `fk_plan_icerikler_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE nt22 FROM @nd22; EXECUTE nt22; DEALLOCATE PREPARE nt22;

-- fk_chatbotlar_kategori_id : nullable; kategori silinince bot silinmemeli
SET @n23 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbotlar' AND CONSTRAINT_NAME = 'fk_chatbotlar_kategori_id');
SET @nd23 := IF(@n23 = 0,
    'ALTER TABLE `chatbotlar` ADD CONSTRAINT `fk_chatbotlar_kategori_id` FOREIGN KEY (`kategori_id`) REFERENCES `chatbot_kategoriler` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0');
PREPARE nt23 FROM @nd23; EXECUTE nt23; DEALLOCATE PREPARE nt23;

-- fk_chatbot_uninterested_category_id : tercih kaydı
SET @n24 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'chatbot_uninterested' AND CONSTRAINT_NAME = 'fk_chatbot_uninterested_category_id');
SET @nd24 := IF(@n24 = 0,
    'ALTER TABLE `chatbot_uninterested` ADD CONSTRAINT `fk_chatbot_uninterested_category_id` FOREIGN KEY (`category_id`) REFERENCES `chatbot_kategoriler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE nt24 FROM @nd24; EXECUTE nt24; DEALLOCATE PREPARE nt24;

-- fk_dialog_uninterested_category_id : tercih kaydı
SET @n25 := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND TABLE_NAME = 'dialog_uninterested' AND CONSTRAINT_NAME = 'fk_dialog_uninterested_category_id');
SET @nd25 := IF(@n25 = 0,
    'ALTER TABLE `dialog_uninterested` ADD CONSTRAINT `fk_dialog_uninterested_category_id` FOREIGN KEY (`category_id`) REFERENCES `chatbot_kategoriler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0');
PREPARE nt25 FROM @nd25; EXECUTE nt25; DEALLOCATE PREPARE nt25;


-- ═══════════════════════════════════════════════════════════════════════
-- GERİ ALMA (yorumlu) — 006'yı geri almak 003'ün kurallarına dönmek demek
-- ═══════════════════════════════════════════════════════════════════════
-- ALTER TABLE `para_cekme_talepleri` DROP FOREIGN KEY `fk_para_cekme_talepleri_user_id`;
-- ALTER TABLE `para_cekme_talepleri` ADD CONSTRAINT `fk_para_cekme_talepleri_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `param_marketplace_payments` DROP FOREIGN KEY `fk_param_marketplace_payments_user_id`;
-- ALTER TABLE `param_marketplace_payments` ADD CONSTRAINT `fk_param_marketplace_payments_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_user_id`;
-- ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `user_subscriptions` DROP FOREIGN KEY `fk_user_subscriptions_chatbot_id`;
-- ALTER TABLE `user_subscriptions` ADD CONSTRAINT `fk_user_subscriptions_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_user_id`;
-- ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `chatbot_purchase_credits` DROP FOREIGN KEY `fk_chatbot_purchase_credits_chatbot_id`;
-- ALTER TABLE `chatbot_purchase_credits` ADD CONSTRAINT `fk_chatbot_purchase_credits_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `param_marketplace_sellers` DROP FOREIGN KEY `fk_param_marketplace_sellers_user_id`;
-- ALTER TABLE `param_marketplace_sellers` ADD CONSTRAINT `fk_param_marketplace_sellers_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `param_marketplace_details` DROP FOREIGN KEY `fk_param_marketplace_details_chatbot_id`;
-- ALTER TABLE `param_marketplace_details` ADD CONSTRAINT `fk_param_marketplace_details_chatbot_id` FOREIGN KEY (`chatbot_id`) REFERENCES `chatbotlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `producer_plans` DROP FOREIGN KEY `fk_producer_plans_user_id`;
-- ALTER TABLE `producer_plans` ADD CONSTRAINT `fk_producer_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `chatbotlar` DROP FOREIGN KEY `fk_chatbotlar_owner_user_id`;
-- ALTER TABLE `chatbotlar` ADD CONSTRAINT `fk_chatbotlar_owner_user_id` FOREIGN KEY (`owner_user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `param_marketplace_alerts` DROP FOREIGN KEY `fk_param_marketplace_alerts_user_id`;
-- ALTER TABLE `param_marketplace_alerts` ADD CONSTRAINT `fk_param_marketplace_alerts_user_id` FOREIGN KEY (`user_id`) REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE `param_marketplace_details` DROP FOREIGN KEY `fk_param_marketplace_details_payment_id`;
-- ALTER TABLE `param_marketplace_details` DROP FOREIGN KEY `fk_param_marketplace_details_seller_user_id`;
-- ALTER TABLE `param_marketplace_refunds` DROP FOREIGN KEY `fk_param_marketplace_refunds_payment_id`;
-- ALTER TABLE `param_marketplace_refunds` DROP FOREIGN KEY `fk_param_marketplace_refunds_detail_id`;
-- ALTER TABLE `param_marketplace_refunds` DROP FOREIGN KEY `fk_param_marketplace_refunds_requested_by_user_id`;
-- ALTER TABLE `param_marketplace_alerts` DROP FOREIGN KEY `fk_param_marketplace_alerts_seller_user_id`;
-- ALTER TABLE `chatbot_in_list` DROP FOREIGN KEY `fk_chatbot_in_list_list_id`;
-- ALTER TABLE `plan_icerikler` DROP FOREIGN KEY `fk_plan_icerikler_plan_id`;
-- ALTER TABLE `chatbotlar` DROP FOREIGN KEY `fk_chatbotlar_kategori_id`;
-- ALTER TABLE `chatbot_uninterested` DROP FOREIGN KEY `fk_chatbot_uninterested_category_id`;
-- ALTER TABLE `dialog_uninterested` DROP FOREIGN KEY `fk_dialog_uninterested_category_id`;
