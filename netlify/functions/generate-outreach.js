// netlify/functions/generate-outreach.js
// Generates 3 personalized outreach angles based on research

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function callClaude(systemPrompt, userPrompt) {
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

  return response.content[0].text;
}

async function generateExecutiveAngle(userProfile, companyResearch, painSignals, stakeholder) {
  const systemPrompt = `You are a sales email expert writing outreach for C-suite executives.
  
  Write a compelling, personalized outreach email that:
  1. Opens with a specific insight about their company (reference pain signal or recent news)
  2. Positions the user's service as a strategic solution
  3. Includes a clear, specific ask (20-min call)
  4. Uses ${userProfile.messaging_style} tone
  5. Is 150-200 words
  
  Format as plain text, no markdown.`;

  const userPrompt = `
  Recipient: ${stakeholder.name} (${stakeholder.title})
  
  Company: ${companyResearch.company_name}
  
  User: ${userProfile.name}
  Service: ${userProfile.service_name}
  Differentiators: ${userProfile.differentiators.join(", ")}
  
  Pain Signals (reference these):
  ${Array.isArray(painSignals) ? painSignals.map(p => `- ${p.category}: ${p.description}`).join("\n") : ""}
  
  Key Point: This is for an executive. Focus on strategic impact, revenue/efficiency gains, and competitive advantage.
  
  Write the email body only (no subject line yet).`;

  return await callClaude(systemPrompt, userPrompt);
}

async function generateOperationalAngle(userProfile, companyResearch, painSignals, stakeholder) {
  const systemPrompt = `You are a business operations email expert.
  
  Write an outreach email that:
  1. Speaks to operational/process pain points
  2. References their specific challenges
  3. Positions as operational efficiency expert
  4. Focuses on implementation, timelines, results
  5. Uses ${userProfile.messaging_style} tone
  6. Is 150-200 words
  
  Format as plain text, no markdown.`;

  const userPrompt = `
  Recipient: ${stakeholder.name} (${stakeholder.title})
  
  Company: ${companyResearch.company_name}
  
  User: ${userProfile.name}
  Service: ${userProfile.service_name}
  
  Pain Signals:
  ${Array.isArray(painSignals) ? painSignals.map(p => `- ${p.category}: ${p.description}`).join("\n") : ""}
  
  Key Point: This is for ops/process owner. Focus on elimination of manual work, speed, accuracy, compliance.
  
  Write the email body only.`;

  return await callClaude(systemPrompt, userPrompt);
}

async function generateTechnicalAngle(userProfile, companyResearch, painSignals, stakeholder) {
  const systemPrompt = `You are a technical solutions architect writing to IT/Technical leaders.
  
  Write an outreach email that:
  1. Demonstrates technical understanding
  2. Addresses integration/compatibility concerns
  3. References their tech stack if known
  4. Focuses on scalability, reliability, security
  5. Uses ${userProfile.messaging_style} tone
  6. Is 150-200 words
  
  Format as plain text, no markdown.`;

  const userPrompt = `
  Recipient: ${stakeholder.name} (${stakeholder.title})
  
  Company: ${companyResearch.company_name}
  
  User: ${userProfile.name}
  Service: ${userProfile.service_name}
  
  Pain Signals:
  ${Array.isArray(painSignals) ? painSignals.map(p => `- ${p.category}: ${p.description}`).join("\n") : ""}
  
  Key Point: This is for technical person. Focus on architecture, integration, security, compliance, performance.
  
  Write the email body only.`;

  return await callClaude(systemPrompt, userPrompt);
}

async function generateSubjectLines(userProfile, companyResearch, stakeholder) {
  const systemPrompt = `Generate 3 short, punchy email subject lines (5-8 words each).
  
  Each should:
  1. Be curiosity-driven or insight-driven
  2. Avoid "spam" words
  3. Reference the company or their situation when possible
  4. Be click-worthy
  
  Return as JSON: ["subject1", "subject2", "subject3"]`;

  const userPrompt = `
  Company: ${companyResearch.company_name}
  Recipient: ${stakeholder.title}
  Service: ${userProfile.service_name}
  
  Generate 3 subject line options.`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return [
      `Quick insight on ${companyResearch.company_name}'s ops`,
      `${companyResearch.company_name} + ${userProfile.service_name}`,
      `20-min call about ${companyResearch.company_name}?`
    ];
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
    const { userProfile, companyResearch, painSignals, stakeholder } = JSON.parse(event.body);

    if (!userProfile || !companyResearch || !stakeholder) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    console.log(`Generating outreach for ${stakeholder.name} at ${companyResearch.company_name}`);

    // Generate all 3 angles in parallel
    const [executiveAngle, operationalAngle, technicalAngle, subjectLines] = await Promise.all([
      generateExecutiveAngle(userProfile, companyResearch, painSignals, stakeholder),
      generateOperationalAngle(userProfile, companyResearch, painSignals, stakeholder),
      generateTechnicalAngle(userProfile, companyResearch, painSignals, stakeholder),
      generateSubjectLines(userProfile, companyResearch, stakeholder),
    ]);

    const outreach = {
      angles: [
        {
          name: "Executive / Strategic",
          description: "Focus on strategic impact and competitive advantage",
          body: executiveAngle,
          subjects: subjectLines.slice(0, 1),
          tone: "high-level, visionary",
        },
        {
          name: "Operational / Efficiency",
          description: "Focus on process improvement and cost reduction",
          body: operationalAngle,
          subjects: subjectLines.slice(1, 2),
          tone: "practical, results-driven",
        },
        {
          name: "Technical / Implementation",
          description: "Focus on technical fit and integration",
          body: technicalAngle,
          subjects: subjectLines.slice(2, 3),
          tone: "technical, detailed",
        },
      ],
      stakeholder_name: stakeholder.name,
      stakeholder_title: stakeholder.title,
      company_name: companyResearch.company_name,
      generated_at: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(outreach),
    };
  } catch (error) {
    console.error("Outreach generation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Outreach generation failed",
        message: error.message,
      }),
    };
  }
};
