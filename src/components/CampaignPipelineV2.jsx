import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const CampaignPipelineV2 = ({ userId }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return <div className="text-center py-12">Loading campaigns...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  const stages = {
    draft: campaigns.filter(c => c.status === 'draft'),
    sent: campaigns.filter(c => c.status === 'sent'),
    opened: campaigns.filter(c => c.status === 'opened'),
    clicked: campaigns.filter(c => c.status === 'clicked'),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Campaign Pipeline</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(stages).map(([stage, items]) => (
          <div key={stage} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4 capitalize">{stage}</h3>
            <p className="text-3xl font-bold text-blue-600">{items.length}</p>
            <p className="text-sm text-gray-600">campaigns</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-600">No campaigns yet</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map(campaign => (
              <div key={campaign.campaign_id} className="p-4 border border-gray-200 rounded">
                <p className="font-semibold text-gray-900">{campaign.campaign_id}</p>
                <p className="text-sm text-gray-600">Status: {campaign.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignPipelineV2;
