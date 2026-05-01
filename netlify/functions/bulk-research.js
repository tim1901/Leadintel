// netlify/functions/bulk-research.js
// Processes bulk company research from CSV uploads

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require("@anthropic-ai/sdk");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Quick research mode (faster, less detailed)
async function quickResearch(companyName, userProfile) {
  const systemPrompt = `You are a quick business research specialist.
  
  Provide rapid company analysis in 30 seconds:
  - Industry & size estimate
  - 2-3 top pain signals
  - Quick health score (1-100)
  
  Return as JSON with minimal detail.`;

  const userPrompt = `Company: ${companyName}
  
  Service: ${userProfile.service_name}
  
  Provide quick research in JSON: { industry, estimated_size, pain_signals: [], health_score }`;

  const response = await client.messages.create({
    model: "claude-opus-4-20250805",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch (e) {
    return null;
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
    const { companies, userId, userProfile } = JSON.parse(event.body);

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No companies provided" }),
      };
    }

    if (companies.length > 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Too many companies. Maximum 50 per bulk request. Use multiple requests or upgrade." 
        }),
      };
    }

    console.log(`Starting bulk research for ${companies.length} companies`);

    const results = [];
    const errors = [];

    // Process companies in parallel (batches of 5)
    for (let i = 0; i < companies.length; i += 5) {
      const batch = companies.slice(i, i + 5);
      
      const batchPromises = batch.map(async (company) => {
        try {
          const research = await quickResearch(company.name, userProfile);
          
          if (research) {
            // Save to Supabase
            const { error: insertError } = await supabase
              .from('company_research')
              .insert([
                {
                  user_id: userId,
                  company_name: company.name,
                  industry: research.industry,
                  company_size: research.estimated_size,
                  health_score: research.health_score,
                  pain_signals: research.pain_signals,
                  research_status: 'completed'
                }
              ]);

            if (insertError) throw insertError;

            return {
              company: company.name,
              success: true,
              health_score: research.health_score
            };
          } else {
            throw new Error("Could not parse research");
          }
        } catch (err) {
          return {
            company: company.name,
            success: false,
            error: err.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + 5 < companies.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        summary: {
          total: companies.length,
          successful,
          failed
        },
        results: results,
        message: `Processed ${successful}/${companies.length} companies successfully`
      }),
    };
  } catch (error) {
    console.error("Bulk research error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Bulk research failed",
        message: error.message,
      }),
    };
  }
};
