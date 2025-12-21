import { h, Component, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import io, { Socket } from 'socket.io-client';

// ========================= TYPES =========================
interface Message {
  id: string;
  content: string;
  senderType: 'USER' | 'BOT' | 'AGENT';
  timestamp: Date;
  isTyping?: boolean;
}

interface WidgetConfig {
  businessId: string;
  primaryColor?: string;
  secondaryColor?: string;
  botName?: string;
  botIcon?: string;
  welcomeMessage?: string;
  position?: 'right' | 'left';
  preChatEnabled?: boolean;
  customIcon?: string;
  accentColor?: string;
  borderRadius?: string;
}

interface VisitorInfo {
  name: string;
  email: string;
  phone?: string;
}

// ========================= ICONS =========================
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
  </svg>
);

// ========================= MODERN WIDGET APP =========================
export default function App({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreChat, setShowPreChat] = useState(config.preChatEnabled !== false);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>({ name: '', email: '', phone: '' });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Extract config values with defaults
  const primaryColor = config.primaryColor || '#0066FF';
  const secondaryColor = config.secondaryColor || '#F8F9FA';
  const accentColor = config.accentColor || '#00D4FF';
  const botName = config.botName || 'مساعد ذكي';
  const welcomeMsg = config.welcomeMessage || 'مرحباً! كيف يمكنني مساعدتك اليوم؟ 👋';
  const position = config.position || 'right';
  const borderRadius = config.borderRadius || '16px';

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize session
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  // Connect socket
  useEffect(() => {
    if (conversationId && !socket) {
      connectSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [conversationId]);

  const initializeSession = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fahimo-api.onrender.com';
      const fingerprint = localStorage.getItem('fahimo_fingerprint') || `fp_${Date.now()}_${Math.random()}`;
      localStorage.setItem('fahimo_fingerprint', fingerprint);

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
      if (data.id || data.sessionId) {
        setSessionId(data.id || data.sessionId);
      }
    } catch (error) {
      console.error('Session init failed:', error);
    }
  };

  const connectSocket = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://fahimo-api.onrender.com';
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (conversationId) {
        newSocket.emit('join-conversation', { conversationId });
      }
    });

    newSocket.on('agent-message', (data: any) => {
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        content: data.content || data.message,
        senderType: 'AGENT',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMsg]);
      setIsTyping(false);
    });

    newSocket.on('bot-message', (data: any) => {
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        content: data.content || data.message,
        senderType: 'BOT',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMsg]);
      setIsTyping(false);
    });

    newSocket.on('agent-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    setSocket(newSocket);
  };

  const handlePreChatSubmit = async (e: Event) => {
    e.preventDefault();
    if (!visitorInfo.name || !visitorInfo.email) return;
    
    setIsLoading(true);
    setShowPreChat(false);

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: welcomeMsg,
      senderType: 'BOT',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: input,
      senderType: 'USER',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input;
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fahimo-api.onrender.com';
      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          content: messageContent,
          conversationId: conversationId,
          visitorId: sessionId,
          visitorName: visitorInfo.name || 'زائر',
          visitorEmail: visitorInfo.email || '',
        }),
      });

      const data = await response.json();
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.reply || data.message) {
        const botMessage: Message = {
          id: `msg_${Date.now()}_bot`,
          content: data.reply || data.message,
          senderType: 'BOT',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Send message failed:', error);
      const errorMsg: Message = {
        id: `msg_${Date.now()}_error`,
        content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        senderType: 'BOT',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (ratingValue: number) => {
    if (!conversationId) return;
    setRating(ratingValue);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fahimo-api.onrender.com';
      await fetch(`${apiUrl}/api/chat/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          rating: ratingValue,
          businessId: config.businessId,
        }),
      });
      setShowRating(false);
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  // ========================= STYLES =========================
  const styles = {
    widgetButton: {
      position: 'fixed' as const,
      bottom: '24px',
      [position]: '24px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
      border: 'none',
      boxShadow: '0 8px 24px rgba(0, 102, 255, 0.3)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      zIndex: 999999,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isOpen ? 'scale(0.9) rotate(90deg)' : 'scale(1) rotate(0deg)',
      opacity: isOpen ? 0 : 1,
      pointerEvents: isOpen ? 'none' : 'auto',
    } as any,

    widgetContainer: {
      position: 'fixed' as const,
      bottom: '24px',
      [position]: '24px',
      width: isMinimized ? '320px' : '400px',
      height: isMinimized ? '80px' : '600px',
      maxHeight: '90vh',
      borderRadius: borderRadius,
      background: 'white',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      zIndex: 999999,
      transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any,

    header: {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
      color: 'white',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '80px',
    },

    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
    },

    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '3px solid rgba(255, 255, 255, 0.3)',
    },

    botInfo: {
      flex: 1,
    },

    botName: {
      fontWeight: '600',
      fontSize: '18px',
      marginBottom: '4px',
    },

    botStatus: {
      fontSize: '13px',
      opacity: 0.9,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },

    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#4ADE80',
      animation: 'pulse 2s infinite',
    },

    headerActions: {
      display: 'flex',
      gap: '8px',
    },

    iconButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '8px',
      padding: '8px',
      cursor: 'pointer',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      ':hover': {
        background: 'rgba(255, 255, 255, 0.3)',
      },
    },

    body: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
      background: '#F8F9FA',
      display: isMinimized ? 'none' : 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },

    messageGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },

    messageBubble: (isUser: boolean) => ({
      maxWidth: '75%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '8px',
      animation: 'slideIn 0.3s ease-out',
    }),

    messageContent: (isUser: boolean) => ({
      background: isUser ? `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` : 'white',
      color: isUser ? 'white' : '#1F2937',
      padding: '12px 16px',
      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      fontSize: '15px',
      lineHeight: '1.5',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      wordBreak: 'break-word' as const,
    }),

    messageAvatar: (isUser: boolean) => ({
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: isUser ? '#E5E7EB' : primaryColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      color: isUser ? '#6B7280' : 'white',
      flexShrink: 0,
    }),

    typingIndicator: {
      display: 'flex',
      gap: '4px',
      padding: '12px 16px',
      background: 'white',
      borderRadius: '16px 16px 16px 4px',
      maxWidth: 'fit-content',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },

    typingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#9CA3AF',
      animation: 'bounce 1.4s infinite',
    },

    footer: {
      padding: '16px',
      background: 'white',
      borderTop: '1px solid #E5E7EB',
      display: isMinimized ? 'none' : 'flex',
      gap: '8px',
      alignItems: 'center',
    },

    inputWrapper: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: secondaryColor,
      borderRadius: '24px',
      padding: '8px 16px',
    },

    input: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontSize: '15px',
      color: '#1F2937',
      fontFamily: 'inherit',
    },

    sendButton: {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'white',
      transition: 'all 0.2s',
      flexShrink: 0,
    },

    preChatForm: {
      padding: '24px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },

    preChatTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1F2937',
      textAlign: 'center' as const,
      marginBottom: '8px',
    },

    preChatSubtitle: {
      fontSize: '14px',
      color: '#6B7280',
      textAlign: 'center' as const,
      marginBottom: '12px',
    },

    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },

    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },

    textInput: {
      padding: '12px 16px',
      border: '2px solid #E5E7EB',
      borderRadius: '12px',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
    },

    submitButton: {
      padding: '14px',
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '8px',
    },

    ratingContainer: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      textAlign: 'center' as const,
    },

    ratingTitle: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#1F2937',
      marginBottom: '16px',
    },

    ratingStars: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
    },

    star: (filled: boolean) => ({
      fontSize: '32px',
      cursor: 'pointer',
      color: filled ? '#FBBF24' : '#D1D5DB',
      transition: 'all 0.2s',
    }),
  };

  // ========================= RENDER =========================
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .fahimo-widget-input:focus {
          border-color: ${primaryColor} !important;
        }

        .fahimo-widget-button:hover {
          transform: scale(1.05) !important;
        }

        .fahimo-widget-send-button:hover {
          transform: scale(1.1) !important;
        }

        .fahimo-widget-icon-button:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>

      {/* Widget Button */}
      <button
        style={styles.widgetButton}
        onClick={() => setIsOpen(true)}
        className="fahimo-widget-button"
        aria-label="Open chat"
      >
        <ChatBubbleIcon />
      </button>

      {/* Widget Container */}
      {isOpen && (
        <div style={styles.widgetContainer}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <div style={styles.avatar}>
                {config.botIcon ? (
                  <img src={config.botIcon} alt={botName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>🤖</span>
                )}
              </div>
              <div style={styles.botInfo}>
                <div style={styles.botName}>{botName}</div>
                <div style={styles.botStatus}>
                  <span style={styles.statusDot}></span>
                  <span>متاح الآن</span>
                </div>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                style={styles.iconButton}
                onClick={() => setIsMinimized(!isMinimized)}
                className="fahimo-widget-icon-button"
                aria-label="Minimize"
              >
                <MinimizeIcon />
              </button>
              <button
                style={styles.iconButton}
                onClick={() => setIsOpen(false)}
                className="fahimo-widget-icon-button"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={styles.body} ref={chatBodyRef}>
            {showPreChat ? (
              <div style={styles.preChatForm}>
                <div style={styles.preChatTitle}>مرحباً بك! 👋</div>
                <div style={styles.preChatSubtitle}>من فضلك عرّفنا بنفسك لنبدأ المحادثة</div>
                <form onSubmit={handlePreChatSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>الاسم *</label>
                    <input
                      type="text"
                      required
                      value={visitorInfo.name}
                      onInput={(e) => setVisitorInfo({ ...visitorInfo, name: (e.target as HTMLInputElement).value })}
                      style={styles.textInput}
                      className="fahimo-widget-input"
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={visitorInfo.email}
                      onInput={(e) => setVisitorInfo({ ...visitorInfo, email: (e.target as HTMLInputElement).value })}
                      style={styles.textInput}
                      className="fahimo-widget-input"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>رقم الهاتف (اختياري)</label>
                    <input
                      type="tel"
                      value={visitorInfo.phone || ''}
                      onInput={(e) => setVisitorInfo({ ...visitorInfo, phone: (e.target as HTMLInputElement).value })}
                      style={styles.textInput}
                      className="fahimo-widget-input"
                      placeholder="+966 5X XXX XXXX"
                    />
                  </div>
                  <button type="submit" style={styles.submitButton} disabled={isLoading}>
                    {isLoading ? 'جاري البدء...' : 'ابدأ المحادثة'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={styles.messageGroup}>
                {messages.map((msg) => (
                  <div key={msg.id} style={styles.messageBubble(msg.senderType === 'USER')}>
                    <div style={styles.messageAvatar(msg.senderType === 'USER')}>
                      {msg.senderType === 'USER' ? visitorInfo.name.charAt(0).toUpperCase() : '🤖'}
                    </div>
                    <div style={styles.messageContent(msg.senderType === 'USER')}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={styles.messageBubble(false)}>
                    <div style={styles.messageAvatar(false)}>🤖</div>
                    <div style={styles.typingIndicator}>
                      <span style={{ ...styles.typingDot, animationDelay: '0s' }}></span>
                      <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}></span>
                      <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                )}
                {showRating && (
                  <div style={styles.ratingContainer}>
                    <div style={styles.ratingTitle}>كيف كانت تجربتك معنا؟</div>
                    <div style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={styles.star(star <= rating)}
                          onClick={() => submitRating(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer */}
          {!showPreChat && (
            <div style={styles.footer}>
              <button style={styles.iconButton} aria-label="Attach file">
                <AttachIcon />
              </button>
              <button style={styles.iconButton} aria-label="Emoji">
                <EmojiIcon />
              </button>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={input}
                  onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="اكتب رسالتك هنا..."
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>
              <button
                style={styles.sendButton}
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="fahimo-widget-send-button"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
