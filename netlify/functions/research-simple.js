// netlify/functions/research-simple.js
// ULTIMATE SERVICE-SPECIFIC RESEARCH WITH NEWS, SOCIAL SIGNALS & PERSONALIZED EMAILS
// Gets user's service from profile and generates targeted intelligence dossier

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

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
}

async function generateServiceSpecificResearch(companyName, userProfile) {
  // If no user profile, return generic research
  if (!userProfile || !userProfile.service_name) {
    console.log("No user profile or service name - generating generic research");
    return generateGenericResearch(companyName);
  }

  const serviceName = userProfile.service_name;
  const serviceDescription = userProfile.service_description;
  const differentiators = userProfile.differentiators?.join(", ") || "N/A";

  console.log(`Generating SERVICE-SPECIFIC research with emails for ${serviceName}`);

  const systemPrompt = `You are an elite business development researcher and email copywriter.

Your job is to research companies SPECIFICALLY for how they need a particular service AND write personalized pitch emails for each decision maker.

CRITICAL: Your emails must be:
1. PERSONALIZED - Reference their specific situation, recent news, or social posts
2. PROFESSIONAL - Proper business tone, no spam language
3. COMPELLING - Hook them with specific pain point relevant to them
4. ACTIONABLE - Clear next step (15-min call, demo, brief chat)
5. SHORT - 3-4 paragraphs max, scannable
6. SUBJECT LINE - Attention-grabbing but professional, mention company or trend

You do NOT provide generic company info or generic emails. Instead, you:
1. Identify SPECIFIC pain points the company has that THIS service solves
2. Find EVIDENCE from REAL NEWS, SOCIAL POSTS, HIRING proving these pain points
3. Identify DECISION MAKERS who own these problems
4. Write PERSONALIZED emails for EACH decision maker:
   - Primary decision maker (owns the pain most)
   - Secondary decision makers (influenced but not primary)
5. Tailor each email to THEIR specific role, KPIs, and recent focus
6. Reference specific news, product launch, hiring, or social post in the email
7. Create urgency based on real signals

The service you're researching for: ${serviceName}
Service description: ${serviceDescription}
Your differentiators: ${differentiators}

Be SPECIFIC, TACTICAL, SALES-FOCUSED, and EVIDENCE-BASED.
Include real news sources and dates.
Write emails that feel personal, not templated.
Respond ONLY as valid JSON, no markdown.`;

  const userPrompt = `Research ${companyName} for SELLING: ${serviceName}

Generate a SERVICE-SPECIFIC intelligence dossier with REAL NEWS, SOCIAL SIGNALS, and PERSONALIZED EMAILS.

Return this JSON:

{
  "company_name": "Company name",
  "service_being_sold": "${serviceName}",
  "service_description": "${serviceDescription}",
  
  "opportunity_summary": {
    "opportunity_level": "HIGH/MEDIUM/LOW",
    "urgency_level": "HIGH/MEDIUM/LOW",
    "why": "Why this company needs this service"
  },
  
  "pain_points": [
    {
      "pain_point_name": "Specific problem they have",
      "description": "What this pain point costs them",
      "evidence_sources": [
        {
          "type": "news/hiring/social_post",
          "headline": "News headline or social post quote",
          "source": "Publication or platform name",
          "date": "2026-05-10",
          "url": "https://...",
          "relevance": "How this reveals the pain point"
        }
      ],
      "impact": "Business impact of this pain point",
      "how_your_service_solves_it": "Exactly how your service fixes this"
    }
  ],
  
  "recent_news": [
    {
      "date": "2026-05-10",
      "headline": "Actual news headline",
      "source": "TechCrunch",
      "url": "https://...",
      "summary": "What the news says",
      "significance": "Why this matters",
      "relevance_to_service": "How this creates opportunity for your service"
    }
  ],
  
  "executive_social_signals": [
    {
      "executive_name": "Full name",
      "executive_title": "Job title",
      "platform": "LinkedIn",
      "date": "2026-05-08",
      "post": "What they posted (quote)",
      "url": "https://linkedin.com/...",
      "indicates_pain": "What this post reveals",
      "opportunity": "How your service addresses this"
    }
  ],
  
  "decision_makers": [
    {
      "rank": "primary",
      "name": "Full name",
      "title": "Job title",
      "email": "firstname.lastname@company.com",
      "linkedin": "linkedin.com/in/firstname-lastname",
      "linkedin_url": "https://linkedin.com/in/...",
      "recent_posts": ["Post theme 1", "Post theme 2"],
      "why_this_person": "Why they're the right decision maker",
      "what_they_care_about": "Their KPIs and goals",
      "pain_they_own": "Which pain point this person owns",
      "how_your_service_helps_them": "How your service helps them hit their goals",
      "personalized_email": {
        "subject_line": "Compelling subject line mentioning company or trend",
        "body": "Dear {name},\n\n[Opening: Hook with specific signal]\n\n[Problem: Their specific pain with evidence]\n\n[Solution: How your service fixes it]\n\n[CTA: Clear next step]\n\nBest regards,\n{Your Name}",
        "key_points": [
          "Specific news or signal referenced",
          "Their likely objection and counter",
          "Why NOW is the right time"
        ]
      }
    },
    {
      "rank": "secondary",
      "name": "Name",
      "title": "Title",
      "email": "email@company.com",
      "linkedin": "linkedin.com/in/...",
      "why_they_matter": "Their influence",
      "pain_they_care_about": "What pain point they care about",
      "personalized_email": {
        "subject_line": "Subject for this stakeholder",
        "body": "Email tailored to their role",
        "key_points": ["Point 1", "Point 2"]
      }
    }
  ],
  
  "pitch_framework": {
    "opening": "First 2 sentences (mention specific news or signal)",
    "problem_statement": "Their specific problem (from news/social)",
    "implication": "Business impact",
    "solution": "How your service solves it",
    "proof_point": "Proof companies like them are using service",
    "call_to_action": "Next step"
  },
  
  "industry_trends": [
    {
      "trend": "Industry trend",
      "why_company_feels_it": "How this affects them",
      "creates_urgency_for": "Need for your service",
      "your_pitch_angle": "How to position it"
    }
  ],
  
  "urgency_signals": {
    "signal_1": "What creates urgency",
    "timing_1": "When they'd be receptive",
    "trigger_1": "What to watch for",
    "signal_2": "Another signal",
    "timing_2": "Another good time",
    "trigger_2": "Another trigger"
  },
  
  "roi_calculation": {
    "current_cost": "What they're spending now",
    "with_your_service": "What they'd spend with service",
    "annual_savings": "How much they'd save",
    "additional_upside": "Revenue enabled or risks avoided",
    "payback_period": "Months to break even"
  },
  
  "email_strategy": {
    "approach": "How to approach this company (cold, warm intro, etc.)",
    "sequence": [
      "Step 1: Send email to primary decision maker",
      "Step 2: Wait X days for response",
      "Step 3: Follow up with secondary if no response",
      "Step 4: Next step based on response"
    ],
    "timing": "Best time to send emails (day of week, time of day)",
    "follow_up_plan": "How to follow up if no response"
  },
  
  "news_and_sources": {
    "tracked_sources": ["TechCrunch", "VentureBeat", "Forbes", "LinkedIn", "Company Blog"],
    "data_freshness": "Based on knowledge through May 2026"
  },
  
  "next_steps": [
    "Review personalized emails for each decision maker",
    "Customize with your name and company info",
    "Send primary email first (Monday-Thursday, 9-11am preferred)",
    "Wait 3 business days",
    "Follow up with secondary if needed",
    "Prepare for discovery call (they're interested)"
  ],
  
  "research_summary": "2-3 sentence summary including news signals and email approach"
}

CRITICAL REQUIREMENTS:
- REAL NEWS and DATES with URLs
- PERSONALIZED EMAILS for EACH decision maker
- Each email references SPECIFIC news, social post, or signal from THIS company
- Emails mention their ROLE-SPECIFIC pain and goals
- Subject lines are compelling but professional
- Email body is 3-4 paragraphs, scannable
- Primary vs secondary emails have different angles
- Emails feel personal, not templated
- Clear next step in each email
- Email strategy explains WHEN and HOW to send
- Every field FILLED with specific information`;

  try {
    console.log("Calling Claude with SERVICE-SPECIFIC + NEWS + EMAIL prompt...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = response.content[0].text;
    console.log("Claude response received, parsing...");

    // Extract and parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("SERVICE-SPECIFIC research with emails generated successfully");
      return parsed;
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

async function generateGenericResearch(companyName) {
  console.log("Generating generic research (no service profile)");
  
  const systemPrompt = `You are a comprehensive business intelligence researcher and email strategist.
Provide detailed company research in JSON format with REAL NEWS, SOCIAL SIGNALS, and PERSONALIZED EMAILS.
Include actual recent news articles and executive social posts with dates and URLs.`;

  const userPrompt = `Research ${companyName} comprehensively with real news, social signals, and personalized emails for decision makers.

Return comprehensive JSON with all fields filled.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = response.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Generic research error:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { company_name, userId } = body;

    if (!company_name || !company_name.trim()) {
      console.log("Missing company_name");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "company_name is required" })
      };
    }

    console.log(`[${new Date().toISOString()}] Starting research for: ${company_name}`);

    let userProfile = null;
    if (userId) {
      console.log(`[${new Date().toISOString()}] Fetching profile for userId: ${userId}`);
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`[${new Date().toISOString()}] Profile loaded. Service: ${userProfile.service_name}`);
      } else {
        console.log(`[${new Date().toISOString()}] No profile found`);
      }
    }

    console.log(`[${new Date().toISOString()}] Generating research with news, signals, and emails...`);
    const research = await generateServiceSpecificResearch(company_name, userProfile);

    console.log(`[${new Date().toISOString()}] Research completed successfully`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research,
        research_type: userProfile?.service_name ? "SERVICE-SPECIFIC" : "GENERIC",
        includes_news: true,
        includes_social_signals: true,
        includes_personalized_emails: true,
        user_context: userProfile ? {
          service_name: userProfile.service_name,
          service_description: userProfile.service_description
        } : null
      })
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Handler error:`, error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to research company",
        details: error.toString()
      })
    };
  }
};
