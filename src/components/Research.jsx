import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { findEmails, getFinderStatus } from '../lib/emailFinderService';

const Research = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [integrations, setIntegrations] = useState(null);
  const [finderStatus, setFinderStatus] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [quotaUsage, setQuotaUsage] = useState({});

  const fetchIntegrations = useCallback(() => {
    try {
      const stored = localStorage.getItem(`integrations_${user?.id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setIntegrations(data);
        setFinderStatus(getFinderStatus(data));
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    }
  }, [user?.id]);

  const fetchSearchHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(`search_history_${user?.id}`);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
      const quota = localStorage.getItem(`quota_usage_${user?.id}`);
      if (quota) {
        setQuotaUsage(JSON.parse(quota));
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchIntegrations();
    fetchSearchHistory();
  }, [user, fetchIntegrations, fetchSearchHistory]);

  const updateQuotaUsage = (finder) => {
    const newQuota = { ...quotaUsage };
    newQuota[finder] = (newQuota[finder] || 0) + 1;
    localStorage.setItem(`quota_usage_${user?.id}`, JSON.stringify(newQuota));
    setQuotaUsage(newQuota);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!domain) {
        setError('Please enter a domain');
        return;
      }

      if (!integrations) {
        setError('Please set up integrations first');
        return;
      }

      const connectedFinders = Object.entries(integrations)
        .filter(([key, value]) => key.endsWith('_api_key') && value)
        .map(([key]) => key.replace('_api_key', ''));

      if (connectedFinders.length === 0) {
        setError('Please connect at least one email finder in Integrations');
        return;
      }

      console.log('Starting email search...');
      console.log('Domain:', domain);
      console.log('Connected finders:', connectedFinders);

      const result = await findEmails(
        domain,
        integrations,
        firstName,
        lastName
      );

      if (result.success) {
        setSuccess(`✅ Found ${result.emails.length} email(s) via ${result.source}!`);
        updateQuotaUsage(result.source);

        const newEntry = {
          id: Date.now(),
          companyName,
          domain,
          contactName: `${firstName} ${lastName}`.trim(),
          emails: result.emails,
          source: result.source,
          foundAt: new Date().toLocaleString(),
        };

        const newHistory = [newEntry, ...searchHistory.slice(0, 49)];
        setSearchHistory(newHistory);
        localStorage.setItem(`search_history_${user?.id}`, JSON.stringify(newHistory));

        setCompanyName('');
        setDomain('');
        setFirstName('');
        setLastName('');
      } else {
        setError(result.error || 'Could not find email');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    }
  };

  const getTotalQuotaUsed = () => {
    return Object.values(quotaUsage).reduce((a, b) => a + b, 0);
  };

  const getTotalQuotaAvailable = () => {
    return 400;
  };

  // ✅ FIXED: Navigate to settings tab via URL
  const handleGoToSettings = () => {
    setSearchParams({ tab: 'settings' });
  };

  if (!integrations) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-2">⚙️ Setup Required</h3>
          <p className="text-yellow-800 text-sm mb-3">
            You need to connect your email finders first to search for emails.
          </p>
          <button
            onClick={handleGoToSettings}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Go to Settings → Integrations →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Research</h1>
        <p className="text-gray-600 mt-1">Find email addresses for your prospects using AI</p>
      </div>

      {finderStatus && finderStatus.totalConnected > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-blue-900">📊 Monthly Quota</h3>
              <p className="text-blue-800 text-sm mt-1">
                You have {getTotalQuotaAvailable() - getTotalQuotaUsed()} searches left this month
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{getTotalQuotaUsed()}/{getTotalQuotaAvailable()}</div>
            </div>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${(getTotalQuotaUsed() / getTotalQuotaAvailable()) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {['hunter', 'rocketreach', 'clearbit', 'findthatemail', 'emailhippo', 'violanorbert'].map(finder => (
              integrations[`${finder}_api_key`] && (
                <div key={finder} className="bg-white rounded p-2">
                  <div className="text-gray-700 font-medium capitalize">{finder}</div>
                  <div className="text-gray-600 text-xs">{quotaUsage[finder] || 0} used</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Find Email</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domain *</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="apple.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Tim"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Cook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          Find Email
        </button>
      </form>

      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Searches</h2>

          <div className="space-y-4">
            {searchHistory.map(entry => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{entry.companyName || entry.domain}</h4>
                    <p className="text-gray-600 text-sm">{entry.contactName || 'General lookup'}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">{entry.foundAt}</div>
                </div>

                <div className="space-y-2 mb-3">
                  {entry.emails.map((email, idx) => (
                    <div key={idx} className="bg-gray-50 rounded px-3 py-2">
                      <div className="font-mono text-sm text-blue-600">{email.email}</div>
                      {email.name && <div className="text-xs text-gray-600">{email.name}</div>}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Found via <strong className="capitalize">{entry.source}</strong></span>
                  <span>Confidence: {Math.round((entry.emails[0]?.confidence || 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Research;
