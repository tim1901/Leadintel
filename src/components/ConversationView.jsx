import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ConversationView = ({ campaignId, campaign, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestedReply, setSuggestedReply] = useState(null);

  useEffect(() => {
    loadConversations();
  }, [campaignId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeReply = async () => {
    if (!replyText.trim()) return;

    setAnalyzing(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/analyze-reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reply: replyText,
            userProfile: {
              service_name: 'Service',
              messaging_style: 'professional'
            },
            companyResearch: {
              company_name: campaign?.company_name || 'Company'
            },
            generateReply: true
          })
        }
      );

      if (!response.ok) throw new Error('Failed to analyze reply');

      const data = await response.json();
      setAnalysis(data.analysis);
      setSuggestedReply(data.suggestedResponse);

      // Save conversation
      await supabase
        .from('conversations')
        .insert([
          {
            campaign_id: campaignId,
            user_id: campaign.user_id,
            research_id: campaign.research_id,
            reply_text: replyText,
            sentiment_score: data.analysis.engagement_level,
          }
        ]);

      // Update campaign sentiment
      await supabase
        .from('outreach_campaigns')
        .update({ sentiment: data.analysis.sentiment })
        .eq('campaign_id', campaignId);

      // Reload conversations
      loadConversations();
      setReplyText('');
    } catch (err) {
      console.error('Error analyzing reply:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">
            Conversation with {campaign?.prospect_name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Conversation Thread */}
          {conversations.length > 0 ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
              {conversations.map((conv, idx) => (
                <div key={idx} className="p-3 bg-white rounded border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-slate-600">Received</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      conv.sentiment_score >= 4 ? 'bg-green-100 text-green-800' :
                      conv.sentiment_score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Engagement: {conv.sentiment_score}/5
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm">{conv.reply_text}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(conv.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p>No conversation history yet</p>
            </div>
          )}

          {/* Reply Input */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Add Reply / Update
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Paste their reply or add a note..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />

            <div className="flex gap-3">
              <button
                onClick={handleAnalyzeReply}
                disabled={!replyText.trim() || analyzing}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyzing...' : 'Analyze & Get AI Reply'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Analysis Result */}
          {analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Analysis</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Sentiment</p>
                  <p className="font-semibold text-slate-900 capitalize">
                    {analysis.sentiment}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Engagement</p>
                  <p className="font-semibold text-slate-900">
                    {analysis.engagement_level}/5
                  </p>
                </div>
              </div>

              {analysis.key_points.length > 0 && (
                <div>
                  <p className="text-xs text-slate-600 mb-2">Key Points</p>
                  <ul className="space-y-1">
                    {analysis.key_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700">
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-600 mb-2">Next Step</p>
                <p className="text-sm text-slate-700">{analysis.next_step}</p>
              </div>

              {suggestedReply && (
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs text-slate-600 mb-2">Suggested Reply</p>
                  <div className="p-3 bg-white rounded border border-slate-200 text-sm text-slate-700">
                    {suggestedReply}
                  </div>
                  <button
                    onClick={() => {
                      setReplyText(suggestedReply);
                      setSuggestedReply(null);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Use this reply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
