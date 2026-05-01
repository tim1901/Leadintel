# BD Intelligence Engine

A white-label Business Development Intelligence platform that uses Claude AI to research companies, identify pain signals, find decision-makers, and generate personalized outreach strategies.

## Features

### Phase 1 (Current)
- ✅ User authentication (signup/login)
- ✅ Service profile setup (users describe their offering)
- ✅ Company research via Claude multi-agent system
- ✅ Forensic company analysis
- ✅ Pain signal detection
- ✅ Decision-maker profiling
- ✅ Competitive intelligence analysis
- ✅ Lead health scoring (1-100)
- ✅ Engagement recommendations
- ✅ Report generation and storage

### Tech Stack

**Frontend:**
- React 18
- React Router v6
- Tailwind CSS
- Axios

**Backend:**
- Netlify Functions (serverless)
- Anthropic Claude API (multi-agent research)

**Database:**
- Supabase (PostgreSQL)
- Row-level security for multi-tenant isolation

**Authentication:**
- Supabase Auth

## Setup Instructions

### Prerequisites

1. **Supabase Account** - Create free account at https://supabase.com
2. **Anthropic API Key** - Get from https://console.anthropic.com
3. **Netlify Account** - For hosting (https://netlify.com)
4. **Node.js** - v16+ installed locally

### Step 1: Clone & Install

```bash
git clone <repo-url> bd-intelligence-engine
cd bd-intelligence-engine
npm install
```

### Step 2: Supabase Setup

1. Create new Supabase project
2. In Supabase dashboard, go to **SQL Editor**
3. Create new query and paste content of `database/schema.sql`
4. Run the query to create all tables and policies
5. Get your credentials from **Project Settings > API**:
   - Copy `Project URL` → `REACT_APP_SUPABASE_URL`
   - Copy `anon` key → `REACT_APP_SUPABASE_ANON_KEY`

### Step 3: Environment Variables

Create `.env.local` in project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:8888/.netlify/functions
```

For local Netlify Functions, also create `.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Step 4: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 5: Run Locally

```bash
# Terminal 1: Start React app
npm start

# Terminal 2: Start Netlify Functions locally
netlify dev
```

App will be available at `http://localhost:3000`

## Deployment

### Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Set environment variable:
   - `ANTHROPIC_API_KEY` = your API key
4. Deploy

Netlify will automatically:
- Build React app
- Deploy serverless functions
- Set up HTTPS

## How to Use

### 1. Sign Up
- Create account with email/password
- Verify email (Supabase Auth)

### 2. Set Up Profile
- Enter your name
- Describe your service (what you sell)
- List top 3 differentiators
- Select target regions (Nigeria, UAE, Oman, USA, Australia, etc.)
- Select target industries (FinServices, Tech, Government, etc.)
- Choose messaging style

### 3. Research Companies
- Enter company name
- System calls Claude multi-agent to research
- Agents run in parallel:
  1. Forensic Researcher (company overview, news, financials)
  2. Pain Signal Detector (finds relevant pain points)
  3. Decision-Maker Finder (identifies key contacts)
  4. Competitive Analyzer (vs current solutions)
  5. Health Scorer (1-100 fit score)
  6. Engagement Recommender (best approach)

### 4. View Report
- Company overview with key metrics
- Pain signals scored by severity (1-5)
- Key stakeholders with contact info
- Competitive positioning
- Engagement strategy recommendations
- Report auto-saved to Supabase

## Database Schema

### Users
- `user_profiles` - User account info + service profile

### Research
- `company_research` - Company analysis + all findings
- `outreach_campaigns` - Outreach messages sent
- `conversations` - Replies and conversations

All tables have:
- Row-level security (users only see their own data)
- `user_id` foreign key for isolation
- Timestamps for audit trail

## API Endpoints

### Netlify Functions

**POST** `/.netlify/functions/research`

Request body:
```json
{
  "companyName": "AccessBank Nigeria",
  "userProfile": {
    "service_name": "BPM Automation",
    "service_description": "...",
    "differentiators": ["Regional expertise", "..."],
    "target_regions": ["Nigeria", "UAE"],
    "target_industries": ["Financial Services"]
  }
}
```

Response:
```json
{
  "company_research": {...},
  "pain_signals": [...],
  "stakeholders": [...],
  "competitive_intel": {...},
  "health_score": {...},
  "engagement_recommendation": {...}
}
```

## Project Structure

```
bd-intelligence-engine/
├── src/
│   ├── pages/
│   │   ├── SignUp.jsx
│   │   ├── LogIn.jsx
│   │   ├── ProfileSetup.jsx
│   │   └── Dashboard.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── types/
│   │   └── index.js
│   ├── App.jsx
│   └── index.jsx
├── netlify/
│   └── functions/
│       └── research.js
├── database/
│   └── schema.sql
├── package.json
├── tailwind.config.js
└── .env.example
```

## Next Steps (Phase 2)

- [ ] Outreach message generation (3 angles per company)
- [ ] Multi-channel sending (Email, LinkedIn, WhatsApp, Twitter)
- [ ] Campaign tracking and reply management
- [ ] Conversation intelligence & sentiment analysis
- [ ] Heat maps & analytics dashboard
- [ ] Warm intro finder (LinkedIn mutual connections)
- [ ] Content recommendation engine
- [ ] Automated follow-up scheduling

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "ANTHROPIC_API_KEY not set"
Make sure `.env` file has `ANTHROPIC_API_KEY=sk-...`

### "Netlify function timeout"
Research may take 30-60 seconds. Increase timeout in `netlify.toml`:
```toml
[functions]
  timeout = 60
```

### "User data not saving to Supabase"
Check:
1. RLS policies are enabled (they should be from schema.sql)
2. User is authenticated (check browser console)
3. Supabase URL and key are correct

## Support

For issues or questions:
1. Check logs: `netlify functions:invoke research` (test locally)
2. Check Supabase dashboard for data
3. Check browser DevTools console for errors

## License

MIT
