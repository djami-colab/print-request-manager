-- Creation de la base de donnees
CREATE DATABASE IF NOT EXISTS `print_request_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `print_request_db`;

-- Table des demandes d'impression (Bons)
CREATE TABLE IF NOT EXISTS `requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_number` VARCHAR(50) NOT NULL UNIQUE,
  `requester_name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `project` VARCHAR(100) NOT NULL,
  `request_type` VARCHAR(255) NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `device_used` VARCHAR(100) DEFAULT NULL,
  `operator_name` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_department` (`department`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des documents a imprimer par bon
CREATE TABLE IF NOT EXISTS `request_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `format` VARCHAR(10) NOT NULL,
  `color_nb` VARCHAR(20) NOT NULL,
  `pages` INT NOT NULL DEFAULT 1,
  `copies` INT NOT NULL DEFAULT 1,
  `surface_m2` DOUBLE NOT NULL,
  `total_pages` INT NOT NULL,
  FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  INDEX `idx_request_id` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
