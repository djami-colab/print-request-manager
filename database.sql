-- Création de la base de données
CREATE DATABASE IF NOT EXISTS print_request_db;
USE print_request_db;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile ENUM('demandeur', 'operateur', 'admin') NOT NULL DEFAULT 'demandeur',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: projets (NEW)
CREATE TABLE IF NOT EXISTS projets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  intitule VARCHAR(255) NOT NULL,
  unite VARCHAR(255) NOT NULL,
  annee INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_projet (intitule, unite)
);

-- Table: requests
CREATE TABLE IF NOT EXISTS requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_number VARCHAR(50) NOT NULL UNIQUE,
  requester_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  project VARCHAR(255) NOT NULL,
  request_type VARCHAR(255) NOT NULL,
  reason TEXT,
  device_used VARCHAR(255),
  operator_name VARCHAR(255),
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_department (department),
  INDEX idx_created_at (created_at)
);

-- Table: request_items
CREATE TABLE IF NOT EXISTS request_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  format VARCHAR(10) NOT NULL,
  color_nb VARCHAR(50) NOT NULL,
  pages INT NOT NULL,
  copies INT NOT NULL,
  surface_m2 DECIMAL(10, 4) NOT NULL,
  total_pages INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  INDEX idx_request_id (request_id)
);

-- Insertion de quelques projets d'exemple
INSERT INTO projets (intitule, unite) VALUES
('Tour Signal', 'CIDI'),
('Pont de l\'Avenir', 'DEC'),
('Aménagement VRD', 'Coordination'),
('Nouveau Bâtiment CIDI', 'Architecture'),
('Construction Pont Oued Sebou', 'VRD')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
