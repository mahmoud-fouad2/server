import { h, Fragment } from 'preact';
import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import io, { Socket } from 'socket.io-client';

const styles = {
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarShell: (theme: any) => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: theme.textOnPrimary,
    border: '2px solid rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  }),
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  botName: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'white',
  },
  botStatus: (theme: any) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: `rgba(${hexToRgb(theme.textOnPrimary)}, 0.9)`,
    fontSize: '13px',
  }),
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    animation: 'fahimoPulse 1.5s infinite',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#F4F6FB',
  },
  preChatForm: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animation: 'fahimoFadeIn 0.3s ease',
  },
  inputLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    color: '#1f2937',
  },
  inputControl: {
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '12px 14px',
    fontSize: '14px',
    outline: 'none',
  },
  primaryButton: (theme: any) => ({
    border: 'none',
    borderRadius: '14px',
    background: `linear-gradient(120deg, ${theme.primary}, ${theme.accent})`,
    color: theme.textOnPrimary,
    padding: '14px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  }),
  errorText: {
    color: '#ef4444',
    fontSize: '13px',
  },
  chatShell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messages: (theme: any, isMobile: boolean) => ({
    flex: 1,
    padding: isMobile ? '12px' : '20px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: `linear-gradient(180deg, ${theme.secondary}, #fff)`,
  }),
  messageRow: (sender: Message['senderType']) => ({
    display: 'flex',
    justifyContent: sender === 'USER' ? 'flex-end' : 'flex-start',
  }),
  messageBubble: (theme: any, sender: Message['senderType']) => ({
    maxWidth: '80%',
    borderRadius: sender === 'USER' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
    padding: '12px 16px',
    background: sender === 'USER' ? theme.primary : '#fff',
    color: sender === 'USER' ? theme.textOnPrimary : '#111827',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }),
  typingBubble: (theme: any) => ({
    display: 'inline-flex',
    background: '#fff',
    borderRadius: '18px',
    padding: '8px 12px',
    gap: '6px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  }),
  typingDot: (delay: number) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#cbd5f5',
    animation: `fahimoPulse 1.4s ease ${delay}ms infinite`,
  }),
  timestamp: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'right' as const,
  },
  ratingCard: {
    margin: '0 20px 12px',
    padding: '14px',
    borderRadius: '16px',
    background: '#fff',
    boxShadow: '0 10px 30px rgba(15,23,42,.08)',
  },
  ratingStars: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },
  ratingStar: (active: boolean) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: active ? '#FACC15' : '#E5E7EB',
    color: active ? '#8B5CF6' : '#4B5563',
    cursor: 'pointer',
    fontSize: '18px',
  }),
  composerShell: (isMobile: boolean) => ({
    padding: isMobile ? '12px 16px' : '16px',
    paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '16px', // Safe area for home indicator
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#fff',
  }),
  brandingFooter: {
    padding: '10px 16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#94a3b8',
    background: '#f9fafb',
  },
  composerActions: {
    display: 'flex',
    gap: '8px',
  },
  subtleButton: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  textInput: {
    flex: 1,
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '12px 14px',
    resize: 'none' as const,
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: (theme: any, disabled: boolean) => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: disabled ? '#CBD5F5' : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    color: disabled ? '#94a3b8' : theme.textOnPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

function getLauncherStyle(theme: any, position: 'left' | 'right', isOpen: boolean) {
  return {
    position: 'fixed',
    bottom: '28px',
    [position]: '28px',
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    color: theme.textOnPrimary,
    border: 'none',
    boxShadow: '0 18px 40px rgba(37, 99, 235, 0.35)',
    cursor: 'pointer',
    display: isOpen ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
  } as const;
}

function getWidgetStyle(theme: any, position: 'left' | 'right', isOpen: boolean, isMinimized: boolean, isMobile: boolean) {
  if (isMobile && isOpen && !isMinimized) {
    return {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      top: '0',
      width: '100%',
      height: '100%',
      maxHeight: '-webkit-fill-available', // Fallback for mobile browsers
      transform: 'translateY(0)',
      opacity: 1,
      pointerEvents: 'auto',
      borderRadius: '0',
      background: '#fff',
      zIndex: 1000000,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      animation: 'fahimoFadeIn 0.2s ease',
    } as const;
  }

  return {
    position: 'fixed',
    bottom: '24px',
    [position]: '24px',
    width: isMinimized ? '320px' : '420px',
    height: isMinimized ? '96px' : '620px',
    transform: isOpen ? 'translateY(0)' : 'translateY(40px)',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    borderRadius: theme.borderRadius,
    background: '#fff',
    boxShadow: '0 40px 120px rgba(15, 23, 42, 0.35)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 1000000,
    overflow: 'hidden',
    animation: isOpen ? 'fahimoSlideUp 0.35s ease' : 'none',
    transition: 'width 0.3s ease, height 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
  } as const;
}

function getHeaderStyle(theme: any, isMobile: boolean) {
  return {
    padding: isMobile ? '12px 16px' : '20px',
    background: `linear-gradient(120deg, ${theme.primary}, ${theme.accent})`,
    color: theme.textOnPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : '20px', // Safe area for notch
  } as const;
}

function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function getReadableTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

function resolveAssetUrl(input?: string, base?: string) {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  if (base) {
    const normalizedBase = base.replace(/\/$/, '');
    const normalizedPath = input.replace(/^\//, '');
    return `${normalizedBase}/${normalizedPath}`;
  }
  return input;
}

function buildFormState(fields: PreChatField[]) {
  return fields.reduce<Record<string, string>>((state, field) => {
    state[field.id] = '';
    return state;
  }, {});
}

interface Message {
  id: string;
  content: string;
  senderType: 'USER' | 'BOT' | 'AGENT';
  timestamp: Date | string;
  isTyping?: boolean;
}

interface VisitorInfo {
  name: string;
  email: string;
  phone: string;
}

interface AppProps {
  phone?: string;
}

interface PreChatField {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'phone' | 'number';
  required?: boolean;
  placeholder?: string;
}

interface WidgetConfig {
  businessId: string;
  widgetName?: string;
  welcomeMessage?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  borderRadius?: string;
  position?: 'left' | 'right';
  personality?: 'friendly' | 'formal' | 'fun';
  botName?: string;
  botIcon?: string;
  avatar?: string;
  avatarUrl?: string;
  customIconUrl?: string;
  customLauncherIcon?: string;
  notificationSound?: string;
  notificationSoundEnabled?: boolean;
  ratingEnabled?: boolean;
  preChatEnabled?: boolean;
  preChatDescription?: string;
  preChatFields?: PreChatField[];
  autoOpenDelay?: number;
  showBranding?: boolean;
  accentText?: string;
  secondaryText?: string;
}

interface AppProps {
  config: WidgetConfig;
  businessName?: string;
  assetBaseUrl?: string;
  apiBaseUrl?: string;
  isDemo?: boolean;
  preChatFormEnabled?: boolean;
}

const DEFAULT_PRECHAT_FIELDS: PreChatField[] = [
  { id: 'name', label: 'ما اسمك؟', type: 'text', required: true, placeholder: 'أدخل اسمك' },
  { id: 'email', label: 'بريدك الإلكتروني', type: 'email', required: true, placeholder: 'example@email.com' },
  { id: 'phone', label: 'رقم الجوال (اختياري)', type: 'phone', required: false, placeholder: '+9665XXXXXXX' },
];

const DEFAULT_SOUND_PATH = '/sounds/notify.mp3';
const API_SOUND_FALLBACK = 'https://fahimo-api.onrender.com/sounds/notify.mp3';

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

const AttachIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const EmojiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </svg>
);

function formatTimestamp(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function ensureGlobalStyles() {
  if (typeof document === 'undefined') return;
  const styleId = 'fahimo-widget-global';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes fahimoPulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1); } 100% { opacity: 0.5; transform: scale(0.9); } }
    @keyframes fahimoSlideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fahimoFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default function App({ config, businessName, assetBaseUrl, apiBaseUrl, preChatFormEnabled }: AppProps) {
  ensureGlobalStyles();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const computedPreChatEnabled = typeof preChatFormEnabled === 'boolean'
    ? preChatFormEnabled
    : config.preChatEnabled !== false;

  const preChatFields = useMemo(() => {
    return (config.preChatFields && config.preChatFields.length > 0)
      ? config.preChatFields
      : DEFAULT_PRECHAT_FIELDS;
  }, [config.preChatFields]);

  const theme = useMemo(() => {
    const primary = config.primaryColor || '#0066FF';
    const accent = config.accentColor || '#00D4FF';
    const secondary = config.secondaryColor || '#F8F9FA';
    const borderRadius = config.borderRadius || '20px';
    const textOnPrimary = getReadableTextColor(primary);
    return { primary, accent, secondary, borderRadius, textOnPrimary };
  }, [config.primaryColor, config.accentColor, config.secondaryColor, config.borderRadius]);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>({ name: '', email: '', phone: '' });
  const requirePreChat = computedPreChatEnabled;
  const [preChatCompleted, setPreChatCompleted] = useState(!requirePreChat);
  const [showPreChat, setShowPreChat] = useState(requirePreChat);
  const [preChatError, setPreChatError] = useState<string | null>(null);
  const [preChatData, setPreChatData] = useState<Record<string, string>>(() => buildFormState(preChatFields));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
      if (typeof window === 'undefined') return;
      try {
        const storedVisitorId = localStorage.getItem(`fahimo-visitor-id-${config.businessId}`);
        if (storedVisitorId) {
          setVisitorId(storedVisitorId);
        }
      } catch (error) {
        // Ignore storage access issues
      }
    }, [config.businessId]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastMessageCountRef = useRef(0);
  const welcomeInjectedRef = useRef(false);

  const widgetName = config.widgetName || config.botName || businessName || 'مساعد فهملي';
  const welcomeMessage = config.welcomeMessage || 'مرحباً! كيف يمكنني مساعدتك اليوم؟ 👋';
  const avatarUrl = resolveAssetUrl(config.botIcon || config.avatarUrl || config.customIconUrl, assetBaseUrl);
  const launcherIcon = resolveAssetUrl(config.customLauncherIcon || config.customIconUrl || config.botIcon, assetBaseUrl);
  const notificationSoundSrc =
    resolveAssetUrl(config.notificationSound, assetBaseUrl) ||
    resolveAssetUrl(DEFAULT_SOUND_PATH, assetBaseUrl) ||
    (apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}${DEFAULT_SOUND_PATH}` : undefined) ||
    API_SOUND_FALLBACK;
  const notificationsAllowed = config.notificationSoundEnabled !== false;
  const position = config.position || 'right';
  const ratingEnabled = config.ratingEnabled !== false;
  const showBranding = config.showBranding !== false;

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreChatData(buildFormState(preChatFields));
  }, [preChatFields]);

  useEffect(() => {
    if (!requirePreChat) {
      setPreChatCompleted(true);
      setShowPreChat(false);
    } else if (!preChatCompleted) {
      setShowPreChat(true);
    }
  }, [requirePreChat, preChatCompleted]);

  useEffect(() => {
    if (typeof config.autoOpenDelay === 'number') {
      const timer = window.setTimeout(() => setIsOpen(true), Math.max(config.autoOpenDelay, 0));
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [config.autoOpenDelay]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!conversationId) return;

    const apiUrl = getApiUrl();
    const socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-conversation', { conversationId });
    });

    socket.on('agent-message', (payload: any) => {
      appendIncomingMessage(payload, 'AGENT');
    });

    socket.on('bot-message', (payload: any) => {
      appendIncomingMessage(payload, 'BOT');
    });

    socket.on('agent-typing', () => {
      setIsTyping(true);
      window.setTimeout(() => setIsTyping(false), 2500);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!showPreChat && messages.length === 0 && welcomeMessage && !welcomeInjectedRef.current) {
      setMessages([createSystemMessage(welcomeMessage)]);
      welcomeInjectedRef.current = true;
    }
  }, [showPreChat, welcomeMessage, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!notificationsAllowed) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(notificationSoundSrc);
    audio.preload = 'auto';
    audio.volume = 0.85;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [notificationSoundSrc, notificationsAllowed]);

  useEffect(() => {
    if (!notificationsAllowed) return;
    if (messages.length <= lastMessageCountRef.current) return;

    const latest = messages[messages.length - 1];
    lastMessageCountRef.current = messages.length;

    if (latest && latest.senderType !== 'USER') {
      audioRef.current?.play().catch(() => {
        /* Autoplay might be blocked; ignore */
      });
    }
  }, [messages, notificationsAllowed]);

  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    // Optimistic UI update (optional, or just show loading)
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', config.businessId);
      if (conversationId) formData.append('conversationId', conversationId);

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const fileUrl = data.url || data.fileUrl;

      // Send the file URL as a message
      const content = `[ملف مرفق](${fileUrl})`;
      const outgoing: Message = {
        id: `msg_${Date.now()}`,
        content,
        senderType: 'USER',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, outgoing]);
      
      // Also send to backend as a message
      await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          content,
          conversationId,
          visitorId,
          visitorSessionId: sessionId,
          visitorName: visitorInfo.name || 'زائر',
        }),
      });

    } catch (error) {
      console.error('File upload error:', error);
      alert('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreChatChange = (fieldId: string, value: string) => {
    setPreChatError(null);
    setPreChatData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handlePreChatSubmit = async (event: Event) => {
    event.preventDefault();
    for (const field of preChatFields) {
      if (field.required && !preChatData[field.id]?.trim()) {
        setPreChatError('يرجى تعبئة جميع الحقول المطلوبة.');
        return;
      }
    }

    setVisitorInfo({
      name: preChatData.name || 'زائر',
      email: preChatData.email || '',
      phone: preChatData.phone || '',
    });

    setPreChatCompleted(true);
    setShowPreChat(false);
    setPreChatError(null);

    if (!welcomeInjectedRef.current) {
      setMessages([createSystemMessage(welcomeMessage)]);
      welcomeInjectedRef.current = true;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    const outgoing: Message = {
      id: `msg_${Date.now()}`,
      content,
      senderType: 'USER',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, outgoing]);
    setInput('');
    setIsLoading(true);

    const cleanPreChatData = Object.entries(preChatData).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim().length) {
        acc[key] = value.trim();
      }
      return acc;
    }, {});

    let resolvedVisitorId = visitorId;
    if (!resolvedVisitorId && typeof window !== 'undefined') {
      try {
        resolvedVisitorId = localStorage.getItem(`fahimo-visitor-id-${config.businessId}`);
      } catch (error) {
        resolvedVisitorId = null;
      }
    }

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          content,
          conversationId,
          visitorId: resolvedVisitorId || undefined,
          visitorSessionId: sessionId || undefined,
          visitorName: visitorInfo.name || 'زائر',
          visitorEmail: visitorInfo.email || '',
          preChatData: Object.keys(cleanPreChatData).length ? cleanPreChatData : undefined,
        }),
      });

      const data = await response.json();
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.reply || data.message) {
        appendIncomingMessage({ content: data.reply || data.message }, 'BOT');
      }
    } catch (error) {
      console.error('Send message failed:', error);
      appendIncomingMessage({ content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' }, 'BOT');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (value: number) => {
    if (!conversationId || !ratingEnabled) return;

    setRatingValue(value);
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/chat/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          rating: value,
          businessId: config.businessId,
        }),
      });
      setRatingSubmitted(true);
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  function appendIncomingMessage(payload: any, senderType: Message['senderType']) {
    const message: Message = {
      id: `msg_${Date.now()}`,
      content: payload.content || payload.message || '',
      senderType,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    setIsTyping(false);
  }

  async function initializeSession() {
    try {
      const apiUrl = getApiUrl();
      const fingerprintKey = `fahimo_fingerprint_${config.businessId}`;
      const fingerprint = localStorage.getItem(fingerprintKey) || `fp_${Date.now()}_${Math.random()}`;
      localStorage.setItem(fingerprintKey, fingerprint);

      const response = await fetch(`${apiUrl}/api/visitor/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          fingerprint,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();
      const nextSessionId = data.id || data.sessionId;
      if (nextSessionId) {
        setSessionId(nextSessionId);
      }

      const derivedVisitorId = data?.data?.visitor?.id || data.visitorId;
      if (derivedVisitorId) {
        setVisitorId(derivedVisitorId);
        try {
          localStorage.setItem(`fahimo-visitor-id-${config.businessId}`, derivedVisitorId);
        } catch (error) {
          // ignore storage write issues
        }
      }
    } catch (error) {
      console.error('Session init failed:', error);
    }
  }

  function getApiUrl() {
    return (window as any).__FAHIMO_API_URL || import.meta.env.VITE_API_URL || 'https://fahimo-api.onrender.com';
  }

  function createSystemMessage(content: string): Message {
    return {
      id: `sys_${Date.now()}`,
      content,
      senderType: 'BOT',
      timestamp: new Date(),
    };
  }

  function handleComposerKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const shouldShowRating = ratingEnabled && conversationId && !ratingSubmitted;

  return (
    <Fragment>
      <button
        type="button"
        style={getLauncherStyle(theme, position, isOpen)}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        aria-label="فتح المحادثة"
      >
        {launcherIcon ? (
          <img src={launcherIcon} alt={widgetName} style={{ width: '60%', height: '60%' }} />
        ) : (
          <ChatBubbleIcon />
        )}
      </button>

      <section
        style={getWidgetStyle(theme, position, isOpen, isMinimized, isMobile)}
        aria-live="polite"
        aria-label="محادثة الدعم"
      >
        <header style={getHeaderStyle(theme, isMobile)}>
          <div style={styles.headerContent}>
            <div style={styles.avatarShell(theme)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={widgetName} style={styles.avatarImage} />
              ) : (
                <span>{widgetName?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <div style={styles.botName}>{widgetName}</div>
              <div style={styles.botStatus(theme)}>
                <span style={styles.statusDot}></span>
                {config.tagline || 'متاح للرد خلال لحظات'}
              </div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button type="button" style={styles.iconButton} onClick={() => setIsMinimized(prev => !prev)}>
              <MinimizeIcon />
            </button>
            <button
              type="button"
              style={styles.iconButton}
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div style={styles.body}>
          {showPreChat ? (
            <form style={styles.preChatForm} onSubmit={handlePreChatSubmit as any}>
              <h3>لنبدأ التعارف</h3>
              <p>{config.preChatDescription || 'شاركنا بيانات بسيطة لنستطيع خدمتك بشكل أفضل.'}</p>
              {preChatFields.map(field => (
                <label key={field.id} style={styles.inputLabel}>
                  <span>
                    {field.label}
                    {field.required && <span style={{ color: '#F87171', marginRight: '4px' }}>*</span>}
                  </span>
                  <input
                    type={field.type === 'phone' ? 'tel' : field.type || 'text'}
                    style={styles.inputControl}
                    value={preChatData[field.id] || ''}
                    placeholder={field.placeholder}
                    onInput={(event: any) => handlePreChatChange(field.id, event.currentTarget.value)}
                  />
                </label>
              ))}

              {preChatError && <div style={styles.errorText}>{preChatError}</div>}

              <button type="submit" style={styles.primaryButton(theme)}>
                ابدأ المحادثة
              </button>
            </form>
          ) : (
            <div style={styles.chatShell}>
              <div style={styles.messages(theme, isMobile)}>
                {messages.map(message => (
                  <div key={message.id} style={styles.messageRow(message.senderType)}>
                    <div style={styles.messageBubble(theme, message.senderType)}>
                      <div>{message.content}</div>
                      <span style={styles.timestamp}>{formatTimestamp(message.timestamp)}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div style={styles.messageRow('BOT')}>
                    <div style={styles.typingBubble(theme)}>
                      {[0, 120, 240].map(delay => (
                        <span key={delay} style={styles.typingDot(delay)}></span>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}></div>
              </div>

              {shouldShowRating && (
                <div style={styles.ratingCard}>
                  <p>كيف تقيم تجربتك معنا؟</p>
                  <div style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        type="button"
                        key={value}
                        style={styles.ratingStar(value <= (ratingValue || 0))}
                        onClick={() => submitRating(value)}
                        aria-label={`تقييم ${value} نجوم`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.composerShell(isMobile)}>
                <div style={styles.composerActions}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button 
                    type="button" 
                    style={styles.subtleButton} 
                    aria-label="إرفاق ملف" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <AttachIcon />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      style={styles.subtleButton} 
                      aria-label="إرسال إيموجي"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    >
                      <EmojiIcon />
                    </button>
                    {isEmojiPickerOpen && (
                      <div style={{
                        position: 'absolute',
                        bottom: '45px',
                        left: '0',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '8px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        width: '180px'
                      }}>
                        {['😊', '👍', '❤️', '🎉', '🙏', '✅', '🤔', '😂', '🔥', '💯', '👋', '😢', '😡', '👀', '✨'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '20px',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                            }}
                            onClick={() => {
                              setInput(prev => prev + emoji);
                              setIsEmojiPickerOpen(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  style={styles.textInput}
                  rows={1}
                  value={input}
                  placeholder="اكتب رسالتك هنا"
                  onInput={(event: any) => setInput(event.currentTarget.value)}
                  onKeyDown={handleComposerKeyDown as any}
                />
                <button
                  type="button"
                  style={styles.sendButton(theme, isLoading || !input.trim())}
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  aria-label="إرسال الرسالة"
                >
                  <SendIcon />
                </button>
              </div>
              {showBranding && (
                <div style={styles.brandingFooter}>
                  <a
                    href="https://faheemly.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: theme.primary, fontWeight: 600, textDecoration: 'none' }}
                  >
                    Powered by Faheemly.com
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Fragment>
  );
}
