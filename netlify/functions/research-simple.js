// netlify/functions/research-simple.js
// CLEAN CLAUDE RESEARCH - No hardcoding, no timeouts

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
    console.error("Error fetching profile:", err);
    return null;
  }
}

async function generateResearch(companyName, userProfile) {
  const serviceName = userProfile?.service_name || "business solution";
  const serviceDesc = userProfile?.service_description || "";

  console.log(`[RESEARCH] Starting for ${companyName}`);
  console.log(`[SERVICE] ${serviceName}`);

  const prompt = `Research ${companyName} for selling "${serviceName}". 

Return ONLY valid JSON (no markdown, no code blocks):

{
  "company_name": "${companyName}",
  "service_being_sold": "${serviceName}",
  "opportunity_summary": {
    "opportunity_level": "HIGH/MEDIUM/LOW",
    "urgency_level": "HIGH/MEDIUM/LOW",
    "why": "Why they need this service"
  },
  "pain_points": [
    {
      "pain_point_name": "Problem name",
      "description": "What it costs them",
      "how_your_service_solves_it": "Your solution"
    }
  ],
  "recent_news": [
    {
      "date": "2026-05-10",
      "headline": "News headline",
      "source": "Source name",
      "url": "https://example.com",
      "relevance_to_service": "Why it matters for selling your service"
    }
  ],
  "executive_social_signals": [
    {
      "executive_name": "Name",
      "executive_title": "Title",
      "platform": "LinkedIn",
      "date": "2026-05-08",
      "post": "What they said",
      "indicates_pain": "What this reveals",
      "opportunity": "How your service helps"
    }
  ],
  "decision_makers": [
    {
      "rank": "primary",
      "name": "Full name",
      "title": "Job title",
      "email": "firstname.lastname@company.com",
      "linkedin": "linkedin.com/in/name",
      "why_this_person": "Why they own this pain",
      "how_your_service_helps_them": "Specific benefit for them",
      "personalized_email": {
        "subject_line": "Compelling subject mentioning company or trend",
        "body": "Hi [Name],\\n\\n[Hook with specific signal]\\n\\n[Problem statement]\\n\\n[Solution]\\n\\n[CTA]\\n\\nBest regards,\\n[Your Name]",
        "key_points": ["Reference 1", "Reference 2", "Reference 3"]
      }
    }
  ],
  "email_strategy": {
    "approach": "How to approach",
    "timing": "Best time to send",
    "sequence": ["Step 1", "Step 2", "Step 3"]
  },
  "roi_calculation": {
    "current_cost": "What they spend now",
    "annual_savings": "Estimated savings",
    "payback_period": "Timeline"
  },
  "next_steps": ["Action 1", "Action 2"],
  "research_summary": "2-3 sentence summary with specific signals"
}`;

  try {
    console.log("[CLAUDE] Calling API...");
    
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("[CLAUDE] Response received");
    
    const text = response.content[0].text;
    console.log("[PARSE] Parsing JSON...");
    
    // Clean JSON
    let json = text.trim();
    if (json.startsWith("```json")) json = json.slice(7);
    if (json.startsWith("```")) json = json.slice(3);
    if (json.endsWith("```")) json = json.slice(0, -3);
    json = json.trim();
    
    const data = JSON.parse(json);
    console.log("[SUCCESS] Research complete");
    
    return data;

  } catch (error) {
    console.error("[CLAUDE] Error:", error.message);
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
    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  }

  try {
    console.log("[HANDLER] Request received");
    
    const { company_name, userId } = JSON.parse(event.body || "{}");

    if (!company_name?.trim()) {
      console.log("[ERROR] Missing company_name");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "company_name required" })
      };
    }

    console.log(`[HANDLER] Researching: ${company_name}`);

    let userProfile = null;
    if (userId) {
      console.log("[HANDLER] Fetching profile...");
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`[HANDLER] Profile found: ${userProfile.service_name}`);
      } else {
        console.log("[HANDLER] No profile found");
      }
    }

    console.log("[HANDLER] Calling research function");
    const research = await generateResearch(company_name, userProfile);

    console.log("[HANDLER] Returning response");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research,
        research_type: userProfile?.service_name ? "SERVICE-SPECIFIC" : "GENERIC",
        user_context: userProfile ? {
          service_name: userProfile.service_name
        } : null
      })
    };

  } catch (error) {
    console.error("[HANDLER] FATAL ERROR:", error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        help: "Check that ANTHROPIC_API_KEY is set in Netlify environment variables"
      })
    };
  }
};
