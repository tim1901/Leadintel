import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Analytics = ({ userId }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId || user?.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;

      const totalSent = data?.length || 0;
      const opened = data?.filter(e => e.opened_at)?.length || 0;

      setMetrics({
        totalSent,
        opened,
        openRate: totalSent ? ((opened / totalSent) * 100).toFixed(1) : 0,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!metrics) {
    return <div className="text-gray-600 p-4">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Emails Sent</p>
          <p className="text-4xl font-bold text-gray-900">{metrics.totalSent}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Emails Opened</p>
          <p className="text-4xl font-bold text-blue-600">{metrics.opened}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Open Rate</p>
          <p className="text-4xl font-bold text-green-600">{metrics.openRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
