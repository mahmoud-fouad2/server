import { z } from 'zod';

// --- Widget Configuration Types ---

export const WidgetConfigSchema = z.object({
  welcomeMessage: z.string().default("مرحباً! كيف يمكنني مساعدتك اليوم؟"),
  primaryColor: z.string().default("#003366"),
  personality: z.enum(['friendly', 'formal', 'fun']).default('friendly'),
  showBranding: z.boolean().default(true),
  avatar: z.string().default("robot"),
  customIconUrl: z.string().optional(),
  // Add other known properties here
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

export const PublicWidgetResponseSchema = z.object({
  name: z.string(),
  widgetConfig: WidgetConfigSchema,
  widgetVariant: z.enum(['STANDARD', 'ENHANCED']).default('STANDARD'),
  configVersion: z.number(),
  isDemo: z.boolean().optional(),
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