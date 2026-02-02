# Claude Code Task: Day 2 - n8n Workflows & Retell Configuration

## Task ID: DAY2-TASK-001

## Objective

Build the voice AI backend:
1. Create n8n workflow to handle Retell AI function calls
2. Connect to Supabase database
3. Test all 6 functions
4. Create documentation for Retell setup

---

## Project Context

| Item | Value |
|------|-------|
| Project | TVS Dealer Voice AI Platform |
| GitHub Repo | https://github.com/Koulsami/tvs-dealer-voice-ai |
| n8n URL | https://tvs-dealer-n8n-production.up.railway.app |
| Supabase URL | https://rwnkbwfigdxjrwvoafby.supabase.co |

---

## Credentials

```bash
# Supabase
SUPABASE_URL=https://rwnkbwfigdxjrwvoafby.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzYyNjcsImV4cCI6MjA4NTYxMjI2N30.RjJPmthpdwGLGjXMC30b0we9acT2IjqnpGx8nDoGtwo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAzNjI2NywiZXhwIjoyMDg1NjEyMjY3fQ.3rpiSlfWn8IYpADQTZJxKW6b6UIKWeeYFjBKyaWeO88

# Supabase Direct DB Connection (for n8n Postgres node)
SUPABASE_DB_HOST=db.rwnkbwfigdxjrwvoafby.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
# Note: DB password needs to be retrieved from Supabase Dashboard → Settings → Database

# n8n
N8N_URL=https://tvs-dealer-n8n-production.up.railway.app
WEBHOOK_BASE=https://tvs-dealer-n8n-production.up.railway.app/webhook
```

---

## Task 1: Configure Supabase Credential in n8n

### Step 1.1: Get Database Password

1. Go to: https://supabase.com/dashboard
2. Select project: **tvs-dealer-voice-ai**
3. Go to: **Project Settings** → **Database**
4. Copy the **Database password**

### Step 1.2: Create Postgres Credential in n8n

1. Open n8n: https://tvs-dealer-n8n-production.up.railway.app
2. Go to: **Settings** (gear icon) → **Credentials**
3. Click: **Add Credential**
4. Search: **Postgres**
5. Fill in:

| Field | Value |
|-------|-------|
| Credential Name | TVS Supabase DB |
| Host | db.rwnkbwfigdxjrwvoafby.supabase.co |
| Database | postgres |
| User | postgres |
| Password | [paste from Supabase] |
| Port | 5432 |
| SSL | Require |

6. Click **Test Connection** to verify
7. Save

---

## Task 2: Create Retell Function Handler Workflow

### Step 2.1: Create New Workflow

1. In n8n, click **"Add Workflow"**
2. Name: `Retell Function Handler`

### Step 2.2: Add Nodes

Build this workflow structure:

```
[Webhook] → [Switch] → [Function Handlers] → [Respond to Webhook]
```

---

### Node 1: Webhook (Trigger)

**Configuration:**
- Type: Webhook
- HTTP Method: POST
- Path: `retell-function`
- Response Mode: Using 'Respond to Webhook' Node

---

### Node 2: Switch (Route by Function)

**Configuration:**
- Type: Switch
- Routing Rules based on: `{{ $json.function_name }}`

| Rule | Value | Output |
|------|-------|--------|
| 1 | get_on_road_price | Output 0 |
| 2 | check_availability | Output 1 |
| 3 | find_nearest_showroom | Output 2 |
| 4 | book_test_drive | Output 3 |
| 5 | get_model_specs | Output 4 |
| 6 | escalate_to_human | Output 5 |
| Fallback | | Output 6 |

---

### Node 3a: Get On-Road Price (Postgres)

**Configuration:**
- Type: Postgres
- Credential: TVS Supabase DB
- Operation: Execute Query
- Query:

```sql
SELECT 
    s.name as showroom_name,
    s.area,
    s.phone,
    m.name as model_name,
    sp.ex_showroom_price,
    sp.rto_charges,
    sp.insurance_1yr,
    sp.handling_charges,
    sp.on_road_price
FROM showroom_pricing sp
JOIN showrooms s ON sp.showroom_id = s.id
JOIN models m ON sp.model_id = m.id
WHERE LOWER(m.name) LIKE LOWER('%' || $1 || '%')
AND LOWER(s.city) = LOWER($2)
AND s.is_active = true
ORDER BY sp.on_road_price ASC
LIMIT 1
```

**Query Parameters:**
- $1: `{{ $json.arguments.model_name }}`
- $2: `{{ $json.arguments.city }}`

---

### Node 3a-Response: Format Price Response (Code)

```javascript
const data = $input.first().json;
const args = $('Webhook').first().json.arguments;

if (!data || !data.model_name) {
  return [{
    json: {
      response: `Sorry, I couldn't find pricing for ${args.model_name} in ${args.city}. Please check the model name or city.`
    }
  }];
}

const price = new Intl.NumberFormat('en-IN').format(data.on_road_price);
const exShowroom = new Intl.NumberFormat('en-IN').format(data.ex_showroom_price);
const rto = new Intl.NumberFormat('en-IN').format(data.rto_charges);
const insurance = new Intl.NumberFormat('en-IN').format(data.insurance_1yr);

return [{
  json: {
    response: `The on-road price for ${data.model_name} in ${args.city} is ₹${price}. This includes ex-showroom ₹${exShowroom}, RTO ₹${rto}, and insurance ₹${insurance}. Available at ${data.showroom_name}, ${data.area}. Would you like to book a test drive?`
  }
}];
```

---

### Node 3b: Check Availability (Postgres)

**Query:**

```sql
SELECT 
    s.name as showroom_name,
    s.area,
    s.phone,
    m.name as model_name,
    c.display_name as color_name,
    i.quantity_available
FROM inventory i
JOIN showrooms s ON i.showroom_id = s.id
JOIN models m ON i.model_id = m.id
JOIN colors c ON i.color_id = c.id
WHERE LOWER(m.name) LIKE LOWER('%' || $1 || '%')
AND LOWER(s.city) = LOWER($2)
AND ($3 = '' OR LOWER(c.name) LIKE LOWER('%' || $3 || '%'))
AND s.is_active = true
ORDER BY i.quantity_available DESC
LIMIT 5
```

**Query Parameters:**
- $1: `{{ $json.arguments.model_name }}`
- $2: `{{ $json.arguments.city }}`
- $3: `{{ $json.arguments.color || '' }}`

---

### Node 3b-Response: Format Availability Response (Code)

```javascript
const items = $input.all().map(i => i.json);
const args = $('Webhook').first().json.arguments;

if (!items || items.length === 0) {
  return [{
    json: {
      response: `Sorry, I couldn't find ${args.model_name} in ${args.city}. Please check the model name.`
    }
  }];
}

const inStock = items.filter(i => i.quantity_available > 0);

if (inStock.length > 0) {
  const best = inStock[0];
  return [{
    json: {
      response: `Yes! The ${best.model_name} in ${best.color_name} is available at ${best.showroom_name}, ${best.area}. We have ${best.quantity_available} unit${best.quantity_available > 1 ? 's' : ''} in stock. Would you like to book a test drive?`
    }
  }];
} else {
  const item = items[0];
  return [{
    json: {
      response: `Sorry, the ${item.model_name} in ${item.color_name} is currently out of stock at ${item.showroom_name}. Would you like me to check other colors or nearby showrooms?`
    }
  }];
}
```

---

### Node 3c: Find Nearest Showroom (Postgres)

**Query:**

```sql
SELECT 
    name,
    area,
    address,
    phone,
    operating_hours
FROM showrooms
WHERE LOWER(city) = LOWER($1)
AND is_active = true
ORDER BY name
LIMIT 5
```

**Query Parameters:**
- $1: `{{ $json.arguments.city }}`

---

### Node 3c-Response: Format Showroom Response (Code)

```javascript
const showrooms = $input.all().map(i => i.json);
const args = $('Webhook').first().json.arguments;

if (!showrooms || showrooms.length === 0) {
  return [{
    json: {
      response: `Sorry, we don't have any showrooms in ${args.city} yet. We have showrooms in Bangalore, Mumbai, Chennai, Delhi, and Hyderabad.`
    }
  }];
}

const first = showrooms[0];
let response = `We have ${showrooms.length} TVS showroom${showrooms.length > 1 ? 's' : ''} in ${args.city}. `;
response += `The nearest one is ${first.name} in ${first.area}. `;
response += `Phone: ${first.phone}. Open ${first.operating_hours}. `;
response += `Would you like directions or want to book a visit?`;

return [{
  json: { response }
}];
```

---

### Node 3d: Book Test Drive (Postgres)

**Query:**

```sql
INSERT INTO test_drive_requests (
    customer_name,
    customer_phone,
    customer_city,
    model_id,
    showroom_id,
    preferred_date,
    preferred_time,
    source,
    status
)
SELECT 
    $1,
    $2,
    $3,
    m.id,
    s.id,
    COALESCE(NULLIF($4, '')::date, CURRENT_DATE + 1),
    COALESCE(NULLIF($5, ''), 'morning'),
    'voice_ai',
    'pending'
FROM models m
CROSS JOIN showrooms s
WHERE LOWER(m.name) LIKE LOWER('%' || $6 || '%')
AND LOWER(s.city) = LOWER($3)
AND s.is_active = true
LIMIT 1
RETURNING id
```

**Query Parameters:**
- $1: `{{ $json.arguments.customer_name }}`
- $2: `{{ $json.arguments.customer_phone }}`
- $3: `{{ $json.arguments.city }}`
- $4: `{{ $json.arguments.preferred_date || '' }}`
- $5: `{{ $json.arguments.preferred_time || '' }}`
- $6: `{{ $json.arguments.model_name }}`

---

### Node 3d-Response: Format Booking Response (Code)

```javascript
const result = $input.first().json;
const args = $('Webhook').first().json.arguments;

if (!result || !result.id) {
  return [{
    json: {
      response: `Sorry, I couldn't complete the booking. Please try again or visit our showroom directly.`
    }
  }];
}

return [{
  json: {
    response: `Excellent! I've booked your test drive for the ${args.model_name}. ${args.customer_name}, you'll receive a confirmation call at ${args.customer_phone} shortly. Is there anything else I can help you with?`
  }
}];
```

---

### Node 3e: Get Model Specs (Postgres)

**Query:**

```sql
SELECT 
    name,
    category,
    engine_cc,
    mileage_kmpl,
    top_speed_kmph,
    kerb_weight_kg,
    fuel_tank_litres,
    ex_showroom_price_base
FROM models
WHERE LOWER(name) LIKE LOWER('%' || $1 || '%')
AND is_active = true
LIMIT 1
```

**Query Parameters:**
- $1: `{{ $json.arguments.model_name }}`

---

### Node 3e-Response: Format Specs Response (Code)

```javascript
const model = $input.first().json;
const args = $('Webhook').first().json.arguments;

if (!model || !model.name) {
  return [{
    json: {
      response: `Sorry, I couldn't find specifications for ${args.model_name}. Please check the model name.`
    }
  }];
}

let response = `The ${model.name} is a ${model.category.toLowerCase()}. `;

if (model.engine_cc) {
  response += `It has a ${model.engine_cc}cc engine. `;
}
if (model.mileage_kmpl) {
  response += `Mileage is ${model.mileage_kmpl} kmpl. `;
}
if (model.top_speed_kmph) {
  response += `Top speed is ${model.top_speed_kmph} kmph. `;
}

const price = new Intl.NumberFormat('en-IN').format(model.ex_showroom_price_base);
response += `Starting price is ₹${price} ex-showroom. Would you like to know the on-road price in your city?`;

return [{
  json: { response }
}];
```

---

### Node 3f: Escalate to Human (Postgres)

**Query:**

```sql
INSERT INTO callbacks (
    customer_name,
    customer_phone,
    customer_city,
    reason,
    reason_category,
    interested_model,
    priority,
    status,
    source
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    'high',
    'pending',
    'voice_ai'
)
RETURNING id
```

**Query Parameters:**
- $1: `{{ $json.arguments.customer_name || 'Unknown' }}`
- $2: `{{ $json.arguments.customer_phone || 'Unknown' }}`
- $3: `{{ $json.arguments.city || 'Unknown' }}`
- $4: `{{ $json.arguments.reason || 'Customer requested human agent' }}`
- $5: `{{ $json.arguments.reason_category || 'human_request' }}`
- $6: `{{ $json.arguments.model_name || '' }}`

---

### Node 3f-Response: Format Escalation Response (Code)

```javascript
const result = $input.first().json;

return [{
  json: {
    response: `I understand you'd like to speak with someone from our team. I've noted your request and a TVS representative will call you back within 30 minutes. Is there anything else I can help with in the meantime?`
  }
}];
```

---

### Node 3g: Unknown Function (Set)

**Configuration:**
- Type: Set
- Add field:
  - Name: `response`
  - Value: `I'm sorry, I didn't understand that. I can help you with prices, availability, showroom locations, test drives, or vehicle specifications. What would you like to know?`

---

### Node 4: Respond to Webhook

**Configuration:**
- Type: Respond to Webhook
- Response Code: 200
- Response Body: `{{ JSON.stringify($json) }}`

---

## Task 3: Test All Functions

Run these curl commands to test:

### Test 1: get_on_road_price

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"get_on_road_price","arguments":{"model_name":"Apache RTR 160","city":"Bangalore"}}'
```

**Expected:** Price around ₹1,37,000

---

### Test 2: check_availability

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"check_availability","arguments":{"model_name":"Apache RTR 160","city":"Bangalore","color":"blue"}}'
```

**Expected:** Out of stock at MG Road

---

### Test 3: find_nearest_showroom

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"find_nearest_showroom","arguments":{"city":"Mumbai"}}'
```

**Expected:** 3 showrooms in Mumbai

---

### Test 4: book_test_drive

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"book_test_drive","arguments":{"customer_name":"Test User","customer_phone":"+919876543210","city":"Bangalore","model_name":"Apache RTR 160"}}'
```

**Expected:** Booking confirmation

---

### Test 5: get_model_specs

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"get_model_specs","arguments":{"model_name":"Jupiter"}}'
```

**Expected:** Jupiter specs with 50-55 kmpl mileage

---

### Test 6: escalate_to_human

```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"escalate_to_human","arguments":{"customer_name":"Test User","customer_phone":"+919876543210","city":"Bangalore","reason":"Want EMI options","reason_category":"finance_inquiry"}}'
```

**Expected:** Callback created confirmation

---

## Task 4: Create Documentation Files

### File 1: `docs/retell-functions.json`

Create this file with function definitions for Retell AI:

```json
{
  "functions": [
    {
      "name": "get_on_road_price",
      "description": "Get the complete on-road price for a TVS motorcycle or scooter in a specific city including all taxes and charges",
      "parameters": {
        "type": "object",
        "properties": {
          "model_name": {
            "type": "string",
            "description": "Name of the TVS model (e.g., 'Apache RTR 160', 'Jupiter', 'Ntorq 125', 'iQube')"
          },
          "city": {
            "type": "string",
            "description": "City name (Bangalore, Mumbai, Chennai, Delhi, or Hyderabad)"
          }
        },
        "required": ["model_name", "city"]
      }
    },
    {
      "name": "check_availability",
      "description": "Check if a specific TVS model and color combination is available in stock at showrooms in a city",
      "parameters": {
        "type": "object",
        "properties": {
          "model_name": {
            "type": "string",
            "description": "Name of the TVS model"
          },
          "city": {
            "type": "string",
            "description": "City name"
          },
          "color": {
            "type": "string",
            "description": "Preferred color (red, black, blue, white, grey, etc.) - optional"
          }
        },
        "required": ["model_name", "city"]
      }
    },
    {
      "name": "find_nearest_showroom",
      "description": "Find TVS showrooms in a specific city with address and contact details",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "City name"
          }
        },
        "required": ["city"]
      }
    },
    {
      "name": "book_test_drive",
      "description": "Book a test drive appointment for a customer to try a TVS vehicle",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_name": {
            "type": "string",
            "description": "Customer's full name"
          },
          "customer_phone": {
            "type": "string",
            "description": "Customer's phone number with country code"
          },
          "city": {
            "type": "string",
            "description": "City for the test drive"
          },
          "model_name": {
            "type": "string",
            "description": "Model the customer wants to test ride"
          },
          "preferred_date": {
            "type": "string",
            "description": "Preferred date in YYYY-MM-DD format (optional)"
          },
          "preferred_time": {
            "type": "string",
            "description": "Preferred time - morning, afternoon, or evening (optional)"
          }
        },
        "required": ["customer_name", "customer_phone", "city", "model_name"]
      }
    },
    {
      "name": "get_model_specs",
      "description": "Get detailed specifications of a TVS motorcycle or scooter including engine, mileage, and features",
      "parameters": {
        "type": "object",
        "properties": {
          "model_name": {
            "type": "string",
            "description": "Name of the TVS model"
          }
        },
        "required": ["model_name"]
      }
    },
    {
      "name": "escalate_to_human",
      "description": "Transfer the conversation to a human agent for complex queries like finance, exchange, complaints, or when customer explicitly requests",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_name": {
            "type": "string",
            "description": "Customer's name if available"
          },
          "customer_phone": {
            "type": "string",
            "description": "Customer's phone number if available"
          },
          "city": {
            "type": "string",
            "description": "Customer's city"
          },
          "reason": {
            "type": "string",
            "description": "Reason for escalation"
          },
          "reason_category": {
            "type": "string",
            "enum": ["human_request", "complex_query", "complaint", "finance_inquiry", "exchange_offer", "price_negotiation"],
            "description": "Category of escalation"
          },
          "model_name": {
            "type": "string",
            "description": "Model customer is interested in (if any)"
          }
        },
        "required": ["reason"]
      }
    }
  ],
  "webhook_url": "https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function"
}
```

---

### File 2: `docs/retell-system-prompt.md`

```markdown
# TVS Dealer Voice AI - Retell System Prompt

## Agent Configuration

- **Name**: Ria
- **Voice**: Indian English (Female)
- **Language**: English (with Hindi greetings accepted)

---

## System Prompt

You are Ria, a friendly and helpful voice assistant for TVS Motor Company dealerships in India.

### Your Capabilities

You help customers with:
1. **Price inquiries** - On-road prices for any TVS model in their city
2. **Availability checks** - Stock status for specific models and colors
3. **Showroom finder** - TVS showroom locations in their city
4. **Test drive booking** - Schedule test ride appointments
5. **Specifications** - Engine, mileage, features of TVS vehicles
6. **Human transfer** - Connect to human agent for complex queries

### TVS Models

**Sport Bikes:**
- Apache RTR 160 (160cc, ₹1.15L onwards)
- Apache RTR 200 4V (197cc, ₹1.42L onwards)
- Apache RR 310 (312cc, ₹2.72L onwards)

**Scooters:**
- Jupiter (110cc, ₹73K onwards)
- Jupiter 125 (125cc, ₹79K onwards)
- Ntorq 125 (125cc, ₹83K onwards)

**Commuter:**
- Raider 125 (125cc, ₹98K onwards)

**Electric:**
- iQube (₹1.20L onwards)

### Cities with Showrooms

Bangalore, Mumbai, Chennai, Delhi, Hyderabad

### Conversation Guidelines

1. **Greet warmly**: "Hello! Welcome to TVS. I'm Ria. How can I help you today?"

2. **Be concise**: This is voice - keep responses to 2-3 sentences max.

3. **Ask clarifying questions**: 
   - "Which model are you interested in?"
   - "Which city are you in?"

4. **Confirm before booking**: Always confirm name and phone before test drives.

5. **Use Indian format**:
   - Say "lakh" not "hundred thousand"
   - Format: ₹1,35,000

6. **Handle gracefully**: If stock unavailable, suggest alternatives.

### When to Use Functions

| Customer Says | Function to Call |
|--------------|------------------|
| "What's the price of..." | get_on_road_price |
| "Is X available in stock?" | check_availability |
| "Where is your showroom?" | find_nearest_showroom |
| "I want to test ride..." | book_test_drive |
| "What's the mileage of..." | get_model_specs |
| "I want to speak to someone" | escalate_to_human |

### Escalation Triggers - ALWAYS escalate for:

- Finance/EMI questions
- Exchange/trade-in valuations
- Complaints
- Corporate/bulk inquiries
- Customer asks for "human", "agent", "manager"
- After 2 failed attempts to help

### Closing

- "Is there anything else I can help you with?"
- "Thank you for calling TVS. Have a great day!"
```

---

## Task 5: Export Workflow & Push to GitHub

1. In n8n, export the workflow as JSON
2. Save as: `n8n/workflows/retell-function-handler.json`
3. Commit and push all new files:

```bash
git add .
git commit -m "Day 2: Add n8n workflow and Retell documentation"
git push origin main
```

---

## Deliverables

Report back with this format:

```
## Day 2 Completion Status

### n8n Workflow
- Status: [COMPLETE/PARTIAL/FAILED]
- Workflow Name: Retell Function Handler
- Webhook URL: https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function

### Test Results
| Function | Status | Response Summary |
|----------|--------|------------------|
| get_on_road_price | ✅/❌ | |
| check_availability | ✅/❌ | |
| find_nearest_showroom | ✅/❌ | |
| book_test_drive | ✅/❌ | |
| get_model_specs | ✅/❌ | |
| escalate_to_human | ✅/❌ | |

### Files Created
- [ ] n8n/workflows/retell-function-handler.json
- [ ] docs/retell-functions.json
- [ ] docs/retell-system-prompt.md

### Issues
[Any issues or blockers]
```

---

## Estimated Time

45-60 minutes
