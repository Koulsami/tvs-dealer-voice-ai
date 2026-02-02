# Claude Code Task: Deploy n8n to Railway

## Task ID: DAY1-TASK-003

## Objective

Deploy n8n workflow automation platform to Railway from the existing GitHub repository.

---

## Project Context

| Item | Value |
|------|-------|
| Project Name | TVS Dealer Voice AI Platform |
| GitHub Repo | https://github.com/Koulsami/tvs-dealer-voice-ai |
| Current Status | Repo exists with basic structure, n8n NOT deployed |
| Your Role | Developer - execute deployment tasks |

---

## Pre-requisites

Before starting, verify you have:
- [ ] Access to the GitHub repository
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Ability to authenticate with Railway

---

## Task 1: Verify and Update n8n Configuration Files

### 1.1 Check Current State

Navigate to the repository and check what exists:

```bash
cd tvs-dealer-voice-ai
ls -la n8n/
```

### 1.2 Required Files in `n8n/` Directory

Ensure these files exist with the correct content:

#### File: `n8n/Dockerfile`

```dockerfile
FROM n8nio/n8n:latest

# Environment Configuration
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=https
ENV GENERIC_TIMEZONE=Asia/Kolkata
ENV TZ=Asia/Kolkata

# Data persistence
ENV N8N_USER_FOLDER=/home/node/.n8n

# Disable diagnostics
ENV N8N_DIAGNOSTICS_ENABLED=false
ENV N8N_PERSONALIZATION_ENABLED=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5678/healthz || exit 1

# Expose port
EXPOSE 5678

# Start command
CMD ["n8n", "start"]
```

#### File: `n8n/.env.example`

```bash
# n8n Core Settings
N8N_ENCRYPTION_KEY=your-32-character-encryption-key-here
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https

# Webhook Configuration
WEBHOOK_URL=https://your-railway-domain.up.railway.app

# Security
N8N_SECURE_COOKIE=false

# Timezone
GENERIC_TIMEZONE=Asia/Kolkata

# Supabase Connection (for workflows)
SUPABASE_URL=https://rwnkbwfigdxjrwvoafby.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### File: `n8n/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "n8n start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 Create or Update Files

If any file is missing or incorrect, create/update it with the content above.

---

## Task 2: Commit and Push to GitHub

After ensuring all files are correct:

```bash
cd tvs-dealer-voice-ai

# Add all changes
git add .

# Commit
git commit -m "Add n8n Railway deployment configuration"

# Push to GitHub
git push origin main
```

---

## Task 3: Deploy to Railway

### 3.1 Login to Railway

```bash
railway login
```

If browser-based login doesn't work, use:

```bash
railway login --browserless
```

### 3.2 Create New Railway Project

```bash
# Navigate to n8n directory
cd n8n

# Initialize Railway project
railway init
```

When prompted:
- Select "Create new project"
- Name it: `tvs-voice-ai-n8n`

### 3.3 Link to Service

```bash
railway link
```

### 3.4 Set Environment Variables

```bash
# Generate encryption key (32 characters)
railway variables set N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Set other required variables
railway variables set N8N_HOST=0.0.0.0
railway variables set N8N_PORT=5678
railway variables set N8N_PROTOCOL=https
railway variables set N8N_SECURE_COOKIE=false
railway variables set GENERIC_TIMEZONE=Asia/Kolkata

# Supabase credentials
railway variables set SUPABASE_URL=https://rwnkbwfigdxjrwvoafby.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzYyNjcsImV4cCI6MjA4NTYxMjI2N30.RjJPmthpdwGLGjXMC30b0we9acT2IjqnpGx8nDoGtwo
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bmtid2ZpZ2R4anJ3dm9hZmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAzNjI2NywiZXhwIjoyMDg1NjEyMjY3fQ.3rpiSlfWn8IYpADQTZJxKW6b6UIKWeeYFjBKyaWeO88
```

### 3.5 Deploy

```bash
railway up
```

Wait for deployment to complete. This may take 2-5 minutes.

### 3.6 Generate Public Domain

```bash
railway domain
```

This will output a URL like: `https://tvs-voice-ai-n8n-production.up.railway.app`

### 3.7 Update WEBHOOK_URL

After getting the domain, update the webhook URL:

```bash
railway variables set WEBHOOK_URL=https://YOUR-DOMAIN.up.railway.app
```

Replace `YOUR-DOMAIN` with the actual domain from step 3.6.

### 3.8 Redeploy with Updated Variable

```bash
railway up
```

---

## Task 4: Verify Deployment

### 4.1 Check Deployment Status

```bash
railway status
```

### 4.2 Check Logs

```bash
railway logs
```

Look for: `n8n ready on port 5678`

### 4.3 Test Access

Open the Railway domain URL in a browser. You should see the n8n setup screen.

Alternatively, test with curl:

```bash
curl -I https://YOUR-DOMAIN.up.railway.app/healthz
```

Expected: `HTTP/2 200`

---

## Deliverables

When complete, report back with:

1. **n8n URL**: The public Railway domain
2. **Deployment Status**: Success/Failed
3. **Any Errors**: If deployment failed, provide error logs

---

## Success Criteria

| Criteria | Expected |
|----------|----------|
| n8n accessible via URL | Yes |
| Health check passes | HTTP 200 on /healthz |
| Logs show "n8n ready" | Yes |
| Environment variables set | All 8 variables configured |

---

## Troubleshooting

### If Railway CLI not installed:

```bash
npm install -g @railway/cli
```

### If login fails:

```bash
railway login --browserless
```
Follow the token-based authentication.

### If deployment fails with port error:

Ensure Dockerfile has `EXPOSE 5678` and `N8N_PORT=5678`.

### If health check fails:

Check logs with `railway logs` for specific errors.

---

## Estimated Time

15-20 minutes

---

## Report Format

After completion, provide status in this format:

```
## n8n Deployment Status

- **Status**: [SUCCESS/FAILED]
- **n8n URL**: [URL or N/A]
- **Health Check**: [PASS/FAIL]
- **Errors**: [None or error details]
- **Notes**: [Any additional information]
```
