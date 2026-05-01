import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    service_name: '',
    service_description: '',
    differentiators: [],
    messaging_style: 'professional',
  });

  const [newDifferentiator, setNewDifferentiator] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          name: data.name || '',
          service_name: data.service_name || '',
          service_description: data.service_description || '',
          differentiators: data.differentiators || [],
          messaging_style: data.messaging_style || 'professional',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDifferentiator = () => {
    if (newDifferentiator.trim()) {
      setFormData(prev => ({
        ...prev,
        differentiators: [...prev.differentiators, newDifferentiator.trim()]
      }));
      setNewDifferentiator('');
    }
  };

  const handleRemoveDifferentiator = (index) => {
    setFormData(prev => ({
      ...prev,
      differentiators: prev.differentiators.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          service_name: formData.service_name,
          service_description: formData.service_description,
          differentiators: formData.differentiators,
          messaging_style: formData.messaging_style,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
        <p className="text-gray-600 mb-8">Manage your profile information. This data helps Claude generate better research and personalized outreach.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Service Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Service</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., IT Automation, Sales Training, Business Consulting</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description
              </label>
              <textarea
                name="service_description"
                value={formData.service_description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what you do, who you help, and the problems you solve"
              />
              <p className="text-xs text-gray-500 mt-1">This helps Claude understand your value proposition and create better outreach</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Differentiators
              </label>
              <p className="text-xs text-gray-500 mb-3">What makes you different? Add 3-5 key points</p>
              
              {/* Add Differentiator */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newDifferentiator}
                  onChange={(e) => setNewDifferentiator(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDifferentiator();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 10+ years of industry experience"
                />
                <button
                  type="button"
                  onClick={handleAddDifferentiator}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition"
                >
                  Add
                </button>
              </div>

              {/* Display Differentiators */}
              <div className="space-y-2">
                {formData.differentiators.map((diff, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2"
                  >
                    <span className="text-sm text-gray-900">{diff}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDifferentiator(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Communication Style Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Style</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Messaging Style
              </label>
              <select
                name="messaging_style"
                value={formData.messaging_style}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional & Formal</option>
                <option value="casual">Conversational & Friendly</option>
                <option value="technical">Technical & Detailed</option>
                <option value="bold">Bold & Direct</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Claude will use this style when generating outreach messages</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-gray-200 pt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
