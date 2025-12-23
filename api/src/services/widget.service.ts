import prisma from '../config/database.js';
import { PublicWidgetResponse, WidgetConfigSchema } from '../shared_local/index.js';

export class WidgetService {
  
  /**
   * Retrieves the public configuration for a widget by Business ID.
   * Handles default values and URL transformation.
   */
  async getPublicConfig(businessId: string): Promise<PublicWidgetResponse> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        widgetConfig: true,
        widgetVariant: true,
        preChatFormEnabled: true,
        crmLeadCollectionEnabled: true,
      }
    });

    if (!business) {
      console.warn(`[WidgetService] Business ${businessId} not found - returning default demo config`);
      return this.getDefaultConfig();
    }

    let parsedConfig: any = {};
    try {
      parsedConfig = business.widgetConfig ? JSON.parse(business.widgetConfig) : {};
    } catch (e) {
      console.error(`Failed to parse widget config for business ${businessId}`, e);
    }

    // Merge with defaults using Zod (safe parsing)
    const safeConfig = WidgetConfigSchema.parse({
      ...parsedConfig
    });

    // Transform URLs
    if (safeConfig.customIconUrl && safeConfig.customIconUrl.startsWith('/uploads/')) {
      const baseUrl = process.env.API_URL || 'https://fahimo-api.onrender.com';
      safeConfig.customIconUrl = `${baseUrl.replace(/\/$/, '')}${safeConfig.customIconUrl}`;
    }

    return {
      name: business.name,
      widgetConfig: safeConfig,
      widgetVariant: business.widgetVariant,
      configVersion: Date.now(),
      isDemo: false, // Real business, not demo
      preChatFormEnabled: business.preChatFormEnabled,
      crmLeadCollectionEnabled: business.crmLeadCollectionEnabled,
    };
  }

  private getDefaultConfig(): PublicWidgetResponse {
    return {
      name: 'Demo Business',
      widgetConfig: WidgetConfigSchema.parse({}), // Uses defaults from Zod
      widgetVariant: 'STANDARD',
      configVersion: Date.now(),
      isDemo: true
    };
  }
}
