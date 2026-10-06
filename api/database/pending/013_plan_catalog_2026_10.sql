-- 013 — Paket kataloğu: müşteri paket tablosu (AUDIT.md, Faz 3)
--
-- DURUM: ONAY BEKLİYOR. Mevcut veriyi GÜNCELLEYEN ve SİLEN migration
-- (CLAUDE.md: veri düzeltme migration'ı yerelde de onay ister). Onaya kadar
-- `api/database/pending/` altında.
--
-- 012'ye BAĞIMLI (privacy_right_limit kolonu ve NULL = sınırsız).
-- `plan_icerikler` satırlarını sildiği için migrate.php bunu yıkıcı sayar:
-- `--apply --allow-destructive` gerekir — Claude bu bayrağı çalıştıramaz,
-- uygulamayı kullanıcı yapar.
--
-- Alternatif: fiyat/coin/limit değerleri ve özellik metinleri admin
-- panelinden (Abonelik sayfası) de girilebilir; yalnızca "sınırsız" (NULL)
-- ve yayından kaldırma hakkı 012'yi gerektirir.
--
-- ── Değişen değerler (007 seed'ine göre) ────────────────────────────────
--   Altın : coin 200 → 100, bağımsız 10 → 5, herkese açık 15 → 10
--   Elmas : 599 → 849 ₺, coin 1000 → 200, bağımsız/herkese açık 50 → sınırsız
--   Hak   : Ücretsiz 1, Gümüş 3, Altın 5, Elmas 20 (toplam — GK-17)
--   Ücretsiz ve Gümüş fiyat/coin/bot limitleri değişmiyor.
--
-- Plan kimlikleri kurulumdan kuruluma değiştiği için eşleşme `name_tr`
-- üzerinden (007 UNIQUE koydu).
--
-- ── Geri alma notu ───────────────────────────────────────────────────────
-- Önceki değerler 007_plan_limits.sql'de. Geri almak: aynı UPDATE'leri 007
-- değerleriyle çalıştırmak + 007'nin BÖLÜM 3'ündeki özellik satırlarını
-- yeniden eklemek (bu dosya o satırları siliyor).

UPDATE `plans` SET `monthly_price` = 0.00,   `daily_message_limit` = 10,
       `independent_bot_limit` = 1,    `public_bot_limit` = 2,    `privacy_right_limit` = 1
 WHERE `name_tr` = 'Ücretsiz';

UPDATE `plans` SET `monthly_price` = 149.00, `daily_message_limit` = 50,
       `independent_bot_limit` = 3,    `public_bot_limit` = 5,    `privacy_right_limit` = 3
 WHERE `name_tr` = 'Gümüş';

UPDATE `plans` SET `monthly_price` = 299.00, `daily_message_limit` = 100,
       `independent_bot_limit` = 5,    `public_bot_limit` = 10,   `privacy_right_limit` = 5
 WHERE `name_tr` = 'Altın';

UPDATE `plans` SET `monthly_price` = 849.00, `daily_message_limit` = 200,
       `independent_bot_limit` = NULL, `public_bot_limit` = NULL, `privacy_right_limit` = 20
 WHERE `name_tr` = 'Elmas';

-- Özellik metinleri: paket tablosuyla birebir. Kota satırları sayılardan,
-- "Yalnızca metin" sütunu müşteri metninden. Eski pazarlama metinleri
-- ("Sınırsıza yakın mesaj hakkı" vb.) tabloyla çeliştiği için siliniyor.
DELETE pi FROM `plan_icerikler` pi
  JOIN `plans` p ON p.id = pi.plan_id
 WHERE p.name_tr IN ('Ücretsiz', 'Gümüş', 'Altın', 'Elmas');

INSERT INTO `plan_icerikler` (`plan_id`, `feature_tr`, `feature_en`)
SELECT p.id, f.feature_tr, f.feature_en
FROM `plans` p
JOIN (
              SELECT 1 AS sira, 'Ücretsiz' AS plan, 'Günlük 10 Luma Coin' AS feature_tr, '10 Luma Coins per day' AS feature_en
    UNION ALL SELECT 2, 'Ücretsiz', '1 bağımsız chatbot',                        '1 private chatbot'
    UNION ALL SELECT 3, 'Ücretsiz', '2 herkese açık chatbot',                    '2 public chatbots'
    UNION ALL SELECT 4, 'Ücretsiz', '1 yayından kaldırma (özel yapma) hakkı',    '1 unpublish (make private) right'

    UNION ALL SELECT 1, 'Gümüş',    'Günlük 50 Luma Coin',                       '50 Luma Coins per day'
    UNION ALL SELECT 2, 'Gümüş',    '3 bağımsız chatbot',                        '3 private chatbots'
    UNION ALL SELECT 3, 'Gümüş',    '5 herkese açık chatbot',                    '5 public chatbots'
    UNION ALL SELECT 4, 'Gümüş',    '3 yayından kaldırma (özel yapma) hakkı',    '3 unpublish (make private) rights'
    UNION ALL SELECT 5, 'Gümüş',    'Diğer tüm özelliklerde sınırsız deneyim',   'Unlimited experience in all other features'

    UNION ALL SELECT 1, 'Altın',    'Günlük 100 Luma Coin',                      '100 Luma Coins per day'
    UNION ALL SELECT 2, 'Altın',    '5 bağımsız chatbot',                        '5 private chatbots'
    UNION ALL SELECT 3, 'Altın',    '10 herkese açık chatbot',                   '10 public chatbots'
    UNION ALL SELECT 4, 'Altın',    '5 yayından kaldırma (özel yapma) hakkı',    '5 unpublish (make private) rights'
    UNION ALL SELECT 5, 'Altın',    'Öncelikli destek',                          'Priority support'
    UNION ALL SELECT 6, 'Altın',    'Tüm Lumanoris deneyimlerine erişim',        'Access to all Lumanoris experiences'

    UNION ALL SELECT 1, 'Elmas',    'Günlük 200 Luma Coin',                      '200 Luma Coins per day'
    UNION ALL SELECT 2, 'Elmas',    'Sınırsız bağımsız chatbot',                 'Unlimited private chatbots'
    UNION ALL SELECT 3, 'Elmas',    'Sınırsız herkese açık chatbot',             'Unlimited public chatbots'
    UNION ALL SELECT 4, 'Elmas',    '20 yayından kaldırma (özel yapma) hakkı',   '20 unpublish (make private) rights'
    UNION ALL SELECT 5, 'Elmas',    '7/24 VIP destek',                           '24/7 VIP support'
    UNION ALL SELECT 6, 'Elmas',    'Yeni özelliklere erken erişim',             'Early access to new features'
) f ON f.plan = p.name_tr
ORDER BY p.sort_order, f.sira;

-- Doğrulama
SELECT p.name_tr, p.monthly_price, p.daily_message_limit,
       p.independent_bot_limit, p.public_bot_limit, p.privacy_right_limit,
       COUNT(pi.id) AS ozellik
FROM `plans` p
LEFT JOIN `plan_icerikler` pi ON pi.plan_id = p.id
GROUP BY p.id ORDER BY p.sort_order;
