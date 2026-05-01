import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Analytics = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [userId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get all research
      const { data: researchData, error: researchError } = await supabase
        .from('company_research')
        .select('*')
        .eq('user_id', userId);

      if (researchError) throw researchError;

      // Get all campaigns
      const { data: campaignData, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('user_id', userId);

      if (campaignError) throw campaignError;

      // Calculate statistics
      const metrics = calculateMetrics(researchData || [], campaignData || [], parseInt(timeRange));
      setStats(metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (research, campaigns, days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter by date range
    const filteredCampaigns = campaigns.filter(c => 
      new Date(c.created_at) >= cutoffDate
    );

    // By Status
    const byStatus = {};
    ['draft', 'sent', 'opened', 'clicked', 'replied', 'qualified', 'pitched'].forEach(s => {
      byStatus[s] = filteredCampaigns.filter(c => c.status === s).length;
    });

    // By Angle
    const byAngle = {};
    filteredCampaigns.forEach(c => {
      const angle = c.outreach_angle || 'Unknown';
      byAngle[angle] = (byAngle[angle] || 0) + 1;
    });

    const angles = Object.entries(byAngle)
      .map(([angle, count]) => {
        const replied = filteredCampaigns.filter(c => c.outreach_angle === angle && c.status === 'replied').length;
        return {
          angle,
          sent: count,
          replied,
          rate: count > 0 ? ((replied / count) * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.rate - a.rate);

    // By Company Health
    const byHealth = {};
    research.forEach(r => {
      const bucket = r.health_score >= 80 ? 'High (80+)' :
                     r.health_score >= 60 ? 'Medium (60-79)' :
                     'Low (0-59)';
      byHealth[bucket] = (byHealth[bucket] || 0) + 1;
    });

    // By Industry (if available)
    const byIndustry = {};
    research.forEach(r => {
      const industry = r.industry || 'Unknown';
      byIndustry[industry] = (byIndustry[industry] || 0) + 1;
    });

    const industries = Object.entries(byIndustry)
      .map(([industry, count]) => {
        const sent = filteredCampaigns.filter(c => 
          research.find(r => r.industry === industry && r.research_id === c.research_id)
        ).length;
        const replied = filteredCampaigns.filter(c => 
          research.find(r => r.industry === industry && r.research_id === c.research_id) && c.status === 'replied'
        ).length;
        return {
          industry,
          researched: count,
          sent,
          replied,
          rate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.rate - a.rate);

    // KPIs
    const totalResearched = research.length;
    const totalSent = filteredCampaigns.filter(c => c.status !== 'draft').length;
    const totalReplied = filteredCampaigns.filter(c => c.status === 'replied' || c.status === 'qualified' || c.status === 'pitched').length;
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : 0;
    const avgHealthScore = totalResearched > 0 ? (research.reduce((sum, r) => sum + (r.health_score || 0), 0) / totalResearched).toFixed(0) : 0;

    return {
      kpis: {
        totalResearched,
        totalSent,
        totalReplied,
        replyRate,
        avgHealthScore
      },
      byStatus,
      byAngle: angles,
      byIndustry: industries,
      byHealth
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">No data available yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Analytics & Insights</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="999">All time</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Companies Researched</p>
          <p className="text-3xl font-bold text-slate-900">{stats.kpis.totalResearched}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-slate-600">Outreach Sent</p>
          <p className="text-3xl font-bold text-blue-600">{stats.kpis.totalSent}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-slate-600">Replies Received</p>
          <p className="text-3xl font-bold text-orange-600">{stats.kpis.totalReplied}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-slate-600">Reply Rate</p>
          <p className="text-3xl font-bold text-green-600">{stats.kpis.replyRate}%</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-slate-600">Avg Health Score</p>
          <p className="text-3xl font-bold text-purple-600">{stats.kpis.avgHealthScore}</p>
        </div>
      </div>

      {/* By Angle */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Outreach Angle</h3>
        <div className="space-y-3">
          {stats.byAngle.length > 0 ? (
            stats.byAngle.map((item, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-900">{item.angle}</p>
                  <span className="text-sm font-bold text-green-600">{item.rate}% reply rate</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{item.sent} sent</span>
                  <span>•</span>
                  <span>{item.replied} replied</span>
                </div>
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-600">No outreach data yet</p>
          )}
        </div>
      </div>

      {/* By Industry */}
      {stats.byIndustry.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance by Industry</h3>
          <div className="space-y-3">
            {stats.byIndustry.map((item, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-900">{item.industry}</p>
                  <span className="text-sm font-bold text-green-600">{item.rate}% reply rate</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{item.researched} researched</span>
                  <span>•</span>
                  <span>{item.sent} sent</span>
                  <span>•</span>
                  <span>{item.replied} replied</span>
                </div>
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(item.rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Health Score */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Research Distribution by Health Score</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.byHealth).map(([bucket, count]) => (
            <div key={bucket} className="p-4 border border-slate-200 rounded-lg text-center">
              <p className="text-sm text-slate-600">{bucket}</p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.kpis.totalResearched > 0 && 
                  `${((count / stats.kpis.totalResearched) * 100).toFixed(0)}%`
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
