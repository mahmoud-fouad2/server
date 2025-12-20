export interface WidgetConfig {
  welcomeMessage: string;
  primaryColor: string;
  personality: 'friendly' | 'formal' | 'fun';
  showBranding: boolean;
  avatar: string;
  customIconUrl?: string | null;
}

export interface PublicWidgetConfigResponse {
  name: string;
  businessId: string;
  widgetConfig: WidgetConfig;
  preChatFormEnabled: boolean;
  widgetVariant: 'standard' | 'enhanced';
  configVersion: number;
  servedAt: number;
  source: 'database' | 'default';
  isDemo?: boolean;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
  primaryColor: "#003366",
  personality: "friendly",
  showBranding: true,
  avatar: "robot"
};
