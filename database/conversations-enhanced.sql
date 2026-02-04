-- =============================================
-- TVS Dealer Voice AI - Enhanced Conversations Analytics
-- Additional fields for enterprise-grade analytics
-- =============================================

-- Add enhanced fields to call_logs table
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS
    -- Voice Analytics
    talk_time_seconds INTEGER DEFAULT 0,
    listen_time_seconds INTEGER DEFAULT 0,
    silence_time_seconds INTEGER DEFAULT 0,
    hold_time_seconds INTEGER DEFAULT 0,
    talk_listen_ratio DECIMAL(3,2) DEFAULT 0,
    interruption_count INTEGER DEFAULT 0,

    -- Quality Metrics
    audio_quality_score INTEGER DEFAULT 100, -- 0-100

    -- Customer Satisfaction
    csat_score INTEGER, -- 1-5
    nps_score INTEGER, -- -100 to 100
    customer_effort_score INTEGER, -- 1-7

    -- Resolution
    first_call_resolution BOOLEAN DEFAULT FALSE,
    issue_resolved BOOLEAN,
    resolution_time_seconds INTEGER,

    -- Keywords & Compliance
    keywords_detected TEXT[],
    competitor_mentions TEXT[],
    compliance_flags TEXT[],
    profanity_detected BOOLEAN DEFAULT FALSE,

    -- Customer Profile
    customer_id VARCHAR(100),
    is_repeat_caller BOOLEAN DEFAULT FALSE,
    previous_calls_count INTEGER DEFAULT 0,
    customer_lifetime_value DECIMAL(12,2),
    customer_segment VARCHAR(50), -- premium, regular, new

    -- Agent Info
    agent_id VARCHAR(100),
    agent_quality_score INTEGER, -- 0-100

    -- Transfer & Escalation
    was_transferred BOOLEAN DEFAULT FALSE,
    transfer_count INTEGER DEFAULT 0,
    transfer_reason VARCHAR(255),

    -- Callback
    callback_requested BOOLEAN DEFAULT FALSE,
    callback_scheduled_at TIMESTAMP WITH TIME ZONE,
    preferred_callback_time VARCHAR(50),

    -- Recording
    recording_url VARCHAR(500),
    recording_duration_seconds INTEGER,

    -- Language
    detected_language VARCHAR(20) DEFAULT 'en',

    -- Channel
    channel VARCHAR(50) DEFAULT 'web'; -- web, phone, whatsapp, ivr

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_call_logs_csat ON call_logs(csat_score);
CREATE INDEX IF NOT EXISTS idx_call_logs_fcr ON call_logs(first_call_resolution);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);

-- Create customer_profiles table for unified customer view
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(100) UNIQUE,

    -- Basic Info
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100),

    -- Demographics
    age_range VARCHAR(20),
    occupation VARCHAR(100),

    -- Engagement Stats
    total_calls INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    first_contact_date TIMESTAMP WITH TIME ZONE,
    last_contact_date TIMESTAMP WITH TIME ZONE,

    -- Sentiment History
    avg_sentiment_score DECIMAL(3,2) DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,

    -- Satisfaction
    avg_csat_score DECIMAL(3,2),
    avg_nps_score DECIMAL(5,2),

    -- Value
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    segment VARCHAR(50) DEFAULT 'regular', -- vip, premium, regular, at-risk
    churn_risk_score INTEGER DEFAULT 50, -- 0-100

    -- Interests
    models_interested TEXT[],
    preferred_category VARCHAR(50),
    purchase_history TEXT[],

    -- Status
    is_lead BOOLEAN DEFAULT FALSE,
    is_customer BOOLEAN DEFAULT FALSE,
    has_active_booking BOOLEAN DEFAULT FALSE,

    -- Notes
    notes TEXT,
    tags TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_performance table
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100),
    agent_name VARCHAR(255),
    date DATE NOT NULL,

    -- Volume
    total_calls INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    avg_handle_time_seconds INTEGER DEFAULT 0,

    -- Quality
    quality_score INTEGER DEFAULT 0, -- 0-100
    csat_avg DECIMAL(3,2),
    first_call_resolution_rate DECIMAL(5,2),

    -- Outcomes
    leads_generated INTEGER DEFAULT 0,
    bookings_made INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0,

    -- Efficiency
    avg_response_time_seconds INTEGER DEFAULT 0,
    avg_hold_time_seconds INTEGER DEFAULT 0,
    transfer_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(agent_id, date)
);

-- Create keywords_tracking table for trend analysis
CREATE TABLE IF NOT EXISTS keywords_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- product, competitor, complaint, praise, feature
    mention_count INTEGER DEFAULT 1,
    sentiment_when_mentioned VARCHAR(20), -- positive, neutral, negative

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(date, keyword)
);

-- Create hourly_stats table for peak hour analysis
CREATE TABLE IF NOT EXISTS hourly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour INTEGER NOT NULL, -- 0-23

    call_count INTEGER DEFAULT 0,
    avg_wait_time_seconds INTEGER DEFAULT 0,
    avg_handle_time_seconds INTEGER DEFAULT 0,
    abandonment_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(date, hour)
);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow anonymous access customer_profiles" ON customer_profiles FOR ALL USING (true);
CREATE POLICY "Allow anonymous access agent_performance" ON agent_performance FOR ALL USING (true);
CREATE POLICY "Allow anonymous access keywords_tracking" ON keywords_tracking FOR ALL USING (true);
CREATE POLICY "Allow anonymous access hourly_stats" ON hourly_stats FOR ALL USING (true);

-- =============================================
-- SAMPLE DATA FOR ENHANCED FEATURES
-- =============================================

-- Update existing call_logs with enhanced data
UPDATE call_logs SET
    talk_time_seconds = FLOOR(duration_seconds * 0.45),
    listen_time_seconds = FLOOR(duration_seconds * 0.40),
    silence_time_seconds = FLOOR(duration_seconds * 0.10),
    hold_time_seconds = FLOOR(duration_seconds * 0.05),
    talk_listen_ratio = 1.12,
    interruption_count = FLOOR(RANDOM() * 3),
    audio_quality_score = 85 + FLOOR(RANDOM() * 15),
    csat_score = CASE
        WHEN sentiment = 'positive' THEN 4 + FLOOR(RANDOM() * 2)
        WHEN sentiment = 'negative' THEN 1 + FLOOR(RANDOM() * 2)
        ELSE 3 + FLOOR(RANDOM() * 2)
    END,
    customer_effort_score = CASE
        WHEN sentiment = 'positive' THEN 1 + FLOOR(RANDOM() * 2)
        WHEN sentiment = 'negative' THEN 5 + FLOOR(RANDOM() * 2)
        ELSE 3 + FLOOR(RANDOM() * 2)
    END,
    first_call_resolution = CASE WHEN outcome IN ('booking_made', 'info_provided') THEN TRUE ELSE FALSE END,
    issue_resolved = CASE WHEN outcome != 'escalated' THEN TRUE ELSE FALSE END,
    keywords_detected = CASE
        WHEN models_discussed @> ARRAY['Apache RTR 200 4V'] THEN ARRAY['sports bike', 'performance', 'racing']
        WHEN models_discussed @> ARRAY['Jupiter 125'] THEN ARRAY['mileage', 'comfort', 'family']
        ELSE ARRAY['price', 'emi', 'offers']
    END,
    competitor_mentions = CASE
        WHEN RANDOM() > 0.7 THEN ARRAY['Honda', 'Bajaj']
        WHEN RANDOM() > 0.9 THEN ARRAY['Yamaha']
        ELSE NULL
    END,
    is_repeat_caller = RANDOM() > 0.7,
    previous_calls_count = FLOOR(RANDOM() * 3),
    customer_segment = CASE
        WHEN sentiment_score > 0.7 THEN 'premium'
        WHEN sentiment_score < 0 THEN 'at-risk'
        ELSE 'regular'
    END,
    agent_id = 'agent_ria_001',
    agent_quality_score = 88,
    channel = 'web'
WHERE TRUE;

-- Insert sample customer profiles
INSERT INTO customer_profiles (customer_id, name, phone, city, total_calls, avg_sentiment_score, segment, models_interested, is_lead)
SELECT
    'CUST_' || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
    customer_name,
    customer_phone,
    customer_city,
    1 + FLOOR(RANDOM() * 3),
    sentiment_score,
    CASE
        WHEN sentiment_score > 0.7 THEN 'premium'
        WHEN sentiment_score < 0 THEN 'at-risk'
        ELSE 'regular'
    END,
    models_discussed,
    outcome = 'lead_generated'
FROM call_logs
WHERE customer_name IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample agent performance
INSERT INTO agent_performance (agent_id, agent_name, date, total_calls, total_duration_minutes, avg_handle_time_seconds, quality_score, csat_avg, first_call_resolution_rate, leads_generated, bookings_made, escalations)
VALUES
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE, 10, 35, 210, 88, 4.2, 70.00, 5, 2, 2),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 1, 15, 52, 208, 90, 4.4, 73.00, 7, 3, 1),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 2, 12, 40, 200, 87, 4.1, 68.00, 5, 2, 2)
ON CONFLICT (agent_id, date) DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    quality_score = EXCLUDED.quality_score;

-- Insert sample keyword tracking
INSERT INTO keywords_tracking (date, keyword, category, mention_count, sentiment_when_mentioned)
VALUES
    (CURRENT_DATE, 'price', 'inquiry', 8, 'neutral'),
    (CURRENT_DATE, 'emi', 'finance', 5, 'neutral'),
    (CURRENT_DATE, 'test drive', 'action', 6, 'positive'),
    (CURRENT_DATE, 'offers', 'promotion', 4, 'positive'),
    (CURRENT_DATE, 'mileage', 'feature', 4, 'neutral'),
    (CURRENT_DATE, 'Honda', 'competitor', 2, 'neutral'),
    (CURRENT_DATE, 'delivery delay', 'complaint', 2, 'negative'),
    (CURRENT_DATE, 'exchange', 'action', 3, 'positive'),
    (CURRENT_DATE - 1, 'price', 'inquiry', 10, 'neutral'),
    (CURRENT_DATE - 1, 'booking', 'action', 4, 'positive'),
    (CURRENT_DATE - 1, 'Bajaj', 'competitor', 3, 'neutral')
ON CONFLICT (date, keyword) DO UPDATE SET
    mention_count = EXCLUDED.mention_count;

-- Insert sample hourly stats
INSERT INTO hourly_stats (date, hour, call_count, avg_wait_time_seconds, avg_handle_time_seconds)
VALUES
    (CURRENT_DATE, 9, 1, 0, 180),
    (CURRENT_DATE, 10, 2, 0, 220),
    (CURRENT_DATE, 11, 3, 0, 200),
    (CURRENT_DATE, 12, 1, 0, 150),
    (CURRENT_DATE, 14, 2, 0, 250),
    (CURRENT_DATE, 15, 1, 0, 180),
    (CURRENT_DATE, 16, 0, 0, 0),
    (CURRENT_DATE, 17, 0, 0, 0)
ON CONFLICT (date, hour) DO UPDATE SET
    call_count = EXCLUDED.call_count;
