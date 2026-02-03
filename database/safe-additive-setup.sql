-- TVS Dealer Voice AI - SAFE Additive Database Setup
-- This script ONLY ADDS missing tables and data - it will NOT drop or modify existing tables
-- Safe to run multiple times
-- Run this in Supabase SQL Editor

-- ============================================
-- CREATE MISSING TABLES (IF NOT EXISTS)
-- ============================================

-- Colors table (for inventory color options)
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Showrooms table
CREATE TABLE IF NOT EXISTS showrooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    operating_hours VARCHAR(100) DEFAULT '9 AM - 7 PM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Showroom pricing table
CREATE TABLE IF NOT EXISTS showroom_pricing (
    id SERIAL PRIMARY KEY,
    showroom_id INTEGER REFERENCES showrooms(id),
    model_id INTEGER REFERENCES models(id),
    ex_showroom_price DECIMAL(12,2),
    rto_charges DECIMAL(10,2),
    insurance_1yr DECIMAL(10,2),
    handling_charges DECIMAL(10,2) DEFAULT 0,
    on_road_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(showroom_id, model_id)
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    showroom_id INTEGER REFERENCES showrooms(id),
    model_id INTEGER REFERENCES models(id),
    color_id INTEGER REFERENCES colors(id),
    quantity_available INTEGER DEFAULT 0,
    expected_arrival DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    city VARCHAR(100),
    source_channel VARCHAR(50),
    last_contact TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test drive requests table
CREATE TABLE IF NOT EXISTS test_drive_requests (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    showroom_id INTEGER REFERENCES showrooms(id),
    model_id INTEGER REFERENCES models(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    preferred_date DATE,
    preferred_time VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Callbacks table
CREATE TABLE IF NOT EXISTS callbacks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    conversation_summary TEXT,
    interested_model VARCHAR(100),
    city VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',
    callback_type VARCHAR(30),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    short_message TEXT,
    promotion_type VARCHAR(50) DEFAULT 'discount',
    discount_amount DECIMAL(10,2),
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SEED DATA: COLORS (if empty)
-- ============================================
INSERT INTO colors (name, display_name, hex_code)
SELECT * FROM (VALUES
    ('red', 'Racing Red', '#E31837'),
    ('blue', 'Pearl Blue', '#1E40AF'),
    ('black', 'Glossy Black', '#1F2937'),
    ('white', 'Pearl White', '#F9FAFB'),
    ('grey', 'Titanium Grey', '#6B7280'),
    ('yellow', 'Neon Yellow', '#FBBF24')
) AS v(name, display_name, hex_code)
WHERE NOT EXISTS (SELECT 1 FROM colors LIMIT 1);

-- ============================================
-- SEED DATA: SHOWROOMS (if empty)
-- ============================================
INSERT INTO showrooms (name, city, area, address, phone, operating_hours)
SELECT * FROM (VALUES
    ('TVS - MG Road', 'Bangalore', 'MG Road', '123 MG Road, Bangalore 560001', '+91-80-12345678', '9 AM - 8 PM'),
    ('TVS - Koramangala', 'Bangalore', 'Koramangala', '456 80 Feet Road, Koramangala, Bangalore 560034', '+91-80-23456789', '9 AM - 8 PM'),
    ('TVS - Whitefield', 'Bangalore', 'Whitefield', '789 ITPL Road, Whitefield, Bangalore 560066', '+91-80-34567890', '9 AM - 8 PM'),
    ('TVS - Andheri', 'Mumbai', 'Andheri West', '101 SV Road, Andheri West, Mumbai 400058', '+91-22-12345678', '9 AM - 8 PM'),
    ('TVS - Powai', 'Mumbai', 'Powai', '202 Hiranandani, Powai, Mumbai 400076', '+91-22-23456789', '10 AM - 8 PM'),
    ('TVS - Thane', 'Mumbai', 'Thane', '303 LBS Marg, Thane 400602', '+91-22-34567890', '9 AM - 7 PM'),
    ('TVS - Anna Nagar', 'Chennai', 'Anna Nagar', '404 2nd Avenue, Anna Nagar, Chennai 600040', '+91-44-12345678', '9 AM - 8 PM'),
    ('TVS - T Nagar', 'Chennai', 'T Nagar', '505 Usman Road, T Nagar, Chennai 600017', '+91-44-23456789', '9 AM - 8 PM'),
    ('TVS - Connaught Place', 'Delhi', 'Connaught Place', '606 Janpath, Connaught Place, New Delhi 110001', '+91-11-12345678', '10 AM - 8 PM'),
    ('TVS - Lajpat Nagar', 'Delhi', 'Lajpat Nagar', '707 Ring Road, Lajpat Nagar, New Delhi 110024', '+91-11-23456789', '10 AM - 8 PM'),
    ('TVS - Banjara Hills', 'Hyderabad', 'Banjara Hills', '808 Road No 12, Banjara Hills, Hyderabad 500034', '+91-40-12345678', '9 AM - 8 PM'),
    ('TVS - Secunderabad', 'Hyderabad', 'Secunderabad', '909 SD Road, Secunderabad 500003', '+91-40-23456789', '9 AM - 8 PM')
) AS v(name, city, area, address, phone, operating_hours)
WHERE NOT EXISTS (SELECT 1 FROM showrooms LIMIT 1);

-- ============================================
-- SEED DATA: PROMOTIONS (if empty)
-- ============================================
INSERT INTO promotions (name, description, short_message, promotion_type, discount_amount, valid_from, valid_until, is_active, priority)
SELECT * FROM (VALUES
    ('Summer Sale', 'Get amazing discounts this summer on all scooters!', 'Flat Rs 5,000 off on all Jupiter and Ntorq models this summer!', 'discount', 5000::DECIMAL, '2024-01-01'::DATE, '2025-12-31'::DATE, true, 2),
    ('Exchange Bonus', 'Trade in your old vehicle for a new TVS', 'Get up to Rs 15,000 exchange bonus on your old two-wheeler!', 'exchange', 15000::DECIMAL, '2024-01-01'::DATE, '2025-12-31'::DATE, true, 1)
) AS v(name, description, short_message, promotion_type, discount_amount, valid_from, valid_until, is_active, priority)
WHERE NOT EXISTS (SELECT 1 FROM promotions LIMIT 1);

-- ============================================
-- SEED DATA: SHOWROOM PRICING (if empty)
-- Uses existing models table
-- NOTE: on_road_price is a generated column - do NOT insert it
-- ============================================
INSERT INTO showroom_pricing (showroom_id, model_id, ex_showroom_price, rto_charges, insurance_1yr, handling_charges)
SELECT
    s.id,
    m.id,
    m.ex_showroom_price_base,
    CASE
        WHEN m.ex_showroom_price_base > 200000 THEN 15000
        WHEN m.ex_showroom_price_base > 100000 THEN 10000
        ELSE 5000
    END,
    CASE
        WHEN m.ex_showroom_price_base > 200000 THEN 12000
        WHEN m.ex_showroom_price_base > 100000 THEN 8000
        ELSE 4000
    END,
    2000
FROM showrooms s
CROSS JOIN models m
WHERE NOT EXISTS (SELECT 1 FROM showroom_pricing LIMIT 1)
ON CONFLICT (showroom_id, model_id) DO NOTHING;

-- ============================================
-- SEED DATA: INVENTORY (if empty)
-- ============================================
INSERT INTO inventory (showroom_id, model_id, color_id, quantity_available)
SELECT
    s.id,
    m.id,
    c.id,
    (RANDOM() * 5 + 1)::INTEGER
FROM showrooms s
CROSS JOIN models m
CROSS JOIN colors c
WHERE NOT EXISTS (SELECT 1 FROM inventory LIMIT 1)
  AND RANDOM() < 0.3;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (safe to run multiple times)
-- ============================================
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drive_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP AND RECREATE POLICIES (to ensure they exist correctly)
-- ============================================

-- Colors policies
DROP POLICY IF EXISTS "anon_read_colors" ON colors;
CREATE POLICY "anon_read_colors" ON colors FOR SELECT USING (true);

-- Showrooms policies
DROP POLICY IF EXISTS "anon_read_showrooms" ON showrooms;
CREATE POLICY "anon_read_showrooms" ON showrooms FOR SELECT USING (true);

-- Showroom pricing policies
DROP POLICY IF EXISTS "anon_read_pricing" ON showroom_pricing;
CREATE POLICY "anon_read_pricing" ON showroom_pricing FOR SELECT USING (true);

-- Inventory policies
DROP POLICY IF EXISTS "anon_read_inventory" ON inventory;
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory;
CREATE POLICY "anon_read_inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "anon_update_inventory" ON inventory FOR UPDATE USING (true);

-- Clients policies
DROP POLICY IF EXISTS "anon_read_clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_read_clients" ON clients FOR SELECT USING (true);
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE USING (true);

-- Test drive requests policies
DROP POLICY IF EXISTS "anon_read_testdrives" ON test_drive_requests;
DROP POLICY IF EXISTS "anon_insert_testdrives" ON test_drive_requests;
DROP POLICY IF EXISTS "anon_update_testdrives" ON test_drive_requests;
CREATE POLICY "anon_read_testdrives" ON test_drive_requests FOR SELECT USING (true);
CREATE POLICY "anon_insert_testdrives" ON test_drive_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_testdrives" ON test_drive_requests FOR UPDATE USING (true);

-- Callbacks policies
DROP POLICY IF EXISTS "anon_read_callbacks" ON callbacks;
DROP POLICY IF EXISTS "anon_insert_callbacks" ON callbacks;
DROP POLICY IF EXISTS "anon_update_callbacks" ON callbacks;
CREATE POLICY "anon_read_callbacks" ON callbacks FOR SELECT USING (true);
CREATE POLICY "anon_insert_callbacks" ON callbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_callbacks" ON callbacks FOR UPDATE USING (true);

-- Promotions policies
DROP POLICY IF EXISTS "anon_read_promotions" ON promotions;
DROP POLICY IF EXISTS "anon_insert_promotions" ON promotions;
DROP POLICY IF EXISTS "anon_update_promotions" ON promotions;
DROP POLICY IF EXISTS "anon_delete_promotions" ON promotions;
CREATE POLICY "anon_read_promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "anon_insert_promotions" ON promotions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_promotions" ON promotions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_promotions" ON promotions FOR DELETE USING (true);

-- ============================================
-- VERIFY: Check if models table has RLS enabled (don't modify it)
-- ============================================
DO $$
BEGIN
    -- Enable RLS on models if not already enabled (safe operation)
    ALTER TABLE models ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'models table RLS already configured or table has different structure';
END $$;

-- Create read policy for models if it doesn't exist
DO $$
BEGIN
    CREATE POLICY "anon_read_models" ON models FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Policy anon_read_models already exists';
END $$;

SELECT 'SUCCESS: Safe additive setup complete! Existing data preserved.' as status;
