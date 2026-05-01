/**
 * @typedef {Object} UserProfile
 * @property {string} user_id - UUID from Supabase Auth
 * @property {string} name - User's full name
 * @property {string} service_name - Name of their service/offering
 * @property {string} service_description - Detailed description of what they do
 * @property {string[]} differentiators - Key differentiators (3-5 items)
 * @property {string[]} target_regions - Regions they focus on
 * @property {string[]} target_industries - Industries they target
 * @property {string} company_size_range - e.g., "100-500", "500-1000"
 * @property {string} messaging_style - "formal", "casual", "technical", "bold"
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} CompanyResearch
 * @property {string} research_id - UUID primary key
 * @property {string} user_id - Foreign key to user_profiles
 * @property {string} company_name - Name of the company researched
 * @property {string} industry - Company industry
 * @property {string} location - Company location
 * @property {number} company_size - Number of employees
 * @property {string} website - Company website URL
 * @property {number} health_score - 1-100 score of fit
 * @property {Object} pain_signals - JSON object with pain signals
 * @property {Object} stakeholders - JSON object with decision-makers
 * @property {Object} competitive_intel - JSON object with competitor analysis
 * @property {Object} positioning - JSON object with positioning strategy
 * @property {Object} engagement_readiness - JSON object with engagement score
 * @property {string[]} sources - Array of URLs to sources
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} PainSignal
 * @property {number} severity - 1-5 (critical to low)
 * @property {string} category - Type of pain
 * @property {string} description - What the pain is
 * @property {string} source - Where it was found (news, LinkedIn, etc.)
 * @property {string} quote - Exact quote from source
 * @property {string} timeline - When it was detected
 * @property {string} window - Action window (e.g., "60-90 days")
 */

/**
 * @typedef {Object} Stakeholder
 * @property {string} name - Person's name
 * @property {string} title - Job title
 * @property {string} email - Email address
 * @property {string} linkedin_url - LinkedIn profile URL
 * @property {number} contact_priority - 1 = first to contact, 5 = last
 * @property {string} motivation - Why they'd care
 * @property {string} pain_owned - What pain they own
 * @property {string} best_channel - Email, LinkedIn, WhatsApp, Twitter
 * @property {string[]} recent_activity - Recent posts/announcements
 */

/**
 * @typedef {Object} OutreachCampaign
 * @property {string} campaign_id - UUID primary key
 * @property {string} user_id - Foreign key to user_profiles
 * @property {string} research_id - Foreign key to company_research
 * @property {string} prospect_name - Name of contact
 * @property {string} prospect_email - Email address
 * @property {string} prospect_title - Job title
 * @property {string} outreach_angle - Which angle was used
 * @property {string} message_sent - The actual message text
 * @property {string} channel - email, linkedin, whatsapp, twitter
 * @property {string} sent_date - ISO timestamp
 * @property {string} message_id - ID for tracking
 * @property {string} status - sent, opened, clicked, replied, bounced
 * @property {string} sentiment - If replied: interested, not_interested, maybe
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} Conversation
 * @property {string} conv_id - UUID primary key
 * @property {string} user_id - Foreign key to user_profiles
 * @property {string} research_id - Foreign key to company_research
 * @property {string} campaign_id - Foreign key to outreach_campaigns
 * @property {string} reply_text - The actual reply
 * @property {number} sentiment_score - 1-5: not interested to very interested
 * @property {string} next_step - Suggested next action
 * @property {string} created_at - ISO timestamp
 */

export {};
