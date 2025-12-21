import { useState, useEffect, useRef } from 'preact/hooks';

// Simple local definition if shared isn't fully linked in widget build context yet
interface Props {
  config: any;
  variant: 'standard' | 'enhanced';
  businessId: string;
  assetBaseUrl?: string;
}

// Helper to darken/lighten hex color
const adjustColor = (color: string, amount: number) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export function App({ config, variant, businessId, assetBaseUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, sender: 'user' | 'bot'}[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load mute preference
  useEffect(() => {
    const savedMute = localStorage.getItem(`fahimo-mute-${businessId}`);
    if (savedMute) setIsMuted(savedMute === 'true');
  }, [businessId]);

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
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    playSound();

    try {
      // Call API
      const apiUrl = window.__FAHIMO_API_URL || 'https://fahimo-api.onrender.com';
      const res = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          content: userMsg,
          senderType: 'USER'
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.content || 'No response', sender: 'bot' }]);
      playSound();
    } catch (e) {
      setMessages(prev => [...prev, { text: 'Error sending message', sender: 'bot' }]);
    }
  };

  // Dynamic Styles based on config
  const primaryColor = config.primaryColor || '#6366F1';
  // Use assetBaseUrl if available, otherwise fallback to relative path (assuming widget is hosted on same domain) or absolute fallback
  const soundUrl = assetBaseUrl ? `${assetBaseUrl}/assets/notification.mp3` : '/assets/notification.mp3';

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <audio ref={audioRef} src={soundUrl} preload="auto" />
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: variant === 'enhanced' ? '380px' : '350px',
          height: variant === 'enhanced' ? '600px' : '550px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '20px',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          animation: 'fahimo-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <style>{`
            @keyframes fahimo-slide-up {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .fahimo-scroll::-webkit-scrollbar { width: 6px; }
            .fahimo-scroll::-webkit-scrollbar-track { background: transparent; }
            .fahimo-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
            .fahimo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
          `}</style>
          
          {/* Header */}
          <div style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -20)})`, 
            color: 'white', 
            padding: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={config.customIconUrl || `https://api.dicebear.com/7.x/${config.avatar || 'bottts'}/svg`} 
                  style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', backgroundColor: 'white' }} 
                />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, 
                  backgroundColor: '#10B981', borderRadius: '50%', border: '2px solid white'
                }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '-0.01em' }}>{config.welcomeMessage?.split('!')[0] || 'Chat Support'}</div>
                <div style={{ fontSize: '13px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)' }}></span>
                  {variant === 'enhanced' ? 'AI Assistant' : 'Online'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={toggleMute} 
                title={isMuted ? "Unmute" : "Mute"}
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button 
                onClick={toggleOpen} 
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fff' }}>
            {activeTab === 'chat' && (
              <>
                {/* Messages Area */}
                <div className="fahimo-scroll" style={{ 
                  flex: 1, 
                  padding: '20px', 
                  overflowY: 'auto', 
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {messages.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#6B7280', 
                      marginTop: '40px',
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>👋</div>
                      {config.welcomeMessage || 'Hello! How can we help you today?'}
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      animation: 'fahimo-slide-up 0.3s ease-out forwards'
                    }}>
                      {msg.sender === 'bot' && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', marginLeft: '4px' }}>AI Assistant</div>
                      )}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: msg.sender === 'user' ? primaryColor : 'white',
                        color: msg.sender === 'user' ? 'white' : '#1F2937',
                        boxShadow: msg.sender === 'bot' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        border: msg.sender === 'bot' ? '1px solid #E5E7EB' : 'none'
                      }}>
                        {msg.text}
                      </div>
                      {msg.sender === 'user' && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right', marginRight: '4px' }}>Just now</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Input Area */}
                <div style={{ 
                  padding: '16px', 
                  borderTop: '1px solid #F3F4F6', 
                  display: 'flex', 
                  gap: '10px',
                  backgroundColor: 'white',
                  alignItems: 'flex-end'
                }}>
                  <textarea
                    value={input}
                    onInput={(e) => {
                      setInput(e.currentTarget.value);
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      outline: 'none',
                      fontSize: '14px',
                      resize: 'none',
                      height: '44px',
                      maxHeight: '100px',
                      fontFamily: 'inherit',
                      backgroundColor: '#F9FAFB',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: input.trim() ? primaryColor : '#E5E7EB',
                      color: 'white',
                      border: 'none',
                      cursor: input.trim() ? 'pointer' : 'not-allowed',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      transform: input.trim() ? 'scale(1)' : 'scale(0.95)',
                      opacity: input.trim() ? 1 : 0.7
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
                
                {/* Branding Footer */}
                <div style={{ 
                  textAlign: 'center', 
                  padding: '8px', 
                  fontSize: '11px', 
                  color: '#9CA3AF',
                  backgroundColor: '#F9FAFB',
                  borderTop: '1px solid #F3F4F6'
                }}>
                  Powered by <a href="https://faheemly.com" target="_blank" style={{ color: '#6B7280', textDecoration: 'none', fontWeight: '600' }}>Faheemly AI</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            backgroundColor: primaryColor,
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: 'fahimo-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <style>{`
            @keyframes fahimo-pop-in {
              from { transform: scale(0) rotate(-180deg); opacity: 0; }
              to { transform: scale(1) rotate(0); opacity: 1; }
            }
          `}</style>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
