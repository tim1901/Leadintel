// netlify/functions/analyze-reply.js
// Analyzes email replies for sentiment and suggests next steps

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSentiment(reply) {
  const systemPrompt = `You are an expert at analyzing B2B sales emails.
  
  Analyze the reply and determine:
  1. Sentiment (interested, not_interested, maybe)
  2. Engagement level (1-5, where 5 is very engaged)
  3. Key points from the email
  4. Suggested next step
  
  Return as JSON only.`;

  const userPrompt = `Analyze this reply:
  
  "${reply}"
  
  Return JSON:
  {
    "sentiment": "interested|not_interested|maybe",
    "engagement_level": 1-5,
    "key_points": ["point1", "point2"],
    "next_step": "suggested action",
    "reasoning": "why this sentiment"
  }`;

  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 500,
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
      sentiment: "maybe",
      engagement_level: 3,
      key_points: [],
      next_step: "Review manually",
      reasoning: "Could not parse response"
    };
  }
}

async function generateResponse(reply, userProfile, companyResearch) {
  const systemPrompt = `You are a B2B sales expert responding to prospects.
  
  Based on their reply, draft a concise (100-150 word) response that:
  1. References specific points from their email
  2. Moves conversation forward
  3. Uses ${userProfile.messaging_style} tone
  4. Addresses their concerns or interests
  
  Return plain text, no markdown.`;

  const userPrompt = `
  Their reply: "${reply}"
  
  Your service: ${userProfile.service_name}
  Description: ${userProfile.service_description}
  
  Company: ${companyResearch.company_name}
  
  Draft a response email.`;

  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  return response.content[0].text;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { reply, userProfile, companyResearch, generateReply } = JSON.parse(event.body);

    if (!reply) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing reply text" }),
      };
    }

    // Analyze sentiment
    const analysis = await analyzeSentiment(reply);

    let responseEmail = null;
    if (generateReply && userProfile && companyResearch) {
      responseEmail = await generateResponse(reply, userProfile, companyResearch);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        analysis: analysis,
        suggestedResponse: responseEmail,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("Reply analysis error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Reply analysis failed",
        message: error.message,
      }),
    };
  }
};
