-- =====================================================
-- GebeyaNet Database Schema Setup
-- Ethiopian Retail Inventory Platform
-- Compatible with XAMPP MySQL
-- =====================================================

-- Create database with proper character set for Ethiopian text
CREATE DATABASE IF NOT EXISTS gebeyanet_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE gebeyanet_db;

-- =====================================================
-- 1. USERS TABLE (Shop Owners)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    
    -- Business Information
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    business_address TEXT,
    business_type ENUM('retail', 'wholesale', 'mixed') DEFAULT 'retail',
    
    -- Contact Information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    
    -- Account Status
    subscription_plan ENUM('free', 'basic', 'premium') DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_uuid (uuid),
    INDEX idx_business_name (business_name),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 2. CATEGORIES TABLE (Product Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_amharic VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_category_name (name),
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- 3. INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    category_id INT,
    
    -- Product Information
    name VARCHAR(255) NOT NULL,
    name_amharic VARCHAR(255),
    description TEXT,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    
    -- Stock Information
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    
    -- Pricing (in Ethiopian Birr)
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Stock Thresholds
    min_threshold INT DEFAULT 5,
    max_threshold INT DEFAULT 1000,
    
    -- Additional Information
    supplier_info JSON,
    image_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_sku (sku),
    INDEX idx_quantity (quantity),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_low_stock (quantity, min_threshold)
);

-- =====================================================
-- 4. SALES TABLE (Transaction Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    
    -- Sale Details
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    profit_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment Information
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'credit') DEFAULT 'cash',
    
    -- Customer Information (Optional)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Additional Notes
    notes TEXT,
    
    -- Timestamps
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_method (payment_method)
);

-- =====================================================
-- 5. WHOLESALERS TABLE (Supplier Directory)
-- =====================================================
CREATE TABLE IF NOT EXISTS wholesalers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    
    -- Business Information
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    
    -- Contact Information
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    
    -- Location Information
    address TEXT NOT NULL,
    location VARCHAR(100), -- e.g., "Merkato, Addis Ababa"
    
    -- Business Details
    specialties JSON, -- Array of specialties
    
    -- Rating System
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    
    -- Verification Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_name (name),
    INDEX idx_location (location),
    INDEX idx_phone (phone),
    INDEX idx_rating (rating),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- 6. WHOLESALER PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wholesaler_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    wholesaler_id INT NOT NULL,
    category_id INT,
    
    -- Product Information
    name VARCHAR(255) NOT NULL,
    name_amharic VARCHAR(255),
    description TEXT,
    
    -- Pricing and Ordering
    unit_price DECIMAL(10,2) NOT NULL,
    min_order_quantity INT DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'pieces',
    
    -- Availability
    availability_status ENUM('in_stock', 'out_of_stock', 'limited') DEFAULT 'in_stock',
    
    -- Media
    image_url VARCHAR(500),
    
    -- Status and Timestamps
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (wholesaler_id) REFERENCES wholesalers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_wholesaler_id (wholesaler_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_unit_price (unit_price),
    INDEX idx_availability_status (availability_status),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- 7. STOCK MOVEMENTS TABLE (Inventory Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    
    -- Movement Details
    movement_type ENUM('sale', 'purchase', 'adjustment', 'return', 'damage') NOT NULL,
    quantity_change INT NOT NULL, -- Positive for additions, negative for reductions
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    
    -- Reference Information
    reference_id VARCHAR(100), -- Reference to sale ID, purchase order, etc.
    notes TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 8. USER SETTINGS TABLE
-- =====================================================
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

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

INSERT IGNORE INTO categories (name, name_amharic, description, icon) VALUES
('Food & Grains', 'ምግብ እና እህል', 'Food items and grains including teff, wheat, barley', 'wheat'),
('Beverages', 'መጠጦች', 'Drinks and beverages including coffee, tea, soft drinks', 'coffee'),
('Spices', 'ቅመማ ቅመም', 'Spices and seasonings including berbere, mitmita', 'pepper'),
('Household', 'የቤት ውስጥ', 'Household items and cleaning supplies', 'home'),
('Personal Care', 'የግል ንፅህና', 'Personal care and hygiene products', 'user'),
('Electronics', 'ኤሌክትሮኒክስ', 'Electronic devices and accessories', 'smartphone'),
('Textiles', 'ጨርቃ ጨርቅ', 'Clothing and textile products', 'shirt'),
('Stationery', 'ጽሕፈት መሳሪያ', 'Office and school supplies', 'pen-tool'),
('Medicine', 'መድሃኒት', 'Basic medicines and health products', 'heart'),
('Other', 'ሌላ', 'Other miscellaneous items', 'package');

-- Insert Sample Ethiopian Wholesalers
INSERT INTO wholesalers (uuid, name, contact_person, phone, whatsapp, address, location, specialties, rating, is_verified) VALUES
(UUID(), 'Merkato Trading House', 'Ato Bekele Tadesse', '+251-911-123456', '+251-911-123456', 'Merkato Market, Block 15, Shop 234', 'Merkato, Addis Ababa', '["Electronics", "Household Items", "Textiles"]', 4.5, TRUE),
(UUID(), 'Piassa Wholesale Center', 'W/ro Almaz Getachew', '+251-911-234567', '+251-911-234567', 'Piassa Commercial Center, 2nd Floor', 'Piassa, Addis Ababa', '["Food & Beverages", "Personal Care", "Stationery"]', 4.2, TRUE),
(UUID(), 'Kazanchis Business Plaza', 'Ato Dawit Haile', '+251-911-345678', '+251-911-345678', 'Kazanchis Business District, Building A', 'Kazanchis, Addis Ababa', '["Import Goods", "Electronics", "Medicine"]', 4.7, TRUE),
(UUID(), 'Shiro Meda Suppliers', 'Ato Girma Wolde', '+251-911-456789', '+251-911-456789', 'Shiro Meda Market, Section C', 'Shiro Meda, Addis Ababa', '["Textiles", "Traditional Clothing", "Fabrics"]', 4.3, TRUE),
(UUID(), 'Addis Ketema Wholesale', 'W/ro Hanan Mohammed', '+251-911-567890', '+251-911-567890', 'Addis Ketema District, Main Street', 'Addis Ketema, Addis Ababa', '["Food & Grains", "Spices", "Traditional Foods"]', 4.1, TRUE);

-- Insert Sample Products for Wholesalers
INSERT INTO wholesaler_products (uuid, wholesaler_id, category_id, name, name_amharic, description, unit_price, min_order_quantity, unit, availability_status) VALUES
-- Merkato Trading House Products
(UUID(), 1, 6, 'Samsung Galaxy A54', 'ሳምሰንግ ጋላክሲ A54', 'Latest Samsung smartphone with 128GB storage', 25000.00, 1, 'piece', 'in_stock'),
(UUID(), 1, 4, 'Kitchen Utensils Set', 'የወጥ ቤት መሳሪያዎች', 'Complete kitchen utensils set for cooking', 850.00, 5, 'set', 'in_stock'),
(UUID(), 1, 7, 'Cotton T-Shirts', 'የጥጥ ሸሚዞች', 'High quality cotton t-shirts, various sizes', 320.00, 10, 'piece', 'limited'),

-- Piassa Wholesale Center Products
(UUID(), 2, 2, 'Coca Cola (24 pack)', 'ኮካ ኮላ (24 ጠርሙስ)', 'Coca Cola soft drinks, 24 bottles per case', 480.00, 2, 'case', 'in_stock'),
(UUID(), 2, 5, 'Shampoo Bottles', 'ሻምፑ ጠርሙሶች', 'Hair shampoo bottles, 400ml each', 180.00, 12, 'bottle', 'in_stock'),
(UUID(), 2, 8, 'Exercise Books', 'የልምምድ መጽሃፍት', 'School exercise books, 80 pages', 25.00, 50, 'piece', 'in_stock'),

-- Kazanchis Business Plaza Products
(UUID(), 3, 6, 'HP Laptop', 'HP ላፕቶፕ', 'HP laptop computer with Windows 11', 45000.00, 1, 'piece', 'in_stock'),
(UUID(), 3, 5, 'Perfume Collection', 'ሽቶ ስብስብ', 'Imported perfume collection, various scents', 1200.00, 6, 'bottle', 'in_stock'),
(UUID(), 3, 9, 'Pain Relief Tablets', 'ህመም ማስታገሻ ክኒን', 'Basic pain relief medication', 45.00, 20, 'box', 'in_stock');

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- User Inventory Summary View
DROP VIEW IF EXISTS user_inventory_summary;
CREATE VIEW user_inventory_summary AS
SELECT 
    u.id as user_id,
    u.business_name,
    u.owner_name,
    COUNT(i.id) as total_items,
    SUM(i.quantity) as total_quantity,
    SUM(i.quantity * i.cost_price) as total_inventory_value,
    COUNT(CASE WHEN i.quantity <= i.min_threshold THEN 1 END) as low_stock_items,
    COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock_items
FROM users u
LEFT JOIN inventory_items i ON u.id = i.user_id AND i.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.id, u.business_name, u.owner_name;

-- Daily Sales Summary View
DROP VIEW IF EXISTS daily_sales_summary;
CREATE VIEW daily_sales_summary AS
SELECT 
    user_id,
    DATE(sale_date) as sale_date,
    COUNT(*) as total_sales,
    SUM(quantity) as total_items_sold,
    SUM(total_amount) as total_revenue,
    SUM(profit_amount) as total_profit,
    AVG(total_amount) as average_sale_amount
FROM sales
GROUP BY user_id, DATE(sale_date)
ORDER BY sale_date DESC;

-- Low Stock Items View
DROP VIEW IF EXISTS low_stock_items;
CREATE VIEW low_stock_items AS
SELECT 
    i.id,
    i.uuid,
    i.user_id,
    u.business_name,
    i.name,
    i.name_amharic,
    i.quantity,
    i.min_threshold,
    i.unit,
    c.name as category_name,
    (i.quantity * i.cost_price) as tied_up_value
FROM inventory_items i
INNER JOIN users u ON i.user_id = u.id
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.is_active = TRUE 
  AND u.is_active = TRUE 
  AND i.quantity <= i.min_threshold
ORDER BY i.quantity ASC, tied_up_value DESC;

-- =====================================================
-- CREATE STORED PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS GetUserDashboardStats;
CREATE PROCEDURE GetUserDashboardStats(IN p_user_id INT)
BEGIN
    DECLARE today_start DATETIME DEFAULT DATE(NOW());
    DECLARE week_start DATETIME DEFAULT DATE_SUB(NOW(), INTERVAL 7 DAY);
    DECLARE month_start DATETIME DEFAULT DATE_SUB(NOW(), INTERVAL 30 DAY);

    -- Today's sales
    SELECT 
        COALESCE(COUNT(*), 0) as today_sales_count,
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COALESCE(SUM(profit_amount), 0) as today_profit,
        COALESCE(SUM(quantity), 0) as today_items_sold
    FROM sales 
    WHERE user_id = p_user_id AND sale_date >= today_start;

    -- Week's sales
    SELECT 
        COALESCE(COUNT(*), 0) as week_sales_count,
        COALESCE(SUM(total_amount), 0) as week_revenue,
        COALESCE(SUM(profit_amount), 0) as week_profit,
        COALESCE(SUM(quantity), 0) as week_items_sold
    FROM sales 
    WHERE user_id = p_user_id AND sale_date >= week_start;

    -- Inventory summary
    SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(quantity * cost_price) as inventory_value,
        COUNT(CASE WHEN quantity <= min_threshold THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count
    FROM inventory_items 
    WHERE user_id = p_user_id AND is_active = TRUE;
END;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables were created
SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'gebeyanet_db'
ORDER BY TABLE_NAME;

-- Check categories
SELECT * FROM categories;

-- Check wholesalers
SELECT id, name, location, rating, is_verified FROM wholesalers;

-- Check sample products
SELECT wp.name, w.name as wholesaler, c.name as category, wp.unit_price
FROM wholesaler_products wp
JOIN wholesalers w ON wp.wholesaler_id = w.id
JOIN categories c ON wp.category_id = c.id
LIMIT 10;

-- =====================================================
-- END OF SETUP SCRIPT
-- =====================================================