// netlify/functions/send-email.js
// Sends outreach emails via Resend
// Supports tracking opens and clicks

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      to,
      subject,
      body,
      fromEmail,
      fromName,
      campaignId,
      userId,
      trackingPixelUrl
    } = JSON.parse(event.body);

    if (!to || !subject || !body || !fromEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Add tracking pixel to email body
    const trackingCode = campaignId ? `?campaign=${campaignId}&user=${userId}` : '';
    const htmlBody = `
      ${body.replace(/\n/g, '<br>')}
      <img src="https://your-tracking-domain.com/track${trackingCode}" width="1" height="1" alt="" style="display:none;" />
    `;

    // Send via Resend
    const response = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlBody,
      reply_to: fromEmail,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: response.data.id,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Email sending failed",
        message: error.message,
      }),
    };
  }
};
