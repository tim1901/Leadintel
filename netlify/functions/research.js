// netlify/functions/research.js
// This is the main orchestrator that coordinates the multi-agent research

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to call Claude with a specific prompt
async function callClaude(systemPrompt, userPrompt, model = "claude-opus-4-20250805") {
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
}

// Agent 1: Forensic Researcher
async function researchCompany(companyName) {
  const systemPrompt = `You are a business research specialist. Your job is to find comprehensive information about companies.
  
  Research the company thoroughly and provide:
  - Company overview (size, industry, location, headquarters, founding date)
  - Recent news and announcements (last 6 months)
  - Funding history and financial status
  - Product/service evolution and recent launches
  - Website analysis (positioning, target market)
  - Expansion or scaling activities
  
  Format your response as a structured JSON object with clear sections.`;

  const userPrompt = `Research the company: ${companyName}
  
  Use your knowledge and web search capabilities to find recent information about this company.
  Provide findings in JSON format with the following structure:
  {
    "company_name": "...",
    "industry": "...",
    "location": "...",
    "size_employees": "...",
    "founded_year": "...",
    "website": "...",
    "recent_news": [...],
    "funding_history": {...},
    "recent_announcements": [...],
    "product_services": "...",
    "positioning": "..."
  }`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse JSON response" };
  }
}

// Agent 2: Pain Signal Detector
async function detectPainSignals(userProfile, companyResearch) {
  const systemPrompt = `You are a business pain signal analyst. Your job is to identify pain points relevant to the user's service.
  
  Given:
  1. User's service description and offerings
  2. Company research data
  
  Find pain signals that indicate the company needs the user's service.
  
  Score each pain signal 1-5 (1=low, 5=critical).
  Include: source, quote, timeline, action window.
  
  Format as JSON array of pain signals.`;

  const userPrompt = `User's Service:
  Name: ${userProfile.service_name}
  Description: ${userProfile.service_description}
  Differentiators: ${userProfile.differentiators.join(", ")}
  Target Industries: ${userProfile.target_industries.join(", ")}
  
  Company Research:
  ${JSON.stringify(companyResearch, null, 2)}
  
  Find pain signals that show this company needs the user's service.
  Return JSON array with fields: severity, category, description, source, quote, timeline, window`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse pain signals" };
  }
}

// Agent 3: Decision-Maker Finder
async function findStakeholders(companyName, companyResearch) {
  const systemPrompt = `You are an organizational intelligence specialist. Your job is to identify key decision-makers.
  
  Find 3-5 key stakeholders who would be involved in buying solutions for:
  - Operations automation
  - Business process management
  - Digital transformation
  - Compliance automation
  
  For each person, provide:
  - Name, title, email (if known)
  - Why they matter in the buying decision
  - Their recent activity/stated priorities
  - Best contact approach
  - Contact priority (1-5)
  
  Format as JSON array.`;

  const userPrompt = `Company: ${companyName}
  
  Company Data:
  ${JSON.stringify(companyResearch, null, 2)}
  
  Find the key decision-makers and influencers at this company.
  Return JSON array with fields: name, title, email, linkedin_url, contact_priority, 
  motivation, pain_owned, best_channel, recent_activity`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse stakeholders" };
  }
}

// Agent 4: Competitive Analyzer
async function analyzeCompetitive(userProfile, companyResearch) {
  const systemPrompt = `You are a competitive positioning analyst. Your job is to understand:
  1. What vendors/solutions the company currently uses
  2. Gaps in their current solution
  3. How the user's service fills those gaps
  4. Positioning strategy
  
  Format response as structured JSON.`;

  const userPrompt = `User's Service:
  ${userProfile.service_name}: ${userProfile.service_description}
  
  Company:
  ${JSON.stringify(companyResearch, null, 2)}
  
  Analyze:
  1. What automation/process tools does this company likely use?
  2. What gaps might exist in their current solution?
  3. How would the user's service fit?
  4. What's the unique positioning angle?
  
  Return JSON with fields: current_vendors, gaps, our_fit, positioning_angle, differentiation`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse competitive analysis" };
  }
}

// Agent 5: Health Scorer
async function scoreHealth(painSignals, stakeholders, companyResearch, userProfile) {
  const systemPrompt = `You are a lead scoring specialist. Score the company 1-100 based on:
  1. Likelihood they have the problem (from pain signals)
  2. Likelihood they have budget (size, funding, growth)
  3. Likelihood they're actively seeking solutions (recent activity, hiring)
  
  Return a JSON object with the score and explanation.`;

  const userPrompt = `Company: ${companyResearch.company_name}
  
  Pain Signals:
  ${JSON.stringify(painSignals, null, 2)}
  
  Stakeholders Found: ${stakeholders.length}
  
  Company Data:
  ${JSON.stringify(companyResearch, null, 2)}
  
  Score this company 1-100 for fit with: ${userProfile.service_name}
  
  Return JSON with fields: health_score, problem_fit (1-100), budget_likelihood (1-100), 
  solution_seeking_likelihood (1-100), explanation`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse health score" };
  }
}

// Agent 6: Engagement Recommender
async function recommendEngagement(userProfile, painSignals, stakeholders, companyResearch) {
  const systemPrompt = `You are an engagement strategy expert. Your job is to recommend:
  1. Best time to reach out (now, wait, window)
  2. Who to contact first
  3. What message angle to use
  4. Best channel (email, LinkedIn, WhatsApp, Twitter)
  5. Decision timeline
  
  Format as structured JSON.`;

  const userPrompt = `User: ${userProfile.name} (${userProfile.service_name})
  
  Company: ${companyResearch.company_name}
  
  Pain Signals:
  ${JSON.stringify(painSignals, null, 2)}
  
  Stakeholders:
  ${JSON.stringify(stakeholders, null, 2)}
  
  Recommend engagement strategy. Return JSON with fields:
  decision_timeline, best_time_to_contact, contact_first (stakeholder name), 
  recommended_angle, best_channel, urgency_level, next_steps`;

  const result = await callClaude(systemPrompt, userPrompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { raw: result, error: "Could not parse engagement recommendation" };
  }
}

// Main handler
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { companyName, userProfile } = JSON.parse(event.body);

    if (!companyName || !userProfile) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: companyName, userProfile",
        }),
      };
    }

    console.log(`Starting research for: ${companyName}`);

    // Run all agents in sequence
    const companyResearch = await researchCompany(companyName);
    console.log("✓ Forensic research complete");

    const painSignals = await detectPainSignals(userProfile, companyResearch);
    console.log("✓ Pain signal detection complete");

    const stakeholders = await findStakeholders(companyName, companyResearch);
    console.log("✓ Stakeholder identification complete");

    const competitiveIntel = await analyzeCompetitive(
      userProfile,
      companyResearch
    );
    console.log("✓ Competitive analysis complete");

    const healthScore = await scoreHealth(
      painSignals,
      stakeholders,
      companyResearch,
      userProfile
    );
    console.log("✓ Health scoring complete");

    const engagementRecommendation = await recommendEngagement(
      userProfile,
      painSignals,
      stakeholders,
      companyResearch
    );
    console.log("✓ Engagement recommendation complete");

    // Compile final report
    const report = {
      company_research: companyResearch,
      pain_signals: painSignals,
      stakeholders: stakeholders,
      competitive_intel: competitiveIntel,
      health_score: healthScore,
      engagement_recommendation: engagementRecommendation,
      generated_at: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(report),
    };
  } catch (error) {
    console.error("Research error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Research failed",
        message: error.message,
      }),
    };
  }
};
