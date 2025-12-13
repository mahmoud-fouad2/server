/**
 * Integration Dashboard Service
 * Provides visual admin panel with integration icons and configuration
 */
class IntegrationDashboardService {
  constructor() {
    this.dashboardConfig = {
      layout: 'grid',
      theme: 'light',
      refreshInterval: 30000, // 30 seconds
      maxItemsPerRow: 4
    };

    this.integrationIcons = {
      whatsapp: {
        icon: '📱',
        color: '#25D366',
        category: 'messaging'
      },
      telegram: {
        icon: '✈️',
        color: '#0088CC',
        category: 'messaging'
      },
      salesforce: {
        icon: '☁️',
        color: '#00A1E0',
        category: 'crm'
      },
      hubspot: {
        icon: '🎯',
        color: '#FF7A59',
        category: 'crm'
      },
      api: {
        icon: '🔗',
        color: '#6B46C1',
        category: 'api'
      },
      webhook: {
        icon: '🪝',
        color: '#10B981',
        category: 'webhook'
      }
    };

    this.dashboardStats = new Map();
    this.userPermissions = new Map();
  }

  /**
   * Generate dashboard layout
   * @param {string} businessId - Business ID
   * @returns {Object} Dashboard layout
   */
  async generateDashboard(businessId) {
    const integrations = await this.getBusinessIntegrations(businessId);
    const stats = await this.getDashboardStats(businessId);
    const permissions = this.getUserPermissions(businessId);

    return {
      layout: this.dashboardConfig.layout,
      theme: this.dashboardConfig.theme,
      sections: [
        this.generateOverviewSection(stats),
        this.generateIntegrationsSection(integrations, permissions),
        this.generateActivitySection(stats),
        this.generateAlertsSection(integrations)
      ],
      refreshInterval: this.dashboardConfig.refreshInterval
    };
  }

  /**
   * Generate overview section
   * @param {Object} stats - Dashboard statistics
   * @returns {Object} Overview section
   */
  generateOverviewSection(stats) {
    return {
      id: 'overview',
      title: 'نظرة عامة',
      type: 'metrics',
      cards: [
        {
          id: 'active_integrations',
          title: 'التكاملات النشطة',
          value: stats.activeIntegrations || 0,
          icon: '🔗',
          color: '#10B981',
          trend: stats.integrationTrend || 0
        },
        {
          id: 'messages_today',
          title: 'الرسائل اليوم',
          value: stats.messagesToday || 0,
          icon: '💬',
          color: '#3B82F6',
          trend: stats.messageTrend || 0
        },
        {
          id: 'success_rate',
          title: 'معدل النجاح',
          value: `${stats.successRate || 0}%`,
          icon: '✅',
          color: '#F59E0B',
          trend: stats.successTrend || 0
        },
        {
          id: 'alerts',
          title: 'التنبيهات',
          value: stats.alerts || 0,
          icon: '🚨',
          color: '#EF4444',
          trend: stats.alertTrend || 0
        }
      ]
    };
  }

  /**
   * Generate integrations section
   * @param {Array} integrations - Business integrations
   * @param {Object} permissions - User permissions
   * @returns {Object} Integrations section
   */
  generateIntegrationsSection(integrations, permissions) {
    const categories = this.groupIntegrationsByCategory(integrations);

    return {
      id: 'integrations',
      title: 'التكاملات',
      type: 'grid',
      categories: Object.entries(categories).map(([category, items]) => ({
        name: category,
        title: this.getCategoryTitle(category),
        items: items.map(integration => this.formatIntegrationCard(integration, permissions))
      }))
    };
  }

  /**
   * Group integrations by category
   * @param {Array} integrations - Integrations list
   * @returns {Object} Grouped integrations
   */
  groupIntegrationsByCategory(integrations) {
    const categories = {};

    integrations.forEach(integration => {
      const category = this.integrationIcons[integration.id]?.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(integration);
    });

    return categories;
  }

  /**
   * Get category title in Arabic
   * @param {string} category - Category name
   * @returns {string} Arabic title
   */
  getCategoryTitle(category) {
    const titles = {
      messaging: 'المراسلة',
      crm: 'إدارة علاقات العملاء',
      api: 'واجهات برمجة التطبيقات',
      webhook: 'الخطافات',
      other: 'أخرى'
    };

    return titles[category] || category;
  }

  /**
   * Format integration card
   * @param {Object} integration - Integration data
   * @param {Object} permissions - User permissions
   * @returns {Object} Formatted card
   */
  formatIntegrationCard(integration, permissions) {
    const icon = this.integrationIcons[integration.id] || { icon: '🔧', color: '#6B7280' };

    return {
      id: integration.id,
      name: integration.name,
      icon: icon.icon,
      color: icon.color,
      status: integration.status,
      statusText: this.getStatusText(integration.status),
      statusColor: this.getStatusColor(integration.status),
      description: integration.description || '',
      actions: this.getIntegrationActions(integration, permissions),
      metrics: integration.metrics || {},
      lastActivity: integration.lastActivity,
      configuration: permissions.canConfigure ? {
        endpoint: `/api/integrations/${integration.id}/configure`,
        method: 'POST'
      } : null
    };
  }

  /**
   * Get status text in Arabic
   * @param {string} status - Status code
   * @returns {string} Arabic status text
   */
  getStatusText(status) {
    const statusTexts = {
      active: 'نشط',
      inactive: 'غير نشط',
      configured: 'مُعد',
      error: 'خطأ',
      pending: 'في الانتظار'
    };

    return statusTexts[status] || status;
  }

  /**
   * Get status color
   * @param {string} status - Status code
   * @returns {string} Color code
   */
  getStatusColor(status) {
    const statusColors = {
      active: '#10B981',
      inactive: '#6B7280',
      configured: '#3B82F6',
      error: '#EF4444',
      pending: '#F59E0B'
    };

    return statusColors[status] || '#6B7280';
  }

  /**
   * Get integration actions based on permissions
   * @param {Object} integration - Integration data
   * @param {Object} permissions - User permissions
   * @returns {Array} Available actions
   */
  getIntegrationActions(integration, permissions) {
    const actions = [];

    if (permissions.canView) {
      actions.push({
        id: 'view',
        label: 'عرض',
        icon: '👁️',
        endpoint: `/api/integrations/${integration.id}`,
        method: 'GET'
      });
    }

    if (permissions.canTest && integration.status !== 'inactive') {
      actions.push({
        id: 'test',
        label: 'اختبار',
        icon: '🧪',
        endpoint: `/api/integrations/${integration.id}/test`,
        method: 'POST'
      });
    }

    if (permissions.canConfigure) {
      actions.push({
        id: 'configure',
        label: 'إعداد',
        icon: '⚙️',
        endpoint: `/api/integrations/${integration.id}/configure`,
        method: 'POST'
      });
    }

    if (permissions.canDelete && integration.status === 'inactive') {
      actions.push({
        id: 'delete',
        label: 'حذف',
        icon: '🗑️',
        endpoint: `/api/integrations/${integration.id}`,
        method: 'DELETE',
        confirm: true
      });
    }

    return actions;
  }

  /**
   * Generate activity section
   * @param {Object} stats - Dashboard statistics
   * @returns {Object} Activity section
   */
  generateActivitySection(stats) {
    return {
      id: 'activity',
      title: 'النشاط الأخير',
      type: 'timeline',
      items: stats.recentActivity || [],
      maxItems: 10
    };
  }

  /**
   * Generate alerts section
   * @param {Array} integrations - Business integrations
   * @returns {Object} Alerts section
   */
  generateAlertsSection(integrations) {
    const alerts = [];

    integrations.forEach(integration => {
      if (integration.status === 'error') {
        alerts.push({
          id: `error_${integration.id}`,
          type: 'error',
          title: `خطأ في ${integration.name}`,
          message: 'فشل في الاتصال بالتكامل',
          action: {
            label: 'إصلاح',
            endpoint: `/api/integrations/${integration.id}/configure`
          },
          timestamp: new Date()
        });
      }

      if (integration.status === 'pending') {
        alerts.push({
          id: `pending_${integration.id}`,
          type: 'warning',
          title: `${integration.name} في انتظار التفعيل`,
          message: 'التكامل يحتاج إلى تفعيل',
          action: {
            label: 'تفعيل',
            endpoint: `/api/integrations/${integration.id}/activate`
          },
          timestamp: new Date()
        });
      }
    });

    return {
      id: 'alerts',
      title: 'التنبيهات',
      type: 'alerts',
      items: alerts,
      count: alerts.length
    };
  }

  /**
   * Get business integrations (mock implementation)
   * @param {string} businessId - Business ID
   * @returns {Array} Integrations list
   */
  async getBusinessIntegrations(_businessId) {
    // In a real implementation, this would fetch from database
    return [
      {
        id: 'whatsapp',
        name: 'WhatsApp Business',
        status: 'active',
        description: 'إرسال واستقبال رسائل WhatsApp',
        metrics: { messagesSent: 150, messagesReceived: 120 },
        lastActivity: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: 'telegram',
        name: 'Telegram Bot',
        status: 'configured',
        description: 'بوت Telegram للدردشة',
        metrics: { messagesSent: 89, messagesReceived: 95 },
        lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        id: 'salesforce',
        name: 'Salesforce CRM',
        status: 'inactive',
        description: 'مزامنة بيانات العملاء',
        metrics: {},
        lastActivity: null
      },
      {
        id: 'hubspot',
        name: 'HubSpot CRM',
        status: 'error',
        description: 'إدارة علاقات العملاء',
        metrics: { syncErrors: 3 },
        lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ];
  }

  /**
   * Get dashboard statistics (mock implementation)
   * @param {string} businessId - Business ID
   * @returns {Object} Dashboard stats
   */
  async getDashboardStats(_businessId) {
    // In a real implementation, this would calculate from database
    return {
      activeIntegrations: 2,
      messagesToday: 245,
      successRate: 94.5,
      alerts: 2,
      integrationTrend: 12.5,
      messageTrend: 8.3,
      successTrend: 2.1,
      alertTrend: -15.2,
      recentActivity: [
        {
          id: 'activity_1',
          type: 'message',
          title: 'رسالة WhatsApp جديدة',
          description: 'تم استقبال رسالة من عميل',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          icon: '💬'
        },
        {
          id: 'activity_2',
          type: 'integration',
          title: 'تم تفعيل Telegram',
          description: 'نجح تفعيل تكامل Telegram Bot',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          icon: '✅'
        },
        {
          id: 'activity_3',
          type: 'error',
          title: 'خطأ في HubSpot',
          description: 'فشل في مزامنة البيانات',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          icon: '❌'
        }
      ]
    };
  }

  /**
   * Get user permissions
   * @param {string} businessId - Business ID
   * @returns {Object} User permissions
   */
  getUserPermissions(_businessId) {
    // In a real implementation, this would check user roles
    return {
      canView: true,
      canConfigure: true,
      canTest: true,
      canDelete: true,
      canCreate: true
    };
  }

  /**
   * Update dashboard configuration
   * @param {Object} config - New configuration
   * @returns {Object} Update result
   */
  updateDashboardConfig(config) {
    this.dashboardConfig = { ...this.dashboardConfig, ...config };
    return {
      success: true,
      config: this.dashboardConfig
    };
  }

  /**
   * Add custom integration to dashboard
   * @param {Object} integration - Custom integration
   * @returns {Object} Add result
   */
  addCustomIntegration(integration) {
    if (!integration.id || !integration.name) {
      throw new Error('Integration must have id and name');
    }

    this.integrationIcons[integration.id] = {
      icon: integration.icon || '🔧',
      color: integration.color || '#6B7280',
      category: integration.category || 'api'
    };

    return {
      success: true,
      integration: integration
    };
  }

  /**
   * Generate dashboard export
   * @param {string} businessId - Business ID
   * @param {string} format - Export format (json, pdf, csv)
   * @returns {Object} Export data
   */
  async exportDashboard(businessId, format = 'json') {
    const dashboard = await this.generateDashboard(businessId);

    switch (format) {
      case 'json':
        return {
          format: 'json',
          data: dashboard,
          timestamp: new Date()
        };

      case 'csv':
        return {
          format: 'csv',
          data: this.convertDashboardToCSV(dashboard),
          timestamp: new Date()
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert dashboard to CSV
   * @param {Object} dashboard - Dashboard data
   * @returns {string} CSV string
   */
  convertDashboardToCSV(dashboard) {
    let csv = 'Section,Title,Value,Status\n';

    // Overview metrics
    const overview = dashboard.sections.find(s => s.id === 'overview');
    if (overview) {
      overview.cards.forEach(card => {
        csv += `Overview,${card.title},${card.value},\n`;
      });
    }

    // Integrations
    const integrations = dashboard.sections.find(s => s.id === 'integrations');
    if (integrations) {
      integrations.categories.forEach(category => {
        category.items.forEach(item => {
          csv += `Integration,${item.name},,${item.statusText}\n`;
        });
      });
    }

    return csv;
  }

  /**
   * Get dashboard themes
   * @returns {Array} Available themes
   */
  getAvailableThemes() {
    return [
      {
        id: 'light',
        name: 'فاتح',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          background: '#FFFFFF',
          surface: '#F9FAFB'
        }
      },
      {
        id: 'dark',
        name: 'داكن',
        colors: {
          primary: '#60A5FA',
          secondary: '#9CA3AF',
          background: '#111827',
          surface: '#1F2937'
        }
      },
      {
        id: 'blue',
        name: 'أزرق',
        colors: {
          primary: '#2563EB',
          secondary: '#64748B',
          background: '#EFF6FF',
          surface: '#DBEAFE'
        }
      }
    ];
  }

  /**
   * Validate dashboard configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateDashboardConfig(config) {
    const errors = [];

    if (config.layout && !['grid', 'list', 'cards'].includes(config.layout)) {
      errors.push('Invalid layout. Must be grid, list, or cards');
    }

    if (config.theme && !this.getAvailableThemes().find(t => t.id === config.theme)) {
      errors.push('Invalid theme');
    }

    if (config.refreshInterval && (config.refreshInterval < 5000 || config.refreshInterval > 300000)) {
      errors.push('Refresh interval must be between 5000ms and 300000ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new IntegrationDashboardService();