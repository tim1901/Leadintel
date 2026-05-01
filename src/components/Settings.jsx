import React, { useState } from 'react';
import ProfileSettings from './ProfileSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'integrations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileSettings />}
        
        {activeTab === 'integrations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Integrations</h2>
            <p className="text-gray-600">Coming soon: Connect your email, CRM, and communication tools</p>
          </div>
        )}
        
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Preferences</h2>
            <p className="text-gray-600">Coming soon: Customize your LeadIntel experience</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
