// netlify/functions/research-simple.js
// Personalized company research - optimized for speed (5000 tokens)

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
    
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
}

// Deep personalized research using Claude (5000 tokens - optimized speed)
async function researchCompanyPersonalized(companyName, userProfile) {
  // Build context about user's solution
  let userContext = "";
  if (userProfile) {
    userContext = `
The researcher sells: ${userProfile.service_name || "business solution"}
How they help: ${userProfile.service_description || "B2B solutions"}
What makes them different: ${userProfile.differentiators?.join(", ") || "N/A"}

CRITICAL: Analyze this company SPECIFICALLY for fit with this user's solution.`;
  } else {
    userContext = `Note: User profile not filled in. Provide strong general B2B research.`;
  }

  const systemPrompt = `You are an elite business development strategist with 25+ years of experience.
Provide DEEP, ACTIONABLE company research focused on:
- Deal fit and opportunity sizing
- Specific pain points this company faces
- Decision-makers and organizational structure
- Budget availability and buying signals
- Precise outreach strategy
- Risk assessment

Be specific, not generic. Be honest about confidence levels.

${userContext}

Respond ONLY as valid JSON, no markdown or extra text.`;

  const userPrompt = `Research this company for B2B sales opportunity: ${companyName}

Provide analysis in this JSON format:

{
  "company_name": "Official name",
  "industry": "Industry/sector",
  "location": "HQ location",
  "company_size": "Employee count estimate",
  "founded_year": "Year if known",
  "website": "Main website if known",
  "revenue_estimate": "Revenue range estimate",
  "business_model": "How they make money",
  "key_products": "Main offerings",
  "market_position": "Leader/challenger/niche/emerging",
  "growth_stage": "Early-stage/growth/mature/declining",
  
  "decision_makers": {
    "titles": "CEO, VP Sales, CTO, etc",
    "org_dynamics": "Who really makes decisions, power structure"
  },
  
  "pain_signals": [
    "Specific pain point with context",
    "Specific pain point with context",
    "Specific pain point with context"
  ],
  
  "financial_health": "Bootstrapped/funded/profitable/burning cash - with reasoning",
  "budget_likelihood": 1-10,
  "buying_timeline": "When would they likely decide",
  
  "deal_fit_analysis": {
    "fit_score": 0-100,
    "fit_reasoning": "Why this score - be specific",
    "solution_alignment": "How your solution solves their problems",
    "competitive_positioning": "Why choose you over competitors"
  },
  
  "outreach_strategy": {
    "primary_contact": "Best first contact role/title",
    "contact_motivation": "What they care about",
    "outreach_angle": "SPECIFIC angle for this company",
    "call_opener": "How to start the conversation",
    "key_talking_points": ["Point 1", "Point 2", "Point 3"]
  },
  
  "deal_probability": {
    "close_probability": "0-100 percentage",
    "sales_cycle_months": "Estimated length",
    "estimated_deal_size": "ACV/contract value range"
  },
  
  "risk_factors": {
    "deal_risks": "What could kill the deal",
    "mitigation": "How to address risks"
  },
  
  "growth_signals": "Recent hiring, funding, expansions, market moves",
  "competitive_landscape": "Who they compete with, market dynamics",
  "recent_news": "Announcements, leadership changes, partnerships",
  
  "confidence_level": "high/medium/low",
  "confidence_reasoning": "Why this level",
  "executive_summary": "Is this a GO or NO-GO and why"
}

REQUIREMENTS:
- Be SPECIFIC: Name exact pain points, not generic ones
- Focus on FIT: Every insight relates to the user's solution
- Be HONEST: If not a fit, say so. If confidence is low, admit it
- Use INFERENCE: For niche/unknown companies, apply business logic
- ACTIONABLE: Guide the sales approach`;

  try {
    console.log("Calling Claude with optimized 5000-token prompt...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,  // â† OPTIMIZED for speed
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

    // Fetch user profile if userId provided
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
