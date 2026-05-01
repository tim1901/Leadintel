// netlify/functions/find-warm-intros.js
// Finds warm introductions via LinkedIn mutual connections
// Returns list of mutual connections who can introduce you

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function findWarmIntros(targetPerson, userLinkedInNetwork, userProfile) {
  const systemPrompt = `You are a LinkedIn network expert.
  
  Given:
  1. Target person (who user wants to meet)
  2. User's LinkedIn network (connections)
  3. User's service
  
  Find mutual connections who can introduce them.
  
  For each mutual connection, provide:
  - Name and title
  - Email if available
  - Why they're connected to the target
  - Strength of connection (1-5)
  - Suggested introduction angle
  
  Return as JSON array.`;

  const userPrompt = `
  Target Person: ${targetPerson.name} (${targetPerson.title})
  Company: ${targetPerson.company}
  
  Your Service: ${userProfile.service_name}
  Description: ${userProfile.service_description}
  
  Your LinkedIn Network (sample): [
    ${userLinkedInNetwork.slice(0, 5).map(p => `{ name: "${p.name}", title: "${p.title}", company: "${p.company}" }`).join(',\n    ')}
  ]
  
  Find warm intros and suggest introduction angles.
  Return JSON array with: { name, title, email, mutual_connection_reason, strength (1-5), intro_angle }`;

  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 2000,
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
      raw: response.content[0].text,
      message: "Could not parse warm intros"
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
    const { targetPerson, userLinkedInNetwork, userProfile } = JSON.parse(event.body);

    if (!targetPerson || !userProfile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing targetPerson or userProfile" }),
      };
    }

    const intros = await findWarmIntros(
      targetPerson,
      userLinkedInNetwork || [],
      userProfile
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        target: targetPerson.name,
        intros: intros,
        generated_at: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("Warm intro finding error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to find warm intros",
        message: error.message,
      }),
    };
  }
};
