import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AdvancedAnalytics = ({ userId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadAdvancedMetrics();
  }, [userId, timeRange]);

  const loadAdvancedMetrics = async () => {
    try {
      setLoading(true);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

      // Get campaigns
      const { data: campaigns } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());

      // Get email logs
      const { data: emailLogs } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('sent_at', cutoffDate.toISOString());

      // Calculate funnel
      const funnel = calculateFunnel(campaigns || []);
      
      // Calculate conversion metrics
      const conversions = calculateConversions(campaigns || []);

      // Calculate email metrics
      const emailMetrics = calculateEmailMetrics(emailLogs || []);

      // Calculate best times
      const bestTimes = calculateBestSendTimes(emailLogs || []);

      setMetrics({
        funnel,
        conversions,
        emailMetrics,
        bestTimes,
        total: campaigns?.length || 0
      });
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFunnel = (campaigns) => {
    const statuses = ['sent', 'opened', 'clicked', 'replied', 'qualified', 'pitched'];
    const funnel = {};

    statuses.forEach(status => {
      funnel[status] = campaigns.filter(c => c.status === status).length;
    });

    // Calculate percentages
    const sent = funnel['sent'];
    Object.keys(funnel).forEach(status => {
      funnel[`${status}_pct`] = sent > 0 ? ((funnel[status] / sent) * 100).toFixed(1) : 0;
    });

    return funnel;
  };

  const calculateConversions = (campaigns) => {
    const replied = campaigns.filter(c => c.status === 'replied' || c.status === 'qualified' || c.status === 'pitched').length;
    const qualified = campaigns.filter(c => c.status === 'qualified' || c.status === 'pitched').length;
    const pitched = campaigns.filter(c => c.status === 'pitched').length;
    const sent = campaigns.filter(c => c.status !== 'draft').length;

    return {
      replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : 0,
      qualifiedRate: sent > 0 ? ((qualified / sent) * 100).toFixed(1) : 0,
      closedRate: sent > 0 ? ((pitched / sent) * 100).toFixed(1) : 0,
      avgDaysToReply: calculateAvgDaysToReply(campaigns)
    };
  };

  const calculateAvgDaysToReply = (campaigns) => {
    const replied = campaigns.filter(c => c.status === 'replied');
    if (replied.length === 0) return 0;

    const totalDays = replied.reduce((sum, c) => {
      const sent = new Date(c.sent_date);
      const updated = new Date(c.updated_at);
      const days = Math.floor((updated - sent) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return (totalDays / replied.length).toFixed(1);
  };

  const calculateEmailMetrics = (logs) => {
    const sent = logs.length;
    const opened = logs.filter(l => l.opened_at).length;
    const clicked = logs.filter(l => l.clicked_at).length;
    const bounced = logs.filter(l => l.bounced_at).length;

    return {
      sent,
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
      clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0,
      bounceRate: sent > 0 ? ((bounced / sent) * 100).toFixed(1) : 0
    };
  };

  const calculateBestSendTimes = (logs) => {
    const hours = {};
    
    logs.forEach(log => {
      if (log.opened_at) {
        const hour = new Date(log.sent_at).getHours();
        hours[hour] = (hours[hour] || 0) + 1;
      }
    });

    const best = Object.entries(hours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        opens: count
      }));

    return best;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Loading advanced analytics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="999">All time</option>
        </select>
      </div>

      {/* Conversion Funnel */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: 'Sent', key: 'sent', color: 'bg-blue-500' },
            { label: 'Opened', key: 'opened', color: 'bg-cyan-500' },
            { label: 'Clicked', key: 'clicked', color: 'bg-purple-500' },
            { label: 'Replied', key: 'replied', color: 'bg-orange-500' },
            { label: 'Qualified', key: 'qualified', color: 'bg-yellow-500' },
            { label: 'Pitched', key: 'pitched', color: 'bg-green-500' }
          ].map(item => (
            <div key={item.key}>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-slate-900">{item.label}</p>
                <span className="text-sm font-bold text-slate-600">
                  {metrics.funnel[item.key]} ({metrics.funnel[`${item.key}_pct`]}%)
                </span>
              </div>
              <div className="h-8 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all`}
                  style={{ width: `${Math.min(metrics.funnel[`${item.key}_pct`], 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Conversion Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversion Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600">Reply Rate</p>
            <p className="text-3xl font-bold text-blue-600">{metrics.conversions.replyRate}%</p>
            <p className="text-xs text-slate-500 mt-2">Of sent campaigns</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-slate-600">Qualified Rate</p>
            <p className="text-3xl font-bold text-purple-600">{metrics.conversions.qualifiedRate}%</p>
            <p className="text-xs text-slate-500 mt-2">Of sent campaigns</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-slate-600">Closed Rate</p>
            <p className="text-3xl font-bold text-green-600">{metrics.conversions.closedRate}%</p>
            <p className="text-xs text-slate-500 mt-2">Of sent campaigns</p>
          </div>
        </div>
      </div>

      {/* Email Metrics */}
      {metrics.emailMetrics.sent > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Email Engagement</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Sent</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.emailMetrics.sent}</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <p className="text-sm text-slate-600">Open Rate</p>
              <p className="text-2xl font-bold text-cyan-600">{metrics.emailMetrics.openRate}%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-slate-600">Click Rate</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.emailMetrics.clickRate}%</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-slate-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-red-600">{metrics.emailMetrics.bounceRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Best Send Times */}
      {metrics.bestTimes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Best Send Times</h3>
          <div className="grid grid-cols-3 gap-4">
            {metrics.bestTimes.map((time, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600">#{idx + 1}</p>
                <p className="text-2xl font-bold text-blue-600">{time.hour}</p>
                <p className="text-xs text-slate-500 mt-2">{time.opens} opens</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Days to Reply */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600 mb-2">Average Days to First Reply</p>
        <p className="text-3xl font-bold text-slate-900">{metrics.conversions.avgDaysToReply}</p>
        <p className="text-xs text-slate-500 mt-2">From send to reply</p>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
