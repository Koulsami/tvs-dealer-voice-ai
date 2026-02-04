-- =============================================
-- TVS Dealer Voice AI - Conversations & Analytics Tables
-- =============================================

-- Call Logs Table - Stores all voice conversation data
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(100) UNIQUE, -- Retell call ID

    -- Customer Information
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_city VARCHAR(100),

    -- Call Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,

    -- Sentiment Analysis
    sentiment VARCHAR(20) DEFAULT 'neutral', -- positive, neutral, negative
    sentiment_score DECIMAL(3,2) DEFAULT 0, -- -1.00 to 1.00

    -- Call Classification
    call_type VARCHAR(50) DEFAULT 'inquiry', -- inquiry, booking, complaint, feedback, escalation
    outcome VARCHAR(50) DEFAULT 'info_provided', -- lead_generated, booking_made, escalated, info_provided, dropped

    -- Content Analysis
    topics TEXT[], -- Array of topics discussed
    models_discussed TEXT[], -- Models mentioned
    intent VARCHAR(100), -- Primary intent detected

    -- Transcript & Summary
    transcript TEXT,
    summary TEXT,
    key_points TEXT[],

    -- Actions Taken
    actions_taken TEXT[], -- e.g., ['booked_test_drive', 'sent_price_quote']
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,

    -- Metadata
    agent_name VARCHAR(100) DEFAULT 'Ria',
    source VARCHAR(50) DEFAULT 'website', -- website, phone, whatsapp

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table - Potential customers extracted from conversations
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id UUID REFERENCES call_logs(id),

    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_city VARCHAR(100),

    -- Interest Details
    model_interested VARCHAR(100),
    category_interested VARCHAR(50), -- Sport, Scooter, Commuter, Electric
    budget_range VARCHAR(50),
    purchase_timeline VARCHAR(50), -- immediate, 1_week, 1_month, 3_months, exploring

    -- Lead Scoring
    interest_level VARCHAR(20) DEFAULT 'warm', -- hot, warm, cold
    lead_score INTEGER DEFAULT 50, -- 0-100

    -- Status Tracking
    status VARCHAR(30) DEFAULT 'new', -- new, contacted, qualified, negotiating, converted, lost
    assigned_to VARCHAR(100),

    -- Source Tracking
    source VARCHAR(50) DEFAULT 'voice_ai',
    campaign VARCHAR(100),

    -- Notes & Follow-up
    notes TEXT,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up DATE,

    -- Conversion
    converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(12,2),
    lost_reason VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Insights Table - Aggregated analytics
CREATE TABLE IF NOT EXISTS conversation_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,

    -- Volume Metrics
    total_calls INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    avg_call_duration_seconds INTEGER DEFAULT 0,

    -- Sentiment Distribution
    positive_calls INTEGER DEFAULT 0,
    neutral_calls INTEGER DEFAULT 0,
    negative_calls INTEGER DEFAULT 0,
    avg_sentiment_score DECIMAL(3,2) DEFAULT 0,

    -- Outcome Distribution
    leads_generated INTEGER DEFAULT 0,
    bookings_made INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0,

    -- Top Topics (stored as JSONB for flexibility)
    top_topics JSONB DEFAULT '[]',
    top_models JSONB DEFAULT '[]',

    -- Conversion Metrics
    lead_conversion_rate DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous access (for demo)
CREATE POLICY "Allow anonymous read call_logs" ON call_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert call_logs" ON call_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update call_logs" ON call_logs FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update leads" ON leads FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete leads" ON leads FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read insights" ON conversation_insights FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert insights" ON conversation_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update insights" ON conversation_insights FOR UPDATE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_sentiment ON call_logs(sentiment);
CREATE INDEX IF NOT EXISTS idx_call_logs_outcome ON call_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- =============================================
-- SAMPLE DATA FOR DEMO
-- =============================================

-- Insert sample call logs
INSERT INTO call_logs (call_id, customer_name, customer_phone, customer_city, started_at, ended_at, duration_seconds, sentiment, sentiment_score, call_type, outcome, topics, models_discussed, intent, summary, key_points, actions_taken, follow_up_required, source) VALUES
-- Positive calls with leads
('call_demo_001', 'Rahul Sharma', '+91 98765 43210', 'Bangalore', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '4 minutes 30 seconds', 270, 'positive', 0.85, 'inquiry', 'lead_generated', ARRAY['pricing', 'test_drive', 'finance'], ARRAY['Apache RTR 200 4V'], 'purchase_intent', 'Customer very interested in Apache RTR 200 4V. Asked about on-road price in Bangalore and EMI options. Wants to book a test drive this weekend.', ARRAY['Interested in Apache RTR 200', 'Budget: 1.5-2 lakhs', 'Wants weekend test drive'], ARRAY['provided_price_quote', 'booked_test_drive'], true, 'website'),

('call_demo_002', 'Priya Patel', '+91 87654 32109', 'Mumbai', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours' + INTERVAL '3 minutes 15 seconds', 195, 'positive', 0.72, 'inquiry', 'lead_generated', ARRAY['availability', 'colors', 'features'], ARRAY['Jupiter 125', 'Ntorq 125'], 'comparison', 'Customer comparing Jupiter and Ntorq for daily commute. Prefers Jupiter for mileage but likes Ntorq features. Will visit showroom tomorrow.', ARRAY['Comparing scooters', 'Priority: mileage', 'Will visit showroom'], ARRAY['provided_comparison', 'shared_showroom_details'], true, 'website'),

('call_demo_003', 'Amit Kumar', '+91 76543 21098', 'Delhi', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '6 minutes 45 seconds', 405, 'positive', 0.91, 'booking', 'booking_made', ARRAY['test_drive', 'offers', 'booking'], ARRAY['Apache RR 310'], 'test_drive_booking', 'Enthusiast customer very excited about Apache RR 310. Booked test drive for Saturday. Asked about current offers and exchange bonus.', ARRAY['Apache RR 310 enthusiast', 'Test drive booked for Saturday', 'Has old bike for exchange'], ARRAY['booked_test_drive', 'shared_offers', 'notified_dealer'], false, 'website'),

-- Neutral calls
('call_demo_004', 'Sneha Reddy', '+91 65432 10987', 'Hyderabad', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours' + INTERVAL '2 minutes 20 seconds', 140, 'neutral', 0.15, 'inquiry', 'info_provided', ARRAY['specifications', 'mileage'], ARRAY['iQube Electric'], 'information', 'Customer asking about iQube range and charging time. Still in early research phase, not ready to buy yet.', ARRAY['Researching electric scooters', 'Concerned about range', 'Early stage'], ARRAY['provided_specifications'], false, 'website'),

('call_demo_005', 'Vikram Singh', '+91 54321 09876', 'Chennai', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '1 minute 45 seconds', 105, 'neutral', 0.08, 'inquiry', 'info_provided', ARRAY['service_center', 'warranty'], ARRAY['Raider 125'], 'service_inquiry', 'Customer asking about service center locations and warranty details for Raider 125.', ARRAY['Service center query', 'Warranty information'], ARRAY['shared_service_centers'], false, 'website'),

-- Negative/Escalated calls
('call_demo_006', 'Rajesh Menon', '+91 43210 98765', 'Bangalore', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours' + INTERVAL '5 minutes 10 seconds', 310, 'negative', -0.45, 'complaint', 'escalated', ARRAY['complaint', 'service', 'delay'], ARRAY['Apache RTR 160'], 'complaint', 'Customer frustrated about delayed delivery of Apache RTR 160. Booked 3 weeks ago but no update. Wants to speak to manager.', ARRAY['Delivery delayed 3 weeks', 'No communication from dealer', 'Wants manager callback'], ARRAY['escalated_to_dealer', 'created_callback'], true, 'website'),

('call_demo_007', 'Meera Nair', '+91 32109 87654', 'Mumbai', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours' + INTERVAL '2 minutes 55 seconds', 175, 'negative', -0.32, 'complaint', 'escalated', ARRAY['pricing', 'hidden_charges'], ARRAY['Jupiter 125'], 'price_dispute', 'Customer unhappy about additional charges not mentioned earlier. On-road price higher than quoted. Requested callback from sales manager.', ARRAY['Price discrepancy', 'Hidden charges complaint', 'Needs clarification'], ARRAY['created_callback', 'flagged_for_review'], true, 'website'),

-- More positive recent calls
('call_demo_008', 'Arjun Verma', '+91 21098 76543', 'Delhi', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes' + INTERVAL '4 minutes 5 seconds', 245, 'positive', 0.78, 'inquiry', 'lead_generated', ARRAY['pricing', 'offers', 'exchange'], ARRAY['Ntorq 125'], 'purchase_intent', 'Young customer interested in Ntorq 125 Race Edition. Asking about student offers and exchange value for old Honda Activa.', ARRAY['Interested in Ntorq Race Edition', 'Student looking for offers', 'Has Activa for exchange'], ARRAY['provided_price_quote', 'calculated_exchange_value'], true, 'website'),

('call_demo_009', 'Kavitha Krishnan', '+91 10987 65432', 'Chennai', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '3 minutes 40 seconds', 220, 'positive', 0.68, 'inquiry', 'lead_generated', ARRAY['comparison', 'mileage', 'comfort'], ARRAY['Jupiter 125', 'Jupiter Classic'], 'comparison', 'Customer comparing Jupiter variants for her mother. Interested in classic edition for comfort. Budget conscious.', ARRAY['Buying for mother', 'Comfort priority', 'Budget: under 1 lakh'], ARRAY['provided_comparison', 'shared_offers'], true, 'website'),

('call_demo_010', 'Sanjay Gupta', '+91 09876 54321', 'Hyderabad', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes' + INTERVAL '5 minutes 20 seconds', 320, 'positive', 0.88, 'booking', 'booking_made', ARRAY['test_drive', 'finance', 'insurance'], ARRAY['Apache RTR 200 4V'], 'purchase_ready', 'Customer ready to purchase Apache RTR 200. Booked test drive and requested finance options. Very positive interaction.', ARRAY['Ready to purchase', 'Needs finance options', 'Test drive tomorrow'], ARRAY['booked_test_drive', 'shared_finance_options', 'notified_dealer'], false, 'website')

ON CONFLICT (call_id) DO NOTHING;

-- Insert sample leads (extracted from calls)
INSERT INTO leads (call_log_id, customer_name, customer_phone, customer_city, model_interested, category_interested, purchase_timeline, interest_level, lead_score, status, source, notes)
SELECT
    id,
    customer_name,
    customer_phone,
    customer_city,
    models_discussed[1],
    CASE
        WHEN models_discussed[1] LIKE '%Apache%' THEN 'Sport'
        WHEN models_discussed[1] LIKE '%Jupiter%' OR models_discussed[1] LIKE '%Ntorq%' THEN 'Scooter'
        WHEN models_discussed[1] LIKE '%iQube%' THEN 'Electric'
        ELSE 'Commuter'
    END,
    CASE
        WHEN outcome = 'booking_made' THEN 'immediate'
        WHEN sentiment = 'positive' THEN '1_week'
        ELSE '1_month'
    END,
    CASE
        WHEN sentiment_score > 0.7 THEN 'hot'
        WHEN sentiment_score > 0.3 THEN 'warm'
        ELSE 'cold'
    END,
    CASE
        WHEN sentiment_score > 0.7 THEN 85
        WHEN sentiment_score > 0.3 THEN 65
        ELSE 40
    END,
    CASE
        WHEN outcome = 'booking_made' THEN 'qualified'
        ELSE 'new'
    END,
    'voice_ai',
    summary
FROM call_logs
WHERE outcome IN ('lead_generated', 'booking_made')
ON CONFLICT DO NOTHING;

-- Insert today's conversation insights
INSERT INTO conversation_insights (date, total_calls, total_duration_minutes, avg_call_duration_seconds, positive_calls, neutral_calls, negative_calls, avg_sentiment_score, leads_generated, bookings_made, escalations, top_topics, top_models, lead_conversion_rate)
VALUES (
    CURRENT_DATE,
    10,
    35,
    210,
    6,
    2,
    2,
    0.43,
    5,
    2,
    2,
    '[{"topic": "pricing", "count": 7}, {"topic": "test_drive", "count": 5}, {"topic": "offers", "count": 4}, {"topic": "comparison", "count": 3}]'::jsonb,
    '[{"model": "Apache RTR 200 4V", "count": 3}, {"model": "Jupiter 125", "count": 3}, {"model": "Ntorq 125", "count": 2}]'::jsonb,
    50.00
)
ON CONFLICT (date) DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    total_duration_minutes = EXCLUDED.total_duration_minutes,
    positive_calls = EXCLUDED.positive_calls,
    neutral_calls = EXCLUDED.neutral_calls,
    negative_calls = EXCLUDED.negative_calls,
    avg_sentiment_score = EXCLUDED.avg_sentiment_score,
    leads_generated = EXCLUDED.leads_generated,
    bookings_made = EXCLUDED.bookings_made,
    escalations = EXCLUDED.escalations;

-- Function to update insights (can be called periodically)
CREATE OR REPLACE FUNCTION update_conversation_insights(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO conversation_insights (
        date,
        total_calls,
        total_duration_minutes,
        avg_call_duration_seconds,
        positive_calls,
        neutral_calls,
        negative_calls,
        avg_sentiment_score,
        leads_generated,
        bookings_made,
        escalations
    )
    SELECT
        target_date,
        COUNT(*),
        COALESCE(SUM(duration_seconds) / 60, 0),
        COALESCE(AVG(duration_seconds)::INTEGER, 0),
        COUNT(*) FILTER (WHERE sentiment = 'positive'),
        COUNT(*) FILTER (WHERE sentiment = 'neutral'),
        COUNT(*) FILTER (WHERE sentiment = 'negative'),
        COALESCE(AVG(sentiment_score), 0),
        COUNT(*) FILTER (WHERE outcome = 'lead_generated'),
        COUNT(*) FILTER (WHERE outcome = 'booking_made'),
        COUNT(*) FILTER (WHERE outcome = 'escalated')
    FROM call_logs
    WHERE DATE(started_at) = target_date
    ON CONFLICT (date) DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        total_duration_minutes = EXCLUDED.total_duration_minutes,
        avg_call_duration_seconds = EXCLUDED.avg_call_duration_seconds,
        positive_calls = EXCLUDED.positive_calls,
        neutral_calls = EXCLUDED.neutral_calls,
        negative_calls = EXCLUDED.negative_calls,
        avg_sentiment_score = EXCLUDED.avg_sentiment_score,
        leads_generated = EXCLUDED.leads_generated,
        bookings_made = EXCLUDED.bookings_made,
        escalations = EXCLUDED.escalations;
END;
$$ LANGUAGE plpgsql;
