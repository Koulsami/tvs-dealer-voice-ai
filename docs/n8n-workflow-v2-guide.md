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

### 5. get_model_specs (Full Implementation)
Returns vehicle specifications with structured data.

Flow:
1. Query model specifications from database
2. Check if model was found
3. If found: Return detailed specs (engine, mileage, speed, weight, fuel tank)
4. If not found: Return available models list

### 6. escalate_to_human (Full Implementation)
**Required fields:** customer_phone, reason
**Optional fields:** customer_name, conversation_summary, interested_model, city, priority

Flow:
1. Validate required fields (customer_phone AND reason)
2. Check if customer_name provided → Upsert client record (optional)
3. Insert callback request with client_id (if available)
4. Send Slack notification with all details
5. Return personalized confirmation (finance-aware)

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

### Test escalate_to_human (with customer name)
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
        "interested_model": "Apache RTR 160",
        "conversation_summary": "Customer inquired about Apache RTR 160 pricing and wants detailed EMI information",
        "priority": "normal"
      }
    }
  }'
```

### Test escalate_to_human (minimal - no customer name)
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_003",
    "body": {
      "name": "escalate_to_human",
      "args": {
        "customer_phone": "+919876543210",
        "reason": "Customer wants to speak with a manager"
      }
    }
  }'
```

### Test get_model_specs
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_specs_001",
    "body": {
      "name": "get_model_specs",
      "args": {
        "model_name": "Apache RTR 160"
      }
    }
  }'
```

### Test book_test_drive - Missing Phone
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_book_nophone_002",
    "body": {
      "name": "book_test_drive",
      "args": {
        "model_name": "Apache",
        "city": "Bangalore",
        "customer_name": "Test No Phone"
      }
    }
  }'
```

### Test escalate_to_human - Full Details (High Priority)
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_escalate_full_001",
    "body": {
      "name": "escalate_to_human",
      "args": {
        "reason": "Customer wants EMI details",
        "customer_phone": "+919876543211",
        "customer_name": "EMI Query User",
        "conversation_summary": "Interested in Apache RTR 160, asking about finance options",
        "interested_model": "Apache RTR 160",
        "city": "Bangalore",
        "priority": "high"
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
```

## Definition of Done

- [ ] Switch node has cases for: `book_test_drive`, `escalate_to_human`, `get_model_specs`
- [ ] All validation nodes correctly reject incomplete requests
- [ ] Database records created in: `clients`, `test_drive_requests`, `callbacks`
- [ ] Slack nodes configured (with placeholder URLs, continueOnFail=true)
- [ ] All response formats match: `{ "response": "...", "data": {...} }`
- [ ] All test payloads return expected responses
- [ ] No n8n execution errors in history

## Response Format

All functions return responses in this format:
```json
{
  "response": "Human-readable message for voice AI",
  "data": {
    "key": "value",
    "...": "..."
  }
}
```

On errors:
```json
{
  "response": "User-friendly error message",
  "data": {
    "error": "error_code",
    "...": "additional context"
  }
}
```
