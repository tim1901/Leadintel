// netlify/functions/sync-to-crm.js
// Syncs campaigns and prospects to Salesforce or HubSpot

const axios = require('axios');

// Sync to HubSpot
async function syncToHubSpot(contact, campaign, apiKey) {
  const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';

  try {
    const response = await axios.post(hubspotUrl, {
      properties: [
        {
          name: 'firstname',
          value: contact.prospect_name.split(' ')[0]
        },
        {
          name: 'lastname',
          value: contact.prospect_name.split(' ').slice(1).join(' ')
        },
        {
          name: 'email',
          value: contact.prospect_email
        },
        {
          name: 'jobtitle',
          value: contact.prospect_title
        },
        {
          name: 'company',
          value: campaign.company_name
        },
        {
          name: 'bd_intelligence_source',
          value: 'BD Intelligence Engine'
        },
        {
          name: 'bd_health_score',
          value: campaign.health_score
        },
        {
          name: 'bd_outreach_angle',
          value: contact.outreach_angle
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      platform: 'HubSpot',
      contactId: response.data.id,
      message: 'Contact synced to HubSpot'
    };
  } catch (error) {
    return {
      success: false,
      platform: 'HubSpot',
      error: error.message
    };
  }
}

// Sync to Salesforce
async function syncToSalesforce(contact, campaign, instanceUrl, accessToken) {
  const salesforceUrl = `${instanceUrl}/services/data/v57.0/sobjects/Contact`;

  try {
    const response = await axios.post(salesforceUrl, {
      FirstName: contact.prospect_name.split(' ')[0],
      LastName: contact.prospect_name.split(' ').slice(1).join(' '),
      Email: contact.prospect_email,
      Title: contact.prospect_title,
      Company__c: campaign.company_name,
      BD_Intelligence_Source__c: 'BD Intelligence Engine',
      BD_Health_Score__c: campaign.health_score,
      BD_Outreach_Angle__c: contact.outreach_angle
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      platform: 'Salesforce',
      contactId: response.data.id,
      message: 'Contact synced to Salesforce'
    };
  } catch (error) {
    return {
      success: false,
      platform: 'Salesforce',
      error: error.message
    };
  }
}

// Sync to Pipedrive
async function syncToPipedrive(contact, campaign, accessToken) {
  const pipedriveUrl = 'https://api.pipedrive.com/v1/persons';

  try {
    const response = await axios.post(pipedriveUrl, {
      name: contact.prospect_name,
      email: contact.prospect_email,
      phone: contact.prospect_phone,
      org_id: campaign.company_name,
      custom_fields: {
        bd_health_score: campaign.health_score,
        bd_outreach_angle: contact.outreach_angle,
        bd_source: 'BD Intelligence Engine'
      }
    }, {
      params: {
        api_token: accessToken
      }
    });

    return {
      success: true,
      platform: 'Pipedrive',
      contactId: response.data.data.id,
      message: 'Contact synced to Pipedrive'
    };
  } catch (error) {
    return {
      success: false,
      platform: 'Pipedrive',
      error: error.message
    };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      contact,
      campaign,
      crmType,
      crmApiKey,
      crmInstanceUrl,
      crmAccessToken
    } = JSON.parse(event.body);

    if (!contact || !campaign || !crmType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    let result;

    switch (crmType.toLowerCase()) {
      case 'hubspot':
        result = await syncToHubSpot(contact, campaign, crmApiKey);
        break;
      case 'salesforce':
        result = await syncToSalesforce(contact, campaign, crmInstanceUrl, crmAccessToken);
        break;
      case 'pipedrive':
        result = await syncToPipedrive(contact, campaign, crmAccessToken);
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown CRM type: ${crmType}` }),
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...result,
        contact: contact.prospect_name,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("CRM sync error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "CRM sync failed",
        message: error.message,
      }),
    };
  }
};
