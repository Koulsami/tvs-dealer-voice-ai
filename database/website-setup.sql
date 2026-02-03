-- TVS Dealer Voice AI - Website Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rwnkbwfigdxjrwvoafby/sql

-- ============================================
-- MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    engine_cc INTEGER,
    mileage_kmpl VARCHAR(20),
    top_speed_kmph INTEGER,
    kerb_weight_kg INTEGER,
    fuel_tank_litres DECIMAL(4,1),
    ex_showroom_price_base DECIMAL(12,2),
    description TEXT,
    features TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COLORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    hex_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SHOWROOMS TABLE
-- ============================================
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

-- ============================================
-- SHOWROOM PRICING TABLE
-- ============================================
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

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    showroom_id INTEGER REFERENCES showrooms(id),
    model_id INTEGER REFERENCES models(id),
    color_id INTEGER REFERENCES colors(id),
    quantity_available INTEGER DEFAULT 0,
    expected_arrival DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    city VARCHAR(100),
    source_channel VARCHAR(50),
    last_contact TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TEST DRIVE REQUESTS TABLE
-- ============================================
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

-- ============================================
-- CALLBACKS TABLE
-- ============================================
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

-- ============================================
-- PROMOTIONS TABLE
-- ============================================
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
-- SEED DATA: MODELS
-- ============================================
INSERT INTO models (name, category, engine_cc, mileage_kmpl, top_speed_kmph, kerb_weight_kg, fuel_tank_litres, ex_showroom_price_base, description) VALUES
('Apache RTR 160', 'Sport Bike', 160, '50', 113, 140, 12, 115000, 'The Apache RTR 160 is a sporty commuter with race-inspired styling.'),
('Apache RTR 200 4V', 'Sport Bike', 197, '40', 127, 148, 12, 142000, 'The Apache RTR 200 4V delivers exhilarating performance with advanced technology.'),
('Apache RR 310', 'Sport Bike', 312, '35', 160, 174, 11, 272000, 'Track-focused supersport with premium features and thrilling performance.'),
('Jupiter 125', 'Scooter', 125, '58', 90, 108, 5, 79000, 'Indias favorite family scooter with unmatched comfort and mileage.'),
('Ntorq 125', 'Scooter', 125, '50', 95, 118, 5.8, 83000, 'The smart scooter with TVS SmartXonnect technology.'),
('Raider 125', 'Commuter', 125, '67', 99, 123, 10, 98000, 'Stylish commuter bike with segment-first features.'),
('iQube Electric', 'Electric', NULL, NULL, 78, 118, NULL, 120000, 'TVS premium electric scooter with smart connectivity.')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: COLORS
-- ============================================
INSERT INTO colors (name, display_name, hex_code) VALUES
('red', 'Racing Red', '#E31837'),
('blue', 'Pearl Blue', '#1E40AF'),
('black', 'Glossy Black', '#1F2937'),
('white', 'Pearl White', '#F9FAFB'),
('grey', 'Titanium Grey', '#6B7280'),
('yellow', 'Neon Yellow', '#FBBF24')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: SHOWROOMS
-- ============================================
INSERT INTO showrooms (name, city, area, address, phone, operating_hours) VALUES
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
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: SHOWROOM PRICING (Sample)
-- ============================================
INSERT INTO showroom_pricing (showroom_id, model_id, ex_showroom_price, rto_charges, insurance_1yr, handling_charges, on_road_price)
SELECT
    s.id,
    m.id,
    m.ex_showroom_price_base,
    CASE
        WHEN m.ex_showroom_price_base > 200000 THEN 15000
        WHEN m.ex_showroom_price_base > 100000 THEN 10000
        ELSE 5000
    END as rto,
    CASE
        WHEN m.ex_showroom_price_base > 200000 THEN 12000
        WHEN m.ex_showroom_price_base > 100000 THEN 8000
        ELSE 4000
    END as insurance,
    2000 as handling,
    m.ex_showroom_price_base +
    CASE WHEN m.ex_showroom_price_base > 200000 THEN 29000 WHEN m.ex_showroom_price_base > 100000 THEN 20000 ELSE 11000 END as on_road
FROM showrooms s
CROSS JOIN models m
ON CONFLICT (showroom_id, model_id) DO NOTHING;

-- ============================================
-- SEED DATA: INVENTORY (Sample)
-- ============================================
INSERT INTO inventory (showroom_id, model_id, color_id, quantity_available)
SELECT
    s.id,
    m.id,
    c.id,
    FLOOR(RANDOM() * 5 + 1)::INTEGER
FROM showrooms s
CROSS JOIN models m
CROSS JOIN colors c
WHERE RANDOM() < 0.4
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: PROMOTIONS
-- ============================================
INSERT INTO promotions (name, description, short_message, promotion_type, discount_amount, valid_from, valid_until, is_active, priority) VALUES
('Summer Sale', 'Get amazing discounts this summer on all scooters!', 'Flat Rs 5,000 off on all Jupiter and Ntorq models this summer!', 'discount', 5000, '2024-01-01', '2025-12-31', true, 2),
('Exchange Bonus', 'Trade in your old vehicle for a new TVS', 'Get up to Rs 15,000 exchange bonus on your old two-wheeler!', 'exchange', 15000, '2024-01-01', '2025-12-31', true, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- ============================================
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE showrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drive_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access
CREATE POLICY "Allow anonymous read" ON models FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON showrooms FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON promotions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON showroom_pricing FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON colors FOR SELECT USING (true);

-- Create policies for insert (for test drives and callbacks)
CREATE POLICY "Allow anonymous insert" ON test_drive_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON callbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read" ON test_drive_requests FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON callbacks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON clients FOR SELECT USING (true);

-- Allow updates for admin
CREATE POLICY "Allow anonymous update" ON test_drive_requests FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update" ON callbacks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous update" ON promotions FOR ALL USING (true);
CREATE POLICY "Allow anonymous update" ON inventory FOR UPDATE USING (true);

-- Allow delete for promotions
CREATE POLICY "Allow anonymous delete" ON promotions FOR DELETE USING (true);

SELECT 'Database setup complete! Tables created with sample data.' as status;
