export interface Service {
  id: string;
  title: string;
  description: string;
  icon: 'bot' | 'calendar' | 'chart' | 'support';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  text: string;
  timestamp: Date;
}

export type ViewState = 'home' | 'wizard' | 'login' | 'support' | 'chat' | 'profile' | 'notifications';

export interface BotConfig {
  name: string;
  industry: string;
  tone: string;
  platforms: string[];
  createdAt: Date;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  isLoggedIn?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}
