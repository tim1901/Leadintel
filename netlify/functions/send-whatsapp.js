// netlify/functions/send-whatsapp.js
// Sends outreach messages via WhatsApp using WaSenderAPI

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      phoneNumber,
      message,
      campaignId,
      userId,
      mediaUrl
    } = JSON.parse(event.body);

    if (!phoneNumber || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing phoneNumber or message" }),
      };
    }

    // Format phone number (international format)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid phone number" }),
      };
    }

    // Call WaSenderAPI
    const payload = {
      phone: formattedPhone,
      message: message,
      custom_uid: campaignId || null,
    };

    if (mediaUrl) {
      payload.media_url = mediaUrl;
    }

    const response = await fetch('https://api.wasenderapi.com/message/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WASENDER_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send WhatsApp message');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: data.message_id,
        phoneNumber: formattedPhone,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("WhatsApp sending error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "WhatsApp sending failed",
        message: error.message,
      }),
    };
  }
};
