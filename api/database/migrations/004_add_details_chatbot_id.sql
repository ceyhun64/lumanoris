-- PAY-004 🟠 — bu ALTER TABLE, createSubscription()'ın ödeme transaction'ının
-- İÇİNDE çalışıyordu. MySQL'de DDL örtük COMMIT tetikler: ALTER'a ulaşan ilk
-- checkout, o ana kadar yazılmış abonelik/kredi/sepet satırlarını kalıcı hâle
-- getiriyor ve transaction'ı bitiriyordu. Sonrasındaki bir hata artık geri
-- alınamıyordu — "hepsi ya da hiçbiri" garantisi ilk çalıştırmada kayboluyordu.
--
-- Sütun buraya, migration'a taşındı. Uygulama kodu artık şemayı değiştirmiyor;
-- yalnızca sütunun var olup olmadığına bakıp ona göre yazıyor.
--
-- Idempotent: MySQL 8 `ADD COLUMN IF NOT EXISTS` kabul etmediği için
-- information_schema üzerinden koşullu çalıştırılıyor.

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = 'param_marketplace_details'
      AND column_name  = 'chatbot_id'
);

SET @ddl := IF(
    @col_exists = 0,
    'ALTER TABLE param_marketplace_details ADD COLUMN chatbot_id INT NULL AFTER seller_user_id',
    'SELECT "004: chatbot_id zaten var, atlandı" AS note'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- getMyPayments ve satıcı raporları bu sütunla filtreliyor.
SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name   = 'param_marketplace_details'
      AND index_name   = 'idx_details_chatbot'
);

SET @idx := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_details_chatbot ON param_marketplace_details (chatbot_id)',
    'SELECT "004: idx_details_chatbot zaten var, atlandı" AS note'
);

PREPARE stmt2 FROM @idx;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
