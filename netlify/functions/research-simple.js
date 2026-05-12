// netlify/functions/research-simple.js
// ELITE 25-year BD research with social sentiment, news, trends, and urgency positioning

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

// Fetch user profile from Supabase
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

// Main research function - uses Claude to do EVERYTHING
async function researchCompanyElite(companyName, userProfile) {
  // Build user context
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

  const systemPrompt = `You are an elite business development executive with 25+ years closing deals.

Your job is to provide DEAL-WINNING research that identifies:
1. REAL problems the company faces (not generic)
2. WHO specifically makes buying decisions
3. WHEN they'd be ready to buy (timing + triggers)
4. HOW to approach them (exact positioning + call script)
5. What will KILL the deal (risks + objections)
6. REALISTIC win probability (not optimistic)
7. SOCIAL PROOF + RECENT SIGNALS showing they're ready

You combine company fundamentals with:
- Recent social media sentiment (what leaders are saying)
- Latest achievements (hiring, funding, product launches)
- Recent executive activity (LinkedIn posts, public statements)
- Industry trends (what's changing in their space)
- Urgency signals (what makes this THE RIGHT TIME to sell)

Be specific. Be honest. Be actionable.

${userContext}

Respond ONLY as valid JSON, no markdown.`;

  const userPrompt = `Conduct ELITE business development research for: ${companyName}

Use your knowledge to analyze:
1. Company fundamentals (size, industry, growth stage)
2. Recent social media sentiment (what are people saying about this company? LinkedIn posts? News?)
3. Latest achievements (recent hiring, funding, product launches, partnerships)
4. Recent executive/founder activity (what have leaders posted about recently?)
5. Industry trends happening RIGHT NOW that affect this company
6. How those trends CREATE the problem ${userProfile ? userProfile.service_name + ' solves' : 'your solution solves'}
7. Urgency positioning (why NOW is the right time to approach them)

Return analysis in this JSON format:

{
  "company_name": "Official name",
  "industry": "Industry/sector",
  "location": "HQ location",
  "company_size": "Employee count",
  "growth_stage": "Early/growth/mature/declining",
  "founded_year": "Year if known",
  "website": "Main website",
  
  "social_sentiment": {
    "recent_linkedin_activity": "What the company and leaders are posting about (sample 2-3 recent posts/themes)",
    "sentiment_analysis": "Tone - are they positive? stressed? excited? confused?",
    "trending_concerns": "What themes appear repeatedly in their posts?",
    "founder_focus": "What is the CEO/founder publicly focused on?"
  },
  
  "latest_achievements": {
    "recent_hiring": "Any recent hiring announcements? New departments? Growth signals?",
    "funding_or_revenue": "Recent funding, revenue growth, or financial signals?",
    "product_launches": "New products, features, or market expansion?",
    "partnerships": "New partnerships or integrations?",
    "time_frame": "When did these happen? (weeks/months)"
  },
  
  "industry_trends_analysis": {
    "trend_1": {
      "what_is_happening": "Specific trend in their industry",
      "why_it_matters_to_them": "How this affects their business",
      "creates_opportunity_for": "How this creates the problem you solve"
    },
    "trend_2": {
      "what_is_happening": "Another trend",
      "why_it_matters_to_them": "Impact on their business",
      "creates_opportunity_for": "Problem alignment"
    }
  },
  
  "actual_problem_they_face": "The REAL problem (not generic). Based on their recent activity, achievements, and industry trends, what is their actual bottleneck?",
  
  "buying_trigger": "What specific trigger makes them ready to buy NOW? (time of year, trend forcing action, hiring pattern, etc.)",
  
  "primary_contact": "Exact role (not generic title). Who REALLY makes this decision?",
  
  "positioning": "How to position your solution based on their recent activity and industry trends (NOT generic)",
  
  "call_opening": "First 2 sentences to say when they answer (hook on their specific situation, not generic)",
  
  "hardest_objection": "Based on their company culture and recent signals, what will they object to?",
  
  "how_to_overcome_objection": "Specific counter-argument based on their situation",
  
  "deal_probability": 0-100,
  
  "deal_strategy": [
    "Step 1 with timing (when to call based on their calendar/cycles)",
    "Step 2: Hook (what to lead with)",
    "Step 3: Demo/proof (what to show)",
    "Step 4: Close trigger (how to create urgency)"
  ],
  
  "urgency_positioning": "Based on industry trends and their recent activity, create SPECIFIC messaging about WHY NOW. Not generic.",
  
  "readiness_signals": [
    "Evidence they're ready (from social posts, hiring, achievements)",
    "LinkedIn indicator to confirm",
    "News source to monitor"
  ],
  
  "deal_size_estimate": "Annual contract value range",
  
  "sales_cycle_months": "Realistic timeline",
  
  "deal_killers": [
    "Specific mistake to avoid (based on their culture/recent signals)",
    "Another deal killer"
  ],
  
  "confidence_level": "high/medium/low",
  
  "confidence_reasoning": "Why this level - be honest about what we know vs. don't know",
  
  "executive_summary": "2-3 sentence summary: GO or NO-GO and why"
}

CRITICAL REQUIREMENTS:
- Use recent social media activity (LinkedIn posts, news, announcements)
- Base recommendations on ACTUAL trends, not assumptions
- Match industry trends to THEIR specific problem
- Create urgency based on real signals, not manipulation
- Be specific: name the recent achievement, quote the post, cite the trend
- Be honest: if confidence is low, say why
- Focus on DEAL DYNAMICS, not company description`;

  try {
    console.log("Calling Claude with ELITE 25-year BD prompt...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000, // Stay within safe limit
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = response.content[0].text;
    console.log("Claude research completed");

    // Extract JSON
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

    console.log(`Starting ELITE research for: ${company_name}${userId ? ` (User: ${userId})` : ""}`);

    // Fetch user profile if provided
    let userProfile = null;
    if (userId) {
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`Loaded user profile: ${userProfile.service_name}`);
      } else {
        console.log(`No user profile found for userId: ${userId}`);
      }
    }

    const research = await researchCompanyElite(company_name, userProfile);

    console.log(`ELITE research completed for: ${company_name}`);

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
