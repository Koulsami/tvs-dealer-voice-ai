# n8n Setup Guide - TVS Dealer Voice AI

## Step 1: Configure Supabase Database Credential

1. Open n8n: https://tvs-dealer-n8n-production.up.railway.app
2. Go to **Settings** (gear icon) → **Credentials**
3. Click **Add Credential**
4. Search for **Postgres**
5. Fill in:

| Field | Value |
|-------|-------|
| Credential Name | TVS Supabase DB |
| Host | db.rwnkbwfigdxjrwvoafby.supabase.co |
| Database | postgres |
| User | postgres |
| Password | [Get from Supabase Dashboard → Settings → Database] |
| Port | 5432 |
| SSL | Require |

6. Click **Test Connection** to verify
7. Save

## Step 2: Import the Workflow

1. In n8n, click **Add Workflow**
2. Click the **...** menu → **Import from File**
3. Upload: `n8n/workflows/retell-function-handler.json`
4. Update all Postgres nodes to use the "TVS Supabase DB" credential
5. Save and **Activate** the workflow

## Step 3: Verify Webhook URL

After activation, the webhook will be available at:
```
https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function
```

## Step 4: Test the Functions

### Test get_on_road_price
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"get_on_road_price","arguments":{"model_name":"Apache RTR 160","city":"Bangalore"}}'
```

### Test check_availability
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"check_availability","arguments":{"model_name":"Apache RTR 160","city":"Bangalore","color":"blue"}}'
```

### Test find_nearest_showroom
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"find_nearest_showroom","arguments":{"city":"Mumbai"}}'
```

### Test book_test_drive
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"book_test_drive","arguments":{"customer_name":"Test User","customer_phone":"+919876543210","city":"Bangalore","model_name":"Apache RTR 160"}}'
```

### Test get_model_specs
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"get_model_specs","arguments":{"model_name":"Jupiter"}}'
```

### Test escalate_to_human
```bash
curl -X POST https://tvs-dealer-n8n-production.up.railway.app/webhook/retell-function \
  -H "Content-Type: application/json" \
  -d '{"function_name":"escalate_to_human","arguments":{"customer_name":"Test User","customer_phone":"+919876543210","city":"Bangalore","reason":"Want EMI options","reason_category":"finance_inquiry"}}'
```

## Troubleshooting

### Webhook returns 404
- Ensure the workflow is **activated** (toggle should be ON)
- Check the webhook path is exactly `retell-function`

### Database connection fails
- Verify Supabase credentials
- Check SSL is set to "Require"
- Ensure the database password is correct

### Query returns empty
- Verify the database has seed data
- Check table names match (showrooms, models, etc.)
