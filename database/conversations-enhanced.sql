-- =============================================
-- TVS Dealer Voice AI - Enhanced Conversations Analytics
-- Additional fields for enterprise-grade analytics
-- =============================================

-- Add enhanced fields to call_logs table
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS talk_time_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS listen_time_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS silence_time_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS hold_time_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS talk_listen_ratio DECIMAL(3,2) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS interruption_count INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS audio_quality_score INTEGER DEFAULT 100;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS csat_score INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS nps_score INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS customer_effort_score INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS first_call_resolution BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS issue_resolved BOOLEAN;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS resolution_time_seconds INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS keywords_detected TEXT[];
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS competitor_mentions TEXT[];
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS compliance_flags TEXT[];
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS profanity_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS customer_id VARCHAR(100);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS is_repeat_caller BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS previous_calls_count INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS customer_lifetime_value DECIMAL(12,2);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS customer_segment VARCHAR(50);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS agent_id VARCHAR(100);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS agent_quality_score INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS was_transferred BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS transfer_count INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS transfer_reason VARCHAR(255);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS escalated_to_human BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS escalation_reason VARCHAR(255);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS human_agent_name VARCHAR(100);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS human_takeover_time_seconds INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS callback_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS callback_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS preferred_callback_time VARCHAR(50);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500);
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS detected_language VARCHAR(20) DEFAULT 'en';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'web';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_call_logs_csat ON call_logs(csat_score);
CREATE INDEX IF NOT EXISTS idx_call_logs_fcr ON call_logs(first_call_resolution);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_escalated ON call_logs(escalated_to_human);

-- Create customer_profiles table for unified customer view
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100),
    age_range VARCHAR(20),
    occupation VARCHAR(100),
    total_calls INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    first_contact_date TIMESTAMP WITH TIME ZONE,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    avg_sentiment_score DECIMAL(3,2) DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    avg_csat_score DECIMAL(3,2),
    avg_nps_score DECIMAL(5,2),
    lifetime_value DECIMAL(12,2) DEFAULT 0,
    segment VARCHAR(50) DEFAULT 'regular',
    churn_risk_score INTEGER DEFAULT 50,
    models_interested TEXT[],
    preferred_category VARCHAR(50),
    purchase_history TEXT[],
    is_lead BOOLEAN DEFAULT FALSE,
    is_customer BOOLEAN DEFAULT FALSE,
    has_active_booking BOOLEAN DEFAULT FALSE,
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
    total_calls INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    avg_handle_time_seconds INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    csat_avg DECIMAL(3,2),
    first_call_resolution_rate DECIMAL(5,2),
    leads_generated INTEGER DEFAULT 0,
    bookings_made INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0,
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
    category VARCHAR(50),
    mention_count INTEGER DEFAULT 1,
    sentiment_when_mentioned VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, keyword)
);

-- Create hourly_stats table for peak hour analysis
CREATE TABLE IF NOT EXISTS hourly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    call_count INTEGER DEFAULT 0,
    avg_wait_time_seconds INTEGER DEFAULT 0,
    avg_handle_time_seconds INTEGER DEFAULT 0,
    abandonment_count INTEGER DEFAULT 0,
    escalation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, hour)
);

-- Create escalation_logs table for human handoff tracking
CREATE TABLE IF NOT EXISTS escalation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id UUID REFERENCES call_logs(id),
    escalation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(255),
    category VARCHAR(50), -- complaint, technical, billing, sales, other
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, high, normal, low
    ai_confidence_before DECIMAL(3,2), -- AI confidence when escalated
    customer_sentiment_before VARCHAR(20),
    human_agent_id VARCHAR(100),
    human_agent_name VARCHAR(100),
    resolution_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, resolved, unresolved
    resolution_time_seconds INTEGER,
    resolution_notes TEXT,
    customer_satisfied BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow anonymous access customer_profiles" ON customer_profiles FOR ALL USING (true);
CREATE POLICY "Allow anonymous access agent_performance" ON agent_performance FOR ALL USING (true);
CREATE POLICY "Allow anonymous access keywords_tracking" ON keywords_tracking FOR ALL USING (true);
CREATE POLICY "Allow anonymous access hourly_stats" ON hourly_stats FOR ALL USING (true);
CREATE POLICY "Allow anonymous access escalation_logs" ON escalation_logs FOR ALL USING (true);

-- =============================================
-- COMPREHENSIVE MOCK DATA
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
    nps_score = CASE
        WHEN sentiment = 'positive' THEN 30 + FLOOR(RANDOM() * 70)
        WHEN sentiment = 'negative' THEN -50 + FLOOR(RANDOM() * 30)
        ELSE -10 + FLOOR(RANDOM() * 40)
    END,
    customer_effort_score = CASE
        WHEN sentiment = 'positive' THEN 1 + FLOOR(RANDOM() * 2)
        WHEN sentiment = 'negative' THEN 5 + FLOOR(RANDOM() * 2)
        ELSE 3 + FLOOR(RANDOM() * 2)
    END,
    first_call_resolution = CASE WHEN outcome IN ('booking_made', 'info_provided') THEN TRUE ELSE FALSE END,
    issue_resolved = CASE WHEN outcome != 'escalated' THEN TRUE ELSE FALSE END,
    resolution_time_seconds = duration_seconds,
    keywords_detected = CASE
        WHEN models_discussed @> ARRAY['Apache RTR 200 4V'] THEN ARRAY['sports bike', 'performance', 'racing', 'speed']
        WHEN models_discussed @> ARRAY['Apache RR 310'] THEN ARRAY['superbike', 'premium', 'track', 'racing']
        WHEN models_discussed @> ARRAY['Jupiter 125'] THEN ARRAY['mileage', 'comfort', 'family', 'scooter']
        WHEN models_discussed @> ARRAY['Ntorq 125'] THEN ARRAY['youth', 'style', 'connected', 'features']
        WHEN models_discussed @> ARRAY['iQube Electric'] THEN ARRAY['electric', 'eco-friendly', 'charging', 'range']
        ELSE ARRAY['price', 'emi', 'offers', 'discount']
    END,
    competitor_mentions = CASE
        WHEN RANDOM() > 0.6 THEN ARRAY['Honda', 'Bajaj']
        WHEN RANDOM() > 0.8 THEN ARRAY['Yamaha', 'Suzuki']
        WHEN RANDOM() > 0.9 THEN ARRAY['Hero', 'KTM']
        ELSE NULL
    END,
    is_repeat_caller = RANDOM() > 0.7,
    previous_calls_count = FLOOR(RANDOM() * 3),
    customer_segment = CASE
        WHEN sentiment_score > 0.7 THEN 'premium'
        WHEN sentiment_score < 0 THEN 'at-risk'
        ELSE 'regular'
    END,
    customer_lifetime_value = CASE
        WHEN outcome = 'booking_made' THEN 150000 + FLOOR(RANDOM() * 100000)
        WHEN outcome = 'lead_generated' THEN 50000 + FLOOR(RANDOM() * 50000)
        ELSE 10000 + FLOOR(RANDOM() * 20000)
    END,
    agent_id = 'agent_ria_001',
    agent_quality_score = 85 + FLOOR(RANDOM() * 10),
    channel = 'web',
    detected_language = CASE WHEN RANDOM() > 0.8 THEN 'hi' ELSE 'en' END,
    -- Escalation data for escalated calls
    escalated_to_human = CASE WHEN outcome = 'escalated' THEN TRUE ELSE FALSE END,
    escalation_reason = CASE
        WHEN outcome = 'escalated' AND call_type = 'complaint' THEN 'Customer complaint - delivery delay'
        WHEN outcome = 'escalated' THEN 'Customer requested human agent'
        ELSE NULL
    END,
    human_agent_name = CASE WHEN outcome = 'escalated' THEN 'Suresh Kumar' ELSE NULL END,
    human_takeover_time_seconds = CASE WHEN outcome = 'escalated' THEN 45 + FLOOR(RANDOM() * 30) ELSE NULL END,
    callback_requested = CASE WHEN outcome = 'escalated' THEN TRUE ELSE FALSE END,
    callback_scheduled_at = CASE WHEN outcome = 'escalated' THEN NOW() + INTERVAL '2 hours' ELSE NULL END
WHERE TRUE;

-- Insert more call logs with varied data for realistic analytics
INSERT INTO call_logs (
    call_id, customer_name, customer_phone, customer_city,
    started_at, ended_at, duration_seconds,
    sentiment, sentiment_score, call_type, outcome,
    topics, models_discussed, intent, summary, key_points, actions_taken,
    follow_up_required, source,
    talk_time_seconds, listen_time_seconds, silence_time_seconds, hold_time_seconds,
    csat_score, nps_score, customer_effort_score, first_call_resolution,
    keywords_detected, competitor_mentions, is_repeat_caller, customer_segment,
    agent_id, agent_quality_score, channel,
    escalated_to_human, escalation_reason, human_agent_name, human_takeover_time_seconds
) VALUES
-- Morning calls (9 AM - 12 PM)
('call_demo_011', 'Arun Krishnamurthy', '+91 98123 45678', 'Bangalore',
 NOW()::date + INTERVAL '9 hours 15 minutes', NOW()::date + INTERVAL '9 hours 19 minutes', 240,
 'positive', 0.82, 'inquiry', 'lead_generated',
 ARRAY['pricing', 'exchange', 'finance'], ARRAY['Apache RTR 160 4V'], 'purchase_intent',
 'Customer interested in upgrading from older bike. Asked about exchange value and EMI options.',
 ARRAY['Has Pulsar 150 for exchange', 'Budget 1.3L', 'Wants low EMI'], ARRAY['provided_exchange_value', 'shared_emi_options'],
 true, 'website',
 108, 96, 24, 12, 5, 65, 2, true,
 ARRAY['exchange', 'upgrade', 'emi', 'finance'], ARRAY['Bajaj'], false, 'premium',
 'agent_ria_001', 90, 'web', false, NULL, NULL, NULL),

('call_demo_012', 'Pooja Sharma', '+91 87123 45678', 'Delhi',
 NOW()::date + INTERVAL '10 hours 30 minutes', NOW()::date + INTERVAL '10 hours 34 minutes', 240,
 'positive', 0.75, 'inquiry', 'lead_generated',
 ARRAY['features', 'safety', 'colors'], ARRAY['Jupiter 125'], 'feature_inquiry',
 'First-time buyer looking for safe and reliable scooter. Interested in Jupiter for daily office commute.',
 ARRAY['First vehicle', 'Safety priority', 'Daily commute 15km'], ARRAY['provided_safety_features', 'shared_colors'],
 true, 'website',
 100, 100, 28, 12, 4, 45, 2, true,
 ARRAY['safety', 'first bike', 'commute', 'reliable'], NULL, false, 'regular',
 'agent_ria_001', 88, 'web', false, NULL, NULL, NULL),

('call_demo_013', 'Karthik Rajan', '+91 76123 45678', 'Chennai',
 NOW()::date + INTERVAL '11 hours', NOW()::date + INTERVAL '11 hours 8 minutes', 480,
 'negative', -0.55, 'complaint', 'escalated',
 ARRAY['service', 'quality', 'complaint'], ARRAY['Ntorq 125'], 'complaint',
 'Customer extremely frustrated with recurring brake issues. Third visit to service center. Demanded manager intervention.',
 ARRAY['Brake issue 3rd time', 'Service center not helpful', 'Threatening social media'], ARRAY['escalated_to_manager', 'created_priority_ticket'],
 true, 'phone',
 200, 220, 40, 20, 1, -60, 7, false,
 ARRAY['brake issue', 'service complaint', 'quality problem'], NULL, true, 'at-risk',
 'agent_ria_001', 75, 'phone', true, 'Recurring quality issue - customer threatening social media', 'Ramesh Iyer', 55),

-- Afternoon calls (12 PM - 5 PM)
('call_demo_014', 'Deepa Menon', '+91 65123 45678', 'Kochi',
 NOW()::date + INTERVAL '14 hours', NOW()::date + INTERVAL '14 hours 5 minutes', 300,
 'positive', 0.88, 'booking', 'booking_made',
 ARRAY['test_drive', 'booking', 'delivery'], ARRAY['iQube Electric'], 'purchase_ready',
 'Environmentally conscious customer. Booked iQube after detailed range discussion. Very happy with subsidy information.',
 ARRAY['Eco-conscious buyer', 'Range sufficient for needs', 'Happy with govt subsidy'], ARRAY['booked_test_drive', 'initiated_booking', 'shared_subsidy_details'],
 false, 'website',
 130, 120, 35, 15, 5, 85, 1, true,
 ARRAY['electric', 'subsidy', 'eco-friendly', 'range'], ARRAY['Ola', 'Ather'], false, 'premium',
 'agent_ria_001', 92, 'web', false, NULL, NULL, NULL),

('call_demo_015', 'Mohammed Farooq', '+91 54123 45678', 'Hyderabad',
 NOW()::date + INTERVAL '15 hours 30 minutes', NOW()::date + INTERVAL '15 hours 33 minutes', 180,
 'neutral', 0.12, 'inquiry', 'info_provided',
 ARRAY['availability', 'waiting_period'], ARRAY['Apache RR 310'], 'availability_check',
 'Customer checking availability and waiting period for RR 310. Just doing initial research.',
 ARRAY['Checking availability', 'Early research phase', 'No urgency'], ARRAY['provided_waiting_period'],
 false, 'website',
 75, 80, 20, 5, 3, 10, 4, true,
 ARRAY['waiting period', 'availability', 'stock'], NULL, false, 'regular',
 'agent_ria_001', 85, 'web', false, NULL, NULL, NULL),

('call_demo_016', 'Lakshmi Narayanan', '+91 43123 45678', 'Coimbatore',
 NOW()::date + INTERVAL '16 hours', NOW()::date + INTERVAL '16 hours 6 minutes', 360,
 'negative', -0.38, 'complaint', 'escalated',
 ARRAY['pricing', 'hidden_charges', 'transparency'], ARRAY['Raider 125'], 'price_dispute',
 'Customer received final invoice with unexpected charges. Feels misled by salesperson. Wants written price breakup.',
 ARRAY['Invoice mismatch', 'Unexpected RTO charges', 'Wants transparency'], ARRAY['escalated_to_sales_manager', 'requested_invoice_review'],
 true, 'phone',
 160, 150, 30, 20, 2, -45, 6, false,
 ARRAY['hidden charges', 'invoice', 'rto', 'transparency'], NULL, true, 'at-risk',
 'agent_ria_001', 78, 'phone', true, 'Price transparency issue - invoice mismatch', 'Anita Desai', 62),

-- Evening calls (5 PM - 9 PM)
('call_demo_017', 'Vivek Oberoi', '+91 32123 45678', 'Mumbai',
 NOW()::date + INTERVAL '17 hours 45 minutes', NOW()::date + INTERVAL '17 hours 52 minutes', 420,
 'positive', 0.79, 'inquiry', 'lead_generated',
 ARRAY['comparison', 'performance', 'features'], ARRAY['Apache RTR 200 4V', 'Apache RTR 160 4V'], 'comparison',
 'Enthusiast comparing Apache variants. Detailed discussion about power, features and value for money.',
 ARRAY['Performance focused', 'Track day interest', 'Budget flexible'], ARRAY['provided_detailed_comparison', 'shared_track_reviews'],
 true, 'website',
 180, 180, 40, 20, 5, 70, 2, true,
 ARRAY['performance', 'track', 'power', 'comparison'], ARRAY['KTM Duke'], false, 'premium',
 'agent_ria_001', 91, 'web', false, NULL, NULL, NULL),

('call_demo_018', 'Sunita Reddy', '+91 21123 45678', 'Vizag',
 NOW()::date + INTERVAL '18 hours 30 minutes', NOW()::date + INTERVAL '18 hours 35 minutes', 300,
 'positive', 0.68, 'inquiry', 'lead_generated',
 ARRAY['family_scooter', 'storage', 'comfort'], ARRAY['Jupiter Classic'], 'family_purchase',
 'Looking for family scooter with good storage. Comparing Jupiter Classic with competitors. Price sensitive.',
 ARRAY['Family use', 'Storage important', 'Comfort priority'], ARRAY['highlighted_storage_features', 'shared_family_testimonials'],
 true, 'website',
 130, 130, 25, 15, 4, 40, 3, true,
 ARRAY['family', 'storage', 'comfort', 'practical'], ARRAY['Honda Activa', 'Hero Destini'], false, 'regular',
 'agent_ria_001', 87, 'web', false, NULL, NULL, NULL),

('call_demo_019', 'Rohit Bhatia', '+91 10123 45678', 'Chandigarh',
 NOW()::date + INTERVAL '19 hours', NOW()::date + INTERVAL '19 hours 4 minutes', 240,
 'neutral', 0.22, 'inquiry', 'info_provided',
 ARRAY['service_network', 'spare_parts'], ARRAY['Star City Plus'], 'service_inquiry',
 'Customer asking about service network in tier-2 cities. Planning to buy for use in smaller town.',
 ARRAY['Tier-2 city use', 'Service availability concern', 'Spare parts query'], ARRAY['shared_service_network', 'explained_parts_availability'],
 false, 'website',
 100, 100, 30, 10, 3, 20, 4, true,
 ARRAY['service', 'spare parts', 'small town', 'availability'], NULL, false, 'regular',
 'agent_ria_001', 84, 'web', false, NULL, NULL, NULL),

('call_demo_020', 'Neha Kapoor', '+91 99123 45678', 'Jaipur',
 NOW()::date + INTERVAL '20 hours 15 minutes', NOW()::date + INTERVAL '20 hours 22 minutes', 420,
 'positive', 0.92, 'booking', 'booking_made',
 ARRAY['booking', 'delivery', 'accessories'], ARRAY['Ntorq 125 Race Edition'], 'purchase_complete',
 'Young professional very excited about Ntorq Race Edition. Completed booking and added accessories.',
 ARRAY['Race Edition fan', 'Added helmet and accessories', 'Referred by friend'], ARRAY['completed_booking', 'added_accessories', 'shared_delivery_timeline'],
 false, 'website',
 180, 180, 40, 20, 5, 90, 1, true,
 ARRAY['race edition', 'accessories', 'booking', 'referral'], NULL, false, 'premium',
 'agent_ria_001', 94, 'web', false, NULL, NULL, NULL)

ON CONFLICT (call_id) DO UPDATE SET
    sentiment = EXCLUDED.sentiment,
    csat_score = EXCLUDED.csat_score;

-- Insert escalation logs
INSERT INTO escalation_logs (call_log_id, reason, category, priority, ai_confidence_before, customer_sentiment_before, human_agent_id, human_agent_name, resolution_status, resolution_time_seconds, resolution_notes, customer_satisfied)
SELECT
    id,
    escalation_reason,
    CASE
        WHEN call_type = 'complaint' THEN 'complaint'
        ELSE 'sales'
    END,
    CASE
        WHEN sentiment_score < -0.4 THEN 'urgent'
        WHEN sentiment_score < -0.2 THEN 'high'
        ELSE 'normal'
    END,
    0.35 + RANDOM() * 0.2,
    sentiment,
    'human_agent_001',
    human_agent_name,
    CASE WHEN RANDOM() > 0.3 THEN 'resolved' ELSE 'pending' END,
    300 + FLOOR(RANDOM() * 600),
    'Issue addressed by human agent. Customer callback scheduled.',
    CASE WHEN RANDOM() > 0.4 THEN TRUE ELSE FALSE END
FROM call_logs
WHERE escalated_to_human = TRUE
ON CONFLICT DO NOTHING;

-- Insert sample customer profiles
INSERT INTO customer_profiles (customer_id, name, phone, city, total_calls, avg_sentiment_score, segment, models_interested, is_lead, occupation, age_range, lifetime_value, churn_risk_score)
SELECT
    'CUST_' || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
    customer_name,
    customer_phone,
    customer_city,
    1 + FLOOR(RANDOM() * 3),
    sentiment_score,
    customer_segment,
    models_discussed,
    outcome = 'lead_generated',
    CASE FLOOR(RANDOM() * 5)
        WHEN 0 THEN 'IT Professional'
        WHEN 1 THEN 'Business Owner'
        WHEN 2 THEN 'Student'
        WHEN 3 THEN 'Government Employee'
        ELSE 'Private Employee'
    END,
    CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN '18-25'
        WHEN 1 THEN '26-35'
        WHEN 2 THEN '36-45'
        ELSE '46+'
    END,
    customer_lifetime_value,
    CASE
        WHEN sentiment_score < 0 THEN 70 + FLOOR(RANDOM() * 20)
        WHEN sentiment_score > 0.5 THEN 10 + FLOOR(RANDOM() * 20)
        ELSE 30 + FLOOR(RANDOM() * 30)
    END
FROM call_logs
WHERE customer_name IS NOT NULL
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample agent performance for last 7 days
INSERT INTO agent_performance (agent_id, agent_name, date, total_calls, total_duration_minutes, avg_handle_time_seconds, quality_score, csat_avg, first_call_resolution_rate, leads_generated, bookings_made, escalations, transfer_rate, avg_hold_time_seconds)
VALUES
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE, 20, 70, 210, 88, 4.2, 75.00, 8, 3, 3, 5.00, 12),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 1, 25, 85, 204, 90, 4.4, 78.00, 10, 4, 2, 4.00, 10),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 2, 18, 62, 207, 87, 4.1, 72.00, 7, 2, 2, 6.00, 14),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 3, 22, 75, 205, 89, 4.3, 77.00, 9, 3, 1, 3.00, 11),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 4, 19, 65, 205, 86, 4.0, 70.00, 6, 2, 3, 7.00, 15),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 5, 24, 82, 205, 91, 4.5, 80.00, 11, 4, 1, 3.00, 9),
    ('agent_ria_001', 'Ria (AI Assistant)', CURRENT_DATE - 6, 21, 72, 206, 88, 4.2, 74.00, 8, 3, 2, 5.00, 12)
ON CONFLICT (agent_id, date) DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    quality_score = EXCLUDED.quality_score;

-- Insert sample keyword tracking
INSERT INTO keywords_tracking (date, keyword, category, mention_count, sentiment_when_mentioned)
VALUES
    (CURRENT_DATE, 'price', 'inquiry', 12, 'neutral'),
    (CURRENT_DATE, 'emi', 'finance', 8, 'neutral'),
    (CURRENT_DATE, 'test drive', 'action', 10, 'positive'),
    (CURRENT_DATE, 'offers', 'promotion', 7, 'positive'),
    (CURRENT_DATE, 'mileage', 'feature', 6, 'neutral'),
    (CURRENT_DATE, 'Honda', 'competitor', 4, 'neutral'),
    (CURRENT_DATE, 'Bajaj', 'competitor', 3, 'neutral'),
    (CURRENT_DATE, 'delivery delay', 'complaint', 3, 'negative'),
    (CURRENT_DATE, 'exchange', 'action', 5, 'positive'),
    (CURRENT_DATE, 'service', 'support', 4, 'neutral'),
    (CURRENT_DATE, 'performance', 'feature', 5, 'positive'),
    (CURRENT_DATE, 'safety', 'feature', 3, 'positive'),
    (CURRENT_DATE - 1, 'price', 'inquiry', 15, 'neutral'),
    (CURRENT_DATE - 1, 'booking', 'action', 6, 'positive'),
    (CURRENT_DATE - 1, 'Bajaj', 'competitor', 5, 'neutral'),
    (CURRENT_DATE - 1, 'KTM', 'competitor', 2, 'neutral'),
    (CURRENT_DATE - 1, 'emi', 'finance', 9, 'neutral'),
    (CURRENT_DATE - 1, 'insurance', 'finance', 4, 'neutral')
ON CONFLICT (date, keyword) DO UPDATE SET
    mention_count = EXCLUDED.mention_count;

-- Insert sample hourly stats
INSERT INTO hourly_stats (date, hour, call_count, avg_wait_time_seconds, avg_handle_time_seconds, escalation_count)
VALUES
    (CURRENT_DATE, 9, 2, 0, 200, 0),
    (CURRENT_DATE, 10, 3, 0, 220, 0),
    (CURRENT_DATE, 11, 4, 0, 240, 1),
    (CURRENT_DATE, 12, 2, 0, 180, 0),
    (CURRENT_DATE, 13, 1, 0, 150, 0),
    (CURRENT_DATE, 14, 2, 0, 200, 0),
    (CURRENT_DATE, 15, 3, 0, 250, 1),
    (CURRENT_DATE, 16, 2, 0, 180, 0),
    (CURRENT_DATE, 17, 3, 0, 220, 0),
    (CURRENT_DATE, 18, 4, 0, 260, 1),
    (CURRENT_DATE, 19, 2, 0, 210, 0),
    (CURRENT_DATE, 20, 2, 0, 190, 0)
ON CONFLICT (date, hour) DO UPDATE SET
    call_count = EXCLUDED.call_count,
    escalation_count = EXCLUDED.escalation_count;
