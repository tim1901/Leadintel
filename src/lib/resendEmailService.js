// resendEmailService.js
// Service to send emails via Resend API with database tracking

/**
 * Send email via Resend
 */
export async function sendEmailViaResend(apiKey, emailData) {
  try {
    if (!apiKey) {
      throw new Error('Resend API key is required. Please set it in Settings → Integrations');
    }

    const {
      to,
      subject,
      body,
      fromEmail = 'onboarding@resend.dev',
      fromName = 'LeadIntel',
      replyTo,
      trackingPixel = true,
      trackingLinks = true,
    } = emailData;

    if (!to || !subject || !body) {
      throw new Error('Email, subject, and body are required');
    }

    // Convert plain text to HTML with tracking
    let htmlBody = `<html><body>${body.replace(/\n/g, '<br>')}</body></html>`;

    // Add tracking pixel if enabled
    if (trackingPixel) {
      htmlBody += '<img src="https://track.resend.com/email/open" alt="" style="display:none" />';
    }

    // Make request to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        html: htmlBody,
        reply_to: replyTo,
        track: {
          opens: trackingPixel,
          clicks: trackingLinks,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    const result = await response.json();

    return {
      success: true,
      messageId: result.id,
      from: result.from,
      to: result.to,
      createdAt: result.created_at,
      error: null,
    };
  } catch (error) {
    console.error('Resend email error:', error);
    return {
      success: false,
      messageId: null,
      error: error.message,
    };
  }
}

/**
 * Send email and save to database
 * Uses the email_logs table to track all emails
 */
export async function sendEmailAndTrack(supabase, apiKey, emailData, campaignId, userId) {
  try {
    // Send email via Resend
    const sendResult = await sendEmailViaResend(apiKey, emailData);

    if (!sendResult.success) {
      throw new Error(sendResult.error);
    }

    // Save to email logs in database
    if (supabase && campaignId && userId) {
      const { error: logError } = await supabase
        .from('email_logs')
        .insert([
          {
            campaign_id: campaignId,
            user_id: userId,
            resend_message_id: sendResult.messageId,
            recipient_email: emailData.to,
            subject: emailData.subject,
            body: emailData.body,
            sent_at: new Date().toISOString(),
            status: 'delivered',
          }
        ]);

      if (logError) {
        console.error('Failed to log email:', logError);
        // Don't throw - email was sent successfully even if logging failed
      }

      // Update campaign status to 'sent'
      const { error: updateError } = await supabase
        .from('outreach_campaigns')
        .update({
          status: 'sent',
          sent_date: new Date().toISOString(),
          message_id: sendResult.messageId,
        })
        .eq('campaign_id', campaignId);

      if (updateError) {
        console.error('Failed to update campaign:', updateError);
        // Don't throw - email was sent successfully
      }
    }

    return {
      success: true,
      messageId: sendResult.messageId,
      email: emailData.to,
      sentAt: sendResult.createdAt,
      error: null,
    };
  } catch (error) {
    console.error('Track and send error:', error);
    return {
      success: false,
      messageId: null,
      error: error.message,
    };
  }
}

/**
 * Get email sending status
 * Checks if email was opened or clicked
 */
export async function getEmailStatus(apiKey, messageId) {
  try {
    const response = await fetch(`https://api.resend.com/emails/${messageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get email status');
    }

    const result = await response.json();

    return {
      success: true,
      status: result.status,
      opened: result.opens?.length > 0,
      clicked: result.clicks?.length > 0,
      bounced: result.bounced_at ? true : false,
      openCount: result.opens?.length || 0,
      clickCount: result.clicks?.length || 0,
      error: null,
    };
  } catch (error) {
    console.error('Get status error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update email status in database when webhook is received from Resend
 * Call this from a webhook endpoint when Resend sends events
 */
export async function updateEmailStatus(supabase, messageId, event) {
  try {
    const updates = {
      status: event.type, // delivered, opened, clicked, bounced
    };

    if (event.type === 'opened') {
      updates.opened_at = new Date().toISOString();
      updates.status = 'opened';
    } else if (event.type === 'clicked') {
      updates.clicked_at = new Date().toISOString();
      updates.status = 'clicked';
    } else if (event.type === 'bounced') {
      updates.bounced_at = new Date().toISOString();
      updates.status = 'bounced';
    }

    const { error } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('resend_message_id', messageId);

    if (error) {
      console.error('Failed to update email status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Update status error:', error);
    return { success: false, error: error.message };
  }
}
