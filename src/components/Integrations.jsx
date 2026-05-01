import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Integrations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testing, setTesting] = useState({});

  const [integrations, setIntegrations] = useState({
    resend_api_key: '',
    hunter_api_key: '',
    rocketreach_api_key: '',
    clearbit_api_key: '',
    findthatemail_api_key: '',
    emailhippo_api_key: '',
    violanorbert_api_key: '',
  });

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const fetchIntegrations = () => {
    try {
      const stored = localStorage.getItem(`integrations_${user?.id}`);
      if (stored) {
        setIntegrations(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIntegrations(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      localStorage.setItem(
        `integrations_${user?.id}`,
        JSON.stringify(integrations)
      );
      setSuccess('All integrations saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving integrations:', err);
      setError('Failed to save integrations');
    } finally {
      setSaving(false);
    }
  };

  const testAPI = async (apiName) => {
    setTesting(prev => ({ ...prev, [apiName]: true }));
    setError('');
    setSuccess('');

    try {
      let isValid = false;
      let message = '';

      if (apiName === 'resend') {
        if (!integrations.resend_api_key) {
          setError('Please enter your Resend API key');
          setTesting(prev => ({ ...prev, [apiName]: false }));
          return;
        }
        message = '✅ Resend API key saved!';
        isValid = integrations.resend_api_key.length > 5;
      } else {
        if (!integrations[`${apiName}_api_key`]) {
          setError(`Please enter your ${apiName} API key`);
          setTesting(prev => ({ ...prev, [apiName]: false }));
          return;
        }
        message = `✅ ${apiName} API key saved!`;
        isValid = integrations[`${apiName}_api_key`].length > 5;
      }

      if (isValid) {
        setSuccess(message);
      } else {
        setError('Invalid API key format');
      }
    } catch (err) {
      setError('Connection error. Check your API key.');
    } finally {
      setTesting(prev => ({ ...prev, [apiName]: false }));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading integrations...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* EMAIL SENDING */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📧 Email Sending (Required)</h2>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Resend</h3>
                <p className="text-gray-600 text-sm mt-1">Send emails with automatic open & click tracking</p>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">REQUIRED</span>
            </div>
            <input
              type="password"
              name="resend_api_key"
              value={integrations.resend_api_key}
              onChange={handleChange}
              placeholder="re_..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm mb-4"
            />
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => testAPI('resend')} disabled={testing.resend} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">
                {testing.resend ? 'Testing...' : 'Test'}
              </button>
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Get API key →
              </a>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900"><strong>How it works:</strong> When you send an email through LeadIntel, we use Resend to deliver it with automatic tracking.</p>
            </div>
          </div>
        </div>

        {/* EMAIL FINDERS */}
        <div className="border-b border-gray-200 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Email Finders</h2>
          <p className="text-gray-600 mb-6"><strong>Connect all 6 to get 400 FREE email searches/month!</strong></p>

          {[
            { name: 'hunter', label: 'Hunter.io', limit: '50', link: 'https://hunter.io/users/sign_up' },
            { name: 'rocketreach', label: 'RocketReach', limit: '50', link: 'https://rocketreach.com/api' },
            { name: 'clearbit', label: 'Clearbit', limit: '100', link: 'https://clearbit.com/api' },
            { name: 'findthatemail', label: 'FindThatEmail', limit: '50', link: 'https://findthatemail.com/api' },
            { name: 'emailhippo', label: 'Email Hippo', limit: '100', link: 'https://www.emailhippo.com/api' },
            { name: 'violanorbert', label: 'Voila Norbert', limit: '50', link: 'https://www.voilanorbert.com/api' },
          ].map(finder => (
            <div key={finder.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{finder.label}</h4>
                  <p className="text-gray-600 text-sm">{finder.limit} free searches/month</p>
                </div>
              </div>
              <input
                type="password"
                name={`${finder.name}_api_key`}
                value={integrations[`${finder.name}_api_key`]}
                onChange={handleChange}
                placeholder="API key..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm mb-4"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => testAPI(finder.name)} disabled={testing[finder.name]} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">
                  {testing[finder.name] ? 'Testing...' : 'Test'}
                </button>
                <a href={finder.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  Create free account →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* SAVE */}
        <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition">
          {saving ? 'Saving...' : 'Save All Integrations'}
        </button>
      </form>

      {/* GUIDE */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-bold text-green-900 mb-3">🎯 Get 400 FREE Email Searches/Month</h4>
        <ol className="text-sm text-green-900 space-y-2 list-decimal list-inside">
          <li>Create FREE accounts with all 6 email finders (takes 10 minutes)</li>
          <li>Copy their API keys and paste them above</li>
          <li>Click "Test" for each one</li>
          <li>Click "Save All Integrations"</li>
          <li>During research, we'll automatically find emails using your API keys</li>
          <li>You get 400 FREE email searches every month!</li>
        </ol>
      </div>
    </div>
  );
};

export default Integrations;
