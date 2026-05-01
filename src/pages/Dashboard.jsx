import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, getUserProfile } from '../lib/supabaseClient';
import OutreachGenerator from '../components/OutreachGenerator';
import CampaignPipeline from '../components/CampaignPipeline';
import Analytics from '../components/Analytics';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [recentResearch, setRecentResearch] = useState([]);
  const [activeTab, setActiveTab] = useState('research'); // research, outreach, pipeline, analytics
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
      // Call the Netlify function
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/research`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            userProfile: profile
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Research failed: ${response.statusText}`);
      }

      const data = await response.json();
      setReport(data);

      // Save to Supabase
      const { error: insertError } = await supabase
        .from('company_research')
        .insert([
          {
            user_id: user.id,
            company_name: companyName.trim(),
            industry: data.company_research?.industry,
            location: data.company_research?.location,
            company_size: data.company_research?.size_employees,
            website: data.company_research?.website,
            health_score: data.health_score?.health_score,
            pain_signals: data.pain_signals,
            stakeholders: data.stakeholders,
            competitive_intel: data.competitive_intel,
            positioning: data.positioning,
            engagement_readiness: data.engagement_recommendation,
            sources: data.company_research?.sources || []
          }
        ]);

      if (insertError) {
        console.error('Error saving research:', insertError);
      } else {
        // Reload recent research
        loadRecentResearch();
        setCompanyName('');
      }
    } catch (err) {
      setError(err.message || 'Research failed. Please try again.');
      console.error('Research error:', err);
    } finally {
      setResearching(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
            <h1 className="text-2xl font-bold text-slate-900">BD Intelligence Engine</h1>
            {profile && (
              <p className="text-sm text-slate-600 mt-1">
                Welcome back, {profile.name}! Researching: {profile.service_name}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
            <button
              onClick={() => setActiveTab('research')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'research'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Research
            </button>
            <button
              onClick={() => setActiveTab('outreach')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'outreach'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Outreach
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'pipeline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics
            </button>
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

        {/* Research Tab */}
        {activeTab === 'research' && (
          <>
            {/* Research Form */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Research a Company</h2>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name (e.g., AccessBank Nigeria)"
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

            {/* Research Report */}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Company Name</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {report.company_research?.company_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Industry</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {report.company_research?.industry}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {report.company_research?.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Company Size</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {report.company_research?.size_employees} employees
                      </p>
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

                {/* Pain Signals */}
                {report.pain_signals && report.pain_signals.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pain Signals</h3>
                    <div className="space-y-4">
                      {Array.isArray(report.pain_signals) && report.pain_signals.map((signal, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-900">{signal.category}</h4>
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${
                              signal.severity >= 4 ? 'bg-red-100 text-red-800' :
                              signal.severity >= 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Severity: {signal.severity}/5
                            </span>
                          </div>
                          <p className="text-slate-700 mb-2">{signal.description}</p>
                          {signal.quote && (
                            <p className="text-sm text-slate-600 italic mb-2">"{signal.quote}"</p>
                          )}
                          <p className="text-xs text-slate-500">
                            Source: {signal.source} | Timeline: {signal.timeline}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stakeholders */}
                {report.stakeholders && report.stakeholders.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Stakeholders</h3>
                    <div className="space-y-4">
                      {Array.isArray(report.stakeholders) && report.stakeholders.map((stakeholder, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-slate-900">{stakeholder.name}</h4>
                          <p className="text-sm text-slate-600 mb-2">{stakeholder.title}</p>
                          {stakeholder.email && (
                            <p className="text-sm text-blue-600 mb-2">{stakeholder.email}</p>
                          )}
                          <p className="text-sm text-slate-700 mb-2">{stakeholder.motivation}</p>
                          <p className="text-xs text-slate-500">
                            Priority: {stakeholder.contact_priority} | Best channel: {stakeholder.best_channel}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Recommendation */}
                {report.engagement_recommendation && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Engagement Strategy</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Decision Timeline</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {report.engagement_recommendation?.decision_timeline}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">Best Time to Contact</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {report.engagement_recommendation?.best_time_to_contact}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Research */}
            {recentResearch.length > 0 && !report && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Research</h2>
                <div className="space-y-2">
                  {recentResearch.map(research => (
                    <div
                      key={research.research_id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center hover:bg-slate-100 cursor-pointer transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{research.company_name}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(research.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                          Score: {research.health_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <CampaignPipeline userId={user?.id} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Analytics userId={user?.id} />
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

export default Dashboard;
