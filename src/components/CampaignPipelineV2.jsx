import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SendCampaign from './SendCampaign';
import ConversationView from './ConversationView';

const STATUSES = ['draft', 'sent', 'opened', 'clicked', 'replied', 'qualified', 'pitched'];

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-800',
  sent: 'bg-blue-100 text-blue-800',
  opened: 'bg-cyan-100 text-cyan-800',
  clicked: 'bg-purple-100 text-purple-800',
  replied: 'bg-orange-100 text-orange-800',
  qualified: 'bg-yellow-100 text-yellow-800',
  pitched: 'bg-green-100 text-green-800',
};

export const CampaignPipelineV2 = ({ userId }) => {
  const [campaigns, setCampaigns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [userId]);

  const loadCampaigns = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('outreach_campaigns')
        .select(`
          *,
          company_research:research_id(company_name, health_score)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const organized = {};
      STATUSES.forEach(status => {
        organized[status] = [];
      });

      data.forEach(campaign => {
        if (organized[campaign.status]) {
          organized[campaign.status].push(campaign);
        }
      });

      setCampaigns(organized);
    } catch (err) {
      setError(err.message);
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('outreach_campaigns')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId);

      if (updateError) throw updateError;

      loadCampaigns();
    } catch (err) {
      setError('Failed to update campaign: ' + err.message);
    }
  };

  const handleSendClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowSendModal(true);
  };

  const handleConversationClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowConversation(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Delete this campaign?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('outreach_campaigns')
        .delete()
        .eq('campaign_id', campaignId);

      if (deleteError) throw deleteError;

      loadCampaigns();
    } catch (err) {
      setError('Failed to delete campaign: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Loading campaigns...</div>
      </div>
    );
  }

  const totalCampaigns = Object.values(campaigns).flat().length;
  const sentCount = (campaigns.sent?.length || 0) + (campaigns.opened?.length || 0) + (campaigns.clicked?.length || 0) + (campaigns.replied?.length || 0) + (campaigns.qualified?.length || 0) + (campaigns.pitched?.length || 0);
  const repliedCount = campaigns.replied?.length || 0;
  const replyRate = sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Campaign Pipeline</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Total Campaigns</p>
            <p className="text-3xl font-bold text-slate-900">{totalCampaigns}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600">Sent</p>
            <p className="text-3xl font-bold text-blue-600">{sentCount}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-slate-600">Replied</p>
            <p className="text-3xl font-bold text-orange-600">{repliedCount}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-slate-600">Reply Rate</p>
            <p className="text-3xl font-bold text-green-600">{replyRate}%</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-4" style={{ minWidth: '1400px' }}>
          {STATUSES.map(status => (
            <div key={status} className="flex flex-col">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900 capitalize mb-1">
                  {status === 'pitched' ? 'Pitched / Won' : status}
                </h3>
                <p className="text-sm text-slate-600">
                  {campaigns[status]?.length || 0}
                </p>
              </div>

              <div className="space-y-3 flex-1 min-h-[500px] bg-slate-50 rounded-lg p-4">
                {campaigns[status]?.map(campaign => (
                  <div
                    key={campaign.campaign_id}
                    className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="mb-2">
                      <p className="font-semibold text-slate-900 text-sm">
                        {campaign.prospect_name}
                      </p>
                      <p className="text-xs text-slate-600">{campaign.prospect_title}</p>
                    </div>

                    {campaign.company_research && (
                      <div className="mb-3 p-2 bg-slate-50 rounded border border-slate-200">
                        <p className="text-xs font-semibold text-slate-900">
                          {campaign.company_research.company_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Score: {campaign.company_research.health_score}
                        </p>
                      </div>
                    )}

                    <div className="mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[campaign.status]}`}>
                        {campaign.outreach_angle || 'General'}
                      </span>
                    </div>

                    {campaign.sentiment && (
                      <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-900 capitalize">
                          Sentiment: {campaign.sentiment}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendClick(campaign)}
                          className="w-full text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Send
                        </button>
                      )}
                      {campaign.status !== 'draft' && (
                        <button
                          onClick={() => handleConversationClick(campaign)}
                          className="w-full text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          View
                        </button>
                      )}
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign.campaign_id, e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.campaign_id)}
                        className="w-full text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors border border-red-200"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalCampaigns === 0 && (
        <div className="text-center py-12 text-slate-600">
          <p>No campaigns yet.</p>
          <p className="text-sm mt-2">Research a company and generate outreach to get started.</p>
        </div>
      )}

      {/* Send Campaign Modal */}
      {showSendModal && selectedCampaign && (
        <SendCampaign
          campaign={selectedCampaign}
          onClose={() => {
            setShowSendModal(false);
            setSelectedCampaign(null);
          }}
          onSent={() => {
            loadCampaigns();
            setShowSendModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}

      {/* Conversation Modal */}
      {showConversation && selectedCampaign && (
        <ConversationView
          campaignId={selectedCampaign.campaign_id}
          campaign={selectedCampaign}
          onClose={() => {
            setShowConversation(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
};

export default CampaignPipelineV2;
