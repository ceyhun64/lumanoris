-- =====================================================================
-- Lumanoris - tam şema (idempotent: CREATE TABLE IF NOT EXISTS)
-- =====================================================================
-- Kaynaklar:
--   1) src/php/admin/db_backup/backup-2026-02-23-13-56-14.sql
--      (gerçek prod/dev mysqldump yedeği - 28 tablo, DDL aynen alındı)
--   2) Bu yedekten SONRA eklenen özellikler (user_cart, abonelik,
--      Param Pazaryeri ödeme/satıcı tabloları, bildirimler, planlar)
--      src/php/api/*.php ve src/php/functions/*.php kod taramasından
--      çıkarıldı - hiçbir dump'ta yoklardı.
--
-- Not: kullanicilar tablosunda backup'ta NOT NULL olan ama
-- login-google.php / register.php akışlarında her zaman doldurulmayan
-- kolonlar (google_id, kullanici_adi, telefon, sifre, avatar) burada
-- NULL'a izin verecek şekilde gevşetildi; aksi halde strict SQL mode
-- açık bir MySQL'de Google ile kayıt/giriş SQL hatasıyla patlar.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1) Backup'tan aynen alınan tablolar
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `adminler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kullanici_adi` varchar(20) NOT NULL,
  `sifre` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `kullanicilar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ad_soyad` varchar(30) DEFAULT NULL,
  `kullanici_adi` varchar(30) DEFAULT NULL,
  `google_id` varchar(64) DEFAULT NULL,
  `eposta` varchar(50) NOT NULL,
  `telefon` varchar(15) DEFAULT NULL,
  `dogum_tarihi` date DEFAULT NULL,
  `sifre` varchar(255) DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  `dil` enum('Türkçe','İngilizce') NOT NULL DEFAULT 'Türkçe',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kullanici_adi` (`kullanici_adi`),
  UNIQUE KEY `eposta` (`eposta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_phones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `phone` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_kategoriler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kategori_adi_tr` varchar(100) NOT NULL,
  `kategori_adi_en` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbotlar` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author_user_id` int(10) unsigned NOT NULL,
  `owner_user_id` int(11) NOT NULL,
  `isim` varchar(255) NOT NULL,
  `aciklama` text DEFAULT NULL,
  `kapak_fotografi` mediumtext DEFAULT NULL,
  `profil_fotografi` mediumtext DEFAULT NULL,
  `kategori_id` int(10) unsigned DEFAULT NULL,
  `style_prompt` varchar(5000) DEFAULT NULL,
  `sohbet_basi_mesaj` text DEFAULT NULL,
  `ucret_haftalik` decimal(10,2) DEFAULT NULL,
  `ucret_aylik` decimal(10,2) DEFAULT NULL,
  `training_prompt` longtext DEFAULT NULL,
  `yayimlanma_tarih` datetime DEFAULT current_timestamp(),
  `edit_tarih` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `author_user_id` (`author_user_id`),
  KEY `owner_user_id` (`owner_user_id`),
  KEY `kategori_id` (`kategori_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chatbot_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `sent_by` text NOT NULL,
  `message` text NOT NULL,
  `sent_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chatbot_id` int(11) NOT NULL,
  `conversation_name` varchar(50) NOT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_message_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_comments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `comment` varchar(1000) NOT NULL,
  `commented_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `chatbot_id` (`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_likes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `liked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_dislikes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `disliked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_follows` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `followed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_hide` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `hidden_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_uninterested` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `uninterested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `reported_for` varchar(255) NOT NULL,
  `report_detail` varchar(1000) DEFAULT NULL,
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_visits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `chatbot_id` bigint(20) unsigned NOT NULL,
  `visit_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chatbot_in_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chatbot_id` int(11) NOT NULL,
  `list_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `list_id` (`list_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_dialog_books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chatbot_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `input_message` text NOT NULL,
  `output_message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_likes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `dialog_id` bigint(20) unsigned NOT NULL,
  `liked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`dialog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_dislikes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `dialog_id` bigint(20) unsigned NOT NULL,
  `disliked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`dialog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_comments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `dialog_id` bigint(20) unsigned NOT NULL,
  `comment` varchar(1000) NOT NULL,
  `commented_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_hide` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `dialog_id` bigint(20) unsigned NOT NULL,
  `hidden_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_uninterested` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `uninterested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dialog_reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `dialog_id` bigint(20) unsigned NOT NULL,
  `reported_for` varchar(255) NOT NULL,
  `report_detail` varchar(1000) DEFAULT NULL,
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `global_vars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `var_key` varchar(191) NOT NULL,
  `var_value` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `var_key` (`var_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `constant_translations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tr` text NOT NULL,
  `en` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `themes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theme_name` varchar(10) NOT NULL,
  `main_color` varchar(20) NOT NULL,
  `sub_color` varchar(20) NOT NULL,
  `hover_color` varchar(20) NOT NULL,
  `active_color` varchar(20) NOT NULL,
  `text_color` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `page_hits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_url` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `referer` text DEFAULT NULL,
  `click_target` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 2) Backup'tan SONRA eklenen tablolar (koddan çıkarıldı)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_cart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chatbot_id` int(11) NOT NULL,
  `order_weeks` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_chatbot` (`user_id`,`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chatbot_id` int(11) NOT NULL,
  `duration_weeks` int(11) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `chatbot_id` (`chatbot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `selector` varchar(32) NOT NULL,
  `hashed_validator` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expiry` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `selector` (`selector`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(64) NOT NULL,
  `title_tr` text NOT NULL,
  `title_en` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `para_cekme_talepleri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `iban` varchar(34) NOT NULL,
  `miktar` decimal(10,2) NOT NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'beklemede',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_tr` varchar(100) NOT NULL,
  `name_en` varchar(100) DEFAULT NULL,
  `monthly_price` decimal(10,2) DEFAULT NULL,
  `yearly_price` decimal(10,2) DEFAULT NULL,
  `currency` tinyint(4) NOT NULL DEFAULT 1,
  `description_tr` text DEFAULT NULL,
  `description_en` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `plan_icerikler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` int(11) NOT NULL,
  `feature_tr` varchar(255) NOT NULL,
  `feature_en` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `banka_bilgileri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `account_type` varchar(32) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `authorized_first_name` varchar(100) DEFAULT NULL,
  `authorized_last_name` varchar(100) DEFAULT NULL,
  `company_title` varchar(255) DEFAULT NULL,
  `tax_number` varchar(20) DEFAULT NULL,
  `tax_office` varchar(100) DEFAULT NULL,
  `id_number` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `iban` varchar(34) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `il` varchar(100) DEFAULT NULL,
  `ilce` varchar(100) DEFAULT NULL,
  `il_kod` int(11) DEFAULT NULL COMMENT 'Param IL kodu',
  `ilce_kod` int(11) DEFAULT NULL COMMENT 'Param ILCE kodu',
  `mahalle` varchar(150) DEFAULT NULL,
  `cadde` varchar(150) DEFAULT NULL,
  `sokak` varchar(150) DEFAULT NULL,
  `bina_no` varchar(20) DEFAULT NULL,
  `kapi_no` varchar(20) DEFAULT NULL,
  `posta_kodu` varchar(10) DEFAULT NULL,
  `kisi_dogum_tarihi` varchar(10) DEFAULT NULL COMMENT 'dd.MM.yyyy (Param)',
  `yetkili_kisi_dogum_tarihi` varchar(10) DEFAULT NULL COMMENT 'dd.MM.yyyy (Param)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `param_marketplace_sellers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `guid_altuyeisyeri` varchar(64) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('not_started','pending','active','rejected','suspended') NOT NULL DEFAULT 'not_started',
  `tip` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1=Bireysel, 2=Sahis, 3=Kurumsal',
  `last_error` text DEFAULT NULL,
  `last_attempt_at` timestamp NULL DEFAULT NULL,
  `param_payload_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 3) Referans veri (kişisel veri içermeyen sabit liste)
-- ---------------------------------------------------------------------

INSERT INTO `chatbot_kategoriler` (`id`, `kategori_adi_tr`, `kategori_adi_en`) VALUES
(21,'Yaratıcı Yazarlık','Creative Writing'),
(22,'Kurumsal','Commercial'),
(23,'Eğitim','Education'),
(24,'Çeviri','Translation'),
(25,'Planlar','Planning'),
(26,'Uygulamalar','Applications'),
(27,'Yaratıcı Fikirler','Creative Ideas'),
(28,'Programlama','Programming'),
(29,'Hobiler','Hobbies'),
(30,'Oyunlar','Games'),
(31,'Bilim&Araştırma','Science&Researching'),
(32,'Profesyonel','Professional'),
(33,'Karakter','Characters'),
(34,'Filmler','Films'),
(35,'Diğer','Other')
ON DUPLICATE KEY UPDATE kategori_adi_tr = VALUES(kategori_adi_tr);
