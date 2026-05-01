import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, getUserProfile } from '../lib/supabaseClient';
import OutreachGenerator from '../components/OutreachGenerator';
import CampaignPipelineV2 from '../components/CampaignPipelineV2';
import Analytics from '../components/Analytics';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import Settings from '../components/Settings';
// NEW IMPORTS
import Research from '../components/Research';
import Outreach from '../components/Outreach';

export const DashboardComplete = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [recentResearch, setRecentResearch] = useState([]);
  const [activeTab, setActiveTab] = useState('research');
  const [showOutreachGenerator, setShowOutreachGenerator] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
    loadRecentResearch();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentResearch = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('company_research')
        .select('research_id, company_name, health_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) throw queryError;
      setRecentResearch(data || []);
    } catch (err) {
      console.error('Error loading recent research:', err);
    }
  };

  const handleResearch = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setResearching(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/research`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: companyName.trim(),
            userId: user.id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Research failed');
      }

      const data = await response.json();
      setReport(data);
      setCompanyName('');
      loadRecentResearch();
    } catch (err) {
      console.error('Research error:', err);
      setError(err.message || 'Failed to research company');
    } finally {
      setResearching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LeadIntel</h1>
            {profile && (
              <p className="text-sm text-slate-600 mt-1">
                Welcome, {profile.name}! • {profile.service_name}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 overflow-x-auto">
            {[
              { id: 'research', label: 'Company Research', icon: '🔍' },
              { id: 'email', label: 'Find Email', icon: '📧' },
              { id: 'outreach', label: 'Send Outreach', icon: '✉️' },
              { id: 'pipeline', label: 'Pipeline', icon: '📊' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'advanced', label: 'Advanced', icon: '🔬' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Company Research Tab */}
        {activeTab === 'research' && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Research a Company</h2>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name (e.g., Tesla, Stripe, AccessBank)"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={researching}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {researching ? 'Researching...' : 'Research'}
                </button>
              </form>
            </div>

            {report && (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Research Report</h2>
                  <button
                    onClick={() => setShowOutreachGenerator(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Generate Outreach
                  </button>
                </div>

                {/* Company Overview */}
                <div className="mb-8 pb-8 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Company</p>
                      <p className="text-lg font-semibold text-slate-900">{report.company_research?.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Industry</p>
                      <p className="text-lg font-semibold text-slate-900">{report.company_research?.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="text-lg font-semibold text-slate-900">{report.company_research?.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Size</p>
                      <p className="text-lg font-semibold text-slate-900">{report.company_research?.size_employees} employees</p>
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                <div className="mb-8 pb-8 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fit Assessment</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-blue-600">
                      {report.health_score?.health_score}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 mb-2">{report.health_score?.explanation}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${report.health_score?.health_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {recentResearch.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Research</h3>
                <div className="space-y-2">
                  {recentResearch.map(research => (
                    <div key={research.research_id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <p className="font-semibold text-slate-900">{research.company_name}</p>
                      <p className="text-sm text-slate-600">Score: {research.health_score}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Find Email Tab - NEW */}
        {activeTab === 'email' && (
          <Research />
        )}

        {/* Send Outreach Tab - UPDATED */}
        {activeTab === 'outreach' && (
          <Outreach />
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <CampaignPipelineV2 userId={user?.id} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Analytics userId={user?.id} />
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === 'advanced' && (
          <AdvancedAnalytics userId={user?.id} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Settings userId={user?.id} />
        )}

        {/* Outreach Generator Modal */}
        {showOutreachGenerator && report && (
          <OutreachGenerator
            research={report}
            onClose={() => setShowOutreachGenerator(false)}
            onOutreachGenerated={() => {
              setShowOutreachGenerator(false);
              loadRecentResearch();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardComplete;
