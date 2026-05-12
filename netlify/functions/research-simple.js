// netlify/functions/research-simple.js
// Personalized company research based on user's profile + Claude deep analysis

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Fetch user profile from Supabase (handle missing profiles gracefully)
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
    
    // Return first result or null if no profile exists
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
}

// Deep personalized research using Claude
async function researchCompanyPersonalized(companyName, userProfile) {
  // Build context about user's solution
  let userContext = "";
  if (userProfile) {
    userContext = `
The researcher is a ${userProfile.service_name || "business solution provider"}.
Their offering: ${userProfile.service_description || "B2B solution"}
Their differentiators: ${userProfile.differentiators?.join(", ") || "N/A"}
Their messaging style: ${userProfile.messaging_style || "professional"}

CRITICAL: Research this company specifically for fit with this user's solution. 
Tailor all recommendations to their service.`;
  } else {
    userContext = `
Note: User profile not yet filled in. Provide comprehensive research without personalization.`;
  }

  const systemPrompt = `You are an elite business development strategist with 25+ years of enterprise sales experience.
Your job is to provide DEEP, ACTIONABLE company research that directly identifies deal opportunities.

${userContext}

You analyze companies to identify:
- Exact fit with the user's solution (not generic)
- Specific, named pain points (not generic challenges)
- Real decision-making structures and politics
- Budget availability and fiscal timing
- Competitive threats and positioning
- Deal window opportunities
- Risk factors that could derail a sale
- Precise outreach strategy

Be brutally honest. If it's not a fit, say so. If confidence is low, admit it.

Respond ONLY in valid JSON format with no additional text, no markdown, no code blocks.`;

  const userPrompt = `Conduct ELITE business development research for: ${companyName}

${userProfile ? `Analyze this company SPECIFICALLY for fit with the user's solution.` : `Provide comprehensive company research for general B2B sales targeting.`}

Provide comprehensive, actionable analysis in this JSON structure:

{
  "company_name": "Official company name",
  "industry": "Primary industry/sector",
  "location": "HQ location",
  "company_size": "Employee count or range",
  "founded_year": "Year if known",
  "website": "Main website",
  "revenue_estimate": "Revenue range if available",
  
  "business_model": "How they make money - specific details",
  "key_products_services": "Main offerings - specific examples",
  "market_position": "Market leader, challenger, niche, emerging",
  "growth_stage": "Early-stage, growth, mature, declining",
  
  "organizational_structure": {
    "relevant_departments": "Which departments matter for this sale",
    "decision_makers": "Specific roles: CEO, VP Sales, CTO, etc.",
    "org_politics": "Power dynamics: who influences who, informal leaders",
    "typical_decision_timeline": "How long do decisions take (weeks/months)"
  },
  
  "financial_health": {
    "cash_position": "Bootstrapped, funded, profitable, burning cash",
    "recent_funding": "If applicable - amount, series, date",
    "revenue_trend": "Growing, stable, declining",
    "budget_availability": "Do they have budget for solutions? When do they decide?"
  },
  
  "pain_signals_specific": [
    "Specific pain point #1 with evidence",
    "Specific pain point #2 with evidence",
    "Specific pain point #3 with evidence"
  ],
  
  "technology_stack": "What tools/software do they use",
  "current_solutions": "What they're currently using for problems you solve",
  "switching_costs": "High/low - how hard is it to switch from current solution",
  
  "growth_signals": [
    "Recent hiring in relevant departments",
    "New product launches",
    "Geographic expansion",
    "Market share moves"
  ],
  
  "competitive_landscape": {
    "main_competitors": "Who they compete with",
    "market_dynamics": "Is market growing or shrinking",
    "their_positioning": "How they position themselves"
  },
  
  "deal_fit_analysis": {
    "fit_score": 0-100,
    "fit_explanation": "Why this score - specific reasons",
    "user_solution_alignment": "How your solution directly addresses their needs",
    "competitive_advantage": "Why they should choose you over competitors",
    "potential_objections": "What will they say no to",
    "how_to_overcome": "How to address those objections"
  },
  
  "deal_window_intelligence": {
    "urgency_signals": "What creates urgency NOW vs later",
    "fiscal_calendar": "When do they make budget decisions",
    "product_cycles": "When are they launching/updating products",
    "best_contact_timing": "When should you reach out",
    "contact_sequence": "Who to call first, second, third"
  },
  
  "ideal_contact_strategy": {
    "primary_contact": "Best first contact (name/title if known)",
    "primary_contact_motivation": "What they care about (KPIs, bonuses, legacy)",
    "outreach_angle": "SPECIFIC angle for this company - not generic",
    "messaging": "2-3 key messages tailored to their situation",
    "social_proof": "What would convince them (case studies, testimonials)",
    "call_script_opener": "How to start the conversation"
  },
  
  "risk_assessment": {
    "deal_risks": "What could kill the deal",
    "implementation_risks": "Implementation challenges",
    "org_risks": "Organizational changes that could impact",
    "risk_mitigation": "How to mitigate risks"
  },
  
  "recent_news_and_signals": {
    "public_news": "Recent announcements, funding, acquisitions",
    "hiring_signals": "Who are they hiring (signals future direction)",
    "executive_moves": "Leadership changes",
    "partnership_news": "New partnerships or integrations"
  },
  
  "deal_probability": {
    "probability_percentage": 0-100,
    "deal_stage_estimate": "Likely where they are in awareness cycle",
    "sales_cycle_length": "Estimated length in months",
    "deal_size_estimate": "Potential ACV/contract size if applicable",
    "close_timeline": "Realistic timeline from first contact to close"
  },
  
  "confidence_level": "high/medium/low - how confident in this analysis",
  "confidence_reasoning": "Why this confidence level",
  "data_gaps": "What information wasn't available that would help",
  
  "executive_summary": "2-3 sentence summary: is this a go or no-go, and why"
}

REQUIREMENTS:
- Be SPECIFIC: Never say "likely faces challenges" - name WHAT challenges
- Use INFERENCE: For less-known companies, apply industry knowledge and business logic
- Focus on USER FIT: Every field should answer "how does this relate to the user's solution?"
- Be HONEST: If confidence is low, say so. If not a fit, say so clearly
- Actionable: Every insight should guide the sales approach`;

  try {
    console.log("Calling Claude with personalized prompt...");
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
    console.log("Claude response received");

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

// Main Netlify function
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" })
    };
  }

  try {
    const { company_name, userId } = JSON.parse(event.body || "{}");

    if (!company_name || !company_name.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "company_name is required"
        })
      };
    }

    console.log(`Starting research for: ${company_name}${userId ? ` (User: ${userId})` : ""}`);

    // Fetch user profile if userId provided (won't fail if profile doesn't exist)
    let userProfile = null;
    if (userId) {
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`Loaded user profile: ${userProfile.service_name}`);
      } else {
        console.log(`No user profile found for userId: ${userId}`);
      }
    }

    const research = await researchCompanyPersonalized(company_name, userProfile);

    console.log(`Research completed for: ${company_name}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research,
        user_context: userProfile ? {
          service_name: userProfile.service_name,
          service_description: userProfile.service_description
        } : null
      })
    };
  } catch (error) {
    console.error("Research function error:", error);
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
