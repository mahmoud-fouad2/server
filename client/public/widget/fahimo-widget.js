// Lightweight noop proxy to avoid duplicate widget initialization in pages
// Canonical widget is served from the API (`/fahimo-widget.js`). This file
// intentionally no-ops to prevent double-inits and runtime conflicts.
(function(){
  try {
    if (window.__FAHIMO_WIDGET_LOADED) return;
    window.__FAHIMO_WIDGET_LOADED = true;
    // If someone included this legacy client-side widget file, we no-op.
    // Developers should include the canonical script from the API instead:
    // <script src="https://fahimo-api.onrender.com/fahimo-widget.js" data-business-id="YOUR_ID"></script>
    console.debug('Fahimo: legacy client widget neutralized');
  } catch(e) {
    console.warn('Fahimo: noop widget init error', e);
  }
})();
      
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

    _showInactivityPrompt() {
      const container = document.getElementById('fahimo-messages');
      if (!container) return;
      if (document.getElementById('fahimo-inactivity')) return;

      const div = document.createElement('div');
      div.id = 'fahimo-inactivity';
      div.style.cssText = 'background:#fff; padding:12px; border-radius:12px; text-align:center; margin:10px 0; box-shadow:0 2px 8px rgba(0,0,0,0.08);';
      div.innerHTML = `
        <p style="margin-bottom:8px; font-size:13px;">هل لازلت موجوداً؟</p>
        <div style="display:flex; justify-content:center; gap:8px;"> 
          <button id="fahimo-inactive-yes" style="padding:8px 12px; border-radius:8px; background:${this.config.color}; color:#fff; border:none;">نعم</button>
          <button id="fahimo-inactive-no" style="padding:8px 12px; border-radius:8px; background:#f3f4f6; border:none;">لا</button>
        </div>
      `;

      container.appendChild(div);
      container.scrollTop = container.scrollHeight;

      const yes = document.getElementById('fahimo-inactive-yes');
      const no = document.getElementById('fahimo-inactive-no');

      const clearPrompt = () => {
        const el = document.getElementById('fahimo-inactivity');
        if (el) el.remove();
        this._inactivityPromptShown = false;
        this._lastActivity = Date.now();
      };

      yes.onclick = () => {
        clearPrompt();
      };

      no.onclick = () => {
        // Close the widget and keep conversation id saved but hide UI
        clearPrompt();
        const win = document.getElementById('fahimo-chat-window');
        if (win) win.classList.remove('open');
        this.state.isOpen = false;
      };

      // Auto-close after prompt timeout if no response
      setTimeout(() => {
        if (this._inactivityPromptShown) {
          // treat as No (auto-close)
          const win = document.getElementById('fahimo-chat-window');
          if (win) win.classList.remove('open');
          this.state.isOpen = false;
          const el = document.getElementById('fahimo-inactivity');
          if (el) el.remove();
          this._inactivityPromptShown = false;
          // Notify analytics endpoint about auto-close
          try {
            const analyticsUrl = this.config.apiEndpoint.replace('/api/chat/message', '/api/analytics/public/track-event');
            fetch(analyticsUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'widget_inactive_auto_close',
                businessId: this.config.businessId,
                conversationId: this.state.conversationId || null,
                timestamp: new Date().toISOString(),
              }),
            }).catch(() => {});
          } catch (e) {
            // ignore analytics failures
          }
        }
      }, this._inactivityPromptTimeout);
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
