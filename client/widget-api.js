(function() {
    // Fahimo Widget - Unified and Enhanced Version
    // Single-instance loader with session tracking, rating, and analytics
    if (window.__FAHIMO_WIDGET_LOADED) return;
    window.__FAHIMO_WIDGET_LOADED = true;

    // Configuration
    const scriptTag = document.currentScript;
    const businessId = scriptTag && scriptTag.getAttribute && scriptTag.getAttribute('data-business-id');
    const apiUrl = 'https://fahimo-api.onrender.com'; // Unified API URL

    if (!businessId) {
        console.error('Fahimo: Business ID is missing.');
        return;
    }

    // Session Management (from enhanced version)
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
            const response = await fetch(`${apiUrl}/api/visitor/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, fingerprint })
            });

            const data = await response.json();
            if (data.success) {
                sessionId = data.session.id;
                localStorage.setItem('fahimo_session_id', sessionId);
                await trackPageVisit();
            }
        } catch (error) {
            console.error('[Fahimo] Session init error:', error);
        }
    }

    // Track Page Visit
    async function trackPageVisit() {
        try {
            const response = await fetch(`${apiUrl}/api/visitor/page-visit`, {
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
            await fetch(`${apiUrl}/api/visitor/page-visit/${currentVisitId}`, {
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

    // Track scroll depth and clicks
    function trackScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const trackLength = documentHeight - windowHeight;
        const currentDepth = Math.floor((scrollTop / trackLength) * 100);
        scrollDepth = Math.max(scrollDepth, currentDepth);
    }

    function trackClicks() {
        clicks++;
    }

    // Event Listeners for tracking
    window.addEventListener('scroll', trackScrollDepth);
    document.addEventListener('click', trackClicks);
    window.addEventListener('beforeunload', updatePageVisit);

    // Initialize session on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSession);
    } else {
        initSession();
    }

    // Inject Styles (enhanced from original)
    const style = document.createElement('style');
    style.innerHTML = `
        #fahimo-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
        }
        #fahimo-launcher {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #003366, #00D4AA);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 212, 170, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            animation: fahimo-pulse 2s infinite;
        }
        @keyframes fahimo-pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(0, 212, 170, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0); }
        }
        #fahimo-launcher:hover { transform: scale(1.05); }
        #fahimo-launcher svg { width: 30px; height: 30px; fill: white; }

        #fahimo-chat-window {
            display: none;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            flex-direction: column;
            overflow: hidden;
            position: absolute;
            bottom: 80px;
            right: 0;
            animation: fahimo-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(0,0,0,0.05);
        }
        #fahimo-chat-window.fahimo-open { display: flex !important; }

        @keyframes fahimo-slide-up {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        #fahimo-header {
            background: linear-gradient(135deg, #003366, #001a33);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        #fahimo-bot-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #fahimo-bot-avatar {
            width: 35px;
            height: 35px;
            background: rgba(255,255,255,0.12);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        #fahimo-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #F8FAFC;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .fahimo-msg {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
            animation: fahimo-msg-in 0.3s ease-out;
        }
        @keyframes fahimo-msg-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fahimo-msg.user {
            background: #003366;
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }
        .fahimo-msg.bot {
            background: white;
            color: #1E293B;
            margin-right: auto;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        #fahimo-input-area {
            padding: 15px;
            background: white;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        #fahimo-input {
            flex: 1;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        #fahimo-input:focus {
            border-color: #00D4AA;
        }
        #fahimo-send {
            background: #003366;
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        #fahimo-send:hover {
            background: #002244;
        }
        #fahimo-branding {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            padding-bottom: 8px;
            background: #F8FAFC;
        }
        #fahimo-branding a {
            color: #003366;
            text-decoration: none;
            font-weight: bold;
        }

        /* Mobile behavior */
        @media (max-width: 640px) {
            #fahimo-chat-window {
                position: fixed;
                left: 10px;
                right: 10px;
                bottom: 10px;
                top: 12vh;
                width: auto;
                height: auto;
                max-height: 78vh;
                border-radius: 12px;
                box-shadow: 0 12px 50px rgba(0,0,0,0.3);
                transform: translateY(0);
            }
            #fahimo-launcher { right: 14px; bottom: 14px; }
            #fahimo-input { font-size: 15px; }
        }

        /* Rating UI */
        #fahimo-rating-container {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            text-align: center;
            display: none;
        }
        #fahimo-rating-container p {
            margin: 0 0 12px;
            font-size: 14px;
            color: #4b5563;
        }
        #fahimo-stars {
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
        #fahimo-end-session {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            margin-top: 12px;
        }
        #fahimo-end-session:hover {
            background: #dc2626;
        }
    `;
    document.head.appendChild(style);

    // Create Widget HTML (with rating added)
    const container = document.createElement('div');
    container.id = 'fahimo-widget-container';
    container.innerHTML = `
        <div id="fahimo-chat-window">
            <div id="fahimo-header">
                <div id="fahimo-bot-info">
                    <div id="fahimo-bot-avatar">F</div>
                    <div>
                        <div id="fahimo-bot-name" style="font-weight:bold; font-size:15px;">Faheemly Assistant</div>
                        <div style="font-size:11px; opacity:0.8;">● Online</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <span style="cursor:pointer; font-size:12px; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px;" id="fahimo-end-chat">End</span>
                    <span style="cursor:pointer; opacity:0.7;" id="fahimo-close">✕</span>
                </div>
            </div>
            <div id="fahimo-messages"></div>
            <div id="fahimo-rating-container">
                <p>Rate your experience</p>
                <div id="fahimo-stars">
                    ${[1,2,3,4,5].map(i => `<span class="fahimo-star" data-val="${i}" style="cursor:pointer;">☆</span>`).join('')}
                </div>
                <button id="fahimo-end-session">End Session</button>
            </div>
            <div id="fahimo-branding">
                Powered by <a href="https://faheemly.com" target="_blank">Faheemly AI</a>
            </div>
            <div id="fahimo-input-area">
                <input type="text" id="fahimo-input" placeholder="Type a message...">
                <button id="fahimo-send">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
        <div id="fahimo-launcher">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
    `;
    document.body.appendChild(container);

    // Logic (enhanced with rating and session management)
    try {
        const launcher = document.getElementById('fahimo-launcher');
        const chatWindow = document.getElementById('fahimo-chat-window');
        const closeBtn = document.getElementById('fahimo-close');
        const input = document.getElementById('fahimo-input');
        const sendBtn = document.getElementById('fahimo-send');
        const messagesDiv = document.getElementById('fahimo-messages');
        const ratingContainer = document.getElementById('fahimo-rating-container');
        const stars = document.querySelectorAll('.fahimo-star');
        const endSessionBtn = document.getElementById('fahimo-end-session');
        let isOpen = false;
        let conversationId = localStorage.getItem('fahimo_conversation_id');
        let selectedRating = 0;

        // Load Config
        fetch(`${apiUrl}/api/widget/config/${businessId}`)
            .then(res => res.json())
            .then(data => {
                const config = data.widgetConfig || {};
                // Prefer API/Config name but sanitize to remove any 'Demo' branding
                const rawName = data.name || config.name || "Faheemly Assistant";
                let botName = String(rawName || '');
                botName = botName.replace(/demo/gi, '').replace(/\bBusiness\b/gi, '').trim();
                if (!botName) botName = 'Faheemly Assistant';
                document.getElementById('fahimo-bot-name').innerText = botName;

                if (config.primaryColor) {
                    const color = config.primaryColor;
                    document.getElementById('fahimo-launcher').style.background = color;
                    document.getElementById('fahimo-header').style.background = color;
                    document.getElementById('fahimo-send').style.background = color;
                    const dynamicStyle = document.createElement('style');
                    dynamicStyle.innerHTML = `
                        .fahimo-msg.user { background: ${color} !important; }
                        #fahimo-launcher { background: ${color} !important; }
                    `;
                    document.head.appendChild(dynamicStyle);
                }

                if (config.customIconUrl) {
                    const avatarEl = document.getElementById('fahimo-bot-avatar');
                    avatarEl.innerHTML = `<img src="${config.customIconUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Bot">`;
                    avatarEl.style.background = 'transparent';
                }

                if (!conversationId && messagesDiv) {
                    // Sanitize welcome message to remove 'Demo' mentions
                    let welcome = config.welcomeMessage || "Hello! How can I help?";
                    welcome = String(welcome || '').replace(/demo/gi, '').replace(/\bBusiness\b/gi, '').trim();
                    if (!welcome) welcome = "Hello! How can I help?";
                    addMessage(welcome, 'bot');
                }
            })
            .catch(err => console.log('Fahimo: Could not load config'));

        // Send Message
        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, 'user');
            input.value = '';

            const typingId = 'typing-' + Date.now();
            addMessage('...', 'bot', typingId);

            try {
                const res = await fetch(`${apiUrl}/api/chat/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, businessId, conversationId, sessionId })
                });

                const data = await res.json();
                document.getElementById(typingId).remove();

                if (data.conversationId) {
                    conversationId = data.conversationId;
                    localStorage.setItem('fahimo_conversation_id', conversationId);
                }

                if (data.response) {
                    addMessage(data.response, 'bot');
                    // Do not auto-show rating after every reply. Rating is shown
                    // only when the user explicitly ends the chat via End button.
                }
            } catch (err) {
                document.getElementById(typingId).remove();
                addMessage("Sorry, something went wrong.", 'bot');
            }
        }

        // Add Message
        function addMessage(text, sender, id = null) {
            const div = document.createElement('div');
            div.className = `fahimo-msg ${sender}`;
            div.innerText = text;
            if (id) div.id = id;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Rating System
        stars.forEach(star => {
            star.onclick = () => {
                selectedRating = star.getAttribute('data-val');
                stars.forEach(s => s.style.color = s.getAttribute('data-val') <= selectedRating ? '#FFD700' : '#ccc');
            };
        });

        // End Chat and Submit Rating
        document.getElementById('fahimo-end-chat').onclick = () => {
            if (!conversationId) return;
            showRatingUI();
        };

        function showRatingUI() {
            ratingContainer.style.display = 'block';
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        endSessionBtn.onclick = async () => {
            if (!selectedRating) return;
            try {
                await fetch(`${apiUrl}/api/chat/rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversationId, rating: selectedRating })
                });
                localStorage.removeItem('fahimo_conversation_id');
                conversationId = null;
                ratingContainer.style.display = 'none';
                messagesDiv.innerHTML = '';
            } catch (e) {
                console.error(e);
            }
        };

        // Event Listeners
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

        launcher.onclick = () => {
            isOpen = !isOpen;
            chatWindow.classList.toggle('fahimo-open', isOpen);
        };
        closeBtn.onclick = () => {
            isOpen = false;
            chatWindow.classList.remove('fahimo-open');
        };
    } catch (e) {
        console.error('Fahimo widget init error', e);
    }

})();

