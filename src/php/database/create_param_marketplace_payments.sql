-- =====================================================================
-- Param Pazaryeri ödeme tabloları (kanonik şema)
-- =====================================================================
-- Bu dosya checkout_payments.php > ensureParamMarketplaceTables() tarafından
-- her istekte exec edilir. Idempotent: CREATE TABLE IF NOT EXISTS.
--
-- ÖNEMLI: param_transaction_id (SanalPOS Islem_ID) ve param_receipt_id
-- (Dekont_ID) Param tarafından ~10 haneli sayı döner (örn 2826291165).
-- Signed INT max = 2147483647 → TAŞAR. Bu yüzden VARCHAR(32) kullanılır
-- (kod zaten string olarak işliyor, üzerinde aritmetik yok).
--
-- Mevcut tablolarda bu kolonlar INT ise: en alttaki ALTER bloğunu çalıştır.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) param_marketplace_payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_payments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(32) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending'
     COMMENT 'pending, payment_started, paid, failed, hash_failed, refunded, partial_refund',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `product_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `service_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `param_transaction_id` VARCHAR(32) NULL COMMENT 'SanalPOS Islem_ID (büyük sayı, INT taşar)',
  `param_receipt_id` VARCHAR(32) NULL COMMENT 'TURKPOS Dekont_ID',
  `param_net_amount` DECIMAL(10,2) NULL,
  `redirect_url` VARCHAR(512) NULL,
  `items_json` LONGTEXT NULL,
  `seller_splits_json` LONGTEXT NULL,
  `param_response_json` LONGTEXT NULL,
  `callback_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2) param_marketplace_details (alt üye sipariş detayları)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_details` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `payment_id` INT(11) NOT NULL,
  `seller_user_id` INT(11) NOT NULL,
  `guid_altuyeisyeri` VARCHAR(64) NOT NULL DEFAULT '',
  `gross_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payable_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `pysiparis_guid` VARCHAR(64) NULL COMMENT 'Param PYSiparis_GUID',
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending_approval'
     COMMENT 'pending_approval, approved, cancelled, cancel_failed, refunded',
  `param_response_json` LONGTEXT NULL,
  `refunded_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_pysiparis_guid` (`pysiparis_guid`),
  KEY `idx_seller_user_id` (`seller_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3) param_marketplace_alerts (manuel müdahale uyarıları)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_alerts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `alert_type` VARCHAR(64) NOT NULL,
  `severity` VARCHAR(16) NOT NULL DEFAULT 'warning' COMMENT 'warning, critical',
  `order_id` VARCHAR(32) NULL,
  `user_id` INT(11) NULL,
  `seller_user_id` INT(11) NULL,
  `message` TEXT NULL,
  `context_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alert_type` (`alert_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4) param_marketplace_soap_log (SOAP istek/yanıt denetim kaydı)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_soap_log` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(32) NULL,
  `method` VARCHAR(64) NULL,
  `wsdl` VARCHAR(255) NULL,
  `request_xml` LONGTEXT NULL,
  `response_xml` LONGTEXT NULL,
  `result_code` VARCHAR(8) NULL,
  `result_message` VARCHAR(255) NULL,
  `duration_ms` INT(11) NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_method` (`method`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5) param_marketplace_refunds (iptal/iade kayıtları)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `param_marketplace_refunds` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `payment_id` INT(11) NOT NULL,
  `detail_id` INT(11) NOT NULL,
  `pysiparis_guid` VARCHAR(64) NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `reason` TEXT NULL,
  `requested_by_user_id` INT(11) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'completed, failed',
  `param_response_json` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_detail_id` (`detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
