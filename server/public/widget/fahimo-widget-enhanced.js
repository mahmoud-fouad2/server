// Fahimo Widget - Enhanced with Session Tracking & Rating
(function() {
  'use strict';

  // Configuration
  const API_URL = window.FAHIMO_API_URL || 'https://server-production-0883.up.railway.app';
  const businessId = document.currentScript?.getAttribute('data-business-id');

  if (!businessId) {
    console.error('[Fahimo Widget] Missing data-business-id attribute');
    return;
  }

  // Session Management
  let sessionId = localStorage.getItem('fahimo_session_id');
  let currentVisitId = null;
  let pageEnteredAt = Date.now();
  let scrollDepth = 0;
  let clicks = 0;

  // Generate browser fingerprint
  function generateFingerprint() {
    const nav = navigator;
    const screen = window.screen;
    const data = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.localStorage,
      !!window.sessionStorage,
      !!window.indexedDB
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  const fingerprint = generateFingerprint();

  // Initialize Session
  async function initSession() {
    try {
      const response = await fetch(`${API_URL}/api/visitor/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, fingerprint })
      });

      const data = await response.json();
      if (data.success) {
        sessionId = data.session.id;
        localStorage.setItem('fahimo_session_id', sessionId);
        
        // Track page visit
        await trackPageVisit();
      }
    } catch (error) {
      console.error('[Fahimo] Session init error:', error);
    }
  }

  // Track Page Visit
  async function trackPageVisit() {
    try {
      const response = await fetch(`${API_URL}/api/visitor/page-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          url: window.location.href,
          title: document.title,
          path: window.location.pathname
        })
      });

      const data = await response.json();
      if (data.success) {
        currentVisitId = data.visitId;
      }
    } catch (error) {
      console.error('[Fahimo] Page visit tracking error:', error);
    }
  }

  // Update Page Visit Data
  async function updatePageVisit() {
    if (!currentVisitId) return;

    const duration = Math.floor((Date.now() - pageEnteredAt) / 1000);
    
    try {
      await fetch(`${API_URL}/api/visitor/page-visit/${currentVisitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          scrollDepth,
          clicks,
          exitedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('[Fahimo] Update page visit error:', error);
    }
  }

  // Track scroll depth
  function trackScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const trackLength = documentHeight - windowHeight;
    const currentDepth = Math.floor((scrollTop / trackLength) * 100);
    scrollDepth = Math.max(scrollDepth, currentDepth);
  }

  // Track clicks
  function trackClicks() {
    clicks++;
  }

  // Event Listeners
  window.addEventListener('scroll', trackScrollDepth);
  document.addEventListener('click', trackClicks);
  window.addEventListener('beforeunload', updatePageVisit);

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
  } else {
    initSession();
  }

  // Widget UI
  const widgetStyles = `
    .fahimo-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
    }

    .fahimo-chat-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .fahimo-chat-button:hover {
      transform: scale(1.1);
    }

    .fahimo-chat-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    .fahimo-chat-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    .fahimo-chat-window.open {
      display: flex;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fahimo-chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .fahimo-chat-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .fahimo-close-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }

    .fahimo-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fahimo-message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fahimo-message.user {
      background: #667eea;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .fahimo-message.assistant {
      background: #f3f4f6;
      color: #1f2937;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .fahimo-chat-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }

    .fahimo-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      direction: rtl;
    }

    .fahimo-chat-input:focus {
      border-color: #667eea;
    }

    .fahimo-send-btn {
      background: #667eea;
      color: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .fahimo-send-btn:hover {
      background: #5568d3;
    }

    .fahimo-send-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .fahimo-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: #f3f4f6;
      border-radius: 12px;
      align-self: flex-start;
      max-width: 60px;
    }

    .fahimo-typing span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9ca3af;
      animation: typing 1.4s infinite;
    }

    .fahimo-typing span:nth-child(2) { animation-delay: 0.2s; }
    .fahimo-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    .fahimo-rating-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      text-align: center;
    }

    .fahimo-rating-container p {
      margin: 0 0 12px;
      font-size: 14px;
      color: #4b5563;
    }

    .fahimo-stars {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .fahimo-star {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 28px;
      color: #d1d5db;
      transition: color 0.2s;
    }

    .fahimo-star:hover,
    .fahimo-star.active {
      color: #fbbf24;
    }

    .fahimo-end-session-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      margin-top: 12px;
    }

    .fahimo-end-session-btn:hover {
      background: #dc2626;
    }

    @media (max-width: 480px) {
      .fahimo-chat-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: 10px;
      }
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = widgetStyles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const widgetHTML = `
    <div class="fahimo-widget-container">
      <button class="fahimo-chat-button" id="fahimo-toggle-btn" aria-label="فتح الدردشة">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>

      <div class="fahimo-chat-window" id="fahimo-chat-window">
        <div class="fahimo-chat-header">
          <h3>مرحباً! كيف يمكنني مساعدتك؟</h3>
          <button class="fahimo-close-btn" id="fahimo-close-btn">×</button>
        </div>

        <div class="fahimo-chat-messages" id="fahimo-messages"></div>

        <div class="fahimo-rating-container" id="fahimo-rating" style="display: none;">
          <p>قيّم تجربتك معنا</p>
          <div class="fahimo-stars" id="fahimo-stars">
            <button class="fahimo-star" data-rating="1">★</button>
            <button class="fahimo-star" data-rating="2">★</button>
            <button class="fahimo-star" data-rating="3">★</button>
            <button class="fahimo-star" data-rating="4">★</button>
            <button class="fahimo-star" data-rating="5">★</button>
          </div>
          <button class="fahimo-end-session-btn" id="fahimo-end-session">إنهاء المحادثة</button>
        </div>

        <div class="fahimo-chat-input-area">
          <input 
            type="text" 
            class="fahimo-chat-input" 
            id="fahimo-input"
            placeholder="اكتب رسالتك هنا..."
          />
          <button class="fahimo-send-btn" id="fahimo-send-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Inject widget
  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  // Get elements
  const toggleBtn = document.getElementById('fahimo-toggle-btn');
  const closeBtn = document.getElementById('fahimo-close-btn');
  const chatWindow = document.getElementById('fahimo-chat-window');
  const messagesContainer = document.getElementById('fahimo-messages');
  const inputField = document.getElementById('fahimo-input');
  const sendBtn = document.getElementById('fahimo-send-btn');
  const ratingContainer = document.getElementById('fahimo-rating');
  const starsContainer = document.getElementById('fahimo-stars');
  const endSessionBtn = document.getElementById('fahimo-end-session');

  let conversationId = localStorage.getItem('fahimo_conversation_id');
  let isWaitingForResponse = false;

  // Toggle chat window
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      inputField.focus();
      // Show rating if conversation exists
      if (conversationId) {
        ratingContainer.style.display = 'block';
      }
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // Add message to UI
  function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fahimo-message ${role}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'fahimo-typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) typingDiv.remove();
  }

  // Send message
  async function sendMessage() {
    const message = inputField.value.trim();
    if (!message || isWaitingForResponse) return;

    addMessage('user', message);
    inputField.value = '';
    sendBtn.disabled = true;
    isWaitingForResponse = true;

    showTyping();

    try {
      const response = await fetch(`${API_URL}/api/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          message,
          conversationId: conversationId || undefined,
          sessionId
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.success) {
        addMessage('assistant', data.reply);
        conversationId = data.conversationId;
        localStorage.setItem('fahimo_conversation_id', conversationId);
        ratingContainer.style.display = 'block';
      } else {
        addMessage('assistant', 'عذراً، حدث خطأ. حاول مرة أخرى.');
      }
    } catch (error) {
      hideTyping();
      addMessage('assistant', 'عذراً، تعذر الاتصال بالخادم.');
      console.error('[Fahimo] Send message error:', error);
    } finally {
      sendBtn.disabled = false;
      isWaitingForResponse = false;
    }
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Rating system
  starsContainer.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('fahimo-star') || !conversationId) return;

    const rating = parseInt(e.target.dataset.rating);
    
    // Update UI
    const stars = starsContainer.querySelectorAll('.fahimo-star');
    stars.forEach((star, index) => {
      star.classList.toggle('active', index < rating);
    });

    // Send rating
    try {
      await fetch(`${API_URL}/api/rating/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, rating })
      });
    } catch (error) {
      console.error('[Fahimo] Rating error:', error);
    }
  });

  // End session
  endSessionBtn.addEventListener('click', async () => {
    if (!sessionId) return;

    try {
      await fetch(`${API_URL}/api/visitor/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      // Clear storage
      localStorage.removeItem('fahimo_session_id');
      localStorage.removeItem('fahimo_conversation_id');
      
      // Reset UI
      messagesContainer.innerHTML = '';
      ratingContainer.style.display = 'none';
      chatWindow.classList.remove('open');

      // Reinitialize
      sessionId = null;
      conversationId = null;
      initSession();
    } catch (error) {
      console.error('[Fahimo] End session error:', error);
    }
  });

})();
