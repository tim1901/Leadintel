import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserProfile } from '../lib/supabaseClient';
import Settings from '../components/Settings';

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
  const [researchType, setResearchType] = useState('GENERIC');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [user, navigate, loadProfile]);

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
      const response = await fetch('/.netlify/functions/research-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      setReport(data.research);
      setResearchType(data.research_type || 'GENERIC');
      setSelectedEmail(null);
      setCompanyName('');
      setError('');
    } catch (err) {
      console.error('Research error:', err);
      setError(err.message || 'Failed to research company. Please try again.');
    } finally {
      setResearching(false);
    }
  };

  const copyEmailToClipboard = (email) => {
    const emailText = `Subject: ${email.subject_line}\n\n${email.body}`;
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(email.subject_line);
    setTimeout(() => setCopiedEmail(null), 2000);
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
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
              <h2 className="text-xl font-bold text-slate-900 mb-4">Service-Specific Company Research</h2>
              <p className="text-sm text-slate-600 mb-4">
                🎯 Research with news, signals & personalized emails for: <strong>{profile?.service_name || 'Not set'}</strong>
              </p>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={researching}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {researching ? 'Researching...' : 'Research'}
                </button>
              </form>
            </div>

            {report && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ SERVICE-SPECIFIC RESEARCH WITH PERSONALIZED EMAILS
                  </p>
                </div>

                {/* Decision Makers & Personalized Emails */}
                {report.decision_makers && report.decision_makers.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📧 Personalized Pitch Emails</h3>
                    
                    <div className="space-y-4">
                      {report.decision_makers.map((dm, idx) => (
                        <div key={idx} className={`border rounded-lg p-4 ${dm.rank === 'primary' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                          {/* Decision Maker Info */}
                          <div className="mb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-slate-900">{dm.name}</p>
                                <p className="text-sm text-slate-600">{dm.title}</p>
                                <p className="text-sm text-slate-600">{dm.email}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dm.rank === 'primary' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                                {dm.rank.toUpperCase()}
                              </span>
                            </div>
                            {dm.recent_posts && dm.recent_posts.length > 0 && (
                              <div className="mt-2 p-2 bg-white rounded text-xs text-slate-600">
                                <p className="font-semibold">Recent posts about:</p>
                                {dm.recent_posts.map((post, i) => <p key={i}>• {post}</p>)}
                              </div>
                            )}
                          </div>

                          {/* Email Preview */}
                          {dm.personalized_email && (
                            <div className="bg-white rounded border border-slate-200 p-4">
                              <div className="mb-3">
                                <p className="text-xs text-slate-600 uppercase tracking-wide">Subject Line</p>
                                <p className="font-semibold text-slate-900">{dm.personalized_email.subject_line}</p>
                              </div>

                              <div className="mb-4 p-3 bg-slate-50 rounded text-sm text-slate-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                                {dm.personalized_email.body}
                              </div>

                              {dm.personalized_email.key_points && (
                                <div className="mb-4 p-3 bg-blue-50 rounded text-xs">
                                  <p className="font-semibold text-blue-900 mb-2">Key Points in This Email:</p>
                                  {dm.personalized_email.key_points.map((point, i) => (
                                    <p key={i} className="text-blue-800">• {point}</p>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => copyEmailToClipboard(dm.personalized_email)}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                              >
                                {copiedEmail === dm.personalized_email.subject_line ? '✅ Copied!' : '📋 Copy Email'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Strategy */}
                {report.email_strategy && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📅 Email Strategy</h3>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><strong>Approach:</strong> {report.email_strategy.approach}</p>
                      <p><strong>Best Timing:</strong> {report.email_strategy.timing}</p>
                      <div>
                        <p className="font-semibold">Sequence:</p>
                        <ol className="list-decimal list-inside ml-2">
                          {report.email_strategy.sequence?.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      {report.email_strategy.follow_up_plan && (
                        <p><strong>Follow-up Plan:</strong> {report.email_strategy.follow_up_plan}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent News */}
                {report.recent_news && report.recent_news.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📰 Recent News (Referenced in Emails)</h3>
                    <div className="space-y-3">
                      {report.recent_news.map((news, idx) => (
                        <div key={idx} className="border border-slate-200 rounded p-3">
                          <p className="font-semibold text-slate-900">{news.headline}</p>
                          <p className="text-sm text-slate-600 mt-1">{news.source} - {news.date}</p>
                          <p className="text-sm text-slate-700 mt-2"><strong>How used:</strong> {news.relevance_to_service}</p>
                          {news.url && (
                            <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                              Read article →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive Social Signals */}
                {report.executive_social_signals && report.executive_social_signals.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">💬 Executive Social Signals</h3>
                    <div className="space-y-3">
                      {report.executive_social_signals.map((signal, idx) => (
                        <div key={idx} className="border border-slate-200 rounded p-3 bg-purple-50">
                          <p className="font-semibold text-slate-900">{signal.executive_name}</p>
                          <p className="text-sm text-slate-600">{signal.executive_title} • {signal.platform} - {signal.date}</p>
                          <p className="text-sm italic text-slate-700 mt-2">"{signal.post}"</p>
                          <p className="text-sm text-slate-700 mt-2"><strong>Reveals:</strong> {signal.indicates_pain}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Points */}
                {report.pain_points && report.pain_points.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">🚨 Pain Points</h3>
                    <div className="space-y-3">
                      {report.pain_points.map((pain, idx) => (
                        <div key={idx} className="border border-slate-200 rounded p-3">
                          <p className="font-semibold text-slate-900">{pain.pain_point_name}</p>
                          <p className="text-sm text-slate-700 mt-1">{pain.description}</p>
                          <p className="text-sm text-slate-700 mt-2"><strong>Your solution:</strong> {pain.how_your_service_solves_it}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROI */}
                {report.roi_calculation && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">💰 ROI</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-sm text-slate-600">Annual Savings</p>
                        <p className="text-xl font-bold text-green-600">{report.roi_calculation.annual_savings}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-sm text-slate-600">Payback Period</p>
                        <p className="text-xl font-bold text-slate-900">{report.roi_calculation.payback_period}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {report.next_steps && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">🚀 Next Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                      {report.next_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && <Settings userId={user?.id} />}
      </div>
    </div>
  );
};

export default DashboardComplete;
