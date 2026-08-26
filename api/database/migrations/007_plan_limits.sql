-- 007_plan_limits.sql   (BIZ-002 🟠 + UX-002 🟡 + BIZ-003 🟡)
--
-- Bu dosya VERİ EKLER (boş `plans` tablosuna dört satır). Hiçbir şey silmez,
-- hiçbir mevcut satırı değiştirmez.
--
-- ── Sorun ────────────────────────────────────────────────────────────────
-- `plans` tablosunda LİMİT SÜTUNU YOK. Şema yalnızca şunları tutabiliyor:
--     name_tr, name_en, monthly_price, yearly_price, currency, description_*
-- Özellikler `plan_icerikler.feature_tr` içinde SERBEST METİN — pazarlama
-- kopyası, makine tarafından okunabilir kota değil. Yani "Elmas = 10 bot,
-- 100 mesaj/gün" cümlesinin şemada saklanacağı bir yer hiç olmamış.
--
-- Sonuç olarak `chatbot_limits.php` "planı sorgula" yapamıyordu — sorgulayacak
-- bir şey yoktu. Stub herkese `AppConfig::FREE_*` (1 bağımsız / 2 herkese
-- açık) döndürüyor, `UserController` ise başlıkta `user_plan_selection.plan_name`
-- serbest metnini gösteriyordu. İki ayrı kaynak, aralarında hiçbir bağ yok:
-- dashboard "Elmas" derken bot ekranı 1/2 gösteriyordu (UX-002).
--
-- Katalog da kodda: `WalletController::getPricing()` dört planı
-- (Ücretsiz/Gümüş/Altın/Elmas) fiyatlarıyla birlikte PHP dizisi olarak
-- döndürüyor. `plans` tablosu 0 satır.
--
-- ── Bu migration ne yapıyor ──────────────────────────────────────────────
-- 1. `plans`'a makine tarafından okunabilir kota sütunları ekliyor.
-- 2. Dört planı `getPricing()`'deki değerlerle birebir aynı şekilde
--    tohumluyor (fiyatlar dahil) — böylece katalog tek yerden okunabilir.
-- 3. `plan_icerikler`'e mevcut pazarlama metinlerini taşıyor.
--
-- Limitler bugünkü davranışla uyumlu seçildi: Ücretsiz plan tam olarak
-- AppConfig'in bugün uyguladığı değerleri taşıyor (1 / 2 / 10), yani
-- migration hiçbir mevcut kullanıcının limitini değiştirmiyor.
--
-- Tekrar çalıştırılabilir: sütun kontrolleri koşullu, tohumlama
-- INSERT IGNORE (name_tr üzerinde UNIQUE ile).

-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 1 — Kota sütunları
-- ═══════════════════════════════════════════════════════════════════════

SET @c1 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plans'
              AND COLUMN_NAME = 'independent_bot_limit');
SET @s1 := IF(@c1 = 0,
    'ALTER TABLE `plans` ADD COLUMN `independent_bot_limit` INT NOT NULL DEFAULT 1, ADD COLUMN `public_bot_limit` INT NOT NULL DEFAULT 2, ADD COLUMN `daily_message_limit` INT NOT NULL DEFAULT 10, ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0, ADD COLUMN `is_default` TINYINT(1) NOT NULL DEFAULT 0',
    'DO 0');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- `user_plan_selection.plan_name` serbest metin; plana bağlanabilmesi için
-- isim benzersiz olmalı (aynı zamanda tohumlamayı idempotent yapıyor).
SET @c2 := (SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plans'
              AND INDEX_NAME = 'uq_plans_name_tr');
SET @s2 := IF(@c2 = 0,
    'ALTER TABLE `plans` ADD UNIQUE KEY `uq_plans_name_tr` (`name_tr`)',
    'DO 0');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;


-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 2 — Katalog tohumlaması
--
-- Değerler WalletController::getPricing()'deki dizinin birebir aynısı.
-- Ücretsiz planın limitleri AppConfig::FREE_INDEPENDENT_BOT_LIMIT (1),
-- FREE_PUBLIC_BOT_LIMIT (2) ve DAILY_FREE_MESSAGES (10) ile aynı —
-- yani mevcut davranış korunuyor.
-- ═══════════════════════════════════════════════════════════════════════

INSERT IGNORE INTO `plans`
    (`name_tr`, `name_en`, `monthly_price`, `yearly_price`, `currency`,
     `description_tr`,
     `independent_bot_limit`, `public_bot_limit`, `daily_message_limit`,
     `sort_order`, `is_default`)
VALUES
    ('Ücretsiz', 'Free',    0.00,   NULL, 1,
     'Lumanoris''i keşfetmeye başlamak için ücretsiz plan.',
     1,  2,  10, 0, 1),
    ('Gümüş',   'Silver',  149.00, NULL, 1,
     'Daha fazla mesaj hakkı ve gelişmiş özelliklerle bir üst seviyeye taşıyın.',
     3,  5,  50, 1, 0),
    ('Altın',   'Gold',    299.00, NULL, 1,
     'Yoğun kullanıcılar için genişletilmiş limitler ve öncelikli destek.',
     10, 15, 200, 2, 0),
    ('Elmas',   'Diamond', 599.00, NULL, 1,
     'Sınırsız imkanlar ve VIP destekle maksimum verim alın.',
     50, 50, 1000, 3, 0);


-- ═══════════════════════════════════════════════════════════════════════
-- BÖLÜM 3 — Plan özellikleri (pazarlama metni)
-- getPricing()'deki `features` dizilerinin karşılığı.
-- ═══════════════════════════════════════════════════════════════════════

INSERT IGNORE INTO `plan_icerikler` (`plan_id`, `feature_tr`, `feature_en`)
SELECT p.id, f.feature_tr, f.feature_en
FROM `plans` p
JOIN (
    SELECT 'Ücretsiz' AS plan, 'Günlük 10 ücretsiz mesaj'          AS feature_tr, '10 free messages per day'       AS feature_en
    UNION ALL SELECT 'Ücretsiz', '1 bağımsız + 2 herkese açık chatbot', '1 private + 2 public chatbots'
    UNION ALL SELECT 'Gümüş',   'Artırılmış günlük mesaj hakkı',       'Increased daily message allowance'
    UNION ALL SELECT 'Gümüş',   'Daha fazla chatbot oluşturma limiti',  'Higher chatbot creation limit'
    UNION ALL SELECT 'Gümüş',   'Öncelikli destek',                     'Priority support'
    UNION ALL SELECT 'Altın',   'Yüksek günlük mesaj hakkı',           'High daily message allowance'
    UNION ALL SELECT 'Altın',   'Genişletilmiş chatbot limiti',        'Extended chatbot limit'
    UNION ALL SELECT 'Altın',   'Öncelikli destek',                     'Priority support'
    UNION ALL SELECT 'Altın',   'Gelişmiş istatistikler',              'Advanced statistics'
    UNION ALL SELECT 'Elmas',   'Sınırsıza yakın mesaj hakkı',        'Near-unlimited message allowance'
    UNION ALL SELECT 'Elmas',   'Sınırsıza yakın chatbot oluşturma',   'Near-unlimited chatbot creation'
    UNION ALL SELECT 'Elmas',   '7/24 VIP destek',                      '24/7 VIP support'
    UNION ALL SELECT 'Elmas',   'Gelişmiş istatistikler',              'Advanced statistics'
) f ON f.plan = p.name_tr
WHERE NOT EXISTS (
    SELECT 1 FROM `plan_icerikler` pi
    WHERE pi.plan_id = p.id AND pi.feature_tr = f.feature_tr
);


-- ═══════════════════════════════════════════════════════════════════════
-- Doğrulama
-- ═══════════════════════════════════════════════════════════════════════
SELECT p.name_tr, p.monthly_price,
       p.independent_bot_limit, p.public_bot_limit, p.daily_message_limit,
       p.is_default, COUNT(pi.id) AS ozellik
FROM `plans` p
LEFT JOIN `plan_icerikler` pi ON pi.plan_id = p.id
GROUP BY p.id ORDER BY p.sort_order;
