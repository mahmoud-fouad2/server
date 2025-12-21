import { useState, useEffect, useRef } from 'preact/hooks';

interface Props {
  config: any;
  variant: 'standard' | 'enhanced';
  businessId: string;
  assetBaseUrl?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface ChatSession {
  conversationId: string | null;
  messages: Message[];
  rating: number | null;
  ratingSubmitted: boolean;
}

// Helper to darken/lighten hex color
const adjustColor = (color: string, amount: number) => {
  return '#' + color.replace(/^#/, '').replace(/../g, c => 
    ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2)
  );
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export function App({ config, variant, businessId, assetBaseUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Storage key for this business
  const storageKey = `fahimo-chat-${businessId}`;

  // Initialize visitor ID and load session on mount
  useEffect(() => {
    // Get or create visitor ID
    let vid = localStorage.getItem(`fahimo-visitor-${businessId}`);
    if (!vid) {
      vid = `v_${generateId()}`;
      localStorage.setItem(`fahimo-visitor-${businessId}`, vid);
    }
    setVisitorId(vid);

    // Load saved session
    const savedSession = localStorage.getItem(storageKey);
    if (savedSession) {
      try {
        const session: ChatSession = JSON.parse(savedSession);
        setMessages(session.messages || []);
        setConversationId(session.conversationId);
        setRating(session.rating || 0);
        setRatingSubmitted(session.ratingSubmitted || false);
      } catch (e) {
        console.error('Failed to load chat session:', e);
      }
    }

    // Load mute preference
    const savedMute = localStorage.getItem(`fahimo-mute-${businessId}`);
    if (savedMute) setIsMuted(savedMute === 'true');
  }, [businessId, storageKey]);

  // Save session whenever messages change
  useEffect(() => {
    if (messages.length > 0 || conversationId) {
      const session: ChatSession = {
        conversationId,
        messages,
        rating,
        ratingSubmitted
      };
      localStorage.setItem(storageKey, JSON.stringify(session));
    }
  }, [messages, conversationId, rating, ratingSubmitted, storageKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    localStorage.setItem(`fahimo-mute-${businessId}`, String(newState));
  };

  const playSound = () => {
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) playSound();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    const userMessage: Message = {
      id: generateId(),
      text: userMsg,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    playSound();

    try {
      const apiUrl = (window as any).__FAHIMO_API_URL || 'https://fahimo-api.onrender.com';
      const res = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          conversationId,
          visitorId,
          content: userMsg,
          senderType: 'USER'
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Update conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      const botMessage: Message = {
        id: generateId(),
        text: data.content || data.botMessage?.content || 'Sorry, I could not process your message.',
        sender: 'bot',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMessage]);
      playSound();
    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: Message = {
        id: generateId(),
        text: 'Sorry, there was an error. Please try again.',
        sender: 'bot',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (stars: number) => {
    setRating(stars);
    setRatingSubmitted(true);
    
    try {
      const apiUrl = (window as any).__FAHIMO_API_URL || 'https://fahimo-api.onrender.com';
      await fetch(`${apiUrl}/api/chat/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          conversationId,
          rating: stars
        })
      });
    } catch (e) {
      console.error('Rating submission error:', e);
    }
    
    setTimeout(() => setShowRating(false), 2000);
  };

  const endConversation = () => {
    if (!ratingSubmitted && messages.length > 0) {
      setShowRating(true);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(storageKey);
    setMessages([]);
    setConversationId(null);
    setRating(0);
    setRatingSubmitted(false);
    setShowRating(false);
  };

  const primaryColor = config.primaryColor || '#6366F1';

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 2147483647, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
    }}>
      {/* Hidden audio element - uses data URI for sound to avoid CSP issues */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" type="audio/wav" />
      </audio>
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: variant === 'enhanced' ? '380px' : '360px',
          height: variant === 'enhanced' ? '580px' : '520px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '16px',
          overflow: 'hidden',
          animation: 'fahimo-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <style>{`
            @keyframes fahimo-slide-up {
              from { opacity: 0; transform: translateY(30px) scale(0.9); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes fahimo-fade-in {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fahimo-pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
            @keyframes fahimo-star-pop {
              0% { transform: scale(1); }
              50% { transform: scale(1.3); }
              100% { transform: scale(1); }
            }
            .fahimo-scroll::-webkit-scrollbar { width: 5px; }
            .fahimo-scroll::-webkit-scrollbar-track { background: transparent; }
            .fahimo-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            .fahimo-msg { animation: fahimo-fade-in 0.3s ease-out forwards; }
            .fahimo-typing span { animation: fahimo-pulse 1.4s infinite; }
            .fahimo-typing span:nth-child(2) { animation-delay: 0.2s; }
            .fahimo-typing span:nth-child(3) { animation-delay: 0.4s; }
            .fahimo-star { cursor: pointer; transition: transform 0.2s, color 0.2s; }
            .fahimo-star:hover { transform: scale(1.2); }
            .fahimo-star.selected { animation: fahimo-star-pop 0.3s ease-out; }
          `}</style>
          
          {/* Header */}
          <div style={{ 
            background: `linear-gradient(145deg, ${primaryColor}, ${adjustColor(primaryColor, -25)})`,
            color: 'white', 
            padding: '18px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🤖
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, 
                  backgroundColor: '#22C55E', borderRadius: '50%', border: '2px solid white'
                }} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>
                  {config.welcomeMessage?.split('!')[0] || 'AI Assistant'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 6, height: 6, backgroundColor: '#22C55E', borderRadius: '50%' }}></span>
                  Always online
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={toggleMute}
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              {messages.length > 0 && (
                <button 
                  onClick={endConversation}
                  title="End & Rate"
                  style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    border: 'none', 
                    color: 'white', 
                    cursor: 'pointer', 
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  ⭐
                </button>
              )}
              <button 
                onClick={toggleOpen}
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Rating Overlay */}
          {showRating && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.97)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              animation: 'fahimo-fade-in 0.3s ease-out'
            }}>
              {ratingSubmitted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>Thank you!</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                    Your feedback helps us improve
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                    How was your experience?
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                    Rate your conversation
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`fahimo-star ${rating >= star ? 'selected' : ''}`}
                        onClick={() => submitRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          fontSize: '36px',
                          color: (hoverRating || rating) >= star ? '#FBBF24' : '#E5E7EB',
                          transition: 'color 0.2s'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowRating(false)}
                    style={{
                      marginTop: '24px',
                      padding: '8px 20px',
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: '20px',
                      color: '#6B7280',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Skip
                  </button>
                </>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="fahimo-scroll" style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto', 
            backgroundColor: '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '60px',
                animation: 'fahimo-fade-in 0.5s ease-out'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                  {config.welcomeMessage || 'Hello! How can I help you today?'}
                </div>
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                  Ask me anything, I'm here to help!
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="fahimo-msg"
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.sender === 'user' ? primaryColor : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1F2937',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#9CA3AF', 
                  marginTop: '4px',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                  paddingX: '4px'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="fahimo-msg" style={{ alignSelf: 'flex-start' }}>
                <div className="fahimo-typing" style={{
                  padding: '14px 20px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9CA3AF' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9CA3AF' }}></span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9CA3AF' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid #F3F4F6', 
            backgroundColor: 'white'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  setInput(target.value);
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid #E5E7EB',
                  outline: 'none',
                  fontSize: '14px',
                  resize: 'none',
                  height: '46px',
                  maxHeight: '100px',
                  fontFamily: 'inherit',
                  backgroundColor: '#F9FAFB',
                  transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s'
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.borderColor = primaryColor;
                  target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                  target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.borderColor = '#E5E7EB';
                  target.style.boxShadow = 'none';
                  target.style.backgroundColor = '#F9FAFB';
                }}
              />
              <button 
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: input.trim() && !isLoading ? primaryColor : '#E5E7EB',
                  color: 'white',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            padding: '10px', 
            fontSize: '11px', 
            color: '#9CA3AF',
            backgroundColor: '#F9FAFB',
            borderTop: '1px solid #F3F4F6'
          }}>
            Powered by <a href="https://faheemly.com" target="_blank" rel="noopener" style={{ color: primaryColor, textDecoration: 'none', fontWeight: '600' }}>Faheemly AI</a>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '32px',
            background: `linear-gradient(145deg, ${primaryColor}, ${adjustColor(primaryColor, -20)})`,
            color: 'white',
            border: 'none',
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s',
            animation: 'fahimo-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.18)';
          }}
        >
          <style>{`
            @keyframes fahimo-pop-in {
              from { transform: scale(0) rotate(-180deg); opacity: 0; }
              to { transform: scale(1) rotate(0); opacity: 1; }
            }
          `}</style>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          
          {/* Unread indicator if there are messages */}
          {messages.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '18px',
              height: '18px',
              backgroundColor: '#EF4444',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {messages.length > 9 ? '9+' : messages.length}
            </div>
          )}
        </button>
      )}
    </div>
  );
}
