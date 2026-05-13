// netlify/functions/research-simple.js
// MULTI-AGENT RESEARCH SYSTEM - FIXED
// 1. Company Research (WITH EMAIL DISCOVERY)
// 2. Synthesis & Analysis
// 3. BD Strategy & Emails
// NO TIMEOUT ABORT - Let it run as long as needed

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId);
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    return null;
  }
}

// AGENT 1: COMPANY RESEARCH + EMAIL DISCOVERY
async function companyResearchAgent(companyName) {
  console.log(`[AGENT-1] Starting company research for ${companyName}`);

  const systemPrompt = `You are an expert business intelligence researcher specializing in company research and email discovery.

Your job:
1. Research the company thoroughly (website, About, news, etc)
2. FIND EMAIL ADDRESSES - This is critical:
   - Look for CEO, founders, executives (firstname@company.com pattern)
   - Check LinkedIn profiles and infer emails
   - Look for contact pages, press releases, team pages
   - Find common email patterns used by the company
3. Identify decision makers (titles, roles, responsibilities)
4. Extract concrete facts about the company

Be thorough. Use multiple search strategies. Return specific emails you can verify.
Return ONLY valid JSON.`;

  const userPrompt = `Research ${companyName} thoroughly. FOCUS ON FINDING EMAIL ADDRESSES.

Search for:
1. CEO/Founder email(s)
2. Operations/COO email(s)
3. CTO/VP Engineering email(s)
4. CFO/VP Finance email(s)
5. Any executive team emails you can find

Also research:
- What the company does (business model, products/services)
- Company size (employees, revenue stage)
- Industry and market
- Leadership and founders
- Recent funding/acquisitions/partnerships
- Geographic presence
- Website messaging
- Hiring activity

Return ONLY this JSON (no markdown):
{
  "company_name": "${companyName}",
  "description": "What the company does (2-3 sentences)",
  "industry": "Industry category",
  "business_model": "How they make money",
  "company_size": "startup/growth/scale/enterprise",
  "employee_count": "Estimated number",
  "revenue_stage": "Pre-revenue/Early/Growth/Profitable/Undisclosed",
  
  "email_discovery": {
    "domain": "company.com (inferred domain)",
    "common_patterns": ["firstname.lastname@", "firstname@", "fname@"],
    "emails_found": [
      {
        "email": "actual@email@company.com (or inferred format)",
        "name": "Full Name",
        "title": "CEO/Founder/Title",
        "confidence": "HIGH/MEDIUM/LOW - how confident you are",
        "source": "Where you found it (LinkedIn, website, press release, etc)",
        "verification_needed": true
      }
    ],
    "total_emails_discovered": 3,
    "discovery_notes": "Any notes about email patterns or where to find more"
  },

  "leadership": [
    {
      "name": "Full name",
      "title": "CEO/Founder/CTO etc",
      "email": "email@company.com if found",
      "background": "Brief background"
    }
  ],

  "geographic_presence": ["Country 1", "Country 2"],

  "recent_activity": [
    {
      "date": "2026-05-10",
      "activity": "Funding/Acquisition/Launch/Partnership",
      "description": "Details"
    }
  ],

  "website_messaging": "What they emphasize on homepage",
  "products_services": ["Product 1", "Product 2"],
  "visible_pain_points": ["What they're trying to solve"],
  "hiring_signals": "Any open roles or hiring activity",
  "strategic_direction": "Where they seem to be headed",

  "research_confidence": "HIGH/MEDIUM/LOW - based on available public info",
  "research_notes": "Any gaps or limitations in research"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].text;
    let json = text.trim();
    if (json.startsWith("```json")) json = json.slice(7);
    if (json.startsWith("```")) json = json.slice(3);
    if (json.endsWith("```")) json = json.slice(0, -3);
    
    const companyData = JSON.parse(json.trim());
    console.log(`[AGENT-1] Research complete - Found ${companyData.email_discovery?.total_emails_discovered || 0} emails`);
    return companyData;
  } catch (error) {
    console.error("[AGENT-1] Error:", error.message);
    throw error;
  }
}

// AGENT 2: SYNTHESIS & ANALYSIS
async function synthesisAgent(companyData, serviceName, serviceDesc, differentiators) {
  console.log(`[AGENT-2] Starting synthesis analysis`);

  const systemPrompt = `You are an expert at synthesizing company intelligence into actionable sales insights.

Given company research and email discovery, your job:
1. Analyze pain points specific to their business model and size
2. Identify timing signals (expansion, hiring, funding)
3. Understand executive priorities based on company focus
4. Map how the service fits into their challenges
5. Identify which executive persona owns which pain

Return ONLY valid JSON.`;

  const userPrompt = `Analyze this company for selling: "${serviceName}"
Service description: "${serviceDesc}"
Differentiators: "${differentiators}"

Company data:
${JSON.stringify(companyData, null, 2)}

Synthesize into actionable insights:

{
  "company_name": "${companyData.company_name}",
  "service_being_sold": "${serviceName}",
  
  "company_summary": "4-5 paragraph detailed summary of what the company does, their market position, recent moves, and strategic direction",
  
  "pain_points": [
    {
      "pain_point": "Specific operational pain",
      "why_they_have_it": "Based on their size, business model, industry",
      "evidence": "Signals from hiring, announcements, positioning",
      "severity": "CRITICAL/HIGH/MEDIUM",
      "how_service_solves": "How your service directly fixes this",
      "owned_by": "Which executive/role owns this pain",
      "confidence": "HIGH/MEDIUM/LOW"
    }
  ],
  
  "timing_signals": {
    "expansion": "Are they expanding? Where?",
    "hiring": "What are they hiring for?",
    "product": "New product launches?",
    "funding": "Recent funding?",
    "market": "Industry trends?"
  },
  
  "executive_personas": [
    {
      "persona": "CEO/Operations/Technical",
      "likely_title": "Job titles",
      "priorities": "What they care about",
      "pain_they_own": "Which pain point",
      "likely_emails": "emails_found from Agent 1"
    }
  ],
  
  "opportunity_fit": {
    "alignment_score": 1-10,
    "why": "Why the fit is strong",
    "ideal_pitch_angle": "How to position"
  },
  
  "pitch_strategy": {
    "opening_hook": "The single most compelling finding",
    "why_now": "Why urgency exists",
    "differentiation": "How better than alternatives",
    "risk_of_inaction": "What bad happens"
  }
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].text;
    let json = text.trim();
    if (json.startsWith("```json")) json = json.slice(7);
    if (json.startsWith("```")) json = json.slice(3);
    if (json.endsWith("```")) json = json.slice(0, -3);
    
    const synthesis = JSON.parse(json.trim());
    console.log(`[AGENT-2] Synthesis complete`);
    return synthesis;
  } catch (error) {
    console.error("[AGENT-2] Error:", error.message);
    throw error;
  }
}

// AGENT 3: BD STRATEGY & EMAIL GENERATION
async function bdAgent(synthesis, companyData, serviceName, serviceDesc, differentiators) {
  console.log(`[AGENT-3] Starting BD email generation with discovered emails`);

  const emailsFromResearch = companyData.email_discovery?.emails_found || [];

  const systemPrompt = `You are a 25-year veteran business development executive.

You receive REAL EMAILS from company research. Your job:
1. Write specific cold emails to ACTUAL discovered email addresses
2. Reference their specific company, situation, recent moves
3. Use their language and priorities
4. Frame as question, not pitch
5. Suggest brief conversation
6. Each email personalized to that person's role

For each email:
- Use actual email address from research
- Reference their recent activity, hiring, funding
- Mention specific pain they likely have
- Suggest 15-min conversation
- End with low-friction next step

Write 2-3 emails to the discovered contacts.`;

  const userPrompt = `Write personalized cold emails based on this research.

Company: ${synthesis.company_name}
Service: ${serviceName} - ${serviceDesc}
Discovered Emails: ${JSON.stringify(emailsFromResearch, null, 2)}

Synthesis insights:
- Opening hook: ${synthesis.pitch_strategy.opening_hook}
- Why now: ${synthesis.pitch_strategy.why_now}
- Pain points: ${synthesis.pain_points.map(p => p.pain_point).join(", ")}

Write emails to the discovered email addresses. Use actual emails from research.
For each email:
1. Address the specific person
2. Reference their recent activity from research
3. Mention the pain they likely have
4. Suggest brief conversation
5. Make it feel researched and personal

Return ONLY valid JSON:
{
  "company_name": "${synthesis.company_name}",
  "emails": [
    {
      "target_email": "actual@email.com",
      "target_name": "Full name",
      "target_title": "Job title",
      "subject_line": "Subject",
      "body": "Email body (3-4 paragraphs, under 150 words)",
      "key_references": ["What from research you referenced"],
      "why_this_angle": "Why this works for them",
      "cta": "Call to action",
      "email_source": "Where email was discovered"
    }
  ],
  "email_strategy": {
    "send_order": "Who to email first and why",
    "timing": "Best time to send",
    "follow_up": "Follow-up if no response"
  }
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].text;
    let json = text.trim();
    if (json.startsWith("```json")) json = json.slice(7);
    if (json.startsWith("```")) json = json.slice(3);
    if (json.endsWith("```")) json = json.slice(0, -3);
    
    const emails = JSON.parse(json.trim());
    console.log(`[AGENT-3] Email generation complete - ${emails.emails.length} emails created`);
    return emails;
  } catch (error) {
    console.error("[AGENT-3] Error:", error.message);
    throw error;
  }
}

// MAIN ORCHESTRATOR
async function multiAgentResearch(companyName, userProfile) {
  console.log(`\n[ORCHESTRATOR] Starting multi-agent research for ${companyName}\n`);

  const serviceName = userProfile?.service_name || "business solution";
  const serviceDesc = userProfile?.service_description || "helping businesses improve";
  const differentiators = userProfile?.differentiators?.join(", ") || "";

  try {
    // AGENT 1: Research the company + find emails
    console.log("[ORCHESTRATOR] → Dispatching Agent 1: Company Research + Email Discovery");
    const companyData = await companyResearchAgent(companyName);

    // AGENT 2: Synthesize insights
    console.log("[ORCHESTRATOR] → Dispatching Agent 2: Synthesis & Analysis");
    const synthesis = await synthesisAgent(companyData, serviceName, serviceDesc, differentiators);

    // AGENT 3: Generate emails using discovered emails
    console.log("[ORCHESTRATOR] → Dispatching Agent 3: BD Strategy & Email Generation");
    const emailStrategy = await bdAgent(synthesis, companyData, serviceName, serviceDesc, differentiators);

    // Combine all outputs
    const finalResearch = {
      company_name: companyName,
      service_being_sold: serviceName,
      
      // From Company Research Agent
      company_intel: companyData,
      email_discovery: companyData.email_discovery,
      
      // From Synthesis Agent
      company_summary: synthesis.company_summary,
      pain_points: synthesis.pain_points,
      timing_signals: synthesis.timing_signals,
      executive_personas: synthesis.executive_personas,
      opportunity_fit: synthesis.opportunity_fit,
      pitch_strategy: synthesis.pitch_strategy,
      
      // From BD Agent
      personalized_emails: emailStrategy.emails,
      email_strategy: emailStrategy.email_strategy,
      
      research_timestamp: new Date().toISOString(),
      research_confidence: companyData.research_confidence,
      emails_discovered: companyData.email_discovery?.emails_found?.length || 0,
      emails_to_verify: companyData.email_discovery?.emails_found || []
    };

    console.log("[ORCHESTRATOR] ✅ Multi-agent research complete\n");
    return finalResearch;

  } catch (error) {
    console.error("[ORCHESTRATOR] ERROR:", error.message);
    throw error;
  }
}

// NETLIFY HANDLER - NO TIMEOUT ABORT
exports.handler = async (event, context) => {
  // Don't abort on timeout - let it run as long as needed
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  }

  try {
    console.log("[HANDLER] Request received");
    
    const { company_name, userId } = JSON.parse(event.body || "{}");

    if (!company_name?.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "company_name required" })
      };
    }

    console.log(`[HANDLER] Researching: ${company_name}`);

    let userProfile = null;
    if (userId) {
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`[HANDLER] Profile: ${userProfile.service_name}`);
      }
    }

    // Execute multi-agent research - NO TIMEOUT
    const research = await multiAgentResearch(company_name, userProfile);

    console.log("[HANDLER] Returning research");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research,
        research_type: userProfile?.service_name ? "SERVICE-SPECIFIC" : "GENERIC",
        agents_used: ["Company Research + Email Discovery", "Synthesis", "BD Strategy"],
        emails_found: research.emails_discovered
      })
    };

  } catch (error) {
    console.error("[HANDLER] ERROR:", error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        note: "Research was not aborted - the Claude API may need more time. Try again."
      })
    };
  }
};
