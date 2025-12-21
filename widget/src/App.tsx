import { useState, useEffect, useRef } from 'preact/hooks';

// Simple local definition if shared isn't fully linked in widget build context yet
interface Props {
  config: any;
  variant: 'standard' | 'enhanced';
  businessId: string;
}

export function App({ config, variant, businessId }: Props) {
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

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" preload="auto" />
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: variant === 'enhanced' ? '380px' : '320px',
          height: variant === 'enhanced' ? '600px' : '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '16px',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Header */}
          <div style={{ backgroundColor: primaryColor, color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {config.avatar && <img src={config.customIconUrl || `https://api.dicebear.com/7.x/${config.avatar}/svg`} style={{ width: 32, height: 32, borderRadius: '50%' }} />}
              <div>
                <div style={{ fontWeight: 'bold' }}>{config.welcomeMessage?.split('!')[0] || 'Chat'}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{variant === 'enhanced' ? 'AI Support Agent' : 'Support'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button onClick={toggleOpen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'chat' && (
              <>
                {/* Messages Area */}
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
                      {config.welcomeMessage}
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: '8px',
                      textAlign: msg.sender === 'user' ? 'right' : 'left'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: msg.sender === 'user' ? primaryColor : 'white',
                        color: msg.sender === 'user' ? 'white' : '#1f2937',
                        boxShadow: msg.sender === 'bot' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        maxWidth: '80%'
                      }}>
                        {msg.text}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Input Area */}
                <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={input}
                    onInput={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid #e5e7eb',
                      outline: 'none'
                    }}
                  />
                  <button onClick={sendMessage} style={{
                    backgroundColor: primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ➤
                  </button>
                </div>
              </>
            )}

            {activeTab === 'info' && (
              <div style={{ padding: '20px', overflowY: 'auto', direction: 'rtl', textAlign: 'right' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', color: primaryColor }}>من نحن</h3>
                <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>نحن هنا لمساعدتك في الإجابة على أي استفسارات قد تكون لديك. نسعى دائماً لتقديم أفضل خدمة ممكنة.</p>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>البريد الإلكتروني:</strong>
                  <div style={{ direction: 'ltr', textAlign: 'right' }}>support@faheemly.com</div>
                </div>
                
                <div>
                  <strong>ساعات العمل:</strong>
                  <div>9 صباحاً - 5 مساءً</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div style={{ 
            display: 'flex', 
            borderTop: '1px solid #eee', 
            padding: '8px 0',
            backgroundColor: '#fff'
          }}>
            <button 
              onClick={() => setActiveTab('chat')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer',
                color: activeTab === 'chat' ? primaryColor : '#999',
                fontWeight: activeTab === 'chat' ? 'bold' : 'normal'
              }}
            >
              💬 Chat
            </button>
            <button 
              onClick={() => setActiveTab('info')}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer',
                color: activeTab === 'info' ? primaryColor : '#999',
                fontWeight: activeTab === 'info' ? 'bold' : 'normal'
              }}
            >
              ℹ️ Info
            </button>
          </div>
          
          {/* Enhanced Footer */}
          {variant === 'enhanced' && (
            <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb', fontSize: '10px', textAlign: 'center', color: '#9ca3af' }}>
              Powered by Fahimo AI
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleOpen}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: primaryColor,
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          transition: 'transform 0.2s'
        }}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
}
