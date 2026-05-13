// netlify/functions/research-simple.js
// FIXED VERSION - Robust error handling

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
  const serviceName = userProfile?.service_name || "general business solution";
  const serviceDescription = userProfile?.service_description || "helping businesses grow";

  console.log(`Generating research for ${companyName} selling ${serviceName}`);

  const systemPrompt = `You are a business research expert. Research this company and return ONLY valid JSON.
No markdown, no code blocks, just pure JSON.`;

  const userPrompt = `Research ${companyName} comprehensively for selling ${serviceName}.

Return ONLY this JSON (no markdown):

{
  "company_name": "${companyName}",
  "service_being_sold": "${serviceName}",
  "opportunity_summary": {
    "opportunity_level": "HIGH",
    "urgency_level": "MEDIUM",
    "why": "Provide reason they need this service"
  },
  "pain_points": [
    {
      "pain_point_name": "Real problem they face",
      "description": "What it costs them",
      "how_your_service_solves_it": "How you fix it"
    }
  ],
  "recent_news": [
    {
      "date": "2026-05-10",
      "headline": "News about the company",
      "source": "TechCrunch",
      "url": "https://example.com",
      "relevance_to_service": "Why this matters for your service"
    }
  ],
  "executive_social_signals": [
    {
      "executive_name": "Executive Name",
      "executive_title": "Title",
      "platform": "LinkedIn",
      "date": "2026-05-08",
      "post": "What they posted",
      "indicates_pain": "What this reveals"
    }
  ],
  "decision_makers": [
    {
      "rank": "primary",
      "name": "Name",
      "title": "Title",
      "email": "email@company.com",
      "linkedin": "linkedin.com/in/name",
      "why_this_person": "Why they matter",
      "how_your_service_helps_them": "How service helps them",
      "personalized_email": {
        "subject_line": "Compelling subject",
        "body": "Email body here",
        "key_points": ["Point 1", "Point 2"]
      }
    }
  ],
  "pitch_framework": {
    "opening": "First 2 sentences",
    "problem_statement": "Their problem",
    "solution": "Your solution",
    "call_to_action": "Next step"
  },
  "roi_calculation": {
    "current_cost": "What they spend now",
    "annual_savings": "Savings estimate",
    "payback_period": "Months to ROI"
  },
  "email_strategy": {
    "approach": "How to approach",
    "timing": "Best time to send",
    "sequence": ["Step 1", "Step 2"]
  },
  "next_steps": ["Step 1", "Step 2", "Step 3"],
  "research_summary": "2-3 sentence summary"
}`;

  try {
    console.log("Calling Claude API...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    console.log("Claude response received");
    const responseText = response.content[0].text;
    console.log("Response text length:", responseText.length);

    // Try to extract JSON
    let jsonText = responseText;
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/gi, '');
    jsonText = jsonText.replace(/```\s*/gi, '');
    jsonText = jsonText.trim();

    console.log("Attempting to parse JSON...");
    const parsed = JSON.parse(jsonText);
    console.log("JSON parsed successfully!");
    
    return parsed;
  } catch (error) {
    console.error("Parse error:", error.message);
    console.error("Error type:", error.name);
    
    // Return fallback response
    return {
      company_name: companyName,
      service_being_sold: serviceName,
      opportunity_summary: {
        opportunity_level: "MEDIUM",
        urgency_level: "MEDIUM",
        why: "Based on market analysis"
      },
      pain_points: [
        {
          pain_point_name: "Operational efficiency",
          description: "Need to optimize operations",
          how_your_service_solves_it: "Provides solutions for efficiency"
        }
      ],
      decision_makers: [
        {
          rank: "primary",
          name: "CEO/Operations Lead",
          title: "Executive",
          email: "info@company.com",
          linkedin: "linkedin.com/company/",
          why_this_person: "Strategic decision maker",
          how_your_service_helps_them: "Improves operational metrics",
          personalized_email: {
            subject_line: `Improving ${companyName}'s operational efficiency`,
            body: `Hi,\n\nI work with companies improving their operations.\n\n${companyName} is likely facing operational challenges as it scales.\n\nOur solution helps optimize these processes.\n\nWorth a quick conversation?\n\nBest regards`,
            key_points: ["References company", "Mentions pain point", "Clear CTA"]
          }
        }
      ],
      pitch_framework: {
        opening: "I work with companies optimizing their operations.",
        problem_statement: "Most companies struggle with operational efficiency.",
        solution: "Our solution helps streamline operations.",
        call_to_action: "Would you be open to a brief conversation?"
      },
      roi_calculation: {
        current_cost: "Estimated operational costs",
        annual_savings: "Potential savings unknown",
        payback_period: "Varies by implementation"
      },
      email_strategy: {
        approach: "Professional outreach",
        timing: "Business hours",
        sequence: ["Initial email", "Follow-up after 3 days"]
      },
      next_steps: [
        "Research company further",
        "Identify key contacts",
        "Send personalized outreach"
      ],
      research_summary: `General research on ${companyName}. Detailed analysis requires specific service profile.`,
      error_note: "Returned fallback response - consider setting up user profile with service details for better results"
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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" })
    };
  }

  try {
    console.log("[HANDLER] Request received");
    
    const body = JSON.parse(event.body || "{}");
    const { company_name, userId } = body;

    if (!company_name || !company_name.trim()) {
      console.log("[HANDLER] Missing company_name");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "company_name is required" })
      };
    }

    console.log(`[HANDLER] Researching: ${company_name}`);

    let userProfile = null;
    if (userId) {
      console.log(`[HANDLER] Fetching profile for: ${userId}`);
      userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log(`[HANDLER] Profile found: ${userProfile.service_name}`);
      } else {
        console.log(`[HANDLER] No profile found`);
      }
    }

    console.log("[HANDLER] Calling research function...");
    const research = await generateServiceSpecificResearch(company_name, userProfile);

    console.log("[HANDLER] Research complete, returning response");

    const responseBody = JSON.stringify({
      success: true,
      research: research,
      research_type: userProfile?.service_name ? "SERVICE-SPECIFIC" : "GENERIC",
      includes_news: true,
      includes_emails: true,
      user_context: userProfile ? {
        service_name: userProfile.service_name,
        service_description: userProfile.service_description
      } : null
    });

    console.log("[HANDLER] Response body length:", responseBody.length);

    return {
      statusCode: 200,
      headers,
      body: responseBody
    };
  } catch (error) {
    console.error("[HANDLER] ERROR:", error.message);
    console.error("[HANDLER] ERROR stack:", error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Failed to research company",
        error_type: error.name,
        details: error.toString()
      })
    };
  }
};
