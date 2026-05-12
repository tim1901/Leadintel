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
      console.log(`Starting personalized research for: ${companyName}`);

      // ✅ PASS userId to research function
      const response = await fetch('/.netlify/functions/research-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          userId: user.id  // ← NEW: Send user ID for personalization
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

      // Save to Supabase
      if (user.id) {
        await createCompanyResearch(user.id, {
          company_name: research.company_name || companyName,
          industry: research.industry,
          company_size: research.company_size,
          location: research.location,
          website: research.website,
          health_score: research.deal_probability?.probability_percentage || 85,
          pain_signals: research.pain_signals_specific,
        });
      }

      // Set report with full deep research
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
              <h2 className="text-xl font-bold text-slate-900 mb-4">Research a Company</h2>
              <p className="text-sm text-slate-600 mb-4">
                💡 Your research will be personalized based on your profile: <strong>{profile?.service_name || 'Complete your profile'}</strong>
              </p>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name (e.g., Tesla, Stripe, Airbnb)"
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
                  🔍 Analyzing company with elite BD intelligence... (this may take 15-30 seconds for deep analysis)
                </p>
              )}
            </div>

            {report && (
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{report.company_name}</h2>
                    <p className="text-slate-600 mt-1">Elite Business Development Research</p>
                  </div>
                  <button
                    onClick={() => setShowOutreachGenerator(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Generate Outreach
                  </button>
                </div>

                {/* Executive Summary */}
                {report.executive_summary && (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">Executive Summary</h3>
                    <p className="text-blue-800">{report.executive_summary}</p>
                  </div>
                )}

                {/* Deal Fit Analysis */}
                {report.deal_fit_analysis && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Deal Fit Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-600">Fit Score</p>
                        <p className="text-4xl font-bold text-blue-600">{report.deal_fit_analysis.fit_score}</p>
                        <p className="text-sm text-slate-600 mt-2">{report.deal_fit_analysis.fit_explanation}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-600">Deal Probability</p>
                        <p className="text-4xl font-bold text-purple-600">{report.deal_probability?.probability_percentage || 'N/A'}%</p>
                        <p className="text-sm text-slate-600 mt-2">Sales Cycle: {report.deal_probability?.sales_cycle_length || 'N/A'} months</p>
                      </div>
                    </div>
                    {report.deal_fit_analysis.user_solution_alignment && (
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="font-semibold text-slate-900 mb-1">Solution Alignment</p>
                        <p className="text-slate-700">{report.deal_fit_analysis.user_solution_alignment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Company Overview */}
                {report.company_name && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Industry</p>
                        <p className="text-lg font-semibold text-slate-900">{report.industry}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Location</p>
                        <p className="text-lg font-semibold text-slate-900">{report.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Company Size</p>
                        <p className="text-lg font-semibold text-slate-900">{report.company_size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Growth Stage</p>
                        <p className="text-lg font-semibold text-slate-900">{report.growth_stage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pain Signals */}
                {report.pain_signals_specific && report.pain_signals_specific.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Specific Pain Signals</h3>
                    <div className="space-y-2">
                      {report.pain_signals_specific.map((pain, idx) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                          • {pain}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ideal Contact Strategy */}
                {report.ideal_contact_strategy && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Outreach Strategy</h3>
                    <div className="space-y-3">
                      {report.ideal_contact_strategy.primary_contact && (
                        <div>
                          <p className="font-semibold text-slate-900">Primary Contact</p>
                          <p className="text-slate-700">{report.ideal_contact_strategy.primary_contact}</p>
                        </div>
                      )}
                      {report.ideal_contact_strategy.outreach_angle && (
                        <div>
                          <p className="font-semibold text-slate-900">Outreach Angle</p>
                          <p className="text-slate-700">{report.ideal_contact_strategy.outreach_angle}</p>
                        </div>
                      )}
                      {report.ideal_contact_strategy.call_script_opener && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="font-semibold text-slate-900">How to Start the Call</p>
                          <p className="text-slate-700 italic">"{report.ideal_contact_strategy.call_script_opener}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {report.risk_assessment && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h3>
                    {report.risk_assessment.deal_risks && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 mb-3">
                        <p className="font-semibold">Deal Risks</p>
                        <p>{report.risk_assessment.deal_risks}</p>
                      </div>
                    )}
                    {report.risk_assessment.risk_mitigation && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
                        <p className="font-semibold">Mitigation Strategy</p>
                        <p>{report.risk_assessment.risk_mitigation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Confidence Level */}
                {report.confidence_level && (
                  <div className="p-3 bg-slate-50 rounded text-slate-700">
                    <p className="text-sm">
                      <strong>Confidence Level:</strong> {report.confidence_level.toUpperCase()} - {report.confidence_reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {recentResearch.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Research</h3>
                <div className="space-y-2">
                  {recentResearch.map(research => (
                    <div key={research.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <p className="font-semibold text-slate-900">{research.company_name}</p>
                      <p className="text-sm text-slate-600">Health Score: {research.health_score || 'N/A'} | Industry: {research.industry || 'N/A'}</p>
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
