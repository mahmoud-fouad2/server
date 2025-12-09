(function () {
  'use strict';

  // Fahimo Widget Configuration
  const FahimoWidget = {
    config: {
      businessId: null,
      color: '#6366F1',
      position: 'bottom-right',
      apiEndpoint: 'https://fahimo-api.onrender.com/api/chat/message', // Change for production
      configEndpoint: 'https://fahimo-api.onrender.com/api/widget/config',
    },
    state: {
      isOpen: false,
      conversationId: null,
      messages: [],
      settings: null,
    },

    async init() {
      this.loadConfig();
      try {
        await this.fetchSettings(); // Fetch dynamic settings (branding, welcome msg)
      } catch (error) {
        console.warn('Failed to fetch settings, using defaults:', error);
        this.state.settings = {
          widgetConfig: {
            welcomeMessage: 'مرحباً! كيف يمكنني مساعدتك؟',
            showBranding: true,
          },
        };
      }
      this.injectStyles();
      this.createDOM();
      this.attachListeners();

      // Check for saved conversation
      const savedId = localStorage.getItem('fahimo_conv_id');
      if (savedId) {
        this.state.conversationId = savedId;
        this.fetchHistory(savedId);
      }
    },

    async fetchHistory(conversationId) {
      try {
        // Use the public endpoint for widget history
        const baseUrl = this.config.apiEndpoint.replace('/message', '');
        const res = await fetch(`${baseUrl}/public/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const messages = data.data || [];
          messages.forEach(msg => {
            this.addMessage(msg.content, msg.role === 'USER' ? 'user' : 'bot');
          });
        }
      } catch (e) {
        console.warn('Failed to load history', e);
      }
    },

    loadConfig() {
      const script =
        document.currentScript ||
        document.querySelector('script[data-business-id]');
      if (script) {
        this.config.businessId = script.getAttribute('data-business-id');
        // Allow override via data attributes
        if (script.getAttribute('data-color'))
          this.config.color = script.getAttribute('data-color');
        this.config.position =
          script.getAttribute('data-position') || this.config.position;
        
        // Dynamic API Endpoint
        if (script.getAttribute('data-api-url')) {
           this.config.apiEndpoint = script.getAttribute('data-api-url') + '/api/chat/message';
           this.config.configEndpoint = script.getAttribute('data-api-url') + '/api/widget/config';
        }
      }
    },

    async fetchSettings() {
      try {
        const res = await fetch(
          `${this.config.configEndpoint}/${this.config.businessId}`
        );
        if (res.ok) {
          const data = await res.json();
          this.state.settings = data;
          // Update local config with server settings
          if (data.widgetConfig) {
            this.config.color =
              data.widgetConfig.primaryColor || this.config.color;
          }
        }
      } catch (e) {
        console.error('Failed to load widget settings', e);
      }
    },

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #fahimo-widget-container {
          position: fixed;
          z-index: 999999;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
        }
        .fahimo-pos-bottom-right { bottom: 20px; right: 20px; }
        .fahimo-pos-bottom-left { bottom: 20px; left: 20px; }
        
        @media (max-width: 480px) {
          #fahimo-chat-window {
            width: 100% !important;
            height: 100% !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 0 !important;
            transform: translateY(100%);
            max-height: 100vh;
            position: fixed !important;
            top: 0;
          }
          #fahimo-chat-window.open {
            transform: translateY(0);
          }
          .fahimo-pos-bottom-right, .fahimo-pos-bottom-left {
            bottom: 10px;
            right: 10px;
          }
          #fahimo-launcher {
            bottom: 20px !important;
            right: 20px !important;
          }
        }

        #fahimo-launcher {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${this.config.color};
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
          position: absolute;
          bottom: 0;
          right: 0;
        }
        #fahimo-launcher:hover { transform: scale(1.05); }
        #fahimo-launcher svg { width: 30px; height: 30px; fill: white; }
        
        #fahimo-chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 5px 40px rgba(0,0,0,0.16);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }
        #fahimo-chat-window.open {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        
        .fahimo-header {
          background: ${this.config.color};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fahimo-header h3 { margin: 0; font-size: 16px; }
        .fahimo-header p { margin: 0; font-size: 12px; opacity: 0.8; }
        
        .fahimo-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .fahimo-msg {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .fahimo-msg.user {
          background: ${this.config.color};
          color: white;
          align-self: flex-end;
          border-bottom-left-radius: 2px;
        }
        .fahimo-msg.bot {
          background: white;
          color: #333;
          align-self: flex-start;
          border-bottom-right-radius: 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        /* Markdown Styles */
        .fahimo-msg ul, .fahimo-msg ol { margin: 5px 0; padding-right: 20px; }
        .fahimo-msg li { margin-bottom: 4px; }
        .fahimo-msg p { margin: 0 0 8px 0; }
        .fahimo-msg p:last-child { margin: 0; }
        .fahimo-msg a { color: inherit; text-decoration: underline; }
        .fahimo-msg strong { font-weight: 700; }

        /* Typing Indicator */
        .fahimo-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          border-bottom-right-radius: 2px;
          width: fit-content;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          margin-bottom: 10px;
        }
        .fahimo-typing span {
          width: 6px;
          height: 6px;
          background: #ccc;
          border-radius: 50%;
          animation: fahimo-bounce 1.4s infinite ease-in-out both;
        }
        .fahimo-typing span:nth-child(1) { animation-delay: -0.32s; }
        .fahimo-typing span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes fahimo-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .fahimo-input-area {
          padding: 12px;
          border-top: 1px solid #eee;
          background: white;
          display: flex;
          gap: 8px;
        }
        #fahimo-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 8px 16px;
          outline: none;
          font-family: inherit;
        }
        #fahimo-send {
          background: transparent;
          border: none;
          color: ${this.config.color};
          cursor: pointer;
          padding: 4px;
        }
        
        .fahimo-branding {
          text-align: center;
          font-size: 10px;
          color: #999;
          padding: 4px;
          background: #f9fafb;
          border-top: 1px solid #eee;
        }
        .fahimo-branding a {
            color: inherit;
            text-decoration: none;
            font-weight: bold;
        }
      `;
      document.head.appendChild(style);
    },

    createDOM() {
      const container = document.createElement('div');
      container.id = 'fahimo-widget-container';
      container.className = `fahimo-pos-${this.config.position}`;

      const welcomeMsg =
        this.state.settings?.widgetConfig?.welcomeMessage ||
        'مرحباً! كيف يمكنني مساعدتك اليوم؟';
      const botName = this.state.settings?.name || 'مساعد فاهيمو';

      // Branding Logic: Always show unless plan is PREMIUM (handled by server config usually, but enforced here visually)
      // For now, we assume "showBranding" comes from server config.
      // If showBranding is true (default), we show it.
      // The user requested: "the user cant remove this one ,, only the preimium packedge"
      // We will enforce it here.

      const showBranding =
        this.state.settings?.widgetConfig?.showBranding !== false; // Default true

      container.innerHTML = `
        <div id="fahimo-chat-window">
          <div class="fahimo-header">
            <div>
              <h3>${botName}</h3>
              <p>متصل الآن 👋</p>
            </div>
            <div style="cursor:pointer" id="fahimo-close">✕</div>
          </div>
          <div class="fahimo-messages" id="fahimo-messages">
            <div class="fahimo-msg bot">${welcomeMsg}</div>
          </div>
          <div class="fahimo-input-area">
            <input type="text" id="fahimo-input" placeholder="اكتب رسالتك هنا..." />
            <button id="fahimo-send">➤</button>
          </div>
          ${showBranding ? '<div class="fahimo-branding">مدعوم من <a href="https://fahimo.com" target="_blank">فاهيمو</a></div>' : ''}
        </div>
        <div id="fahimo-launcher">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        </div>
      `;

      document.body.appendChild(container);
    },

    attachListeners() {
      const launcher = document.getElementById('fahimo-launcher');
      const window = document.getElementById('fahimo-chat-window');
      const close = document.getElementById('fahimo-close');
      const input = document.getElementById('fahimo-input');
      const send = document.getElementById('fahimo-send');

      // Check if elements exist before adding listeners
      if (!launcher || !window || !close || !input || !send) {
        console.warn(
          'Fahimo Widget: Some DOM elements not found, retrying in 100ms...'
        );
        setTimeout(() => this.attachListeners(), 100);
        return;
      }

      const toggle = () => {
        this.state.isOpen = !this.state.isOpen;
        window.classList.toggle('open', this.state.isOpen);
      };

      launcher.addEventListener('click', toggle);
      close.addEventListener('click', toggle);

      const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        // Add User Message
        this.addMessage(text, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
          const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              businessId: this.config.businessId,
              conversationId: this.state.conversationId,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Server Error');
          }

          if (data.conversationId) {
            this.state.conversationId = data.conversationId;
            localStorage.setItem('fahimo_conv_id', data.conversationId);
          }

          this.hideTyping();
          this.addMessage(data.response || '...', 'bot');
        } catch (error) {
          console.error(error);
          this.hideTyping();
          this.addMessage('عذراً، حدث خطأ في الاتصال: ' + error.message, 'bot');
        }
      };

      send.addEventListener('click', sendMessage);
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
      });
    },

    showTyping() {
      const container = document.getElementById('fahimo-messages');
      if (document.getElementById('fahimo-typing-indicator')) return;
      
      const div = document.createElement('div');
      div.id = 'fahimo-typing-indicator';
      div.className = 'fahimo-typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    hideTyping() {
      const indicator = document.getElementById('fahimo-typing-indicator');
      if (indicator) indicator.remove();
    },

    parseMarkdown(text) {
      if (!text) return '';
      let html = text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Unordered Lists
        .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
        // Ordered Lists
        .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
        // Newlines to <br> (but not inside lists)
        .replace(/\n/g, '<br>');
      
      // Wrap lists in <ul> (simple heuristic)
      if (html.includes('<li>')) {
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        // Fix multiple <ul> blocks if they are adjacent (optional, simple regex might miss this but it's better than nothing)
        html = html.replace(/<\/ul><br><ul>/g, ''); 
      }
      
      return html;
    },

    addMessage(text, sender) {
      const container = document.getElementById('fahimo-messages');
      
      // Check for Rating Request
      if (text.includes('|RATING_REQUEST|')) {
        text = text.replace('|RATING_REQUEST|', '');
        setTimeout(() => this.showRatingUI(), 1000);
      }

      const div = document.createElement('div');
      div.className = `fahimo-msg ${sender}`;
      
      div.innerHTML = this.parseMarkdown(text);
      
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    showRatingUI() {
      const container = document.getElementById('fahimo-messages');
      if (document.getElementById('fahimo-rating')) return;

      const div = document.createElement('div');
      div.id = 'fahimo-rating';
      div.style.cssText = 'background:white; padding:15px; border-radius:12px; text-align:center; margin:10px 0; box-shadow:0 2px 8px rgba(0,0,0,0.1);';
      div.innerHTML = `
        <p style="margin-bottom:10px; font-size:14px;">كيف كانت تجربتك معنا؟</p>
        <div style="display:flex; justify-content:center; gap:5px; font-size:24px; cursor:pointer;">
          <span data-val="1">⭐</span>
          <span data-val="2">⭐</span>
          <span data-val="3">⭐</span>
          <span data-val="4">⭐</span>
          <span data-val="5">⭐</span>
        </div>
      `;

      const stars = div.querySelectorAll('span');
      stars.forEach((star, idx) => {
        star.onclick = () => {
          this.submitRating(idx + 1);
          div.innerHTML = '<p>شكراً لتقييمك! ❤️</p>';
        };
      });

      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    async submitRating(rating) {
      try {
        await fetch(this.config.apiEndpoint.replace('/message', '/rating'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: this.state.conversationId,
            rating: rating
          })
        });
      } catch (e) {
        console.error('Rating failed', e);
      }
    },
  };

  // Prevent double init when script is added multiple times
  if (document.getElementById('fahimo-widget-container')) {
    // Already present — no need to init twice
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => FahimoWidget.init());
    } else {
      FahimoWidget.init();
    }
  }
})();
