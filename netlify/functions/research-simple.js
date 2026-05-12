// netlify/functions/research-simple.js
// ELITE 25-year BD research - ROBUST with error handling

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

function cleanJsonString(str) {
  // Remove markdown code blocks if present
  str = str.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  str = str.replace(/^```\s*/i, '').replace(/```\s*$/, '');
  return str.trim();
}

async function researchCompanyElite(companyName, userProfile) {
  let userContext = "";
  if (userProfile) {
    userContext = `Sells: ${userProfile.service_name || "solution"}
Help: ${userProfile.service_description || "B2B"}
Different: ${userProfile.differentiators?.join(", ") || "N/A"}`;
  }

  const systemPrompt = `You are a 25-year BD executive. Provide elite research in VALID JSON ONLY.
No markdown. No code blocks. Just pure JSON.
${userContext}`;

  const userPrompt = `Research ${companyName} for B2B sales. Return ONLY this JSON (no markdown, no code blocks):

{
  "company_name": "Company name",
  "industry": "Industry",
  "location": "Location",
  "company_size": "Size estimate",
  "social_sentiment": "What leaders recently posted (1 sentence)",
  "latest_news": "Recent hiring/funding/launches (1 sentence)",
  "industry_trend": "One key trend (1 sentence)",
  "actual_problem": "The real problem they face",
  "buying_trigger": "When they'd buy",
  "primary_contact": "Who to call first",
  "positioning": "How to position it",
  "call_opening": "First 2 sentences to say",
  "deal_probability": 65,
  "sales_cycle_months": 3,
  "deal_killers": ["Avoid this", "Avoid that"],
  "confidence_level": "medium",
  "executive_summary": "GO or NO-GO with why"
}`;

  try {
    console.log(`[${new Date().toISOString()}] Starting Claude call for ${companyName}...`);
    
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    console.log(`[${new Date().toISOString()}] Claude response received`);
    
    const rawText = response.content[0].text;
    console.log(`[${new Date().toISOString()}] Raw response length: ${rawText.length}`);
    
    // Clean the response
    const cleanedText = cleanJsonString(rawText);
    console.log(`[${new Date().toISOString()}] Cleaned response length: ${cleanedText.length}`);
    
    // Try to parse
    console.log(`[${new Date().toISOString()}] Attempting JSON parse...`);
    const parsed = JSON.parse(cleanedText);
    console.log(`[${new Date().toISOString()}] JSON parse successful`);
    
    return parsed;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in researchCompanyElite:`, error.message);
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
    console.log(`[${new Date().toISOString()}] Request received`);
    
    const body = JSON.parse(event.body || "{}");
    const { company_name, userId } = body;

    if (!company_name || !company_name.trim()) {
      console.log(`[${new Date().toISOString()}] Missing company_name`);
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
        console.log(`[${new Date().toISOString()}] Profile loaded: ${userProfile.service_name}`);
      } else {
        console.log(`[${new Date().toISOString()}] No profile found`);
      }
    }

    console.log(`[${new Date().toISOString()}] Calling research function...`);
    const research = await researchCompanyElite(company_name, userProfile);

    console.log(`[${new Date().toISOString()}] Research completed successfully`);

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
