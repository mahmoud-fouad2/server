// ==========================================
// Dashboard Type Definitions
// Complete type-safe structure for all Dashboard sections
// ==========================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'CLIENT' | 'ADMIN' | 'EMPLOYEE';
  businessId?: string;
}

export interface Business {
  id: string;
  name: string;
  activityType: string;
  language: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  planType: 'TRIAL' | 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  primaryColor: string;
  botTone: string;
  messageQuota: number;
  messagesUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  todayConversations: number;
  weekConversations: number;
  monthConversations: number;
  averageResponseTime: number;
  knowledgeBaseEntries: number;
  totalVisitors: number;
  uniqueVisitors: number;
  conversionRate: number;
  handoverRequests: number;
  pendingTickets: number;
  teamMembers: number;
  satisfaction: {
    average: number;
    total: number;
    distribution: Record<number, number>;
  };
}

export interface Conversation {
  id: string;
  visitorId: string;
  businessId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'HANDED_OVER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  visitor?: Visitor;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: 'USER' | 'BOT' | 'AGENT';
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt: string;
}

export interface Visitor {
  id: string;
  fingerprint: string;
  name?: string;
  email?: string;
  phone?: string;
  businessId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sessions?: VisitorSession[];
}

export interface VisitorSession {
  id: string;
  visitorId: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  pageViews: number;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

export interface AgentHandoff {
  id: string;
  conversationId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestedAt: string;
  assignedToId?: string;
  assignedAt?: string;
  conversation?: Conversation;
  assignedTo?: User;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  isActive: boolean;
  createdAt: string;
}

export interface Integration {
  id: string;
  type: 'WHATSAPP' | 'TELEGRAM' | 'FACEBOOK' | 'SLACK' | 'API';
  name: string;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  businessId: string;
  title: string;
  content: string;
  tags?: string;
  source: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdById: string;
  assignedToId?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  assignedTo?: User;
  _count?: {
    messages: number;
  };
}

export interface CrmLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  source: string;
  businessId: string;
  assignedToId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  notes?: CrmLeadNote[];
}

export interface CrmLeadNote {
  id: string;
  leadId: string;
  content: string;
  createdById: string;
  createdAt: string;
  createdBy?: User;
}

export interface WidgetConfig {
  primaryColor: string;
  botName: string;
  welcomeMessage: string;
  position: 'bottom-right' | 'bottom-left';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  preChatFormEnabled: boolean;
  preChatFormFields?: string[];
  sounds: {
    enabled: boolean;
    volume: number;
  };
  customCss?: string;
}

export interface Subscription {
  id: string;
  planType: 'TRIAL' | 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  quotas: {
    messages: number;
    messagesUsed: number;
    storage: number;
    storageUsed: number;
    teamMembers: number;
    integrations: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  conversations: number;
  messages: number;
  visitors: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

// Dashboard Tab Types
export type DashboardTab =
  | 'overview'
  | 'conversations'
  | 'live-support'
  | 'visitor-analytics'
  | 'team'
  | 'channels'
  | 'knowledge'
  | 'widget'
  | 'playground'
  | 'tickets'
  | 'crm'
  | 'settings'
  | 'subscription';
