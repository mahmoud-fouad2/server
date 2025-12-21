import { z } from 'zod';

// Team Member Schema
export const AddTeamMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'BUSINESS_OWNER', 'CLIENT', 'EMPLOYEE']), // Match Prisma Role enum
});

export type AddTeamMemberInput = z.infer<typeof AddTeamMemberSchema>;

// Chat Message Schema
export const SendMessageSchema = z.object({
  businessId: z.string().cuid('Invalid business ID'),
  conversationId: z.string().cuid('Invalid conversation ID').optional().nullable(),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  senderType: z.enum(['USER', 'BOT', 'AGENT']).optional().default('USER'),
  visitorId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// Rate Conversation Schema
export const RateConversationSchema = z.object({
  conversationId: z.string().cuid('Invalid conversation ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  businessId: z.string().cuid().optional(),
});

export type RateConversationInput = z.infer<typeof RateConversationSchema>;

// Integration Schemas
export const TelegramIntegrationSchema = z.object({
  botToken: z.string().min(1, 'Bot token is required'),
});

export const WhatsAppIntegrationSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  verifyToken: z.string().min(1, 'Verify token is required'),
});

export type TelegramIntegrationInput = z.infer<typeof TelegramIntegrationSchema>;
export type WhatsAppIntegrationInput = z.infer<typeof WhatsAppIntegrationSchema>;

// Ticket Schema
export const CreateTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
