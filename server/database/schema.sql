-- ==========================================================
-- TouchBizz Menu - Production MySQL Database Schema
-- Compatible with Hostinger MySQL 5.7+ / 8.0+ / MariaDB
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `touchbizz_menu` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `touchbizz_menu`;

-- Table 1: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'owner') NOT NULL DEFAULT 'owner',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: restaurants
CREATE TABLE IF NOT EXISTS `restaurants` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `address` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'MAD',
  `logo_url` TEXT NULL,
  `cover_url` TEXT NULL,
  `theme` ENUM('modern', 'luxury', 'moroccan', 'minimal') NOT NULL DEFAULT 'modern',
  `primary_color` VARCHAR(30) NOT NULL DEFAULT '#0f172a',
  `languages` JSON NOT NULL,
  `default_language` VARCHAR(5) NOT NULL DEFAULT 'fr',
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_restaurants_slug` (`slug`),
  KEY `idx_restaurants_user_id` (`user_id`),
  CONSTRAINT `fk_restaurants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL,
  `restaurant_id` VARCHAR(36) NOT NULL,
  `name_fr` VARCHAR(150) NOT NULL,
  `name_ar` VARCHAR(150) NULL,
  `name_en` VARCHAR(150) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_restaurant_order` (`restaurant_id`, `sort_order`),
  CONSTRAINT `fk_categories_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` VARCHAR(36) NOT NULL,
  `restaurant_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `name_fr` VARCHAR(150) NOT NULL,
  `name_ar` VARCHAR(150) NULL,
  `name_en` VARCHAR(150) NULL,
  `description_fr` TEXT NULL,
  `description_ar` TEXT NULL,
  `description_en` TEXT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `image_url` TEXT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `badge` VARCHAR(50) NULL,
  `ingredients` TEXT NULL,
  `allergens` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_items_restaurant_category` (`restaurant_id`, `category_id`, `sort_order`),
  KEY `idx_menu_items_available` (`is_available`),
  CONSTRAINT `fk_menu_items_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
