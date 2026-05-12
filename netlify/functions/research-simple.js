// netlify/functions/research-simple.js
// Simple wrapper to call the main research orchestrator

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to call Claude with a specific prompt
async function callClaude(systemPrompt, userPrompt, model = "claude-sonnet-4-20250514") {
  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

// Research company using Claude
async function researchCompany(companyName) {
  const systemPrompt = `You are a business research specialist. Your job is to find comprehensive information about companies and analyze their fit for B2B solutions.

Research the company thoroughly and provide:
- Company overview (size, industry, location, founding)
- Recent news and growth signals
- Potential pain points and challenges
- Budget likelihood (1-10 scale)
- Solution-seeking likelihood (1-10 scale)
- Engagement recommendations

Format your response as a structured JSON object.`;

  const userPrompt = `Research this company in detail: ${companyName}

Use your knowledge to analyze this company. Provide findings in JSON format:
{
  "company_name": "...",
  "industry": "...",
  "location": "...",
  "size_employees": "...",
  "founded_year": "...",
  "website": "...",
  "recent_news": "...",
  "pain_signals": "...",
  "budget_likelihood": 0-10,
  "solution_seeking_likelihood": 0-10,
  "engagement_recommendation": "...",
  "health_score": 0-100
}

Be realistic and insightful.`;

  const response = await callClaude(systemPrompt, userPrompt);
  
  try {
    // Extract JSON from response (Claude might include text before/after JSON)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    // Return structured response even if parsing fails
    return {
      company_name: companyName,
      error: "Failed to parse research results",
      raw_response: response
    };
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
    const { company_name } = JSON.parse(event.body || "{}");

    if (!company_name || !company_name.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "company_name is required"
        })
      };
    }

    console.log(`Researching company: ${company_name}`);

    const research = await researchCompany(company_name);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        research
      })
    };
  } catch (error) {
    console.error("Research function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Failed to research company"
      })
    };
  }
};
