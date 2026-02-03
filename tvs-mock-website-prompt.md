# Prompt: Build TVS Dealer Voice AI Demo Website

## Role Assignment

You are a **Senior Frontend Developer** building a demo website for the **TVS Dealer Voice AI Platform**. This is a proof-of-concept demonstration that showcases an AI-powered voice assistant for TVS Motor Company's dealer network.

You will create **two pages**:
1. **Mock TVS Website** - Product showcase with floating AI voice assistant widget
2. **Admin Data Panel** - Data management interface for demonstrators to show dynamic data capabilities

---

## Project Context

### What's Already Built (Backend)
| Component | Status | Details |
|-----------|--------|---------|
| **Supabase Database** | ✅ Complete | 11 tables with sample data |
| **n8n Workflows** | ✅ Complete | 7 working functions |
| **Retell AI Agent** | ✅ Complete | Voice AI configured |
| **Slack Notifications** | ✅ Complete | Leads & escalations |

### Working Voice AI Functions
| Function | What It Does |
|----------|--------------|
| `get_on_road_price` | Returns pricing for model + city |
| `check_availability` | Checks inventory stock |
| `find_nearest_showroom` | Lists showrooms in city |
| `book_test_drive` | Creates booking + Slack notification |
| `get_model_specs` | Returns bike specifications |
| `escalate_to_human` | Creates callback + Slack alert |
| `get_active_promotions` | Returns current offers |

---

## Page 1: Mock TVS Website

### Purpose
A visually appealing mock TVS motorcycle website that embeds the Retell AI voice widget. Visitors can browse products and click the floating widget to talk to the AI assistant.

### Requirements

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: TVS Logo | Navigation (Home, Products, Contact)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO SECTION                                               │
│  - Large banner image/gradient                              │
│  - Headline: "Experience the Thrill of TVS"                 │
│  - Subtext: "Talk to our AI Assistant for instant help"     │
│  - CTA Button: "Explore Models"                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRODUCT GRID (Fetch from Supabase)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Apache  │ │  Apache  │ │  Jupiter │ │  Ntorq   │       │
│  │ RTR 160  │ │ RTR 200  │ │   125    │ │   125    │       │
│  │ ₹1.15L   │ │ ₹1.42L   │ │ ₹79,000  │ │ ₹83,000  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FEATURES SECTION                                           │
│  - "Ask about prices" | "Check availability" | "Book test"  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: © TVS Motor Company | Demo Site                    │
└─────────────────────────────────────────────────────────────┘
                                          ┌─────────────────┐
                                          │  🎤 Talk to Us  │  ← Floating
                                          │   AI Assistant  │    Widget
                                          └─────────────────┘
```

#### Retell Widget Integration

**Widget Script (Add to HTML):**
```html
<script src="https://cdn.retellai.com/web-sdk/retell-client-sdk.js"></script>
```

**Widget Initialization:**
```javascript
const retellClient = new RetellWebClient();

// Configuration
const RETELL_AGENT_ID = "agent_2c149db1a0a0a022c2c2b7878f";

// Start call when button clicked
async function startVoiceCall() {
  try {
    await retellClient.startCall({
      accessToken: await getAccessToken(), // Get from your backend or use agent ID directly
      agentId: RETELL_AGENT_ID,
      sampleRate: 24000,
      enableUpdate: true
    });
  } catch (error) {
    console.error("Failed to start call:", error);
  }
}

// Event handlers
retellClient.on("call_started", () => {
  console.log("Call started");
  updateWidgetState("active");
});

retellClient.on("call_ended", () => {
  console.log("Call ended");
  updateWidgetState("idle");
});

retellClient.on("agent_start_talking", () => {
  updateWidgetState("speaking");
});

retellClient.on("agent_stop_talking", () => {
  updateWidgetState("listening");
});

retellClient.on("error", (error) => {
  console.error("Retell error:", error);
});
```

**Alternative: Use Retell's Embedded Widget (Simpler)**
```html
<!-- Retell Embedded Widget -->
<script>
  window.retellEmbedConfig = {
    agentId: "agent_2c149db1a0a0a022c2c2b7878f",
    position: "bottom-right",
    buttonStyle: {
      backgroundColor: "#E31837", // TVS Red
      color: "#FFFFFF",
      borderRadius: "50px",
      padding: "15px 25px"
    },
    buttonText: "🎤 Talk to Us"
  };
</script>
<script src="https://cdn.retellai.com/widget/embed.js" async></script>
```

#### Supabase Integration (Fetch Products)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rwnkbwfigdxjrwvoafby.supabase.co',
  'YOUR_ANON_KEY' // Get from Supabase dashboard
);

// Fetch models for product grid
async function fetchModels() {
  const { data, error } = await supabase
    .from('models')
    .select('id, name, category, engine_cc, ex_showroom_price_base, image_url')
    .eq('is_active', true)
    .order('category');
  
  if (error) {
    console.error('Error fetching models:', error);
    return [];
  }
  return data;
}
```

#### Design Requirements
- **Color Scheme**: TVS Red (#E31837), White, Black
- **Typography**: Modern, clean sans-serif (Inter, Roboto, or similar)
- **Responsive**: Mobile-first, works on all screen sizes
- **Images**: Use placeholder images or TVS-style motorcycle silhouettes
- **Animation**: Subtle hover effects on cards, smooth widget transitions

---

## Page 2: Admin Data Panel

### Purpose
Allow demonstrators to **add, edit, and delete data** in real-time to prove the AI assistant responds to dynamic data changes. This is the "wow factor" for the demo.

### Demo Flow
1. Demonstrator opens Admin Panel
2. Adds a new promotion: "Festival Sale - ₹10,000 off on Apache!"
3. Opens voice widget on main site
4. Asks: "Do you have any offers?"
5. AI responds with the NEW promotion just added!

### Requirements

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN HEADER: TVS Admin Panel | [Main Site ↗]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TAB NAVIGATION                                             │
│  [ Models ] [ Showrooms ] [ Pricing ] [ Inventory ]         │
│  [ Promotions ] [ Test Drives ] [ Callbacks ]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DATA TABLE (Example: Promotions Tab)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ + Add New Promotion                              🔄 Refresh││
│  ├────────┬──────────────────┬──────────┬──────────┬───────┤│
│  │ Name   │ Short Message    │ Discount │ Valid To │ Action││
│  ├────────┼──────────────────┼──────────┼──────────┼───────┤│
│  │ Summer │ ₹5000 off on all │ ₹5,000   │ Mar 2026 │ ✏️ 🗑️ ││
│  │ Sale   │ scooters!        │          │          │       ││
│  ├────────┼──────────────────┼──────────┼──────────┼───────┤│
│  │ [Add Row]                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  QUICK STATS                                                │
│  [ 8 Models ] [ 12 Showrooms ] [ 5 Pending Test Drives ]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Database Tables to Manage

**Priority 1: Promotions** (Best for demo - instant impact)
```sql
-- Table: promotions
id, name, description, short_message, promotion_type, 
discount_amount, valid_from, valid_until, is_active, priority
```

**Priority 2: Pricing** (Show price changes)
```sql
-- Table: showroom_pricing
showroom_id, model_id, ex_showroom_price, rto_charges, 
insurance_1yr, on_road_price (computed)
```

**Priority 3: Inventory** (Show availability changes)
```sql
-- Table: inventory
showroom_id, model_id, color_id, quantity_available
```

**Priority 4: View-only Tables**
```sql
-- test_drive_requests (View pending bookings)
-- callbacks (View escalation requests)
```

#### CRUD Operations with Supabase

**Create (Insert):**
```javascript
async function addPromotion(promotion) {
  const { data, error } = await supabase
    .from('promotions')
    .insert([{
      name: promotion.name,
      description: promotion.description,
      short_message: promotion.shortMessage,
      promotion_type: promotion.type,
      discount_amount: promotion.discount,
      valid_from: promotion.validFrom,
      valid_until: promotion.validUntil,
      is_active: true,
      priority: 1
    }])
    .select();
  
  return { data, error };
}
```

**Read (Fetch):**
```javascript
async function fetchPromotions() {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('priority', { ascending: false });
  
  return { data, error };
}
```

**Update (Edit):**
```javascript
async function updatePromotion(id, updates) {
  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', id)
    .select();
  
  return { data, error };
}
```

**Delete:**
```javascript
async function deletePromotion(id) {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);
  
  return { error };
}
```

#### Real-time Updates (Optional but impressive)
```javascript
// Subscribe to changes
const subscription = supabase
  .channel('promotions-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'promotions' },
    (payload) => {
      console.log('Change received!', payload);
      refreshTable(); // Update UI
    }
  )
  .subscribe();
```

---

## Technical Specifications

### Technology Stack
| Component | Technology |
|-----------|------------|
| Framework | Vanilla HTML/CSS/JS OR React (your choice) |
| Database | Supabase (PostgreSQL) |
| Voice AI | Retell AI Web SDK |
| Styling | Tailwind CSS OR custom CSS |
| Icons | Heroicons, Lucide, or Font Awesome |
| Hosting | Can be deployed to Vercel, Netlify, or HF Spaces |

### Supabase Configuration
```javascript
// supabase-config.js
const SUPABASE_URL = 'https://rwnkbwfigdxjrwvoafby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Get from dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Retell Configuration
```javascript
// retell-config.js
const RETELL_AGENT_ID = 'agent_2c149db1a0a0a022c2c2b7878f';
```

---

## Database Schema Reference

### Models Table
```sql
models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),           -- "Apache RTR 160"
  category VARCHAR(50),        -- "Sport", "Scooter", "Commuter"
  engine_cc INTEGER,           -- 160
  ex_showroom_price_base DECIMAL, -- 115000
  image_url VARCHAR(500),
  is_active BOOLEAN
)
```

### Showrooms Table
```sql
showrooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),           -- "TVS - MG Road"
  city VARCHAR(100),           -- "Bangalore"
  area VARCHAR(100),           -- "MG Road"
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN
)
```

### Promotions Table
```sql
promotions (
  id UUID PRIMARY KEY,
  name VARCHAR(100),           -- "Summer Sale"
  description TEXT,            -- Full description
  short_message TEXT,          -- "₹5000 off on all scooters!"
  promotion_type VARCHAR(50),  -- "discount", "cashback", "exchange"
  discount_amount DECIMAL,     -- 5000
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN,
  priority INTEGER             -- Higher = shown first
)
```

### Inventory Table
```sql
inventory (
  id SERIAL PRIMARY KEY,
  showroom_id INTEGER,
  model_id INTEGER,
  color_id INTEGER,
  quantity_available INTEGER,  -- 0 = out of stock
  expected_arrival DATE        -- If out of stock
)
```

### Test Drive Requests Table (View Only)
```sql
test_drive_requests (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  model_id INTEGER,
  showroom_id INTEGER,
  city VARCHAR(100),
  status VARCHAR(20),          -- "pending", "confirmed", "completed"
  created_at TIMESTAMP
)
```

### Callbacks Table (View Only)
```sql
callbacks (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  reason VARCHAR(200),
  priority VARCHAR(20),        -- "normal", "high", "urgent"
  status VARCHAR(20),          -- "pending", "contacted", "resolved"
  created_at TIMESTAMP
)
```

---

## Sample Data for Reference

### Models
| Name | Category | Engine | Base Price |
|------|----------|--------|------------|
| Apache RTR 160 | Sport | 160cc | ₹1,15,000 |
| Apache RTR 200 4V | Sport | 200cc | ₹1,42,000 |
| Jupiter 125 | Scooter | 125cc | ₹79,000 |
| Ntorq 125 | Scooter | 125cc | ₹83,000 |
| Raider 125 | Commuter | 125cc | ₹98,000 |
| iQube | Electric | - | ₹1,20,000 |

### Cities with Showrooms
- Bangalore (3 showrooms)
- Mumbai (3 showrooms)
- Chennai (2 showrooms)
- Delhi (2 showrooms)
- Hyderabad (2 showrooms)

---

## Deliverables

### Page 1: Mock TVS Website (index.html)
- [ ] Responsive header with navigation
- [ ] Hero section with CTA
- [ ] Product grid fetching from Supabase
- [ ] Features/benefits section
- [ ] Footer
- [ ] Floating Retell voice widget (bottom-right)
- [ ] Proper error handling for widget

### Page 2: Admin Panel (admin.html)
- [ ] Tab navigation for different tables
- [ ] Promotions CRUD (Create, Read, Update, Delete)
- [ ] Pricing viewer/editor
- [ ] Inventory viewer/editor
- [ ] Test Drives viewer (pending bookings)
- [ ] Callbacks viewer (escalation requests)
- [ ] Quick stats dashboard
- [ ] Link back to main site

### Bonus Features
- [ ] Real-time sync indicator
- [ ] Toast notifications for actions
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsive admin

---

## Testing Checklist

### Voice Widget Tests
1. [ ] Widget button appears on page load
2. [ ] Clicking widget starts voice call
3. [ ] Can ask "What's the price of Jupiter in Bangalore?"
4. [ ] Can ask "Do you have any offers?"
5. [ ] Can say "Book a test drive"
6. [ ] Widget shows call state (idle/active/speaking)
7. [ ] Call ends cleanly

### Admin Panel Tests
1. [ ] Can view all promotions
2. [ ] Can add new promotion
3. [ ] Can edit existing promotion
4. [ ] Can delete promotion
5. [ ] Can toggle promotion active/inactive
6. [ ] Changes reflect in voice AI within seconds
7. [ ] Can view test drive requests
8. [ ] Can view callback requests

### Cross-Page Tests
1. [ ] Add promotion in admin
2. [ ] Ask voice AI about offers
3. [ ] AI mentions the new promotion ✓

---

## File Structure

```
tvs-demo/
├── index.html          # Mock TVS Website
├── admin.html          # Admin Data Panel
├── css/
│   ├── style.css       # Main site styles
│   └── admin.css       # Admin panel styles
├── js/
│   ├── supabase.js     # Supabase client config
│   ├── retell.js       # Retell widget integration
│   ├── products.js     # Product grid logic
│   └── admin.js        # Admin CRUD operations
└── assets/
    ├── logo.svg        # TVS logo
    └── images/         # Product images
```

---

## Important Notes

1. **Supabase Anon Key**: Get from Supabase Dashboard → Settings → API
2. **Retell Agent ID**: `agent_2c149db1a0a0a022c2c2b7878f`
3. **Don't hardcode sensitive keys** in frontend - use environment variables for production
4. **Mobile Support**: Voice widget should work on mobile browsers
5. **Error Handling**: Always show user-friendly error messages

---

## Demo Script (For Reference)

**Demo Flow:**
1. Open mock website, show product grid
2. Click voice widget, ask "What's the price of Apache in Bangalore?"
3. AI responds with real pricing from database
4. Open admin panel in new tab
5. Add new promotion: "Demo Special - ₹8000 off today only!"
6. Go back to voice widget, ask "Any offers available?"
7. AI responds with the NEW promotion just added!
8. Show test_drive_requests table updating in real-time when someone books

This proves the system is **fully dynamic** and **production-ready**!
