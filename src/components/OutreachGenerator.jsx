import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const OutreachGenerator = ({ research, onClose, onOutreachGenerated }) => {
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outreach, setOutreach] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [error, setError] = useState('');

  if (!research) return null;

  const stakeholders = Array.isArray(research.stakeholders) ? research.stakeholders : [];

  const handleGenerateOutreach = async (stakeholder) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/generate-outreach`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userProfile: {
              name: 'User',
              service_name: 'Service',
              differentiators: [],
              messaging_style: 'professional'
            },
            companyResearch: {
              company_name: research.company_research?.company_name,
            },
            painSignals: research.pain_signals || [],
            stakeholder
          })
        }
      );

      if (!response.ok) throw new Error('Failed to generate outreach');

      const data = await response.json();
      setOutreach(data);
      setSelectedStakeholder(stakeholder);
      setSelectedAngle(0);
      setCustomMessage(data.angles[0].body);
    } catch (err) {
      setError(err.message || 'Failed to generate outreach');
    } finally {
      setLoading(false);
    }
  };

  const handleAngleChange = (angleIndex) => {
    setSelectedAngle(angleIndex);
    setCustomMessage(outreach.angles[angleIndex].body);
  };

  const handleSaveOutreach = async (campaign) => {
    try {
      const { user } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('outreach_campaigns')
        .insert([
          {
            user_id: user.id,
            research_id: research.research_id,
            prospect_name: selectedStakeholder.name,
            prospect_email: selectedStakeholder.email,
            prospect_title: selectedStakeholder.title,
            outreach_angle: outreach.angles[selectedAngle].name,
            message_sent: customMessage,
            channel: 'email',
            status: 'draft'
          }
        ]);

      if (insertError) throw insertError;
      
      onOutreachGenerated?.();
      alert('Outreach saved! Ready to send.');
    } catch (err) {
      setError('Failed to save outreach: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Generate Outreach</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {!outreach ? (
            // Stakeholder Selection
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Select Decision-Maker
              </h3>
              <div className="space-y-3">
                {stakeholders.length > 0 ? (
                  stakeholders.map((stakeholder, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGenerateOutreach(stakeholder)}
                      disabled={loading}
                      className="w-full text-left p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="font-semibold text-slate-900">{stakeholder.name}</p>
                      <p className="text-sm text-slate-600">{stakeholder.title}</p>
                      {stakeholder.email && (
                        <p className="text-sm text-blue-600">{stakeholder.email}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Priority: {stakeholder.contact_priority} | Best channel: {stakeholder.best_channel}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-slate-600">No stakeholders found in research</p>
                )}
              </div>

              {loading && (
                <div className="mt-4 text-center">
                  <p className="text-slate-600">Generating outreach messages...</p>
                  <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 animate-pulse" />
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            // Outreach Editor
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {outreach.stakeholder_name} ({outreach.stakeholder_title})
                </h3>
                <p className="text-slate-600">{outreach.company_name}</p>
              </div>

              {/* Angle Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Outreach Angle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {outreach.angles.map((angle, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAngleChange(idx)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedAngle === idx
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 text-sm">{angle.name}</p>
                      <p className="text-xs text-slate-600 mt-2">{angle.description}</p>
                      <p className="text-xs text-slate-500 mt-2 italic">{angle.tone}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Line Suggestions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Suggested Subject Lines
                </label>
                <div className="space-y-2">
                  {outreach.angles[selectedAngle].subjects.map((subject, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 cursor-pointer hover:bg-slate-100"
                      onClick={() => alert(`Use subject: ${subject}`)}
                    >
                      {subject}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  {customMessage.length} characters | {customMessage.split('\n').length} lines
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setOutreach(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleSaveOutreach()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => alert('Phase 2: Send outreach will be implemented next')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Send Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutreachGenerator;
