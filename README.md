# TVS Dealer Voice AI Platform

AI-powered voice assistant for TVS Motor Company dealerships.

## Tech Stack
- **Database**: Supabase (PostgreSQL)
- **Workflows**: n8n (Railway)
- **Voice AI**: Retell AI
- **Frontend**: Hugging Face Spaces

## Setup
1. Database: Run `database/complete-setup.sql` in Supabase SQL Editor
2. n8n: Deploy from this repo on Railway
3. Voice: Configure Retell AI agent

## Project Structure
```
├── database/       # SQL schema and seed data
├── n8n/            # n8n Docker config
├── frontend/       # Website and Admin panel
├── scripts/        # Utility scripts
└── docs/           # Documentation
```
