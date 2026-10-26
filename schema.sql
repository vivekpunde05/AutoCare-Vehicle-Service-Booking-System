CREATE DATABASE IF NOT EXISTS vehicle_service_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vehicle_service_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  make VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  registration_number VARCHAR(20) NOT NULL UNIQUE,
  vehicle_type ENUM('Car','Bike','Scooter','Other') DEFAULT 'Car',
  year SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mechanics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  specialization VARCHAR(120),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  service_id INT NOT NULL,
  mechanic_id INT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status ENUM('Pending','Confirmed','In Progress','Completed','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  notes VARCHAR(1000),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status ENUM('Unpaid','Paid','Refunded') NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT fk_booking_mechanic FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
  INDEX idx_booking_schedule (booking_date, booking_time),
  INDEX idx_booking_user (user_id)
);

INSERT INTO services (name, description, price, duration_minutes) VALUES
('General Service', 'Routine inspection, oil and fluid checks, and basic maintenance.', 1499.00, 120),
('Oil Change', 'Engine oil replacement and basic engine check.', 799.00, 45),
('Brake Inspection', 'Brake pads, brake fluid and braking system inspection.', 599.00, 45),
('Full Vehicle Inspection', 'Comprehensive inspection of major vehicle systems.', 999.00, 90),
('Bike Service', 'Basic two-wheeler maintenance and safety inspection.', 699.00, 60)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO mechanics (name, phone, specialization) VALUES
('Amit Sharma', '9000000001', 'Engine and general service'),
('Priya Patil', '9000000002', 'Two-wheeler specialist'),
('Rahul Deshmukh', '9000000003', 'Brakes and inspection');

-- Default Administrator Account (email: admin@autocare.com, password: admin123)
INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Administrator', 'admin@autocare.com', '$2a$10$UoWb0QvVjFwA7q3cE3Lq8evZ392b4y2hD2eYc5O4w7CjRj3B3o.yK', '9999999999', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

