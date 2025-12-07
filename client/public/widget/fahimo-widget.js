(function () {
  'use strict';

  // Fahimo Widget Configuration
  const FahimoWidget = {
    config: {
      businessId: null,
      color: '#6366F1',
      position: 'bottom-right',
      apiEndpoint: 'https://faheemly-server.onrender.com/api/chat/message', // Change for production
      configEndpoint: 'https://faheemly-server.onrender.com/api/widget/config',
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
      if (savedId) this.state.conversationId = savedId;
    },

    loadConfig() {
      const script =
        document.currentScript ||
        document.querySelector('script[data-business-id]');
      if (script) {
        this.config.businessId = script.getAttribute('data-business-id');
        // Allow override via data attributes, but server config takes precedence usually
        if (script.getAttribute('data-color'))
          this.config.color = script.getAttribute('data-color');
        this.config.position =
          script.getAttribute('data-position') || this.config.position;
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
          z-index: 9999;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          direction: rtl;
        }
        .fahimo-pos-bottom-right { bottom: 20px; right: 20px; }
        .fahimo-pos-bottom-left { bottom: 20px; left: 20px; }
        
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
          line-height: 1.4;
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

        // Show typing indicator (optional)

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

          this.addMessage(data.response || '...', 'bot');
        } catch (error) {
          console.error(error);
          this.addMessage('عذراً، حدث خطأ في الاتصال: ' + error.message, 'bot');
        }
      };

      send.addEventListener('click', sendMessage);
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
      });
    },

    addMessage(text, sender) {
      const container = document.getElementById('fahimo-messages');
      const div = document.createElement('div');
      div.className = `fahimo-msg ${sender}`;
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
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
