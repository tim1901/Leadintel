// emailFinderService.js
// Unified service to handle all 6 email finder APIs
// Converts different response formats to a standard format

const EMAIL_FINDERS = {
  HUNTER: 'hunter',
  ROCKETREACH: 'rocketreach',
  CLEARBIT: 'clearbit',
  FINDTHATEMAIL: 'findthatemail',
  EMAILHIPPO: 'emailhippo',
  VIOLANORBERT: 'violanorbert',
};

/**
 * Standard response format for all email finders
 * {
 *   success: boolean,
 *   emails: [{ email, name, title, confidence }],
 *   source: 'hunter' | 'rocketreach' | etc,
 *   error?: string
 * }
 */

// ============ HUNTER.IO ============
async function findEmailsHunter(domain, apiKey, firstName, lastName) {
  try {
    const params = new URLSearchParams({
      domain,
      api_key: apiKey,
    });

    if (firstName) params.append('first_name', firstName);
    if (lastName) params.append('last_name', lastName);

    const response = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    const data = await response.json();

    if (data.data?.email) {
      return {
        success: true,
        emails: [
          {
            email: data.data.email,
            name: `${data.data.first_name || ''} ${data.data.last_name || ''}`.trim(),
            title: data.data.position || '',
            confidence: data.data.confidence || 0.8,
          }
        ],
        source: EMAIL_FINDERS.HUNTER,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.HUNTER,
      error: data.errors?.[0]?.message || 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.HUNTER,
      error: error.message,
    };
  }
}

// ============ ROCKETREACH ============
async function findEmailsRocketReach(domain, apiKey, firstName, lastName) {
  try {
    const body = {
      api_key: apiKey,
      domain,
      name: `${firstName || ''} ${lastName || ''}`.trim(),
    };

    const response = await fetch('https://api.rocketreach.co/v2/api/profiles/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.profile?.emails && data.profile.emails.length > 0) {
      return {
        success: true,
        emails: data.profile.emails.map(email => ({
          email: email.email,
          name: `${data.profile.first_name || ''} ${data.profile.last_name || ''}`.trim(),
          title: data.profile.current_title || '',
          confidence: 0.85,
        })),
        source: EMAIL_FINDERS.ROCKETREACH,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.ROCKETREACH,
      error: 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.ROCKETREACH,
      error: error.message,
    };
  }
}

// ============ CLEARBIT ============
async function findEmailsClearbit(domain, apiKey, firstName, lastName) {
  try {
    const params = new URLSearchParams({
      domain,
    });

    if (firstName) params.append('name', `${firstName} ${lastName || ''}`.trim());

    const response = await fetch(`https://company.clearbit.com/v1/domains/lookup?${params}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (data.emails && data.emails.length > 0) {
      return {
        success: true,
        emails: data.emails.map(email => ({
          email: email.email,
          name: email.name || '',
          title: email.title || '',
          confidence: 0.9,
        })),
        source: EMAIL_FINDERS.CLEARBIT,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.CLEARBIT,
      error: 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.CLEARBIT,
      error: error.message,
    };
  }
}

// ============ FINDTHATEMAIL ============
async function findEmailsFindThatEmail(domain, apiKey, firstName, lastName) {
  try {
    const response = await fetch('https://api.findthatemail.com/api/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        domain,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (data.email) {
      return {
        success: true,
        emails: [
          {
            email: data.email,
            name: `${firstName || ''} ${lastName || ''}`.trim(),
            title: data.job_title || '',
            confidence: data.confidence || 0.8,
          }
        ],
        source: EMAIL_FINDERS.FINDTHATEMAIL,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.FINDTHATEMAIL,
      error: data.error || 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.FINDTHATEMAIL,
      error: error.message,
    };
  }
}

// ============ EMAIL HIPPO ============
async function findEmailsEmailHippo(domain, apiKey, firstName, lastName) {
  try {
    const response = await fetch('https://api.emailhippo.com/v1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email: `${firstName || 'info'}@${domain}`,
      }),
    });

    const data = await response.json();

    if (data.result === 'valid' || data.result === 'accept_all') {
      return {
        success: true,
        emails: [
          {
            email: `${firstName || 'info'}@${domain}`,
            name: `${firstName || ''} ${lastName || ''}`.trim(),
            title: '',
            confidence: 0.75,
          }
        ],
        source: EMAIL_FINDERS.EMAILHIPPO,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.EMAILHIPPO,
      error: 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.EMAILHIPPO,
      error: error.message,
    };
  }
}

// ============ VOILA NORBERT ============
async function findEmailsViolaNorbert(domain, apiKey, firstName, lastName) {
  try {
    const response = await fetch('https://api.voilanorbert.com/api/v1/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        domain,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (data.person?.email) {
      return {
        success: true,
        emails: [
          {
            email: data.person.email,
            name: `${data.person.first_name || ''} ${data.person.last_name || ''}`.trim(),
            title: data.person.job_title || '',
            confidence: data.person.email_confidence || 0.85,
          }
        ],
        source: EMAIL_FINDERS.VIOLANORBERT,
      };
    }

    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.VIOLANORBERT,
      error: 'Email not found',
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      source: EMAIL_FINDERS.VIOLANORBERT,
      error: error.message,
    };
  }
}

// ============ MAIN FUNCTION - TRY ALL FINDERS ============
/**
 * Find emails using multiple providers in order
 * Tries each API until one succeeds
 * 
 * @param {string} domain - Company domain
 * @param {object} apiKeys - { hunter, rocketreach, clearbit, etc }
 * @param {string} firstName - Contact first name (optional)
 * @param {string} lastName - Contact last name (optional)
 * @param {array} priority - Order to try finders (optional)
 * @returns {object} Standard response with emails or error
 */
export async function findEmails(domain, apiKeys, firstName = '', lastName = '', priority = null) {
  // Default priority order (based on free tier limits)
  const trialOrder = priority || [
    EMAIL_FINDERS.CLEARBIT,      // 100/month
    EMAIL_FINDERS.EMAILHIPPO,     // 100/month
    EMAIL_FINDERS.HUNTER,         // 50/month
    EMAIL_FINDERS.ROCKETREACH,    // 50/month
    EMAIL_FINDERS.FINDTHATEMAIL,  // 50/month
    EMAIL_FINDERS.VIOLANORBERT,   // 50/month
  ];

  const finderFunctions = {
    [EMAIL_FINDERS.HUNTER]: () => findEmailsHunter(domain, apiKeys.hunter_api_key, firstName, lastName),
    [EMAIL_FINDERS.ROCKETREACH]: () => findEmailsRocketReach(domain, apiKeys.rocketreach_api_key, firstName, lastName),
    [EMAIL_FINDERS.CLEARBIT]: () => findEmailsClearbit(domain, apiKeys.clearbit_api_key, firstName, lastName),
    [EMAIL_FINDERS.FINDTHATEMAIL]: () => findEmailsFindThatEmail(domain, apiKeys.findthatemail_api_key, firstName, lastName),
    [EMAIL_FINDERS.EMAILHIPPO]: () => findEmailsEmailHippo(domain, apiKeys.emailhippo_api_key, firstName, lastName),
    [EMAIL_FINDERS.VIOLANORBERT]: () => findEmailsViolaNorbert(domain, apiKeys.violanorbert_api_key, firstName, lastName),
  };

  // Try each finder in priority order
  for (const finderName of trialOrder) {
    // Skip if API key not provided
    if (!apiKeys[`${finderName}_api_key`]) {
      console.log(`Skipping ${finderName} - no API key`);
      continue;
    }

    try {
      console.log(`Trying ${finderName}...`);
      const result = await finderFunctions[finderName]();

      if (result.success && result.emails.length > 0) {
        console.log(`✅ Found email via ${finderName}`);
        return result;
      }
    } catch (error) {
      console.log(`❌ ${finderName} failed:`, error.message);
      continue;
    }
  }

  // If all finders fail, return error
  return {
    success: false,
    emails: [],
    source: null,
    error: 'Could not find email. Try different search terms or check your API keys.',
  };
}

// ============ HELPER - Get email finder status ============
export function getFinderStatus(apiKeys) {
  return {
    hunter: !!apiKeys.hunter_api_key,
    rocketreach: !!apiKeys.rocketreach_api_key,
    clearbit: !!apiKeys.clearbit_api_key,
    findthatemail: !!apiKeys.findthatemail_api_key,
    emailhippo: !!apiKeys.emailhippo_api_key,
    violanorbert: !!apiKeys.violanorbert_api_key,
    totalConnected: Object.values({
      hunter: !!apiKeys.hunter_api_key,
      rocketreach: !!apiKeys.rocketreach_api_key,
      clearbit: !!apiKeys.clearbit_api_key,
      findthatemail: !!apiKeys.findthatemail_api_key,
      emailhippo: !!apiKeys.emailhippo_api_key,
      violanorbert: !!apiKeys.violanorbert_api_key,
    }).filter(Boolean).length,
  };
}
