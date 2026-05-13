// netlify/functions/research-simple.js
// WITH TIMEOUT PROTECTION

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

    if (error) return null;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getUserProfile error:", err);
    return null;
  }
}

// Promise with timeout
function promiseWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout')), timeoutMs)
    )
  ]);
}

async function generateResearch(companyName, userProfile) {
  const serviceName = userProfile?.service_name || "business solution";

  console.log(`Researching ${companyName} for ${serviceName}`);

  const systemPrompt = `You are a research expert. Return ONLY valid JSON, no markdown.`;

  const userPrompt = `Research ${companyName} and return JSON:

{
  "company_name": "${companyName}",
  "service_being_sold": "${serviceName}",
  "opportunity_summary": {
    "opportunity_level": "HIGH",
    "why": "Brief reason this company needs your service"
  },
  "pain_points": [
    {
      "pain_point_name": "Problem they face",
      "description": "What it costs them",
      "how_your_service_solves_it": "Your solution"
    }
  ],
  "recent_news": [
    {
      "date": "2026-05-10",
      "headline": "Recent company news",
      "source": "TechCrunch",
      "relevance_to_service": "Why it matters"
    }
  ],
  "decision_makers": [
    {
      "rank": "primary",
      "name": "CEO or Operations Lead",
      "title": "Title",
      "email": "info@company.com",
      "personalized_email": {
        "subject_line": "Compelling subject",
        "body": "Hi,\\n\\nShort email body.\\n\\nBest regards",
        "key_points": ["Point 1"]
      }
    }
  ],
  "roi_calculation": {
    "annual_savings": "Estimated savings",
    "payback_period": "3-6 months"
  },
  "next_steps": ["Step 1", "Step 2"],
  "research_summary": "Brief summary"
}`;

  try {
    console.log("Calling Claude with 15 second timeout...");
    
    const response = await promiseWithTimeout(
      client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      15000 // 15 second timeout
    );

    console.log("Claude responded");
    const text = response.content[0].text;
    
    // Clean and parse
    let json = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const data = JSON.parse(json);
    console.log("Research complete");
    return data;

  } catch (error) {
    console.error("Claude error:", error.message);
    
    // Return fallback
    return {
      company_name: companyName,
      service_being_sold: serviceName,
      opportunity_summary: {
        opportunity_level: "MEDIUM",
        why: "Companies need optimization"
      },
      pain_points: [
        {
          pain_point_name: "Operational efficiency",
          description: "Need to optimize",
          how_your_service_solves_it: "Provides solutions"
        }
      ],
      decision_makers: [
        {
          rank: "primary",
          name: "Leadership",
          title: "Executive",
          email: "info@company.com",
          personalized_email: {
            subject_line: `${companyName} - Efficiency Opportunity`,
            body: `Hi,\n\nI help companies like ${companyName} improve operations.\n\nWorth a quick chat?\n\nBest regards`,
            key_points: ["References company", "Clear value", "CTA"]
          }
        }
      ],
      roi_calculation: {
        annual_savings: "Varies",
        payback_period: "3-6 months"
      },
      next_steps: ["Contact company", "Schedule call"],
      research_summary: "Research generated (fallback mode)"
    };
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
    console.log("[START] Request received");
    
    const { company_name, userId } = JSON.parse(event.body || "{}");

    if (!company_name?.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "company_name required" })
      };
    }

    console.log(`[RESEARCH] ${company_name}`);

    let userProfile = null;
    if (userId) {
      userProfile = await getUserProfile(userId);
      console.log(`[PROFILE] ${userProfile ? 'Found' : 'Not found'}`);
    }

    const research = await generateResearch(company_name, userProfile);

    console.log("[SUCCESS] Returning research");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research,
        research_type: userProfile?.service_name ? "SERVICE-SPECIFIC" : "GENERIC"
      })
    };

  } catch (error) {
    console.error("[ERROR]", error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
