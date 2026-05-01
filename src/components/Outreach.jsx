import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SendEmailModal from './SendEmailModal';

const Outreach = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    prospectName: '',
    prospectEmail: '',
    prospectTitle: '',
    painPoint: '',
    angle: 'executive', // executive, operational, technical
  });

  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateOutreach = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.companyName || !formData.prospectName || !formData.prospectEmail) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // For now, we'll create sample emails
      // In production, this would call Claude API via Netlify function
      const sampleEmails = {
        executive: {
          subject: `${formData.painPoint ? `Help ${formData.companyName} with ${formData.painPoint}` : `Partnership with ${formData.companyName}`}`,
          body: `Hi ${formData.prospectName},

I noticed ${formData.companyName} is likely dealing with ${formData.painPoint || 'operational challenges'}.

We help companies like yours ${formData.painPoint ? `solve ${formData.painPoint}` : 'improve their operations'} and see an average 40% improvement in efficiency.

Would you be open to a quick 15-min chat?

Best regards,
LeadIntel Team`
        },
        operational: {
          subject: `Quick idea for ${formData.companyName}'s operations`,
          body: `Hi ${formData.prospectName},

I came across ${formData.companyName} and thought of you specifically.

We work with ${formData.prospectTitle ? formData.prospectTitle : 'operations leaders'} to streamline processes and reduce costs.

Given your focus on ${formData.painPoint || 'efficiency'}, I think there might be some overlap.

Free to jump on a call this week?

Best,
LeadIntel Team`
        },
        technical: {
          subject: `Technical insight for ${formData.companyName}`,
          body: `Hi ${formData.prospectName},

While researching ${formData.companyName}'s tech stack, I noticed potential improvements around ${formData.painPoint || 'automation'}.

Our platform helps teams like yours:
- Reduce manual work
- Improve data accuracy
- Speed up processes

Curious if this resonates?

Let me know,
LeadIntel Team`
        }
      };

      const emails = [
        {
          id: 1,
          angle: 'executive',
          subject: sampleEmails.executive.subject,
          body: sampleEmails.executive.body,
          confidence: 0.92
        },
        {
          id: 2,
          angle: 'operational',
          subject: sampleEmails.operational.subject,
          body: sampleEmails.operational.body,
          confidence: 0.88
        },
        {
          id: 3,
          angle: 'technical',
          subject: sampleEmails.technical.subject,
          body: sampleEmails.technical.body,
          confidence: 0.85
        }
      ];

      setGeneratedEmails(emails);
      setSuccess('✅ Generated 3 email angles!');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = (email) => {
    setSelectedEmail({
      to: formData.prospectEmail,
      subject: email.subject,
      body: email.body,
      angle: email.angle
    });
    setShowSendModal(true);
  };

  const handleEmailSent = () => {
    setSuccess('✅ Email sent successfully!');
    setFormData({
      companyName: '',
      prospectName: '',
      prospectEmail: '',
      prospectTitle: '',
      painPoint: '',
      angle: 'executive',
    });
    setGeneratedEmails([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate & Send Outreach</h1>
        <p className="text-gray-600 mt-1">Create personalized emails and send via Resend</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Generate Form */}
      <form onSubmit={handleGenerateOutreach} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Step 1: Enter Prospect Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Apple Inc"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prospect Name *</label>
            <input
              type="text"
              name="prospectName"
              value={formData.prospectName}
              onChange={handleChange}
              placeholder="Tim Cook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="prospectEmail"
              value={formData.prospectEmail}
              onChange={handleChange}
              placeholder="tim@apple.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              name="prospectTitle"
              value={formData.prospectTitle}
              onChange={handleChange}
              placeholder="CEO"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pain Point (Optional)</label>
            <input
              type="text"
              name="painPoint"
              value={formData.painPoint}
              onChange={handleChange}
              placeholder="e.g., inefficient sales process, high support costs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {loading ? 'Generating...' : 'Generate 3 Email Angles'}
        </button>
      </form>

      {/* Generated Emails */}
      {generatedEmails.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Step 2: Choose & Send</h2>

          {generatedEmails.map((email) => (
            <div key={email.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 capitalize">{email.angle} Angle</h4>
                  <p className="text-gray-600 text-sm mt-1">Confidence: {Math.round(email.confidence * 100)}%</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="font-semibold text-gray-900 mb-2">{email.subject}</div>
                <div className="text-gray-600 whitespace-pre-wrap text-sm">{email.body}</div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSendEmail(email)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                >
                  Send This Email
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Email Modal */}
      {selectedEmail && (
        <SendEmailModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          email={selectedEmail.to}
          subject={selectedEmail.subject}
          body={selectedEmail.body}
          campaignId={`campaign_${Date.now()}`}
          onSuccess={handleEmailSent}
        />
      )}
    </div>
  );
};

export default Outreach;
