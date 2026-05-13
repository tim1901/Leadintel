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
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [activeEmailIdx, setActiveEmailIdx] = useState(0);
  const [verifiedEmails, setVerifiedEmails] = useState({});

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
      console.log(`Starting research for: ${companyName}`);

      // 10 MINUTE TIMEOUT - Let agents do full work
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Frontend timeout after 10 minutes');
        controller.abort();
      }, 600000); // 600,000 milliseconds = 10 minutes

      const response = await fetch('/.netlify/functions/research-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          userId: user.id
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.research) {
        throw new Error(data.error || 'Invalid response from research API');
      }

      setReport(data.research);
      setCompanyName('');
      setError('');
      setActiveEmailIdx(0);
      setVerifiedEmails({});
    } catch (err) {
      console.error('Research error:', err);
      
      if (err.name === 'AbortError') {
        setError('Research timed out after 10 minutes. The Claude API may need more time than expected. Try again.');
      } else {
        setError(err.message || 'Failed to research company. Please try again.');
      }
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

  const toggleEmailVerified = (email) => {
    setVerifiedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
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
              <h2 className="text-xl font-bold text-slate-900 mb-4">Multi-Agent Company Intelligence</h2>
              <p className="text-sm text-slate-600 mb-4">
                🎯 AI-powered research with Company Intel → Email Discovery → Synthesis → BD Strategy for: <strong>{profile?.service_name || 'Not set'}</strong>
              </p>
              <form onSubmit={handleResearch} className="flex gap-4">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  disabled={researching}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={researching}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {researching ? '🤖 Researching...' : 'Research'}
                </button>
              </form>
              {researching && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-600">
                    🤖 Agent 1: Company Research + Email Discovery • Agent 2: Synthesis • Agent 3: BD Strategy
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                  <p className="text-xs text-slate-500">Taking time to research thoroughly (may take 1-10 minutes - no timeout limits)</p>
                </div>
              )}
            </div>

            {report && (
              <div className="space-y-6">
                {/* STEP 1: COMPANY SUMMARY */}
                {report.company_summary && (
                  <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold">1</span>
                      <h3 className="text-lg font-bold text-slate-900">Company Summary</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 space-y-3">
                      {report.company_summary.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: OPPORTUNITY FIT */}
                {report.opportunity_fit && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold">2</span>
                      <h3 className="text-lg font-bold text-green-900">Opportunity Fit</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-green-700">Alignment Score</p>
                        <p className="text-3xl font-bold text-green-600">{report.opportunity_fit.alignment_score}/10</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-green-700 font-semibold">Why This Fit Is Strong</p>
                        <p className="text-sm text-green-800 mt-1">{report.opportunity_fit.why}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAIN POINTS */}
                {report.pain_points && report.pain_points.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-700 font-bold">3</span>
                      <h3 className="text-lg font-bold text-slate-900">Pain Points Analysis</h3>
                    </div>
                    <div className="space-y-4">
                      {report.pain_points.map((pain, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-slate-900">{pain.pain_point}</p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              pain.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              pain.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pain.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{pain.why_they_have_it}</p>
                          <p className="text-sm text-slate-600 mb-2"><strong>Evidence:</strong> {pain.evidence}</p>
                          <p className="text-sm text-blue-700"><strong>Solution:</strong> {pain.how_service_solves}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: TIMING SIGNALS */}
                {report.timing_signals && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-700 font-bold">4</span>
                      <h3 className="text-lg font-bold text-slate-900">Timing & Opportunity Signals</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(report.timing_signals).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-50 rounded">
                          <p className="font-semibold text-slate-900 capitalize">{key}</p>
                          <p className="text-slate-700 mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: BD STRATEGY */}
                {report.pitch_strategy && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-700 font-bold">5</span>
                      <h3 className="text-lg font-bold text-slate-900">BD Strategy</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Opening Hook (Lead With This):</p>
                        <p className="text-sm text-slate-700 mt-1 p-2 bg-red-50 rounded italic">"{report.pitch_strategy.opening_hook}"</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Why Now (Urgency):</p>
                        <p className="text-sm text-slate-700 mt-1">{report.pitch_strategy.why_now}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Differentiation:</p>
                        <p className="text-sm text-slate-700 mt-1">{report.pitch_strategy.differentiation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: EMAIL DISCOVERY */}
                {report.email_discovery && report.email_discovery.emails_found && report.email_discovery.emails_found.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold">6</span>
                      <h3 className="text-lg font-bold text-green-900">Discovered Email Addresses ({report.email_discovery.emails_found.length})</h3>
                    </div>
                    <p className="text-sm text-green-700 mb-4">Domain: <strong>{report.email_discovery.domain}</strong> • Pattern: {report.email_discovery.common_patterns[0]}</p>
                    <div className="space-y-3">
                      {report.email_discovery.emails_found.map((email, idx) => (
                        <div key={idx} className={`p-3 rounded border-2 transition-colors ${
                          verifiedEmails[email.email] 
                            ? 'bg-white border-green-400 bg-green-50' 
                            : 'bg-white border-orange-300 bg-orange-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono font-semibold text-slate-900">{email.email}</p>
                              <p className="text-sm text-slate-700 mt-1">{email.name} • {email.title}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Found in:</strong> {email.source}
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                email.confidence === 'HIGH' ? 'bg-green-200 text-green-800' :
                                email.confidence === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {email.confidence}
                              </span>
                              <button
                                onClick={() => toggleEmailVerified(email.email)}
                                className={`block w-20 mt-2 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                                  verifiedEmails[email.email]
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                                }`}
                              >
                                {verifiedEmails[email.email] ? '✓ Verified' : 'Mark OK'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 7: PERSONALIZED EMAILS (LAST) */}
                {report.personalized_emails && report.personalized_emails.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-bold">7</span>
                      <h3 className="text-lg font-bold text-slate-900">Personalized Emails Ready to Send ({report.personalized_emails.length} variants)</h3>
                    </div>
                    
                    <div className="flex gap-2 mb-4 border-b border-slate-200 overflow-x-auto">
                      {report.personalized_emails.map((email, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveEmailIdx(idx)}
                          className={`py-2 px-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeEmailIdx === idx
                              ? 'border-purple-600 text-purple-600'
                              : 'border-transparent text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {email.target_name}
                        </button>
                      ))}
                    </div>

                    {report.personalized_emails[activeEmailIdx] && (
                      <div className="space-y-4">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-xs text-purple-700 font-semibold uppercase">Sending To</p>
                          <p className="font-mono font-bold text-slate-900 mt-1">{report.personalized_emails[activeEmailIdx].target_email}</p>
                          <p className="text-sm text-slate-700">{report.personalized_emails[activeEmailIdx].target_name} • {report.personalized_emails[activeEmailIdx].target_title}</p>
                          {report.personalized_emails[activeEmailIdx].email_source && (
                            <p className="text-xs text-purple-600 mt-1">📍 Email discovered from: {report.personalized_emails[activeEmailIdx].email_source}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Subject Line</p>
                          <p className="font-semibold text-slate-900 mt-2 text-base">{report.personalized_emails[activeEmailIdx].subject_line}</p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                            {report.personalized_emails[activeEmailIdx].body}
                          </p>
                        </div>

                        {report.personalized_emails[activeEmailIdx].key_references && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900">Research References in This Email:</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
                              {report.personalized_emails[activeEmailIdx].key_references.map((ref, i) => (
                                <li key={i}>{ref}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <button
                          onClick={() => copyEmailToClipboard(report.personalized_emails[activeEmailIdx])}
                          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                        >
                          {copiedEmail === report.personalized_emails[activeEmailIdx].subject_line ? '✅ Copied to Clipboard!' : '📋 Copy Email (Subject + Body)'}
                        </button>
                      </div>
                    )}
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
