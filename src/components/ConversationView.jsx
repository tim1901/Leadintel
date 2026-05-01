import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const ConversationView = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (loading) {
    return <div className="text-center py-12">Loading conversations...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map(conversation => (
            <div key={conversation.conversation_id} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900">{conversation.subject}</h3>
              <p className="text-sm text-gray-600">{conversation.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(conversation.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationView;
