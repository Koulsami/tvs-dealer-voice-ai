-- TVS Dealer Voice AI - Complete Database Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================
-- PRODUCT CATALOG
-- ============================================

-- Vehicle Categories
CREATE TABLE IF NOT EXISTS vehicle_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Models
CREATE TABLE IF NOT EXISTS vehicle_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES vehicle_categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    tagline VARCHAR(255),
    description TEXT,
    engine_cc INTEGER,
    fuel_type VARCHAR(20) DEFAULT 'Petrol',
    body_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    launch_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Variants
CREATE TABLE IF NOT EXISTS vehicle_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    variant_code VARCHAR(50),
    features JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_id, name)
);

-- Colors
CREATE TABLE IF NOT EXISTS colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7),
    color_type VARCHAR(20) DEFAULT 'Standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model-Color Availability
CREATE TABLE IF NOT EXISTS model_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    additional_cost DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_id, color_id)
);

-- ============================================
-- DEALER NETWORK
-- ============================================

-- Regions
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE,
    country VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dealers
CREATE TABLE IF NOT EXISTS dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    dealer_code VARCHAR(20) UNIQUE,
    owner_name VARCHAR(100),
    email CITEXT,
    phone VARCHAR(20),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Showrooms
CREATE TABLE IF NOT EXISTS showrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    showroom_code VARCHAR(20) UNIQUE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email CITEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    operating_hours JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    has_service_center BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Showroom Staff
CREATE TABLE IF NOT EXISTS showroom_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email CITEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES vehicle_variants(id) ON DELETE CASCADE,
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(showroom_id, variant_id, color_id)
);

-- Pricing
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES vehicle_variants(id) ON DELETE CASCADE,
    ex_showroom_price DECIMAL(12, 2) NOT NULL,
    road_tax DECIMAL(10, 2) DEFAULT 0,
    insurance DECIMAL(10, 2) DEFAULT 0,
    registration DECIMAL(10, 2) DEFAULT 0,
    handling_charges DECIMAL(10, 2) DEFAULT 0,
    on_road_price DECIMAL(12, 2) GENERATED ALWAYS AS (
        ex_showroom_price + road_tax + insurance + registration + handling_charges
    ) STORED,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(showroom_id, variant_id, effective_from)
);

-- ============================================
-- CUSTOMERS
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(200) GENERATED ALWAYS AS (
        TRIM(first_name || ' ' || COALESCE(last_name, ''))
    ) STORED,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email CITEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    preferred_contact_method VARCHAR(20) DEFAULT 'phone',
    preferred_contact_time VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Interactions
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL,
    interaction_type VARCHAR(20) NOT NULL,
    channel VARCHAR(50),
    summary TEXT,
    transcript TEXT,
    sentiment VARCHAR(20),
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    interested_models UUID[] DEFAULT '{}',
    preferred_colors UUID[] DEFAULT '{}',
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    usage_type VARCHAR(50),
    financing_preference VARCHAR(50),
    exchange_vehicle BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- ============================================
-- LEADS
-- ============================================

-- Lead Status Enum
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM (
        'new', 'contacted', 'qualified', 'negotiation',
        'test_drive_scheduled', 'test_drive_completed',
        'booking', 'converted', 'lost', 'dormant'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Lead Priority Enum
DO $$ BEGIN
    CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    showroom_id UUID REFERENCES showrooms(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES showroom_staff(id) ON DELETE SET NULL,
    interested_model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,
    interested_variant_id UUID REFERENCES vehicle_variants(id) ON DELETE SET NULL,
    preferred_color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
    status lead_status DEFAULT 'new',
    priority lead_priority DEFAULT 'medium',
    source VARCHAR(50),
    source_campaign VARCHAR(100),
    estimated_purchase_date DATE,
    budget_range VARCHAR(50),
    financing_required BOOLEAN,
    exchange_vehicle BOOLEAN DEFAULT false,
    exchange_vehicle_details JSONB,
    notes TEXT,
    next_follow_up DATE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    lost_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    outcome VARCHAR(100),
    performed_by UUID REFERENCES showroom_staff(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Drives
CREATE TABLE IF NOT EXISTS test_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES vehicle_variants(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    conducted_by UUID REFERENCES showroom_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES vehicle_variants(id) ON DELETE CASCADE,
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    booking_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    cancelled_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_vehicle_models_category ON vehicle_models(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_slug ON vehicle_models(slug);
CREATE INDEX IF NOT EXISTS idx_vehicle_variants_model ON vehicle_variants(model_id);
CREATE INDEX IF NOT EXISTS idx_showrooms_dealer ON showrooms(dealer_id);
CREATE INDEX IF NOT EXISTS idx_showrooms_city ON showrooms(city);
CREATE INDEX IF NOT EXISTS idx_showrooms_pincode ON showrooms(pincode);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_leads_customer ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_showroom ON leads(showroom_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_pricing_showroom ON pricing(showroom_id);
CREATE INDEX IF NOT EXISTS idx_pricing_variant ON pricing(variant_id);

-- ============================================
-- SEED DATA: COLORS
-- ============================================

INSERT INTO colors (name, hex_code, color_type) VALUES
    ('Pearl White', '#F5F5F5', 'Standard'),
    ('Metallic Grey', '#6B6B6B', 'Standard'),
    ('Glossy Black', '#1A1A1A', 'Standard'),
    ('Racing Red', '#CC0000', 'Standard'),
    ('Titanium Grey', '#5C5C5C', 'Standard'),
    ('Marine Blue', '#003366', 'Standard'),
    ('Volcano Red', '#B22222', 'Premium'),
    ('Copper Bronze', '#B87333', 'Premium'),
    ('Matte Blue', '#4169E1', 'Premium'),
    ('Starlight Blue', '#1E90FF', 'Standard'),
    ('Yellow', '#FFD700', 'Standard'),
    ('Orange', '#FF8C00', 'Standard'),
    ('Green', '#228B22', 'Standard'),
    ('Purple', '#800080', 'Premium'),
    ('Silver', '#C0C0C0', 'Standard')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA: CATEGORIES & MODELS
-- ============================================

INSERT INTO vehicle_categories (name, description, display_order) VALUES
    ('Scooter', 'Automatic scooters for urban commute', 1),
    ('Motorcycle', 'Manual transmission motorcycles', 2),
    ('Moped', 'Economy mopeds for short distances', 3),
    ('Electric', 'Electric vehicles', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO vehicle_models (name, slug, tagline, description, engine_cc, fuel_type, body_type, category_id, is_active) VALUES
    ('TVS Jupiter', 'tvs-jupiter', 'More For You',
     'India''s most loved family scooter with best-in-class mileage and comfort.',
     113, 'Petrol', 'Scooter',
     (SELECT id FROM vehicle_categories WHERE name = 'Scooter'), true),

    ('TVS Ntorq 125', 'tvs-ntorq-125', 'Ready To Play',
     'India''s first connected scooter with SmartXonnect technology.',
     124, 'Petrol', 'Scooter',
     (SELECT id FROM vehicle_categories WHERE name = 'Scooter'), true),

    ('TVS iQube', 'tvs-iqube', 'Simply Electric',
     'Smart electric scooter with connected features.',
     NULL, 'Electric', 'Electric Scooter',
     (SELECT id FROM vehicle_categories WHERE name = 'Electric'), true),

    ('TVS Apache RTR 160', 'tvs-apache-rtr-160', 'The Beast',
     'Race-bred performance motorcycle with superior handling.',
     159, 'Petrol', 'Sports',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Apache RTR 200 4V', 'tvs-apache-rtr-200-4v', 'Racing DNA',
     'Premium sports motorcycle with 4-valve technology.',
     197, 'Petrol', 'Sports',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Apache RR 310', 'tvs-apache-rr-310', 'Race Replica',
     'Flagship super sport with race-derived technology.',
     312, 'Petrol', 'Super Sport',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Raider', 'tvs-raider', 'Bold In Everything',
     'Stylish 125cc motorcycle for the young generation.',
     124, 'Petrol', 'Commuter',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Ronin', 'tvs-ronin', 'Seek Within',
     'Modern retro scrambler with unique design.',
     225, 'Petrol', 'Modern Classic',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Star City Plus', 'tvs-star-city-plus', 'Mileage Ka King',
     'Reliable commuter with excellent mileage.',
     109, 'Petrol', 'Commuter',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS Sport', 'tvs-sport', 'Khushi Ka Scooter',
     'Entry-level motorcycle with great mileage.',
     99, 'Petrol', 'Commuter',
     (SELECT id FROM vehicle_categories WHERE name = 'Motorcycle'), true),

    ('TVS XL100', 'tvs-xl100', 'The All-Rounder',
     'Versatile moped for personal and commercial use.',
     99, 'Petrol', 'Moped',
     (SELECT id FROM vehicle_categories WHERE name = 'Moped'), true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED DATA: VARIANTS
-- ============================================

-- Jupiter Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-jupiter'),
     'Jupiter Standard', 'JUP-STD',
     '["Alloy Wheels", "Mobile Charging Port", "External Fuel Lid", "27L Boot Space"]'::jsonb,
     '{"mileage": "62 kmpl", "top_speed": "85 kmph", "kerb_weight": "108 kg"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-jupiter'),
     'Jupiter ZX', 'JUP-ZX',
     '["LED Headlamp", "Digital Speedometer", "Alloy Wheels", "USB Charger"]'::jsonb,
     '{"mileage": "60 kmpl", "top_speed": "85 kmph", "kerb_weight": "108 kg"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-jupiter'),
     'Jupiter Classic', 'JUP-CLS',
     '["Chrome Finish", "Premium Seat", "LED Headlamp", "Digital Console"]'::jsonb,
     '{"mileage": "58 kmpl", "top_speed": "85 kmph", "kerb_weight": "110 kg"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Ntorq Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-ntorq-125'),
     'Ntorq 125 Drum', 'NTQ-DRM',
     '["SmartXonnect", "Navigation Assist", "LED DRL", "22L Boot Space"]'::jsonb,
     '{"mileage": "47 kmpl", "top_speed": "95 kmph", "kerb_weight": "118 kg"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-ntorq-125'),
     'Ntorq 125 Disc', 'NTQ-DSC',
     '["Front Disc Brake", "SmartXonnect", "Navigation Assist", "LED DRL"]'::jsonb,
     '{"mileage": "47 kmpl", "top_speed": "95 kmph", "kerb_weight": "119 kg"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-ntorq-125'),
     'Ntorq 125 Race XP', 'NTQ-RXP',
     '["Race Tuned Engine", "Adjustable Levers", "SmartXonnect", "Racing Graphics"]'::jsonb,
     '{"mileage": "45 kmpl", "top_speed": "100 kmph", "kerb_weight": "119 kg"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- iQube Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-iqube'),
     'iQube S', 'IQB-S',
     '["Connected Features", "Navigation", "75 km Range", "TFT Display"]'::jsonb,
     '{"range": "75 km", "top_speed": "78 kmph", "charging_time": "5 hours"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-iqube'),
     'iQube ST', 'IQB-ST',
     '["Extended Range", "Connected Features", "100 km Range", "TFT Display"]'::jsonb,
     '{"range": "100 km", "top_speed": "78 kmph", "charging_time": "6.5 hours"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Apache 160 Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rtr-160'),
     'Apache RTR 160 2V', 'AP160-2V',
     '["Race Tuned FI", "Single Channel ABS", "LED Headlamp"]'::jsonb,
     '{"power": "16 PS", "torque": "14.12 Nm", "mileage": "50 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rtr-160'),
     'Apache RTR 160 4V', 'AP160-4V',
     '["4-Valve Engine", "Dual Channel ABS", "SmartXonnect", "Adjustable Levers"]'::jsonb,
     '{"power": "17.55 PS", "torque": "14.73 Nm", "mileage": "48 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Apache 200 Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rtr-200-4v'),
     'Apache RTR 200 4V Single Channel ABS', 'AP200-SC',
     '["Race Tuned FI", "Single Channel ABS", "Pirelli Tyres", "LED Package"]'::jsonb,
     '{"power": "20.8 PS", "torque": "17.25 Nm", "mileage": "40 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rtr-200-4v'),
     'Apache RTR 200 4V Dual Channel ABS', 'AP200-DC',
     '["Race Tuned FI", "Dual Channel ABS", "Pirelli Tyres", "SmartXonnect"]'::jsonb,
     '{"power": "20.8 PS", "torque": "17.25 Nm", "mileage": "40 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Apache RR 310 Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rr-310'),
     'Apache RR 310 Standard', 'RR310-STD',
     '["Reverse LCD Display", "Dual Channel ABS", "Slipper Clutch"]'::jsonb,
     '{"power": "34 PS", "torque": "27.3 Nm", "top_speed": "160 kmph"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-apache-rr-310'),
     'Apache RR 310 BTO', 'RR310-BTO',
     '["TFT Cluster", "Quick Shifter", "Cruise Control", "Track Mode"]'::jsonb,
     '{"power": "34 PS", "torque": "27.3 Nm", "top_speed": "160 kmph"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Raider Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-raider'),
     'Raider Drum', 'RAD-DRM',
     '["LED Headlamp", "Digital Console", "USB Charger"]'::jsonb,
     '{"power": "11.38 PS", "torque": "11.2 Nm", "mileage": "67 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-raider'),
     'Raider Disc', 'RAD-DSC',
     '["Front Disc", "LED Headlamp", "Digital Console", "Voice Assist"]'::jsonb,
     '{"power": "11.38 PS", "torque": "11.2 Nm", "mileage": "67 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Ronin Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-ronin'),
     'Ronin SS', 'RON-SS',
     '["Dual Channel ABS", "TFT Display", "Adjustable Suspension"]'::jsonb,
     '{"power": "20.4 PS", "torque": "19.93 Nm", "mileage": "40 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-ronin'),
     'Ronin DS', 'RON-DS',
     '["Dual Channel ABS", "TFT Display", "SmartXonnect", "Adjustable Suspension"]'::jsonb,
     '{"power": "20.4 PS", "torque": "19.93 Nm", "mileage": "40 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Star City Plus Variant
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-star-city-plus'),
     'Star City Plus Drum', 'SCP-DRM',
     '["Econometer", "Synchronized Braking", "i-TOuch Start"]'::jsonb,
     '{"power": "8.19 PS", "torque": "8.7 Nm", "mileage": "70 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- Sport Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-sport'),
     'Sport Kick Start', 'SPT-KS',
     '["Tubeless Tyres", "3D Logo", "Tank Pad"]'::jsonb,
     '{"power": "7.4 PS", "torque": "7.5 Nm", "mileage": "75 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-sport'),
     'Sport Self Start', 'SPT-SS',
     '["Electric Start", "Tubeless Tyres", "3D Logo"]'::jsonb,
     '{"power": "7.4 PS", "torque": "7.5 Nm", "mileage": "75 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- XL100 Variants
INSERT INTO vehicle_variants (model_id, name, variant_code, features, specifications) VALUES
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-xl100'),
     'XL100 Comfort', 'XL-CMF',
     '["i-TOuch Start", "Load Carrier", "Long Seat"]'::jsonb,
     '{"power": "4.35 PS", "torque": "6.5 Nm", "mileage": "80 kmpl"}'::jsonb),
    ((SELECT id FROM vehicle_models WHERE slug = 'tvs-xl100'),
     'XL100 Heavy Duty', 'XL-HD',
     '["Heavy Duty Carrier", "i-TOuch Start", "Industrial Use"]'::jsonb,
     '{"power": "4.35 PS", "torque": "6.5 Nm", "mileage": "78 kmpl"}'::jsonb)
ON CONFLICT (model_id, name) DO NOTHING;

-- ============================================
-- SEED DATA: MODEL COLORS
-- ============================================

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-jupiter' AND c.name IN ('Pearl White', 'Metallic Grey', 'Starlight Blue', 'Volcano Red')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-ntorq-125' AND c.name IN ('Metallic Grey', 'Racing Red', 'Yellow', 'Matte Blue', 'Glossy Black')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-iqube' AND c.name IN ('Pearl White', 'Starlight Blue', 'Glossy Black', 'Copper Bronze')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-apache-rtr-160' AND c.name IN ('Racing Red', 'Glossy Black', 'Pearl White', 'Matte Blue')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-apache-rtr-200-4v' AND c.name IN ('Racing Red', 'Glossy Black', 'Pearl White', 'Titanium Grey')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, CASE WHEN c.color_type = 'Premium' THEN 5000 ELSE 0 END
FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-apache-rr-310' AND c.name IN ('Racing Red', 'Glossy Black', 'Titanium Grey', 'Matte Blue')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-raider' AND c.name IN ('Racing Red', 'Glossy Black', 'Starlight Blue', 'Yellow')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, CASE WHEN c.color_type = 'Premium' THEN 3000 ELSE 0 END
FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-ronin' AND c.name IN ('Glossy Black', 'Copper Bronze', 'Titanium Grey', 'Pearl White')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-star-city-plus' AND c.name IN ('Glossy Black', 'Racing Red', 'Starlight Blue', 'Silver')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-sport' AND c.name IN ('Glossy Black', 'Racing Red', 'Silver')
ON CONFLICT (model_id, color_id) DO NOTHING;

INSERT INTO model_colors (model_id, color_id, is_available, additional_cost)
SELECT m.id, c.id, true, 0 FROM vehicle_models m, colors c
WHERE m.slug = 'tvs-xl100' AND c.name IN ('Glossy Black', 'Racing Red', 'Green', 'Silver')
ON CONFLICT (model_id, color_id) DO NOTHING;

-- ============================================
-- SEED DATA: REGIONS & DEALERS
-- ============================================

INSERT INTO regions (name, code, country) VALUES
    ('South', 'S', 'India'),
    ('North', 'N', 'India'),
    ('East', 'E', 'India'),
    ('West', 'W', 'India')
ON CONFLICT (code) DO NOTHING;

INSERT INTO dealers (name, dealer_code, owner_name, email, phone, is_active) VALUES
    ('Chennai TVS Motors', 'CHN001', 'Rajesh Kumar', 'chennai@tvsdealer.com', '+91-44-28150000', true),
    ('Delhi Auto World', 'DEL001', 'Amit Sharma', 'delhi@tvsdealer.com', '+91-11-26150000', true),
    ('Mumbai Two Wheelers', 'MUM001', 'Priya Patel', 'mumbai@tvsdealer.com', '+91-22-24150000', true),
    ('Kolkata Motors Hub', 'KOL001', 'Sanjay Das', 'kolkata@tvsdealer.com', '+91-33-22150000', true),
    ('Bangalore TVS Zone', 'BLR001', 'Venkat Rao', 'bangalore@tvsdealer.com', '+91-80-26150000', true)
ON CONFLICT (dealer_code) DO NOTHING;

-- ============================================
-- SEED DATA: SHOWROOMS
-- ============================================

INSERT INTO showrooms (dealer_id, region_id, name, showroom_code, address_line1, city, state, pincode, phone, email, latitude, longitude, operating_hours, is_active, has_service_center) VALUES
    ((SELECT id FROM dealers WHERE dealer_code = 'CHN001'),
     (SELECT id FROM regions WHERE code = 'S'),
     'TVS - Anna Nagar', 'CHN001-AN',
     '123, 2nd Avenue, Anna Nagar', 'Chennai', 'Tamil Nadu', '600040',
     '+91-44-26150001', 'annanagar@tvsdealer.com', 13.0850, 80.2101,
     '{"monday": "9:00-20:00", "tuesday": "9:00-20:00", "wednesday": "9:00-20:00", "thursday": "9:00-20:00", "friday": "9:00-20:00", "saturday": "9:00-18:00", "sunday": "10:00-14:00"}'::jsonb,
     true, true),

    ((SELECT id FROM dealers WHERE dealer_code = 'DEL001'),
     (SELECT id FROM regions WHERE code = 'N'),
     'TVS - Connaught Place', 'DEL001-CP',
     'N-12, Connaught Place', 'New Delhi', 'Delhi', '110001',
     '+91-11-26150001', 'cp@tvsdealer.com', 28.6315, 77.2167,
     '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-19:00", "sunday": "11:00-15:00"}'::jsonb,
     true, true),

    ((SELECT id FROM dealers WHERE dealer_code = 'MUM001'),
     (SELECT id FROM regions WHERE code = 'W'),
     'TVS - Andheri', 'MUM001-AN',
     '201, Link Road, Andheri West', 'Mumbai', 'Maharashtra', '400053',
     '+91-22-26150001', 'andheri@tvsdealer.com', 19.1190, 72.8466,
     '{"monday": "9:30-20:30", "tuesday": "9:30-20:30", "wednesday": "9:30-20:30", "thursday": "9:30-20:30", "friday": "9:30-20:30", "saturday": "9:30-19:00", "sunday": "10:00-16:00"}'::jsonb,
     true, true),

    ((SELECT id FROM dealers WHERE dealer_code = 'KOL001'),
     (SELECT id FROM regions WHERE code = 'E'),
     'TVS - Park Street', 'KOL001-PS',
     '56, Park Street', 'Kolkata', 'West Bengal', '700016',
     '+91-33-22150001', 'parkstreet@tvsdealer.com', 22.5512, 88.3525,
     '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-18:00", "sunday": "11:00-15:00"}'::jsonb,
     true, true),

    ((SELECT id FROM dealers WHERE dealer_code = 'BLR001'),
     (SELECT id FROM regions WHERE code = 'S'),
     'TVS - Indiranagar', 'BLR001-IN',
     '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', '560038',
     '+91-80-26150001', 'indiranagar@tvsdealer.com', 12.9716, 77.6412,
     '{"monday": "9:30-20:00", "tuesday": "9:30-20:00", "wednesday": "9:30-20:00", "thursday": "9:30-20:00", "friday": "9:30-20:00", "saturday": "9:30-18:00", "sunday": "10:00-14:00"}'::jsonb,
     true, true)
ON CONFLICT (showroom_code) DO NOTHING;

-- ============================================
-- SEED DATA: SHOWROOM STAFF
-- ============================================

INSERT INTO showroom_staff (showroom_id, name, role, phone, email, is_active)
SELECT s.id, 'Arun Kumar', 'Sales Manager', '+91-9876543210', 'arun@tvsdealer.com', true
FROM showrooms s WHERE s.showroom_code = 'CHN001-AN';

INSERT INTO showroom_staff (showroom_id, name, role, phone, email, is_active)
SELECT s.id, 'Priya Singh', 'Sales Executive', '+91-9876543211', 'priya@tvsdealer.com', true
FROM showrooms s WHERE s.showroom_code = 'CHN001-AN';

INSERT INTO showroom_staff (showroom_id, name, role, phone, email, is_active)
SELECT s.id, 'Vikram Mehta', 'Sales Manager', '+91-9876543220', 'vikram@tvsdealer.com', true
FROM showrooms s WHERE s.showroom_code = 'DEL001-CP';

-- ============================================
-- SEED DATA: PRICING (Chennai Showroom)
-- ============================================

INSERT INTO pricing (showroom_id, variant_id, ex_showroom_price, road_tax, insurance, registration, handling_charges)
SELECT s.id, v.id,
    CASE v.variant_code
        WHEN 'JUP-STD' THEN 73000 WHEN 'JUP-ZX' THEN 82000 WHEN 'JUP-CLS' THEN 87000
        WHEN 'NTQ-DRM' THEN 83000 WHEN 'NTQ-DSC' THEN 89000 WHEN 'NTQ-RXP' THEN 95000
        WHEN 'IQB-S' THEN 105000 WHEN 'IQB-ST' THEN 120000
        WHEN 'AP160-2V' THEN 115000 WHEN 'AP160-4V' THEN 125000
        WHEN 'AP200-SC' THEN 140000 WHEN 'AP200-DC' THEN 150000
        WHEN 'RR310-STD' THEN 260000 WHEN 'RR310-BTO' THEN 290000
        WHEN 'RAD-DRM' THEN 85000 WHEN 'RAD-DSC' THEN 92000
        WHEN 'RON-SS' THEN 150000 WHEN 'RON-DS' THEN 165000
        WHEN 'SCP-DRM' THEN 72000
        WHEN 'SPT-KS' THEN 58000 WHEN 'SPT-SS' THEN 62000
        WHEN 'XL-CMF' THEN 45000 WHEN 'XL-HD' THEN 48000
    END,
    CASE WHEN v.variant_code LIKE 'RR310%' THEN 15000 WHEN v.variant_code LIKE 'AP200%' THEN 8000 WHEN v.variant_code LIKE 'IQB%' THEN 0 ELSE 5000 END,
    CASE WHEN v.variant_code LIKE 'RR310%' THEN 12000 WHEN v.variant_code LIKE 'AP200%' THEN 6000 ELSE 4000 END,
    CASE WHEN v.variant_code LIKE 'RR310%' THEN 5000 WHEN v.variant_code LIKE 'AP200%' THEN 3000 ELSE 2000 END,
    1500
FROM showrooms s, vehicle_variants v
WHERE s.showroom_code = 'CHN001-AN'
ON CONFLICT (showroom_id, variant_id, effective_from) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create lead from voice AI
CREATE OR REPLACE FUNCTION create_lead_from_voice_ai(
    p_phone VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR DEFAULT NULL,
    p_showroom_id UUID DEFAULT NULL,
    p_interested_model_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
    v_lead_id UUID;
BEGIN
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone;

    IF v_customer_id IS NULL THEN
        INSERT INTO customers (first_name, last_name, phone, source)
        VALUES (p_first_name, p_last_name, p_phone, 'voice_ai')
        RETURNING id INTO v_customer_id;
    END IF;

    INSERT INTO leads (customer_id, showroom_id, interested_model_id, source, notes, status, priority)
    VALUES (v_customer_id, p_showroom_id, p_interested_model_id, 'voice_ai', p_notes, 'new', 'high')
    RETURNING id INTO v_lead_id;

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get on-road price
CREATE OR REPLACE FUNCTION get_on_road_price(p_showroom_id UUID, p_variant_id UUID)
RETURNS TABLE (
    ex_showroom_price DECIMAL, road_tax DECIMAL, insurance DECIMAL,
    registration DECIMAL, handling_charges DECIMAL, on_road_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.ex_showroom_price, p.road_tax, p.insurance, p.registration, p.handling_charges, p.on_road_price
    FROM pricing p
    WHERE p.showroom_id = p_showroom_id AND p.variant_id = p_variant_id AND p.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check inventory
CREATE OR REPLACE FUNCTION check_inventory(p_showroom_id UUID, p_variant_id UUID, p_color_id UUID)
RETURNS INTEGER AS $$
DECLARE available_qty INTEGER;
BEGIN
    SELECT COALESCE(quantity - reserved_quantity, 0) INTO available_qty
    FROM inventory WHERE showroom_id = p_showroom_id AND variant_id = p_variant_id AND color_id = p_color_id;
    RETURN COALESCE(available_qty, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETE!
-- ============================================
SELECT 'Database setup complete!' as status;
