# BD Intelligence Engine - Step-by-Step Setup Guide

## Overview

This guide walks you through deploying the BD Intelligence Engine to production on Netlify with Supabase as your database.

## Prerequisites Checklist

- [ ] GitHub account (for version control)
- [ ] Supabase account (free tier is fine) - https://supabase.com
- [ ] Netlify account (free tier) - https://netlify.com
- [ ] Anthropic API key - https://console.anthropic.com
- [ ] Node.js v16+ installed locally
- [ ] Git installed locally

---

## Part 1: Local Setup (5-10 minutes)

### 1.1 Clone the Repository

```bash
cd ~/projects  # or your preferred directory
git clone <your-repo-url> bd-intelligence-engine
cd bd-intelligence-engine
```

### 1.2 Install Dependencies

```bash
npm install
```

This installs:
- React, React Router
- Supabase client
- Tailwind CSS
- Axios

### 1.3 Create `.env.local` File

Create `.env.local` in the project root (this file is in .gitignore):

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_API_URL=http://localhost:8888/.netlify/functions
```

Leave the `REACT_APP_API_URL` as-is for local development. It will auto-update on Netlify.

### 1.4 Create `.env` File (for local Netlify Functions)

Create `.env` in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

⚠️ **IMPORTANT**: Add `.env` to `.gitignore` so you don't commit your API key:

```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## Part 2: Supabase Setup (10-15 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Organization**: (select or create)
   - **Project Name**: "bd-intelligence-engine" (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: (select closest to your users)
4. Click "Create new project"

This takes 2-3 minutes to provision.

### 2.2 Create Database Tables

Once your project is ready:

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `database/schema.sql` from your project
4. Paste into the SQL editor
5. Click **"Run"**

The query will:
- Create all tables (user_profiles, company_research, outreach_campaigns, conversations)
- Enable Row Level Security (RLS)
- Create RLS policies (so users only see their own data)
- Create indexes for performance

**Expected output**: "Success. No rows returned" (or similar)

### 2.3 Get Your Credentials

1. In Supabase dashboard, click **Project Settings** (bottom of left sidebar)
2. Click **API** tab
3. Copy:
   - **Project URL** → Save as `REACT_APP_SUPABASE_URL`
   - **anon (public)** key → Save as `REACT_APP_SUPABASE_ANON_KEY`

Update your `.env.local`:

```env
REACT_APP_SUPABASE_URL=https://abc123.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_API_URL=http://localhost:8888/.netlify/functions
```

---

## Part 3: Test Locally (5-10 minutes)

### 3.1 Install Netlify CLI

```bash
npm install -g netlify-cli
```

Verify installation:
```bash
netlify --version
```

### 3.2 Start Local Development Server

**Terminal 1: React App**
```bash
npm start
```

This starts your React app on `http://localhost:3000`

**Terminal 2: Netlify Functions**
```bash
netlify dev
```

This starts the functions server on `http://localhost:8888` and proxies to React on port 3000

### 3.3 Test the App

1. Open `http://localhost:3000`
2. Click **Sign Up**
3. Enter:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123"
4. Click **Create Account**
5. You should be redirected to **Profile Setup**
6. Fill in your service details and click **Save**
7. You should see the **Dashboard**

If you see errors:
- Check browser console (F12)
- Check terminal output
- Verify `.env.local` credentials are correct

---

## Part 4: Deploy to Netlify (10-15 minutes)

### 4.1 Push to GitHub

```bash
git add .
git commit -m "Initial commit: BD Intelligence Engine Phase 1"
git push origin main
```

### 4.2 Connect GitHub to Netlify

1. Go to https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **GitHub**
4. Authorize Netlify to access your GitHub
5. Select your repository: `bd-intelligence-engine`
6. Click **"Deploy site"**

Netlify will automatically:
- Detect `netlify.toml`
- Run `npm run build`
- Deploy React app
- Deploy Netlify Functions

This takes 2-3 minutes.

### 4.3 Set Environment Variables

Your deploy will fail because it needs `ANTHROPIC_API_KEY`.

1. In Netlify dashboard, go to **Site settings**
2. Click **Build & deploy** → **Environment**
3. Click **"Edit variables"**
4. Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your_actual_key`
5. Click **Save**

### 4.4 Trigger a Redeploy

1. In Netlify, go to **Deploys**
2. Click the **"Trigger deploy"** button
3. Select **"Deploy site"**

Wait for the deploy to finish. You should see a green checkmark and a URL like:

```
https://bd-intelligence-engine-abc123.netlify.app
```

### 4.5 Test the Live App

1. Visit your Netlify URL
2. Click **Sign Up** with a new email
3. Fill in **Profile Setup**
4. In **Dashboard**, enter a company name like "Apple" or "Meta"
5. Click **Research**

This will call Claude to research the company and generate a report.

---

## Part 5: Verify Everything Works (5 minutes)

### Checklist

- [ ] Can sign up for account
- [ ] Can set up profile
- [ ] Can research a company (returns a report)
- [ ] Report appears in Supabase (check **Tables** → **company_research**)
- [ ] Each user only sees their own research (test with second account)

### If Research Returns an Error

1. Check Netlify function logs:
   - Dashboard → **Functions** → **research** → **Invocations**
2. Common issues:
   - `ANTHROPIC_API_KEY` not set (check Netlify environment)
   - API key is invalid or expired
   - Claude model name changed (update in `netlify/functions/research.js`)

---

## Part 6: Share with Users (How They Onboard)

### Users Only Need To:

1. **Sign Up** - Create account with email/password
2. **Set Up Profile** - Describe their service, target markets, differentiators
3. **Research** - Enter company names, get reports
4. **Export** - (In Phase 2) Download reports, send outreach

They don't need to:
- Create Airtable accounts
- Know about databases
- Manage API keys
- Understand technical setup

---

## Optional: Custom Domain

To use a custom domain (e.g., `yourcompany.com`):

1. Netlify dashboard → **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions (DNS setup, typically takes 5-15 min)

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
npm install
npm start
```

### "CORS error when calling function"

Make sure `REACT_APP_API_URL` is correct:

**Local**: `http://localhost:8888/.netlify/functions`
**Netlify**: It auto-detects (no need to set)

### "Supabase returns 403 Forbidden"

Check RLS policies:
- Netlify dashboard → **Supabase** → **SQL Editor**
- Run: `SELECT * FROM pg_policies WHERE tablename = 'company_research';`

Should return policies. If empty, re-run `database/schema.sql`

### "Claude API returns 401 Unauthorized"

- Check API key in Netlify environment
- Check key isn't expired
- Check it starts with `sk-ant-`

### "Research takes too long / times out"

- Netlify free tier: timeout is 10 seconds
- Pro tier allows up to 26 seconds
- For slower research, upgrade Netlify plan or optimize Claude prompts

---

## Next Steps

Once Phase 1 is live, Phase 2 adds:
- [ ] Outreach message generation (3 angles)
- [ ] Multi-channel sending (Email, LinkedIn DM, WhatsApp)
- [ ] Campaign tracking
- [ ] Reply management
- [ ] Analytics dashboard
- [ ] Heat maps by industry/region

---

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Claude API Docs**: https://docs.anthropic.com
- **React Router**: https://reactrouter.com

Good luck! 🚀
