# n8n Workflow v2 Setup Guide

## Overview

This guide covers the updated workflow that handles Retell AI function calls with the correct payload structure.

## Retell Payload Structure

Retell sends data in this format:
```json
{
  "call_id": "call_xxxxx",
  "body": {
    "name": "book_test_drive",
    "args": {
      "model_name": "Jupiter",
      "city": "Mumbai",
      "customer_name": "Test User",
      "customer_phone": "+919876543210"
    }
  }
}
```

**Data access patterns in n8n:**
- Function name: `{{ $json.body.name }}`
- Arguments: `{{ $json.body.args.model_name }}`, `{{ $json.body.args.city }}`, etc.
- Call ID: `{{ $json.call_id }}`

## Import Instructions

1. Open n8n: https://tvs-dealer-n8n-production.up.railway.app
2. Create Postgres credential first (see below)
3. Click **Add Workflow** → **Import from File**
4. Upload: `n8n/workflows/retell-function-handler-v2.json`
5. Update all Postgres nodes with your credential
6. **Activate** the workflow

## Postgres Credential Setup

| Field | Value |
|-------|-------|
| Credential Name | TVS Supabase DB |
| Host | aws-1-ap-southeast-1.pooler.supabase.com |
| Database | postgres |
| User | postgres.rwnkbwfigdxjrwvoafby |
| Password | [from Supabase Dashboard] |
| Port | 5432 |
| SSL | Disabled |

## Implemented Functions

### 1. get_on_road_price
Returns pricing for a model in a specific city.

### 2. check_availability
Checks stock availability for model/color combinations.

### 3. find_nearest_showroom
Lists showrooms in a city.

### 4. book_test_drive (Full Implementation)
Flow:
1. Validate required fields (customer_name, customer_phone, model_name, city)
2. Find showroom in city
3. Find model in database
4. Upsert client record
5. Insert test drive request
6. Send Slack notification
7. Return confirmation

### 5. get_model_specs
Returns vehicle specifications.

### 6. escalate_to_human (Full Implementation)
Flow:
1. Validate reason exists
2. Insert callback request
3. Send Slack notification
4. Return confirmation

## Slack Webhook Setup

Replace the placeholder URLs in these nodes:
- "Slack Test Drive Notification"
- "Slack Escalation Notification"

With your actual Slack webhook URL:
```
https://hooks.slack.com/services/YOUR/ACTUAL/WEBHOOK
```

## Test Commands

### Test book_test_drive
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_001",
    "body": {
      "name": "book_test_drive",
      "args": {
        "customer_name": "Rahul Kumar",
        "customer_phone": "+919876543210",
        "model_name": "Jupiter",
        "city": "Mumbai"
      }
    }
  }'
```

### Test escalate_to_human
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_002",
    "body": {
      "name": "escalate_to_human",
      "args": {
        "customer_name": "Rahul Kumar",
        "customer_phone": "+919876543210",
        "city": "Mumbai",
        "reason": "Want to discuss EMI options",
        "reason_category": "finance_inquiry",
        "model_name": "Apache RTR 160"
      }
    }
  }'
```

## Database Tables Required

Ensure these tables exist in Supabase:

### clients
```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  name VARCHAR(255),
  city VARCHAR(100),
  source_channel VARCHAR(20),
  last_contact TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### test_drive_requests
```sql
CREATE TABLE test_drive_requests (
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
```

### callbacks
```sql
CREATE TABLE callbacks (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_city VARCHAR(100),
  reason TEXT,
  reason_category VARCHAR(50),
  interested_model VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```
