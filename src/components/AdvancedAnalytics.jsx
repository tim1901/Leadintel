import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const AdvancedAnalytics = ({ userId }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdvancedMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId || user?.id)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      const totalSent = data?.length || 0;
      const opened = data?.filter(e => e.opened_at)?.length || 0;
      const clicked = data?.filter(e => e.clicked_at)?.length || 0;
      const bounced = data?.filter(e => e.bounced_at)?.length || 0;

      setMetrics({
        totalSent,
        opened,
        clicked,
        bounced,
        openRate: totalSent ? ((opened / totalSent) * 100).toFixed(1) : 0,
        clickRate: totalSent ? ((clicked / totalSent) * 100).toFixed(1) : 0,
        bounceRate: totalSent ? ((bounced / totalSent) * 100).toFixed(1) : 0,
      });
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    loadAdvancedMetrics();
  }, [loadAdvancedMetrics]);

  if (loading) {
    return <div className="text-center py-12">Loading advanced metrics...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!metrics) {
    return <div className="text-gray-600 p-4">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Sent</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalSent}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Open Rate</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.openRate}%</p>
          <p className="text-xs text-gray-500">{metrics.opened} opened</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Click Rate</p>
          <p className="text-3xl font-bold text-green-600">{metrics.clickRate}%</p>
          <p className="text-xs text-gray-500">{metrics.clicked} clicked</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Bounce Rate</p>
          <p className="text-3xl font-bold text-red-600">{metrics.bounceRate}%</p>
          <p className="text-xs text-gray-500">{metrics.bounced} bounced</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
