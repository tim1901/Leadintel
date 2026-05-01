// netlify/functions/email-webhook.js
// Receives webhooks from Resend for email tracking
// Updates campaign status based on opens/clicks

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { type, data } = JSON.parse(event.body);

    if (!type || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid webhook format" }),
      };
    }

    // Extract campaign ID from email headers or custom data
    const campaignId = data.tags?.campaignId || null;
    
    if (!campaignId) {
      console.warn("No campaign ID in webhook");
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
      };
    }

    // Update based on event type
    let updateData = {
      updated_at: new Date().toISOString(),
    };

    switch (type) {
      case 'email.delivered':
        updateData.status = 'sent';
        break;
      case 'email.opened':
        updateData.status = 'opened';
        break;
      case 'email.clicked':
        updateData.status = 'clicked';
        break;
      case 'email.bounced':
        updateData.status = 'bounced';
        break;
      case 'email.complained':
        updateData.status = 'bounced';
        break;
      default:
        console.log("Unknown webhook type:", type);
        return {
          statusCode: 200,
          body: JSON.stringify({ received: true }),
        };
    }

    // Update campaign
    const { error: updateError } = await supabase
      .from('outreach_campaigns')
      .update(updateData)
      .eq('campaign_id', campaignId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
        type: type,
        campaignId: campaignId,
        updated: !updateError
      }),
    };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Webhook processing failed",
        message: error.message,
      }),
    };
  }
};
