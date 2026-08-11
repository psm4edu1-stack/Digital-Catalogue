-- Schema definitions for ecatalogue_db in MySQL / MariaDB
-- Version: V8 — Full Implementation (Image Upload, Featured Products, Advanced Analytics)
-- NOTE: This schema is MySQL/MariaDB-compatible. It is NOT compatible with the
-- current Node backend (backend/src/config/db.js uses the `pg` PostgreSQL driver,
-- $1 placeholders, and table_schema='public'). The backend must be rewritten to
-- use a MySQL/MariaDB driver before the app will connect.

-- Admins table (stores credentials and brand settings configurations)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    brand_logo VARCHAR(500),
    logo_filename VARCHAR(255),
    logo_path VARCHAR(500),
    logo_type VARCHAR(20),
    tagline VARCHAR(255),
    description TEXT,
    contact_info JSON,  -- stores {phone: string, instagram: string, email: string}
    how_to_order TEXT,  -- custom order DM/whatsapp directions
    theme_color VARCHAR(50) DEFAULT '#3b82f6',
    font_family VARCHAR(100) DEFAULT 'Outfit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    image_filename VARCHAR(255),
    image_path VARCHAR(500),
    image_type VARCHAR(20),
    price DECIMAL(10, 2) NOT NULL,
    special_price DECIMAL(10, 2),
    offer_percentage INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(50) DEFAULT 'in_stock', -- 'in_stock', 'pre_order', 'out_of_stock'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(150) NOT NULL, -- e.g. "Size: M", "Carbon Black"
    price DECIMAL(10, 2) NOT NULL,
    special_price DECIMAL(10, 2),
    availability_status VARCHAR(50) DEFAULT 'in_stock',
    image_url VARCHAR(500),
    image_filename VARCHAR(255),
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product-Category Join table
CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cart table
-- Replaces PostgreSQL partial unique indexes with a single generated column
-- (cart_key) that collapses NULL variant_id to 0, preserving the same uniqueness
-- rules: one row per (user, product) when no variant, and one per (user, product, variant) otherwise.
CREATE TABLE IF NOT EXISTS carts (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT DEFAULT 1,
    cart_key VARCHAR(100) AS (CONCAT(user_id, '_', product_id, '_', IFNULL(variant_id, 0))) STORED,
    UNIQUE KEY carts_user_product_variant_idx (cart_key),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Likes (Favorites) table
CREATE TABLE IF NOT EXISTS likes (
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Analytics table (extended for advanced analytics)
CREATE TABLE IF NOT EXISTS analytics (
    product_id INT PRIMARY KEY,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    sales INT DEFAULT 0,
    viral_clicks INT DEFAULT 0,
    enquiries INT DEFAULT 0,
    cart_adds INT DEFAULT 0,
    cart_removals INT DEFAULT 0,
    CONSTRAINT fk_analytics_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- MIGRATION SCRIPT (run once on existing DB)
-- MariaDB syntax (MariaDB 10.2+ supports IF [NOT] EXISTS on ADD/DROP COLUMN).
-- ==========================================
-- ALTER TABLE products DROP COLUMN IF EXISTS image_url;  -- Remove old TEXT duplicate if present
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_type VARCHAR(20);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
-- ALTER TABLE admins ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255);
-- ALTER TABLE admins ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);
-- ALTER TABLE admins ADD COLUMN IF NOT EXISTS logo_type VARCHAR(20);
-- ALTER TABLE analytics ADD COLUMN IF NOT EXISTS enquiries INT DEFAULT 0;
-- ALTER TABLE analytics ADD COLUMN IF NOT EXISTS cart_adds INT DEFAULT 0;
-- ALTER TABLE analytics ADD COLUMN IF NOT EXISTS cart_removals INT DEFAULT 0;
-- INSERT IGNORE INTO analytics (product_id, views, likes, sales, viral_clicks, enquiries, cart_adds, cart_removals)
-- SELECT p.id, 0, 0, 0, 0, 0, 0, 0 FROM products p
-- WHERE NOT EXISTS (SELECT 1 FROM analytics a WHERE a.product_id = p.id);
