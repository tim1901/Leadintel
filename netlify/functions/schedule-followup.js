// netlify/functions/schedule-followup.js
// Schedules automatic follow-ups at specified intervals

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Follow-up schedule: day 3, 7, 14, 21
const FOLLOWUP_SCHEDULE = [
  { days: 3, angle: "reminder", subject: "Quick follow-up re: {company}" },
  { days: 7, angle: "value", subject: "Thought this might be helpful - {company}" },
  { days: 14, angle: "urgency", subject: "Time-sensitive opportunity for {company}" },
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { campaignId, followUpIndex } = JSON.parse(event.body);

    if (!campaignId || followUpIndex === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing campaignId or followUpIndex" }),
      };
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Campaign not found" }),
      };
    }

    // Get follow-up details
    const followUpConfig = FOLLOWUP_SCHEDULE[followUpIndex];
    if (!followUpConfig) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid follow-up index" }),
      };
    }

    // Create follow-up record
    const { data: followUp, error: insertError } = await supabase
      .from('followups')
      .insert([
        {
          campaign_id: campaignId,
          user_id: campaign.user_id,
          research_id: campaign.research_id,
          follow_up_number: followUpIndex + 1,
          scheduled_for: new Date(Date.now() + followUpConfig.days * 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          angle: followUpConfig.angle,
          subject_template: followUpConfig.subject,
        }
      ]);

    if (insertError) throw insertError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        followUp: followUp[0],
        scheduledFor: followUpConfig.days + " days"
      }),
    };
  } catch (error) {
    console.error("Follow-up scheduling error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Follow-up scheduling failed",
        message: error.message,
      }),
    };
  }
};
