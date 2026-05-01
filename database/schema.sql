-- ============================================
-- BD Intelligence Engine - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  service_name VARCHAR(255) NOT NULL,
  service_description TEXT NOT NULL,
  differentiators JSONB NOT NULL DEFAULT '[]',
  target_regions JSONB NOT NULL DEFAULT '[]',
  target_industries JSONB NOT NULL DEFAULT '[]',
  company_size_range VARCHAR(50),
  messaging_style VARCHAR(50) DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COMPANY RESEARCH TABLE
-- ============================================
CREATE TABLE company_research (
  research_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  location VARCHAR(255),
  company_size INTEGER,
  website VARCHAR(500),
  health_score INTEGER CHECK (health_score >= 1 AND health_score <= 100),
  pain_signals JSONB,
  stakeholders JSONB,
  competitive_intel JSONB,
  positioning JSONB,
  engagement_readiness JSONB,
  sources JSONB DEFAULT '[]',
  research_status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OUTREACH CAMPAIGNS TABLE
-- ============================================
CREATE TABLE outreach_campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES company_research(research_id) ON DELETE CASCADE,
  prospect_name VARCHAR(255),
  prospect_email VARCHAR(255),
  prospect_title VARCHAR(255),
  outreach_angle VARCHAR(255),
  message_sent TEXT,
  channel VARCHAR(50), -- email, linkedin, whatsapp, twitter
  sent_date TIMESTAMP,
  message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, opened, clicked, replied, bounced
  sentiment VARCHAR(50), -- interested, not_interested, maybe
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
  conv_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES company_research(research_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(campaign_id) ON DELETE CASCADE,
  reply_text TEXT,
  sentiment_score INTEGER CHECK (sentiment_score >= 1 AND sentiment_score <= 5),
  next_step TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_company_research_user_id ON company_research(user_id);
CREATE INDEX idx_company_research_created_at ON company_research(created_at DESC);
CREATE INDEX idx_company_research_health_score ON company_research(health_score DESC);

CREATE INDEX idx_outreach_campaigns_user_id ON outreach_campaigns(user_id);
CREATE INDEX idx_outreach_campaigns_research_id ON outreach_campaigns(research_id);
CREATE INDEX idx_outreach_campaigns_status ON outreach_campaigns(status);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_research_id ON conversations(research_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- USER PROFILES: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- COMPANY RESEARCH: Users can only see/edit their own research
CREATE POLICY "Users can view own research" 
  ON company_research FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research" 
  ON company_research FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research" 
  ON company_research FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research" 
  ON company_research FOR DELETE 
  USING (auth.uid() = user_id);

-- OUTREACH CAMPAIGNS: Users can only see/edit their own campaigns
CREATE POLICY "Users can view own campaigns" 
  ON outreach_campaigns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" 
  ON outreach_campaigns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" 
  ON outreach_campaigns FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" 
  ON outreach_campaigns FOR DELETE 
  USING (auth.uid() = user_id);

-- CONVERSATIONS: Users can only see/edit their own conversations
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
  ON conversations FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWUPS TABLE (Phase 3)
-- ============================================
CREATE TABLE followups (
  followup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES outreach_campaigns(campaign_id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES company_research(research_id) ON DELETE CASCADE,
  follow_up_number INTEGER,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, sent, opened, replied, skipped
  angle VARCHAR(100),
  subject_template VARCHAR(255),
  message_template TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- WARM_INTROS TABLE (Phase 3)
-- ============================================
CREATE TABLE warm_intros (
  intro_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES company_research(research_id) ON DELETE CASCADE,
  target_person_id VARCHAR(255), -- LinkedIn ID or email
  target_name VARCHAR(255),
  target_title VARCHAR(255),
  mutual_connection_name VARCHAR(255),
  mutual_connection_email VARCHAR(255),
  mutual_connection_linkedin VARCHAR(500),
  strength_score INTEGER CHECK (strength_score >= 1 AND strength_score <= 5),
  intro_status VARCHAR(50) DEFAULT 'pending', -- pending, drafted, sent, scheduled
  drafted_intro TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMAIL_LOGS TABLE (Phase 3)
-- ============================================
CREATE TABLE email_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(campaign_id) ON DELETE CASCADE,
  recipient_email VARCHAR(255),
  subject VARCHAR(500),
  body TEXT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  resend_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX idx_followups_user_id ON followups(user_id);
CREATE INDEX idx_followups_status ON followups(status);
CREATE INDEX idx_followups_scheduled_for ON followups(scheduled_for);

CREATE INDEX idx_warm_intros_user_id ON warm_intros(user_id);
CREATE INDEX idx_warm_intros_status ON warm_intros(intro_status);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- ============================================
-- RLS FOR NEW TABLES
-- ============================================
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_intros ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own followups" 
  ON followups FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followups" 
  ON followups FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followups" 
  ON followups FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own warm intros" 
  ON warm_intros FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own warm intros" 
  ON warm_intros FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own warm intros" 
  ON warm_intros FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email logs" 
  ON email_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email logs" 
  ON email_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email logs" 
  ON email_logs FOR UPDATE 
  USING (auth.uid() = user_id);
