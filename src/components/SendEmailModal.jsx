import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { sendEmailAndTrack } from '../lib/resendEmailService';

const SendEmailModal = ({ isOpen, onClose, email, subject, body, campaignId, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [emailData, setEmailData] = useState({
    to: email || '',
    subject: subject || '',
    body: body || '',
    fromName: 'LeadIntel',
    trackingPixel: true,
    trackingLinks: true,
  });

  useEffect(() => {
    // Get Resend API key from integrations
    const stored = localStorage.getItem(`integrations_${user?.id}`);
    if (stored) {
      const data = JSON.parse(stored);
      setResendApiKey(data.resend_api_key || '');
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!resendApiKey) {
        setError('Resend API key not found. Please set it up in Settings → Integrations');
        setLoading(false);
        return;
      }

      if (!emailData.to || !emailData.subject || !emailData.body) {
        setError('Email, subject, and body are required');
        setLoading(false);
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.to)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Send email and track
      const result = await sendEmailAndTrack(
        supabase,
        resendApiKey,
        emailData,
        campaignId,
        user.id
      );

      if (result.success) {
        setSuccess(`✅ Email sent successfully to ${emailData.to}!`);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Send error:', err);
      setError(err.message || 'An error occurred while sending');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {!resendApiKey && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <strong>⚠️ Resend API key not configured.</strong> Go to Settings → Integrations to add your Resend API key.
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To *
              </label>
              <input
                type="email"
                name="to"
                value={emailData.to}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="prospect@company.com"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={emailData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email subject"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="body"
                value={emailData.body}
                onChange={handleChange}
                required
                rows="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your email message"
              />
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                name="fromName"
                value={emailData.fromName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            {/* Tracking Options */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">Tracking</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackingPixel"
                    checked={emailData.trackingPixel}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Track opens (invisible pixel)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackingLinks"
                    checked={emailData.trackingLinks}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Track clicks
                  </span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="font-semibold text-gray-900 mb-2">{emailData.subject}</div>
                <div className="text-gray-600 whitespace-pre-wrap">{emailData.body}</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !resendApiKey}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
              >
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
