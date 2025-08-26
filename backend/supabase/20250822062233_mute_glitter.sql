-- GebeyaNet Database Schema
-- Ethiopian Retail Inventory Platform

-- Create database
CREATE DATABASE IF NOT EXISTS gebeyanet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gebeyanet_db;

-- Users table (Shop owners)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    business_address TEXT,
    business_type ENUM('retail', 'wholesale', 'mixed') DEFAULT 'retail',
    subscription_plan ENUM('free', 'basic', 'premium') DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_uuid (uuid),
    INDEX idx_created_at (created_at)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_amharic VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_category_name (name)
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    name_amharic VARCHAR(255),
    description TEXT,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    min_threshold INT DEFAULT 5,
    max_threshold INT DEFAULT 1000,
    supplier_info JSON,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_sku (sku),
    INDEX idx_quantity (quantity),
    INDEX idx_created_at (created_at)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    profit_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'credit') DEFAULT 'cash',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    notes TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_created_at (created_at)
);

-- Wholesalers table
CREATE TABLE IF NOT EXISTS wholesalers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    location VARCHAR(100),
    specialties JSON,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_location (location),
    INDEX idx_phone (phone),
    INDEX idx_rating (rating)
);

-- Wholesaler products table
CREATE TABLE IF NOT EXISTS wholesaler_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    wholesaler_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    name_amharic VARCHAR(255),
    description TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    min_order_quantity INT DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'pieces',
    availability_status ENUM('in_stock', 'out_of_stock', 'limited') DEFAULT 'in_stock',
    image_url VARCHAR(500),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    INDEX idx_wholesaler_id (wholesaler_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_unit_price (unit_price),
    INDEX idx_availability_status (availability_status)
);

-- Stock movements table (for tracking inventory changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    movement_type ENUM('sale', 'purchase', 'adjustment', 'return', 'damage') NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_created_at (created_at)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    
    INDEX idx_user_id (user_id),
    INDEX idx_setting_key (setting_key)
);

-- Insert default categories
INSERT INTO categories (name, name_amharic, description, icon) VALUES
('Food & Grains', 'ምግብ እና እህል', 'Food items and grains', 'wheat'),
('Beverages', 'መጠጦች', 'Drinks and beverages', 'coffee'),
('Spices', 'ቅመማ ቅመም', 'Spices and seasonings', 'pepper'),
('Household', 'የቤት ውስጥ', 'Household items', 'home'),
('Personal Care', 'የግል ንፅህና', 'Personal care products', 'user'),
('Electronics', 'ኤሌክትሮኒክስ', 'Electronic devices', 'smartphone'),
('Textiles', 'ጨርቃ ጨርቅ', 'Clothing and textiles', 'shirt'),
('Stationery', 'ጽሕፈት መሳሪያ', 'Office and school supplies', 'pen-tool'),
('Other', 'ሌላ', 'Other items', 'package');

-- Insert sample wholesalers
INSERT INTO wholesalers (uuid, name, contact_person, phone, whatsapp, address, location, specialties, rating, is_verified) VALUES
(UUID(), 'Merkato Trading House', 'Ato Bekele Tadesse', '+251-911-123456', '+251-911-123456', 'Merkato Market, Block 15', 'Merkato, Addis Ababa', '["Electronics", "Household Items", "Textiles"]', 4.5, TRUE),
(UUID(), 'Piassa Wholesale Center', 'W/ro Almaz Getachew', '+251-911-234567', '+251-911-234567', 'Piassa Commercial Center', 'Piassa, Addis Ababa', '["Food & Beverages", "Personal Care", "Stationery"]', 4.2, TRUE),
(UUID(), 'Kazanchis Business Plaza', 'Ato Dawit Haile', '+251-911-345678', '+251-911-345678', 'Kazanchis Business District', 'Kazanchis, Addis Ababa', '["Import Goods", "Electronics", "Cosmetics"]', 4.7, TRUE);

-- Create views for common queries
CREATE VIEW user_inventory_summary AS
SELECT 
    u.id as user_id,
    u.business_name,
    COUNT(i.id) as total_items,
    SUM(i.quantity) as total_quantity,
    SUM(i.quantity * i.cost_price) as total_inventory_value,
    COUNT(CASE WHEN i.quantity <= i.min_threshold THEN 1 END) as low_stock_items
FROM users u
LEFT JOIN inventory_items i ON u.id = i.user_id AND i.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.id, u.business_name;

CREATE VIEW daily_sales_summary AS
SELECT 
    user_id,
    DATE(sale_date) as sale_date,
    COUNT(*) as total_sales,
    SUM(quantity) as total_items_sold,
    SUM(total_amount) as total_revenue,
    SUM(profit_amount) as total_profit
FROM sales
GROUP BY user_id, DATE(sale_date)
ORDER BY sale_date DESC;

-- Create stored procedures
DELIMITER //

CREATE PROCEDURE GetUserDashboardStats(IN p_user_id INT)
BEGIN
    DECLARE today_start DATETIME DEFAULT DATE(NOW());
    DECLARE week_start DATETIME DEFAULT DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Today's sales
    SELECT 
        COALESCE(COUNT(*), 0) as today_sales_count,
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COALESCE(SUM(profit_amount), 0) as today_profit
    FROM sales 
    WHERE user_id = p_user_id AND sale_date >= today_start;
    
    -- Week's sales
    SELECT 
        COALESCE(COUNT(*), 0) as week_sales_count,
        COALESCE(SUM(total_amount), 0) as week_revenue,
        COALESCE(SUM(profit_amount), 0) as week_profit
    FROM sales 
    WHERE user_id = p_user_id AND sale_date >= week_start;
    
    -- Inventory summary
    SELECT 
        COUNT(*) as total_items,
        SUM(quantity * cost_price) as inventory_value,
        COUNT(CASE WHEN quantity <= min_threshold THEN 1 END) as low_stock_count
    FROM inventory_items 
    WHERE user_id = p_user_id AND is_active = TRUE;
END //

DELIMITER ;