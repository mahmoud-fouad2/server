import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { io, Socket } from 'socket.io-client';

// --- Icons ---
const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const AttachmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const StarIcon = ({ filled, onClick }: { filled: boolean; onClick?: () => void }) => (
  <svg 
    onClick={onClick}
    width="24" height="24" viewBox="0 0 24 24" 
    fill={filled ? "#FFD700" : "none"} 
    stroke={filled ? "#FFD700" : "#CBD5E1"} 
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    className={`fahimo-star ${filled ? 'selected' : ''}`}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

// --- Types ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
}

interface WidgetConfig {
  businessId: string;
  primaryColor?: string;
  botName?: string;
  botIcon?: string;
  welcomeMessage?: string;
  requireEmail?: boolean;
}

interface VisitorInfo {
  name: string;
  email: string;
  phone: string;
}

export default function App() {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({ businessId: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>({ name: '', email: '', phone: '' });
  const [showPreChat, setShowPreChat] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const storageKey = `fahimo_chat_${config.businessId}`;

  // Initialization
  useEffect(() => {
    // Load config from script tag
    const script = document.getElementById('fahimo-widget-script');
    const businessId = script?.getAttribute('data-business-id');
    
    if (businessId) {
      fetchConfig(businessId);
    }

    // Load local storage
    const saved = localStorage.getItem(`fahimo_chat_${businessId}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.conversationId) {
        setConversationId(data.conversationId);
        setMessages(data.messages || []);
        setShowPreChat(false);
        setVisitorInfo(data.visitorInfo || { name: '', email: '', phone: '' });
        
        // Reconnect socket if we have an active conversation
        connectSocket(businessId!, data.conversationId);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Play sound on new message
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender !== 'user' && isOpen) {
      audioRef.current?.play().catch(e => console.log('Audio play failed', e));
    }
  }, [messages]);

  const fetchConfig = async (businessId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/widget/config/${businessId}`);
      const data = await res.json();
      setConfig({ ...data, businessId });
    } catch (err) {
      console.error('Failed to load widget config', err);
      setConfig({ businessId });
    }
  };

  const connectSocket = (businessId: string, convId?: string) => {
    if (socket) return;

    const newSocket = io(API_URL, {
      query: { businessId, conversationId: convId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('message', (msg: any) => {
      addMessage({
        id: msg.id || Date.now().toString(),
        text: msg.content,
        sender: msg.sender === 'USER' ? 'user' : (msg.sender === 'BOT' ? 'bot' : 'agent'),
        timestamp: new Date(msg.createdAt),
        type: msg.type || 'text',
        fileUrl: msg.fileUrl
      });
    });

    newSocket.on('agent_joined', () => {
      addMessage({
        id: 'system-' + Date.now(),
        text: 'An agent has joined the chat.',
        sender: 'agent',
        timestamp: new Date()
      });
    });

    setSocket(newSocket);
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      // Save to local storage
      if (config.businessId) {
        localStorage.setItem(storageKey, JSON.stringify({
          conversationId,
          messages: newMessages,
          visitorInfo
        }));
      }
      return newMessages;
    });
  };

  const handlePreChatSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Generate a visitor ID if not exists
    let visitorId = localStorage.getItem('fahimo_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('fahimo_visitor_id', visitorId);
    }

    try {
      // Start conversation via API
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          content: `Started chat. Name: ${visitorInfo.name}, Email: ${visitorInfo.email}`,
          visitorId,
          senderType: 'USER' // Initial message to trigger creation
        })
      });
      
      const data = await res.json();
      setConversationId(data.conversationId);
      setShowPreChat(false);
      connectSocket(config.businessId, data.conversationId);
      
      // Add welcome message if configured
      if (config.welcomeMessage) {
        addMessage({
          id: 'welcome',
          text: config.welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Failed to start chat', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const text = input;
    setInput('');
    
    // Optimistic add
    addMessage({
      id: 'temp-' + Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    });

    try {
      await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          conversationId,
          content: text,
          senderType: 'USER',
          visitorId: localStorage.getItem('fahimo_visitor_id')
        })
      });
    } catch (err) {
      console.error('Failed to send message', err);
      // TODO: Show error state
    }
  };

  const handleFileUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !conversationId) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('businessId', config.businessId);
    formData.append('conversationId', conversationId);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      // Send message with file link
      await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          conversationId,
          content: `Sent a file: ${data.url}`,
          senderType: 'USER',
          visitorId: localStorage.getItem('fahimo_visitor_id')
        })
      });
      
      // Add to local UI
      addMessage({
        id: 'file-' + Date.now(),
        text: 'Sent a file',
        sender: 'user',
        timestamp: new Date(),
        type: 'file',
        fileUrl: data.url
      });

    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRating = async (value: number) => {
    setRating(value);
    try {
      await fetch(`${API_URL}/api/chat/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: config.businessId,
          conversationId,
          rating: value
        })
      });
      setRatingSubmitted(true);
      setTimeout(() => setShowRating(false), 2000);
    } catch (e) {
      console.error('Rating failed', e);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const primaryColor = config.primaryColor || '#6366F1';
  const soundUrl = `${API_URL}/sounds/notification.mp3`; // Use API hosted sound

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 2147483647, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
    }}>
      <audio ref={audioRef} src={soundUrl} preload="auto" />
      
      {isOpen && (
        <div style={{
          width: '380px',
          height: '600px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '16px',
          overflow: 'hidden',
          animation: 'fahimo-slide-up 0.3s ease-out'
        }}>
          <style>{`
            @keyframes fahimo-slide-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .fahimo-msg { padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; max-width: 80%; font-size: 14px; line-height: 1.5; }
            .fahimo-msg.user { background: ${primaryColor}; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            .fahimo-msg.bot, .fahimo-msg.agent { background: #F3F4F6; color: #1F2937; align-self: flex-start; border-bottom-left-radius: 2px; }
            .fahimo-input:focus { outline: none; }
            .fahimo-star:hover { transform: scale(1.1); }
          `}</style>

          {/* Header */}
          <div style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -40)})`,
            color: 'white', 
            padding: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {config.botIcon ? <img src={config.botIcon} style={{width: '100%', height: '100%', borderRadius: '50%'}} /> : <ChatIcon />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>{config.botName || 'Support Chat'}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>We reply immediately</div>
              </div>
            </div>
            <div onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', opacity: 0.8 }}>
              <CloseIcon />
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
            {showPreChat ? (
              <div style={{ padding: '20px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#374151' }}>Welcome! Please introduce yourself.</h3>
                <form onSubmit={handlePreChatSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4B5563' }}>Name</label>
                    <input 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                      value={visitorInfo.name}
                      onInput={(e) => setVisitorInfo({...visitorInfo, name: (e.target as HTMLInputElement).value})}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4B5563' }}>Email</label>
                    <input 
                      type="email" 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                      value={visitorInfo.email}
                      onInput={(e) => setVisitorInfo({...visitorInfo, email: (e.target as HTMLInputElement).value})}
                    />
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', background: primaryColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Start Chat
                  </button>
                </form>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div key={msg.id} className={`fahimo-msg ${msg.sender}`}>
                    {msg.type === 'file' ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                        📎 Attachment
                      </a>
                    ) : msg.text}
                  </div>
                ))}
                {isLoading && <div className="fahimo-msg bot">...</div>}
                <div ref={messagesEndRef} />
                
                {/* Rating Prompt */}
                {showRating && !ratingSubmitted && (
                  <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#4B5563' }}>How was your experience?</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon key={star} filled={rating >= star} onClick={() => handleRating(star)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!showPreChat && (
            <div style={{ padding: '15px', background: 'white', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                disabled={isUploading}
              >
                <AttachmentIcon />
              </button>
              <input 
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px' }}
                placeholder="Type a message..."
                value={input}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                onClick={sendMessage} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: primaryColor }}
                disabled={!input.trim()}
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Launcher */}
      <div 
        onClick={toggleOpen}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: primaryColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </div>
    </div>
  );
}

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, c => 
    ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2)
  );
}
