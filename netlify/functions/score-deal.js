// netlify/functions/score-deal.js
// AI-powered deal scoring for opportunity assessment

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function scoreDeal(companyData, campaignData, conversationHistory, userProfile) {
  const systemPrompt = `You are a B2B sales deal scoring expert.

  Score deals on multiple dimensions:
  1. Problem-fit (1-100): Does this company have the problem you solve?
  2. Budget-fit (1-100): Can they afford your solution?
  3. Timeline (1-100): How soon do they need a solution?
  4. Decision-ready (1-100): How close are they to buying?
  5. Competitive position (1-100): How likely vs competitors?
  6. Relationship strength (1-100): Quality of engagement so far?

  Return a comprehensive deal score (1-100) and recommend next actions.
  Format as JSON.`;

  const userPrompt = `
  Company: ${companyData.company_name}
  Industry: ${companyData.industry}
  Size: ${companyData.company_size}
  Health Score: ${companyData.health_score}
  
  Pain Signals: ${JSON.stringify(companyData.pain_signals?.slice(0, 3) || [])}
  
  Campaign Status: ${campaignData.status}
  Outreach Angle Used: ${campaignData.outreach_angle}
  Days Since Outreach: ${Math.floor((Date.now() - new Date(campaignData.sent_date)) / (1000 * 60 * 60 * 24))}
  
  Conversation History:
  ${conversationHistory?.map(c => `- Reply: "${c.reply_text}" (Sentiment: ${c.sentiment_score}/5)`).join('\n')}
  
  Your Service: ${userProfile.service_name}
  
  Score this deal comprehensively. Return JSON with:
  {
    "overall_score": 1-100,
    "problem_fit": 1-100,
    "budget_fit": 1-100,
    "timeline": 1-100,
    "decision_ready": 1-100,
    "competitive_position": 1-100,
    "relationship_strength": 1-100,
    "deal_stage": "early|qualified|advanced|closing",
    "risk_factors": ["risk1", "risk2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "next_action": "specific recommended next step",
    "probability_close": "0-100%",
    "estimated_value": "if known or estimated",
    "reasoning": "brief explanation"
  }`;

  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch (e) {
    return {
      overall_score: 50,
      error: "Could not parse deal score",
      raw: response.content[0].text
    };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { companyData, campaignData, conversationHistory, userProfile } = JSON.parse(event.body);

    if (!companyData || !campaignData || !userProfile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const score = await scoreDeal(
      companyData,
      campaignData,
      conversationHistory || [],
      userProfile
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        company: companyData.company_name,
        dealScore: score,
        generated_at: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("Deal scoring error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Deal scoring failed",
        message: error.message,
      }),
    };
  }
};
