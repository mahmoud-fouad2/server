import { z } from 'zod';

// --- Widget Configuration Types ---

export const PreChatFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'phone', 'number']).default('text'),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
});

export const WidgetConfigSchema = z.object({
  widgetName: z.string().optional(),
  welcomeMessage: z.string().default("مرحباً! كيف يمكنني مساعدتك اليوم؟"),
  primaryColor: z.string().default("#0066FF"),
  secondaryColor: z.string().default("#F8F9FA"),
  accentColor: z.string().default("#00D4FF"),
  personality: z.enum(['friendly', 'formal', 'fun']).default('friendly'),
  showBranding: z.boolean().default(true),
  avatar: z.string().default("robot"),
  avatarUrl: z.string().optional(),
  customIconUrl: z.string().optional(),
  customLauncherIcon: z.string().optional(),
  botName: z.string().optional(),
  botIcon: z.string().optional(),
  borderRadius: z.string().default('18px'),
  position: z.enum(['left', 'right']).default('right'),
  preChatEnabled: z.boolean().default(true),
  preChatDescription: z.string().optional(),
  preChatFields: z.array(PreChatFieldSchema).optional(),
  notificationSound: z.string().optional(),
  notificationSoundEnabled: z.boolean().default(true),
  ratingEnabled: z.boolean().default(true),
  autoOpenDelay: z.number().optional(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type PreChatField = z.infer<typeof PreChatFieldSchema>;

export const PublicWidgetResponseSchema = z.object({
  name: z.string(),
  widgetConfig: WidgetConfigSchema,
  widgetVariant: z.enum(['STANDARD', 'ENHANCED']).default('STANDARD'),
  configVersion: z.number(),
  isDemo: z.boolean().optional(),
  preChatFormEnabled: z.boolean().optional(),
  crmLeadCollectionEnabled: z.boolean().optional(),
});

export type PublicWidgetResponse = z.infer<typeof PublicWidgetResponseSchema>;

// --- API Response Wrappers ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

// --- Socket Types ---

export interface SocketMessage {
  businessId: string;
  content: string;
  senderType: 'user' | 'agent' | 'system';
  visitorId?: string;
  conversationId?: string;
}

// Export validation schemas from validation.dto.ts
export * from './validation.dto.js';