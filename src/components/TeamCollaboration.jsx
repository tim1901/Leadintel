import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const TeamCollaboration = ({ userId, teamId }) => {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [inviteSent, setInviteSent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  const loadTeam = async () => {
    try {
      // TODO: Load team from Supabase
      // For now, placeholder
      setTeam({
        name: 'Sales Team',
        members: 3,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    try {
      // TODO: Send invitation
      setInviteSent(`Invitation sent to ${newMemberEmail}`);
      setNewMemberEmail('');
      setTimeout(() => setInviteSent(''), 3000);
    } catch (err) {
      setError('Failed to send invitation');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      // TODO: Update member role in database
      console.log(`Changed ${memberId} to ${newRole}`);
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return;

    try {
      // TODO: Remove member from team
      console.log(`Removed ${memberId}`);
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Team Management</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {inviteSent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ {inviteSent}
          </div>
        )}

        {/* Team Info */}
        {team && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Team Name</p>
              <p className="text-lg font-semibold text-slate-900">{team.name}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Team Members</p>
              <p className="text-lg font-semibold text-slate-900">{team.members}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Created</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Invite New Member */}
        <div className="mb-8 p-6 border border-slate-200 rounded-lg bg-gradient-to-br from-blue-50 to-slate-50">
          <h3 className="font-semibold text-slate-900 mb-4">Invite Team Member</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleInviteMember}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Invite
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Invitation will be sent to their email. They can join with their BD Intelligence account.
          </p>
        </div>

        {/* Team Members */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Team Members</h3>
          <div className="space-y-3">
            {[
              { name: 'You', email: 'you@company.com', role: 'Admin', joined: '2 days ago' },
              { name: 'John Smith', email: 'john@company.com', role: 'Member', joined: '1 day ago' },
              { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Member', joined: '6 hours ago' }
            ].map((member, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-sm text-slate-600">{member.email}</p>
                  <p className="text-xs text-slate-500 mt-1">Joined {member.joined}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    defaultValue={member.role}
                    onChange={(e) => handleChangeRole(idx, e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm"
                    disabled={idx === 0}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  {idx !== 0 && (
                    <button
                      onClick={() => handleRemoveMember(idx)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Activity */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Team Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'John researched Apple Inc', time: '2 hours ago', icon: '🔍' },
            { action: 'Sarah sent outreach to 5 prospects', time: '1 hour ago', icon: '✉️' },
            { action: 'You scheduled 3 follow-ups', time: '30 minutes ago', icon: '⏰' }
          ].map((activity, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
              <span className="text-xl">{activity.icon}</span>
              <div>
                <p className="text-sm text-slate-700">{activity.action}</p>
                <p className="text-xs text-slate-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Settings */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Team Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-slate-700">Allow all members to send campaigns</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-slate-700">Sync with shared CRM account</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-slate-700">Allow external team integrations</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TeamCollaboration;
