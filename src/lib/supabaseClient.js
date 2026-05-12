import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key loaded:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars - URL:', supabaseUrl, 'Key:', supabaseAnonKey);
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// USER PROFILES
// ========================================

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getUserProfile error:', err);
    return null;
  }
};

export const createUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email: profileData.email || '',
          name: profileData.name || '',
          service_name: profileData.service_name || '',
          service_description: profileData.service_description || '',
          messaging_style: profileData.messaging_style || 'professional',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createUserProfile error:', err);
    return null;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('updateUserProfile error:', err);
    return null;
  }
};

// ========================================
// COMPANY RESEARCH
// ========================================

export const getCompanyResearch = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('company_research')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company research:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getCompanyResearch error:', err);
    return [];
  }
};

export const getCompanyResearchById = async (researchId) => {
  try {
    const { data, error } = await supabase
      .from('company_research')
      .select('*')
      .eq('id', researchId)
      .single();

    if (error) {
      console.error('Error fetching company research:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getCompanyResearchById error:', err);
    return null;
  }
};

export const createCompanyResearch = async (userId, researchData) => {
  try {
    const { data, error } = await supabase
      .from('company_research')
      .insert([
        {
          user_id: userId,
          company_name: researchData.company_name,
          industry: researchData.industry || null,
          company_size: researchData.company_size || null,
          location: researchData.location || null,
          website: researchData.website || null,
          health_score: researchData.health_score || 0,
          problem_fit: researchData.problem_fit || null,
          budget_likelihood: researchData.budget_likelihood || null,
          solution_seeking_likelihood: researchData.solution_seeking_likelihood || null,
          pain_signals: researchData.pain_signals || null,
          research_status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating company research:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createCompanyResearch error:', err);
    return null;
  }
};

export const updateCompanyResearch = async (researchId, researchData) => {
  try {
    const { data, error } = await supabase
      .from('company_research')
      .update({
        ...researchData,
        updated_at: new Date().toISOString()
      })
      .eq('id', researchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company research:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('updateCompanyResearch error:', err);
    return null;
  }
};

// ========================================
// OUTREACH CAMPAIGNS
// ========================================

export const getOutreachCampaigns = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outreach campaigns:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getOutreachCampaigns error:', err);
    return [];
  }
};

export const getOutreachCampaignById = async (campaignId) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error fetching outreach campaign:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getOutreachCampaignById error:', err);
    return null;
  }
};

export const createOutreachCampaign = async (userId, campaignData) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert([
        {
          user_id: userId,
          company_name: campaignData.company_name,
          company_research_id: campaignData.company_research_id || null,
          prospect_name: campaignData.prospect_name,
          prospect_email: campaignData.prospect_email,
          prospect_title: campaignData.prospect_title || null,
          prospect_phone: campaignData.prospect_phone || null,
          outreach_angle: campaignData.outreach_angle || null,
          subject_line: campaignData.subject_line || null,
          email_body: campaignData.email_body || null,
          status: campaignData.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating outreach campaign:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createOutreachCampaign error:', err);
    return null;
  }
};

export const updateOutreachCampaign = async (campaignId, campaignData) => {
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .update({
        ...campaignData,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('Error updating outreach campaign:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('updateOutreachCampaign error:', err);
    return null;
  }
};

// ========================================
// EMAIL LOGS
// ========================================

export const getEmailLogs = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getEmailLogs error:', err);
    return [];
  }
};

export const getEmailLogsByCampaign = async (campaignId) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getEmailLogsByCampaign error:', err);
    return [];
  }
};

export const createEmailLog = async (userId, emailData) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert([
        {
          user_id: userId,
          campaign_id: emailData.campaign_id,
          message_id: emailData.message_id || null,
          to_email: emailData.to_email,
          subject: emailData.subject || null,
          status: emailData.status || 'sent',
          opened_count: 0,
          clicked_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating email log:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createEmailLog error:', err);
    return null;
  }
};

export const updateEmailLog = async (emailLogId, updates) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailLogId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email log:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('updateEmailLog error:', err);
    return null;
  }
};

// ========================================
// CONVERSATIONS
// ========================================

export const getConversations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getConversations error:', err);
    return [];
  }
};

export const createConversation = async (userId, conversationData) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: userId,
          campaign_id: conversationData.campaign_id,
          message_type: conversationData.message_type,
          message_text: conversationData.message_text,
          sender_email: conversationData.sender_email,
          recipient_email: conversationData.recipient_email,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createConversation error:', err);
    return null;
  }
};

// ========================================
// FOLLOWUPS
// ========================================

export const getFollowups = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('followups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching followups:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getFollowups error:', err);
    return [];
  }
};

export const createFollowup = async (userId, followupData) => {
  try {
    const { data, error } = await supabase
      .from('followups')
      .insert([
        {
          user_id: userId,
          campaign_id: followupData.campaign_id,
          follow_up_number: followupData.follow_up_number || 1,
          scheduled_for: followupData.scheduled_for,
          email_body: followupData.email_body,
          status: followupData.status || 'scheduled',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating followup:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createFollowup error:', err);
    return null;
  }
};

// ========================================
// WARM INTROS
// ========================================

export const getWarmIntros = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('warm_intros')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching warm intros:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('getWarmIntros error:', err);
    return [];
  }
};

export const createWarmIntro = async (userId, introData) => {
  try {
    const { data, error } = await supabase
      .from('warm_intros')
      .insert([
        {
          user_id: userId,
          campaign_id: introData.campaign_id,
          mutual_connection_name: introData.mutual_connection_name,
          mutual_connection_title: introData.mutual_connection_title,
          mutual_connection_email: introData.mutual_connection_email,
          target_person_name: introData.target_person_name,
          target_person_title: introData.target_person_title,
          connection_strength: introData.connection_strength || 5,
          introduction_angle: introData.introduction_angle,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating warm intro:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('createWarmIntro error:', err);
    return null;
  }
};
