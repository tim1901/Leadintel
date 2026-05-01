import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const SendCampaign = ({ campaign, onClose, onSent }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState('email');
  const [scheduleOption, setScheduleOption] = useState('now');
  const [scheduleTime, setScheduleTime] = useState('');
  const [includeFollowup, setIncludeFollowup] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  if (!campaign) return null;

  const handleSendEmail = async () => {
    setError('');
    setLoading(true);

    try {
      const emailResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/send-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: campaign.prospect_email,
            subject: campaign.message_sent.split('\n')[0],
            body: campaign.message_sent,
            fromEmail: 'outreach@yourdomain.com',
            fromName: 'Your Name',
            campaignId: campaign.campaign_id,
            userId: campaign.user_id
          })
        }
      );

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await emailResponse.json();

      // Update campaign status
      const { error: updateError } = await supabase
        .from('outreach_campaigns')
        .update({
          status: 'sent',
          sent_date: new Date().toISOString(),
          message_id: result.messageId,
          channel: 'email'
        })
        .eq('campaign_id', campaign.campaign_id);

      if (updateError) throw updateError;

      // Schedule follow-ups if enabled
      if (includeFollowup) {
        for (let i = 0; i < 3; i++) {
          await fetch(
            `${process.env.REACT_APP_API_URL}/schedule-followup`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: campaign.campaign_id,
                followUpIndex: i
              })
            }
          );
        }
      }

      setSuccessMessage(`Email sent to ${campaign.prospect_email}!`);
      setTimeout(() => {
        onSent?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setError('');
    setLoading(true);

    try {
      // For this demo, we'd need a WhatsApp number from the prospect
      // In production, you'd scrape LinkedIn or ask user to provide
      alert('WhatsApp sending requires phone number. Add phone field to prospect capture first.');
      
      /* Example code:
      const whatsappResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/send-whatsapp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: campaign.prospect_phone,
            message: campaign.message_sent,
            campaignId: campaign.campaign_id
          })
        }
      );
      */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Send Campaign</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recipient Info */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">Sending to</p>
            <p className="font-semibold text-slate-900">{campaign.prospect_name}</p>
            <p className="text-sm text-slate-600">{campaign.prospect_title}</p>
            <p className="text-sm text-blue-600">{campaign.prospect_email}</p>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Choose Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setChannel('email')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  channel === 'email'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-slate-900">📧 Email</p>
                <p className="text-xs text-slate-600 mt-1">Tracked + auto follow-ups</p>
              </button>
              <button
                onClick={() => setChannel('whatsapp')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  channel === 'whatsapp'
                    ? 'border-green-600 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-slate-900">💬 WhatsApp</p>
                <p className="text-xs text-slate-600 mt-1">Direct message</p>
              </button>
            </div>
          </div>

          {/* Schedule Options */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              When to Send
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={scheduleOption === 'now'}
                  onChange={(e) => setScheduleOption(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-slate-700">Send now</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={scheduleOption === 'later'}
                  onChange={(e) => setScheduleOption(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-slate-700">Schedule for later</span>
              </label>
            </div>
            {scheduleOption === 'later' && (
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-3 px-3 py-2 border border-slate-300 rounded-lg w-full text-sm"
              />
            )}
          </div>

          {/* Follow-up Options */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFollowup}
                onChange={(e) => setIncludeFollowup(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-slate-700">
                Auto-schedule follow-ups (day 3, 7, 14)
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-2">
              If enabled, follow-ups will be sent automatically at specified intervals
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message Preview
            </label>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 max-h-32 overflow-y-auto font-mono">
              {campaign.message_sent}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✓ {successMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={channel === 'email' ? handleSendEmail : handleSendWhatsApp}
              disabled={loading || !!successMessage}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : `Send via ${channel === 'email' ? 'Email' : 'WhatsApp'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCampaign;
