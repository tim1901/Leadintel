import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserProfile, getCompanyResearch, createCompanyResearch } from '../lib/supabaseClient';
import OutreachGenerator from '../components/OutreachGenerator';
import CampaignPipelineV2 from '../components/CampaignPipelineV2';
import Analytics from '../components/Analytics';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import Settings from '../components/Settings';
import Research from '../components/Research';
import Outreach from '../components/Outreach';

export const DashboardComplete = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'research';
  
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [recentResearch, setRecentResearch] = useState([]);
  const [showOutreachGenerator, setShowOutreachGenerator] = useState(false);

  const loadProfile = useCallback(async () => {
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
  }, [user?.id]);

  const loadRecentResearch = useCallback(async () => {
    try {
      const data = await getCompanyResearch(user.id);
      setRecentResearch(data || []);
    } catch (err) {
      console.error('Error loading recent research:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
    loadRecentResearch();
  }, [user, navigate, loadProfile, loadRecentResearch]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
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
      console.log(`Starting ELITE research for: ${companyName}`);

      const response = await fetch('/.netlify/functions/research-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.research) {
        throw new Error('Invalid response from research API');
      }

      const research = data.research;

      if (user.id) {
        await createCompanyResearch(user.id, {
          company_name: research.company_name || companyName,
          industry: research.industry,
          company_size: research.company_size,
          location: research.location,
          website: research.website,
          health_score: research.deal_probability || 65,
          pain_signals: research.actual_problem_they_face,
        });
      }

      setReport(research);
      setCompanyName('');
      loadRecentResearch();
      setError('');
    } catch (err) {
      console.error('Research error:', err);
      setError(err.message || 'Failed to research company. Please try again.');
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

  const tabs = [
    { id: 'research', label: 'Company Research', icon: '🔍' },
    { id: 'email', label: 'Find Email', icon: '📧' },
    { id: 'outreach', label: 'Send Outreach', icon: '✉️' },
    { id: 'pipeline', label: 'Pipeline', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'advanced', label: 'Advanced', icon: '🔬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LeadIntel</h1>
            {profile && (
              <p className="text-sm text-slate-600 mt-1">
                Welcome, {profile.name}! • {profile.service_name || 'Setup your profile'}
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

        <div className="bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'research' && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Elite Company Research</h2>
              <p className="text-sm text-slate-600 mb-4">
                💡 25-year BD veteran level research: Social sentiment, news, trends, urgency positioning
              </p>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name (e.g., Tesla, Magdalena's Daughters, Stripe)"
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
              {researching && (
                <p className="text-sm text-slate-600 mt-4">
                  🔍 Elite BD research in progress... (analyzing social sentiment, news, trends, and positioning strategy)
                </p>
              )}
            </div>

            {report && (
              <div className="space-y-6">
                {/* Executive Summary */}
                {report.executive_summary && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Executive Summary</h3>
                    <p className="text-blue-800">{report.executive_summary}</p>
                  </div>
                )}

                {/* Deal Probability & Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Deal Probability</h3>
                    <div className="text-5xl font-bold text-blue-600 mb-2">{report.deal_probability}%</div>
                    <p className="text-slate-600 text-sm mb-4">{report.confidence_reasoning}</p>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${report.deal_probability}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Sales Cycle</h3>
                    <p className="text-3xl font-bold text-slate-900 mb-2">{report.sales_cycle_months} months</p>
                    <p className="text-slate-600 text-sm">Realistic timeline from first contact to close</p>
                  </div>
                </div>

                {/* Social Sentiment & Latest Activity */}
                {report.social_sentiment && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📱 Social Sentiment & Activity</h3>
                    <div className="space-y-4">
                      {report.social_sentiment.recent_linkedin_activity && (
                        <div>
                          <p className="font-semibold text-slate-900">Recent LinkedIn Activity</p>
                          <p className="text-slate-700">{report.social_sentiment.recent_linkedin_activity}</p>
                        </div>
                      )}
                      {report.social_sentiment.sentiment_analysis && (
                        <div>
                          <p className="font-semibold text-slate-900">Sentiment Analysis</p>
                          <p className="text-slate-700">{report.social_sentiment.sentiment_analysis}</p>
                        </div>
                      )}
                      {report.social_sentiment.trending_concerns && (
                        <div>
                          <p className="font-semibold text-slate-900">Trending Concerns</p>
                          <p className="text-slate-700">{report.social_sentiment.trending_concerns}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Latest Achievements */}
                {report.latest_achievements && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">🏆 Latest Achievements</h3>
                    <div className="space-y-3">
                      {report.latest_achievements.recent_hiring && (
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="font-semibold text-blue-900">Recent Hiring</p>
                          <p className="text-blue-800 text-sm">{report.latest_achievements.recent_hiring}</p>
                        </div>
                      )}
                      {report.latest_achievements.funding_or_revenue && (
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <p className="font-semibold text-green-900">Funding/Revenue</p>
                          <p className="text-green-800 text-sm">{report.latest_achievements.funding_or_revenue}</p>
                        </div>
                      )}
                      {report.latest_achievements.product_launches && (
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <p className="font-semibold text-purple-900">Product Launches</p>
                          <p className="text-purple-800 text-sm">{report.latest_achievements.product_launches}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Industry Trends */}
                {report.industry_trends_analysis && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Industry Trends (Creating Opportunity)</h3>
                    <div className="space-y-4">
                      {Object.entries(report.industry_trends_analysis).map(([key, trend], idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                          <p className="font-semibold text-slate-900">Trend {idx + 1}: {trend.what_is_happening}</p>
                          <p className="text-slate-700 text-sm mt-2"><strong>Why it matters:</strong> {trend.why_it_matters_to_them}</p>
                          <p className="text-slate-700 text-sm mt-2"><strong>Creates opportunity:</strong> {trend.creates_opportunity_for}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actual Problem */}
                {report.actual_problem_they_face && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-2">🎯 The Actual Problem</h3>
                    <p className="text-red-800">{report.actual_problem_they_face}</p>
                  </div>
                )}

                {/* Buying Trigger & Timeline */}
                {report.buying_trigger && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">⏰ Buying Trigger (When They're Ready)</h3>
                    <p className="text-slate-700">{report.buying_trigger}</p>
                  </div>
                )}

                {/* Outreach Strategy */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">🎯 Outreach Strategy</h3>
                  <div className="space-y-4">
                    {report.primary_contact && (
                      <div>
                        <p className="font-semibold text-slate-900">Who to Call First</p>
                        <p className="text-slate-700">{report.primary_contact}</p>
                      </div>
                    )}
                    {report.positioning && (
                      <div>
                        <p className="font-semibold text-slate-900">How to Position It</p>
                        <p className="text-slate-700">{report.positioning}</p>
                      </div>
                    )}
                    {report.call_opening && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="font-semibold text-blue-900">Your Call Opening</p>
                        <p className="text-blue-800 italic">"{report.call_opening}"</p>
                      </div>
                    )}
                    {report.urgency_positioning && (
                      <div className="bg-orange-50 p-3 rounded border border-orange-200">
                        <p className="font-semibold text-orange-900">Why NOW (Urgency)</p>
                        <p className="text-orange-800 text-sm">{report.urgency_positioning}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal Strategy Steps */}
                {report.deal_strategy && Array.isArray(report.deal_strategy) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📋 Deal Strategy (5-Step Playbook)</h3>
                    <div className="space-y-3">
                      {report.deal_strategy.map((step, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                          <p className="font-semibold text-slate-900">Step {idx + 1}</p>
                          <p className="text-slate-700 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {report.deal_killers && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">⚠️ Deal Killers (What to Avoid)</h3>
                    <div className="space-y-2">
                      {report.deal_killers.map((killer, idx) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                          • {killer}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Level */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm"><strong>Confidence Level:</strong> {report.confidence_level?.toUpperCase()}</p>
                  <p className="text-sm text-slate-600 mt-1">{report.confidence_reasoning}</p>
                </div>

                <button
                  onClick={() => setShowOutreachGenerator(true)}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Generate Outreach Email
                </button>
              </div>
            )}

            {recentResearch.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Research</h3>
                <div className="space-y-2">
                  {recentResearch.map(research => (
                    <div key={research.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <p className="font-semibold text-slate-900">{research.company_name}</p>
                      <p className="text-sm text-slate-600">Fit Score: {research.health_score || 'N/A'} | Industry: {research.industry || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'email' && <Research />}
        {activeTab === 'outreach' && <Outreach />}
        {activeTab === 'pipeline' && <CampaignPipelineV2 userId={user?.id} />}
        {activeTab === 'analytics' && <Analytics userId={user?.id} />}
        {activeTab === 'advanced' && <AdvancedAnalytics userId={user?.id} />}
        {activeTab === 'settings' && <Settings userId={user?.id} />}

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
