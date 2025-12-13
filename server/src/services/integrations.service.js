const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Integrations Service
 * Handles WhatsApp, Telegram, API integrations, and CRMs
 */
class IntegrationsService {
  constructor() {
    this.integrations = new Map();
    this.webhooks = new Map();
    this.apiClients = new Map();

    // Initialize supported integrations
    this.initializeIntegrations();
  }

  /**
   * Initialize supported integrations
   */
  initializeIntegrations() {
    this.integrations.set('whatsapp', {
      name: 'WhatsApp Business API',
      type: 'messaging',
      config: {
        apiUrl: process.env.WHATSAPP_API_URL,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
      },
      status: 'inactive'
    });

    this.integrations.set('telegram', {
      name: 'Telegram Bot API',
      type: 'messaging',
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
      },
      status: 'inactive'
    });

    this.integrations.set('salesforce', {
      name: 'Salesforce CRM',
      type: 'crm',
      config: {
        clientId: process.env.SALESFORCE_CLIENT_ID,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
        username: process.env.SALESFORCE_USERNAME,
        password: process.env.SALESFORCE_PASSWORD,
        instanceUrl: process.env.SALESFORCE_INSTANCE_URL
      },
      status: 'inactive'
    });

    this.integrations.set('hubspot', {
      name: 'HubSpot CRM',
      type: 'crm',
      config: {
        apiKey: process.env.HUBSPOT_API_KEY,
        portalId: process.env.HUBSPOT_PORTAL_ID
      },
      status: 'inactive'
    });
  }

  /**
   * Configure integration
   * @param {string} integrationId - Integration ID
   * @param {Object} config - Configuration object
   * @returns {Object} Configuration result
   */
  async configureIntegration(integrationId, config) {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    try {
      // Validate configuration
      await this.validateIntegrationConfig(integrationId, config);

      // Update configuration
      integration.config = { ...integration.config, ...config };
      integration.status = 'configured';

      // Test connection
      const testResult = await this.testIntegration(integrationId);

      if (testResult.success) {
        integration.status = 'active';
      }

      return {
        success: true,
        integrationId,
        status: integration.status,
        testResult
      };

    } catch (error) {
      integration.status = 'error';
      throw new Error(`Configuration failed: ${error.message}`);
    }
  }

  /**
   * Validate integration configuration
   * @param {string} integrationId - Integration ID
   * @param {Object} config - Configuration to validate
   */
  async validateIntegrationConfig(integrationId, config) {
    const requiredFields = this.getRequiredFields(integrationId);

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Type-specific validation
    switch (integrationId) {
      case 'whatsapp':
        if (!config.phoneNumberId || !config.accessToken) {
          throw new Error('WhatsApp requires phoneNumberId and accessToken');
        }
        break;

      case 'telegram':
        if (!config.botToken) {
          throw new Error('Telegram requires botToken');
        }
        break;

      case 'salesforce':
        if (!config.clientId || !config.clientSecret) {
          throw new Error('Salesforce requires clientId and clientSecret');
        }
        break;

      case 'hubspot':
        if (!config.apiKey) {
          throw new Error('HubSpot requires apiKey');
        }
        break;
    }
  }

  /**
   * Get required fields for integration
   * @param {string} integrationId - Integration ID
   * @returns {Array} Required fields
   */
  getRequiredFields(integrationId) {
    const fieldMap = {
      whatsapp: ['apiUrl', 'accessToken', 'phoneNumberId'],
      telegram: ['botToken'],
      salesforce: ['clientId', 'clientSecret', 'username', 'password'],
      hubspot: ['apiKey']
    };

    return fieldMap[integrationId] || [];
  }

  /**
   * Test integration connection
   * @param {string} integrationId - Integration ID
   * @returns {Object} Test result
   */
  async testIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);

    try {
      switch (integrationId) {
        case 'whatsapp':
          return await this.testWhatsAppConnection(integration);

        case 'telegram':
          return await this.testTelegramConnection(integration);

        case 'salesforce':
          return await this.testSalesforceConnection(integration);

        case 'hubspot':
          return await this.testHubspotConnection(integration);

        default:
          return { success: false, message: 'Unknown integration type' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test WhatsApp connection
   * @param {Object} integration - WhatsApp integration config
   * @returns {Object} Test result
   */
  async testWhatsAppConnection(integration) {
    try {
      const response = await axios.get(
        `${integration.config.apiUrl}/${integration.config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.config.accessToken}`
          }
        }
      );

      return {
        success: true,
        message: 'WhatsApp connection successful',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: `WhatsApp connection failed: ${error.message}`
      };
    }
  }

  /**
   * Test Telegram connection
   * @param {Object} integration - Telegram integration config
   * @returns {Object} Test result
   */
  async testTelegramConnection(integration) {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${integration.config.botToken}/getMe`
      );

      return {
        success: response.data.ok,
        message: response.data.ok ? 'Telegram connection successful' : 'Telegram connection failed',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: `Telegram connection failed: ${error.message}`
      };
    }
  }

  /**
   * Test Salesforce connection
   * @param {Object} integration - Salesforce integration config
   * @returns {Object} Test result
   */
  async testSalesforceConnection(_integration) {
    // Salesforce OAuth flow would be implemented here
    // For demo, we'll simulate a successful connection
    return {
      success: true,
      message: 'Salesforce connection simulated successfully'
    };
  }

  /**
   * Test HubSpot connection
   * @param {Object} integration - HubSpot integration config
   * @returns {Object} Test result
   */
  async testHubspotConnection(integration) {
    try {
      const response = await axios.get(
        'https://api.hubapi.com/contacts/v1/lists/all/contacts/all',
        {
          headers: {
            'Authorization': `Bearer ${integration.config.apiKey}`
          },
          params: { count: 1 }
        }
      );

      return {
        success: true,
        message: 'HubSpot connection successful',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: `HubSpot connection failed: ${error.message}`
      };
    }
  }

  /**
   * Send message via integration
   * @param {string} integrationId - Integration ID
   * @param {Object} message - Message data
   * @returns {Object} Send result
   */
  async sendMessage(integrationId, message) {
    const integration = this.integrations.get(integrationId);

    if (!integration || integration.status !== 'active') {
      throw new Error(`Integration ${integrationId} not active`);
    }

    try {
      switch (integrationId) {
        case 'whatsapp':
          return await this.sendWhatsAppMessage(integration, message);

        case 'telegram':
          return await this.sendTelegramMessage(integration, message);

        default:
          throw new Error(`Sending not supported for ${integrationId}`);
      }
    } catch (error) {
        logger.error(`[Integrations] Send message error:`, error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   * @param {Object} integration - WhatsApp integration
   * @param {Object} message - Message data
   * @returns {Object} Send result
   */
  async sendWhatsAppMessage(integration, message) {
    const payload = {
      messaging_product: 'whatsapp',
      to: message.to,
      type: 'text',
      text: { body: message.text }
    };

    const response = await axios.post(
      `${integration.config.apiUrl}/${integration.config.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${integration.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      data: response.data
    };
  }

  /**
   * Send Telegram message
   * @param {Object} integration - Telegram integration
   * @param {Object} message - Message data
   * @returns {Object} Send result
   */
  async sendTelegramMessage(integration, message) {
    const response = await axios.post(
      `https://api.telegram.org/bot${integration.config.botToken}/sendMessage`,
      {
        chat_id: message.chatId,
        text: message.text,
        parse_mode: 'HTML'
      }
    );

    return {
      success: response.data.ok,
      messageId: response.data.result?.message_id,
      data: response.data
    };
  }

  /**
   * Sync data with CRM
   * @param {string} integrationId - CRM integration ID
   * @param {Object} data - Data to sync
   * @returns {Object} Sync result
   */
  async syncWithCRM(integrationId, data) {
    const integration = this.integrations.get(integrationId);

    if (!integration || integration.type !== 'crm' || integration.status !== 'active') {
      throw new Error(`CRM integration ${integrationId} not active`);
    }

    try {
      switch (integrationId) {
        case 'salesforce':
          return await this.syncWithSalesforce(integration, data);

        case 'hubspot':
          return await this.syncWithHubspot(integration, data);

        default:
          throw new Error(`CRM sync not supported for ${integrationId}`);
      }
    } catch (error) {
        logger.error(`[Integrations] CRM sync error:`, error);
      throw error;
    }
  }

  /**
   * Sync with Salesforce
   * @param {Object} integration - Salesforce integration
   * @param {Object} data - Contact/lead data
   * @returns {Object} Sync result
   */
  async syncWithSalesforce(_integration, _data) {
    // Salesforce API integration would be implemented here
    // For demo, we'll simulate the sync
    return {
      success: true,
      recordId: `SF_${crypto.randomBytes(8).toString('hex')}`,
      message: 'Contact synced with Salesforce'
    };
  }

  /**
   * Sync with HubSpot
   * @param {Object} integration - HubSpot integration
   * @param {Object} data - Contact data
   * @returns {Object} Sync result
   */
  async syncWithHubspot(integration, data) {
    const contactData = {
      properties: [
        { property: 'firstname', value: data.firstName || '' },
        { property: 'lastname', value: data.lastName || '' },
        { property: 'email', value: data.email || '' },
        { property: 'phone', value: data.phone || '' }
      ]
    };

    const response = await axios.post(
      `https://api.hubapi.com/contacts/v1/contact`,
      contactData,
      {
        headers: {
          'Authorization': `Bearer ${integration.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      recordId: response.data.vid,
      message: 'Contact synced with HubSpot',
      data: response.data
    };
  }

  /**
   * Register webhook for integration
   * @param {string} integrationId - Integration ID
   * @param {string} webhookUrl - Webhook URL
   * @param {Object} config - Webhook configuration
   * @returns {Object} Registration result
   */
  async registerWebhook(integrationId, webhookUrl, config = {}) {
    try {
      switch (integrationId) {
        case 'whatsapp':
          return await this.registerWhatsAppWebhook(integrationId, webhookUrl, config);

        case 'telegram':
          return await this.registerTelegramWebhook(integrationId, webhookUrl, config);

        default:
          // Store webhook for future use
          this.webhooks.set(integrationId, { webhookUrl, config });
          return { success: true, message: 'Webhook registered' };
      }
    } catch (error) {
        logger.error(`[Integrations] Webhook registration error:`, error);
      throw error;
    }
  }

  /**
   * Register WhatsApp webhook
   * @param {string} integrationId - Integration ID
   * @param {string} webhookUrl - Webhook URL
   * @param {Object} config - Configuration
   * @returns {Object} Registration result
   */
  async registerWhatsAppWebhook(integrationId, webhookUrl, config) {

    // WhatsApp webhook registration would be done through their dashboard
    // Here we just store the configuration
    this.webhooks.set(integrationId, {
      webhookUrl,
      config,
      registeredAt: new Date()
    });

    return {
      success: true,
      message: 'WhatsApp webhook configuration stored. Please configure in WhatsApp Business Manager.'
    };
  }

  /**
   * Register Telegram webhook
   * @param {string} integrationId - Integration ID
   * @param {string} webhookUrl - Webhook URL
   * @param {Object} config - Configuration
   * @returns {Object} Registration result
   */
  async registerTelegramWebhook(integrationId, webhookUrl, config) {
    const integration = this.integrations.get(integrationId);

    const response = await axios.post(
      `https://api.telegram.org/bot${integration.config.botToken}/setWebhook`,
      {
        url: webhookUrl,
        max_connections: config.maxConnections || 40,
        allowed_updates: config.allowedUpdates || ['message', 'callback_query']
      }
    );

    if (response.data.ok) {
      this.webhooks.set(integrationId, {
        webhookUrl,
        config,
        registeredAt: new Date()
      });
    }

    return {
      success: response.data.ok,
      message: response.data.ok ? 'Telegram webhook registered' : 'Webhook registration failed',
      data: response.data
    };
  }

  /**
   * Handle incoming webhook
   * @param {string} integrationId - Integration ID
   * @param {Object} payload - Webhook payload
   * @returns {Object} Processing result
   */
  async handleWebhook(integrationId, payload) {
    try {
      switch (integrationId) {
        case 'whatsapp':
          return await this.handleWhatsAppWebhook(payload);

        case 'telegram':
          return await this.handleTelegramWebhook(payload);

        default:
          return { success: false, message: 'Unknown integration' };
      }
    } catch (error) {
      logger.error(`[Integrations] Webhook handling error:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle WhatsApp webhook
   * @param {Object} payload - WhatsApp webhook payload
   * @returns {Object} Processing result
   */
  async handleWhatsAppWebhook(payload) {
    const messages = [];

    if (payload.entry) {
      payload.entry.forEach(entry => {
        if (entry.messaging) {
          entry.messaging.forEach(msg => {
            if (msg.message && msg.message.text) {
              messages.push({
                integration: 'whatsapp',
                from: msg.sender.id,
                to: msg.recipient.id,
                text: msg.message.text.body,
                timestamp: new Date(msg.timestamp),
                messageId: msg.message.id
              });
            }
          });
        }
      });
    }

    return {
      success: true,
      messages,
      count: messages.length
    };
  }

  /**
   * Handle Telegram webhook
   * @param {Object} payload - Telegram webhook payload
   * @returns {Object} Processing result
   */
  async handleTelegramWebhook(payload) {
    const messages = [];

    if (payload.message && payload.message.text) {
      messages.push({
        integration: 'telegram',
        chatId: payload.message.chat.id,
        from: payload.message.from.id,
        text: payload.message.text,
        timestamp: new Date(payload.message.date * 1000),
        messageId: payload.message.message_id
      });
    }

    return {
      success: true,
      messages,
      count: messages.length
    };
  }

  /**
   * Get integration status
   * @param {string} integrationId - Integration ID
   * @returns {Object} Integration status
   */
  getIntegrationStatus(integrationId) {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      return { error: 'Integration not found' };
    }

    return {
      id: integrationId,
      name: integration.name,
      type: integration.type,
      status: integration.status,
      configured: Object.keys(integration.config).length > 0,
      webhook: this.webhooks.has(integrationId)
    };
  }

  /**
   * Get all integrations status
   * @returns {Array} All integrations status
   */
  getAllIntegrationsStatus() {
    const statuses = [];

    for (const [id] of this.integrations) {
      statuses.push(this.getIntegrationStatus(id));
    }

    return statuses;
  }

  /**
   * Remove integration
   * @param {string} integrationId - Integration ID
   * @returns {Object} Removal result
   */
  async removeIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);

    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Clean up webhooks
    this.webhooks.delete(integrationId);

    // Reset integration
    integration.status = 'inactive';
    integration.config = {};

    return {
      success: true,
      message: `${integration.name} integration removed`
    };
  }
}

module.exports = new IntegrationsService();