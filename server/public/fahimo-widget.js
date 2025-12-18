(function() {
    // Fahimo Widget - Unified and Enhanced Version
    // Single-instance loader with session tracking, rating, and analytics
    if (window.__FAHIMO_WIDGET_LOADED) return;
    window.__FAHIMO_WIDGET_LOADED = true;

    // Configuration
    const scriptTag = document.currentScript;
    const businessId = scriptTag && scriptTag.getAttribute && scriptTag.getAttribute('data-business-id');

    // Determine API URL with multiple override options (data attribute, global override, script origin, fallback)
    let apiUrl = 'https://fahimo-api.onrender.com'; // default fallback
    try {
        const dataApi = scriptTag && scriptTag.getAttribute && scriptTag.getAttribute('data-api-url');
        const globalApi = window.__FAHIMO_WIDGET_API_URL || window.__FAHIMO_WIDGET_API;
        if (dataApi) {
            apiUrl = dataApi;
        } else if (globalApi) {
            apiUrl = globalApi;
        } else if (scriptTag && scriptTag.src) {
            try {
                // Use script origin as a sensible default when embedded from same host
                const u = new URL(scriptTag.src);
                apiUrl = u.origin;
            } catch (e) {
                // ignore and use fallback
            }
        }
    } catch (e) {
        // Defensive: keep the default apiUrl
    }

    // Sanitize apiUrl: don't let an explicit/local API (http://localhost...) be used when widget is embedded on a remote host
    try {
        const parsed = new URL(apiUrl);
        const isLocalTarget = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        const isPageLocal = window && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocalTarget && !isPageLocal) {
            console.warn('[Fahimo] Ignoring local apiUrl (%s) because widget is embedded on remote host %s. Falling back to script origin or default.', apiUrl, window.location.hostname);
            // Prefer script origin if available, otherwise default to canonical API
            try {
                apiUrl = scriptTag && scriptTag.src ? new URL(scriptTag.src).origin : 'https://fahimo-api.onrender.com';
            } catch (ignore) {
                apiUrl = 'https://fahimo-api.onrender.com';
            }
        }
    } catch (e) {
        // ignore URL parse errors
    }

    // Warn if the widget is contacting a remote production API while embedded on a different host
    try {
        const apiHost = (new URL(apiUrl)).host;
        if (window && window.location && window.location.host && apiHost && apiHost !== window.location.host && apiHost.indexOf('fahimo-api.onrender.com') !== -1) {
            console.warn('[Fahimo] Widget is configured to use production API host:', apiUrl, 'while this page is served from', window.location.host);
        }
    } catch (e) {
        // ignore URL parse errors
    }

    if (!businessId) {
        console.error('Fahimo: Business ID is missing.');
        return;
    }

    // Declare variables that will be used across functions
    let messagesDiv = null;
    let botName = 'Faheemly Assistant';

    // Define triggerConfigRefresh early so it can be called by event listeners
    function triggerConfigRefresh() {
        fetch(`${apiUrl}/api/widget/config/${businessId}?_=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                const config = data.widgetConfig || {};
                console.log('[Fahimo] Applying config update:', config);

                // Apply primary color
                if (config.primaryColor) {
                    const color = config.primaryColor;
                    const launcher = document.getElementById('fahimo-launcher');
                    const header = document.getElementById('fahimo-header');
                    const send = document.getElementById('fahimo-send');
                    
                    if (launcher) launcher.style.background = color;
                    if (header) header.style.background = color;
                    if (send) send.style.background = color;
                    
                    const dynamicStyle = document.createElement('style');
                    dynamicStyle.setAttribute('data-fahimo-refresh', String(Date.now()));
                    dynamicStyle.innerHTML = `
                        .fahimo-msg.user { background: ${color} !important; }
                        #fahimo-launcher { background: ${color} !important; }
                    `;
                    document.head.appendChild(dynamicStyle);
                }

                // Apply custom icon URL update (new!)
                if (config.customIconUrl || config.customIconData) {
                    const avatarEl = document.getElementById('fahimo-bot-avatar');
                    if (avatarEl) {
                        const img = document.createElement('img');
                        img.src = config.customIconData || config.customIconUrl;
                        img.alt = 'Bot';
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.borderRadius = '50%';
                        img.style.objectFit = 'cover';
                        img.style.display = 'block';
                        img.onerror = function() {
                            try { img.remove(); } catch (e) {}
                            avatarEl.style.background = 'rgba(255,255,255,0.12)';
                            avatarEl.innerText = (botName && botName[0]) ? botName[0] : 'F';
                            console.warn('[Fahimo] custom icon update failed to load, using fallback');
                        };
                        avatarEl.innerHTML = '';
                        avatarEl.appendChild(img);
                        avatarEl.style.background = 'transparent';
                        console.log('[Fahimo] Updated custom icon:', config.customIconUrl || config.customIconData);
                    }
                }

                // Apply welcome message
                if (config.welcomeMessage && messagesDiv && messagesDiv.children.length === 1) {
                    let welcome = config.welcomeMessage;
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'fahimo-msg bot';
                    msgDiv.innerText = welcome;
                    messagesDiv.appendChild(msgDiv);
                }
            })
            .catch(err => console.log('[Fahimo] Config refresh failed:', err));
    }

    // Listen for config update signals from dashboard (via localStorage or BroadcastChannel)
    const updateChannelName = `fahimo-config-update-${businessId}`;
    let broadcastChannel = null;
    try {
        broadcastChannel = new BroadcastChannel(updateChannelName);
        broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'CONFIG_UPDATED') {
                // Force immediate refresh
                console.log('[Fahimo] Received config update signal, refreshing...');
                triggerConfigRefresh();
            }
        };
    } catch (e) {
        // BroadcastChannel not supported, will fall back to polling
    }

    // Also listen via storage events (cross-tab)
    window.addEventListener('storage', (event) => {
        if (event.key === `${updateChannelName}-notify`) {
            console.log('[Fahimo] Received storage update signal');
            triggerConfigRefresh();
        }
    });

    // Session Management (from enhanced version)
    // Use safe storage helpers to gracefully handle Tracking Prevention (which may block localStorage)
    const _inMemoryStorage = new Map();
    function safeGetItem(key) {
        try { return localStorage.getItem(key); } catch (e) { return _inMemoryStorage.get(key) || null; }
    }
    function safeSetItem(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { _inMemoryStorage.set(key, value); }
    }
    function safeRemoveItem(key) {
        try { localStorage.removeItem(key); } catch (e) { _inMemoryStorage.delete(key); }
    }

    let sessionId = safeGetItem('fahimo_session_id');
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
                safeSetItem('fahimo_session_id', sessionId);
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
            width: 68px;
            height: 68px;
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
        #fahimo-launcher svg { width: 36px; height: 36px; fill: white; }

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
            width: 56px;
            height: 56px;
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
            /* Improve text layout: preserve lines and allow simple HTML */
            white-space: pre-wrap;
        }

        /* Typing indicator styles */
        .fahimo-typing { display: inline-flex; gap:6px; align-items:center; font-size:13px; color:#64748b; }
        .fahimo-typing .dots { display:inline-flex; gap:4px; margin-left:6px }
        .fahimo-typing .dot { width:6px; height:6px; background:#94a3b8; border-radius:50%; opacity:0.3; transform:translateY(0); }
        @keyframes fahimo-dot {
            0% { opacity: 0.25; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-4px); }
            100% { opacity: 0.25; transform: translateY(0); }
        }
        .fahimo-typing .dot:nth-child(1) { animation: fahimo-dot 1s infinite 0s; }
        .fahimo-typing .dot:nth-child(2) { animation: fahimo-dot 1s infinite 0.15s; }
        .fahimo-typing .dot:nth-child(3) { animation: fahimo-dot 1s infinite 0.3s; }
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

        #fahimo-prechat-form {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            z-index: 10000;
            display: none;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
            direction: rtl;
        }
        #fahimo-prechat-form .prechat-header {
            background: linear-gradient(135deg, #003366, #002244);
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            text-align: center;
        }
        #fahimo-prechat-form .prechat-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        #fahimo-prechat-form .prechat-header p {
            margin: 8px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        #fahimo-prechat-form .prechat-body {
            padding: 20px;
        }
        #fahimo-prechat-form .form-group {
            margin-bottom: 16px;
        }
        #fahimo-prechat-form label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
        }
        #fahimo-prechat-form input,
        #fahimo-prechat-form textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            font-family: inherit;
        }
        #fahimo-prechat-form input:focus,
        #fahimo-prechat-form textarea:focus {
            outline: none;
            border-color: #003366;
            box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
        }
        #fahimo-prechat-form textarea {
            resize: vertical;
            min-height: 80px;
        }
        #fahimo-prechat-form .prechat-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }
        #fahimo-prechat-form .btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        #fahimo-prechat-form .btn-primary {
            background: #003366;
            color: white;
        }
        #fahimo-prechat-form .btn-primary:hover {
            background: #002244;
        }
        #fahimo-prechat-form .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        #fahimo-prechat-form .btn-secondary:hover {
            background: #e5e7eb;
        }
        #fahimo-prechat-form .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Mobile styles for prechat form */
        @media (max-width: 640px) {
            #fahimo-prechat-form {
                position: fixed;
                left: 10px;
                right: 10px;
                bottom: 80px;
                width: auto;
                max-width: none;
            }
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
                    <div id="fahimo-bot-avatar" style="background: transparent; width:56px; height:56px;">F</div>
                    <div>
                        <div id="fahimo-bot-name" style="font-weight:bold; font-size:16px;">Faheemly Assistant</div>
                        <div style="font-size:12px; opacity:0.85; display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;background:#34d399;border-radius:50%;display:inline-block;"></span><span>Online</span></div>
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

    // Pre-chat form HTML
    const prechatForm = document.createElement('div');
    prechatForm.id = 'fahimo-prechat-form';
    prechatForm.innerHTML = `
        <div class="prechat-header">
            <h3>مرحباً بك</h3>
            <p>يرجى تقديم بعض المعلومات قبل بدء المحادثة</p>
        </div>
        <div class="prechat-body">
            <div class="form-group">
                <label for="prechat-name">الاسم الكامل</label>
                <input type="text" id="prechat-name" placeholder="أدخل اسمك الكامل">
            </div>
            <div class="form-group">
                <label for="prechat-email">البريد الإلكتروني</label>
                <input type="email" id="prechat-email" placeholder="example@email.com">
            </div>
            <div class="form-group">
                <label for="prechat-phone">رقم الهاتف</label>
                <input type="tel" id="prechat-phone" placeholder="+966501234567">
            </div>
            <div class="form-group">
                <label for="prechat-request">كيف يمكننا مساعدتك؟</label>
                <textarea id="prechat-request" placeholder="يرجى وصف طلبك أو استفسارك..."></textarea>
            </div>
            <div class="prechat-actions">
                <button class="btn btn-secondary" id="prechat-cancel">إلغاء</button>
                <button class="btn btn-primary" id="prechat-submit">بدء المحادثة</button>
            </div>
        </div>
    `;
    document.body.appendChild(prechatForm);

    // Logic (enhanced with rating and session management)
    try {
        const launcher = document.getElementById('fahimo-launcher');
        const chatWindow = document.getElementById('fahimo-chat-window');
        const closeBtn = document.getElementById('fahimo-close');
        const input = document.getElementById('fahimo-input');
        const sendBtn = document.getElementById('fahimo-send');
        messagesDiv = document.getElementById('fahimo-messages');
        const ratingContainer = document.getElementById('fahimo-rating-container');
        const stars = document.querySelectorAll('.fahimo-star');
        const endSessionBtn = document.getElementById('fahimo-end-session');
        const inputArea = document.getElementById('fahimo-input-area');
        let isOpen = false;
        let conversationId = safeGetItem('fahimo_conversation_id');
        let selectedRating = 0;
        // persisted messages for this business (visitor persistence)
        let storedMessages = [];
        let isLoadingStored = false;
        // Pre-chat form variables
        let prechatEnabled = false;
        let prechatFormVisible = false;

        function storageKey() {
            return `fahimo_msgs_${businessId}`;
        }

        function saveStoredMessages() {
            try {
                // keep last 200 messages to avoid large storage
                const toSave = storedMessages.slice(-200);
                localStorage.setItem(storageKey(), JSON.stringify(toSave));
            } catch (e) {
                // ignore storage errors
            }
        }

        function loadStoredMessages() {
            try {
                    const raw = safeGetItem(storageKey());
                if (!raw) return;
                const arr = JSON.parse(raw);
                if (!Array.isArray(arr) || !arr.length) return;
                isLoadingStored = true;
                storedMessages = arr;
                arr.forEach(m => {
                    // when loading, avoid re-saving
                    addMessage(m.text, m.sender);
                });
                isLoadingStored = false;
            } catch (e) {
                isLoadingStored = false;
            }
        }

        // Load any stored messages for this visitor/business
        loadStoredMessages();

        // Load Config
        fetch(`${apiUrl}/api/widget/config/${businessId}`)
            .then(res => res.json())
            .then(data => {
                        const config = data.widgetConfig || {};

                if (data && data.isDemo) {
                    console.warn('[Fahimo] Widget config returned demo response — business not found or no config for businessId:', businessId);
                    try {
                        // Show a small unobtrusive badge so it's obvious on the page
                        const badge = document.createElement('div');
                        badge.id = 'fahimo-demo-badge';
                        badge.innerText = 'Demo widget (no business config)';
                        badge.style.position = 'fixed';
                        badge.style.bottom = '100px';
                        badge.style.right = '20px';
                        badge.style.padding = '6px 10px';
                        badge.style.background = 'rgba(220,38,38,0.95)';
                        badge.style.color = 'white';
                        badge.style.fontSize = '12px';
                        badge.style.borderRadius = '6px';
                        badge.style.zIndex = '100000';
                        badge.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                        badge.title = 'Widget is using demo/default config because business record was not found on the API';
                        if (!document.getElementById('fahimo-demo-badge')) document.body.appendChild(badge);
                    } catch (e) {}
                }

                // Support widgetVariant switching: if the business prefers the enhanced variant, dynamically load enhanced script
                const serverVariant = (data.widgetVariant || (config.widgetVariant || 'standard')).toLowerCase();
                if (serverVariant === 'enhanced' && !(scriptTag && scriptTag.src && scriptTag.src.indexOf('enhanced') !== -1)) {
                    // Load enhanced script from same API host
                    try {
                        const enhancedSrc = (apiUrl || '').replace(/\/$/, '') + '/fahimo-widget-enhanced.js';
                        if (!document.querySelector('script[src="' + enhancedSrc + '"]')) {
                            const s2 = document.createElement('script');
                            s2.async = true;
                            s2.defer = true;
                            s2.src = enhancedSrc;
                            s2.setAttribute('data-business-id', businessId);
                            s2.setAttribute('data-api-url', apiUrl);
                            s2.crossOrigin = 'anonymous';
                            s2.onload = function() { console.debug('Fahimo enhanced widget loaded via variant switch:', enhancedSrc); };
                            s2.onerror = function() { console.error('Failed to load enhanced variant:', enhancedSrc); };
                            document.body.appendChild(s2);
                        }
                    } catch (e) {
                        console.warn('[Fahimo] Failed to auto-switch to enhanced variant', e);
                    }
                    // Do not continue initializing the basic widget when enhanced variant is used
                    return;
                }

                // Allow script author to override displayed name via data-business-name attribute
                const scriptName = scriptTag && scriptTag.getAttribute && scriptTag.getAttribute('data-business-name');
                const rawName = scriptName || data.name || config.name || "Faheemly Assistant";
                botName = String(rawName || '');
                botName = botName.replace(/demo/gi, '').replace(/\bBusiness\b/gi, '').trim();
                if (!botName) botName = 'Faheemly Assistant';
                document.getElementById('fahimo-bot-name').innerText = botName;

                // expose botName globally so responses can be normalized
                window.__FAHIMO_WIDGET_BOT_NAME = botName;

                if (config.primaryColor) {
                    const color = config.primaryColor;
                    document.getElementById('fahimo-launcher').style.background = color;
                    document.getElementById('fahimo-header').style.background = color;
                    document.getElementById('fahimo-send').style.background = color;
                    const dynamicStyle = document.createElement('style');
                    dynamicStyle.innerHTML = `
                        .fahimo-msg.user { background: ${color} !important; }
                        #fahimo-launcher { background: ${color} !important; }
                        .fahimo-kb-badge { display:inline-block; margin-top:6px; background: rgba(0,0,0,0.05); color: #333; font-size: 0.7em; padding: 2px 6px; border-radius: 6px; margin-left:6px; }
                    `;
                    document.head.appendChild(dynamicStyle);
                }

                // Prefer direct data URL stored in config (if admin uploaded via dashboard) to avoid CORS/404 issues
                if (config.customIconData) {
                    const avatarEl = document.getElementById('fahimo-bot-avatar');
                    const img = document.createElement('img');
                    img.src = config.customIconData;
                    img.alt = 'Bot';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    img.style.display = 'block';
                    img.onerror = function() {
                        try { img.remove(); } catch (e) {}
                        avatarEl.style.background = 'rgba(255,255,255,0.12)';
                        avatarEl.innerText = (botName && botName[0]) ? botName[0] : 'F';
                        console.warn('[Fahimo] custom icon data failed to load, using fallback');
                    };
                    avatarEl.innerHTML = '';
                    avatarEl.appendChild(img);
                    avatarEl.style.background = 'transparent';
                } else if (config.customIconUrl) {
                    const avatarEl = document.getElementById('fahimo-bot-avatar');
                    const img = document.createElement('img');
                    img.src = config.customIconUrl;
                    img.alt = 'Bot';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    img.style.display = 'block';
                    img.onerror = function() {
                        // Fallback: remove broken image and show initial letter or default style
                        try {
                            img.remove();
                        } catch (e) {}
                        avatarEl.style.background = 'rgba(255,255,255,0.12)';
                        avatarEl.innerText = (botName && botName[0]) ? botName[0] : 'F';
                        console.warn('[Fahimo] custom icon failed to load, using fallback');
                    };
                    avatarEl.innerHTML = '';
                    avatarEl.appendChild(img);
                    avatarEl.style.background = 'transparent';
                }

                // Check pre-chat settings
                prechatEnabled = data.preChatFormEnabled || config.preChatEnabled || false;

                        if (!conversationId && messagesDiv && storedMessages.length === 0) {
                    // Sanitize welcome message to remove 'Demo' mentions
                    let welcome = config.welcomeMessage || "Hello! How can I help?";
                    welcome = String(welcome || '').replace(/demo/gi, '').replace(/\bBusiness\b/gi, '').trim();
                    if (!welcome) welcome = "Hello! How can I help?";
                    addMessage(welcome, 'bot');
                }
            })
            .catch(err => console.log('Fahimo: Could not load config'));

        // Auto-refresh: poll widget config periodically and apply live updates when configVersion changes
        (function enableAutoRefresh(){
            try {
                let currentConfigVersion = null;
                // initialize from loaded config if available (attempt a quick HEAD to get version)
                fetch(`${apiUrl}/api/widget/config/${businessId}`).then(r => r.json()).then(d => { currentConfigVersion = d.configVersion || d.widgetConfig?.configVersion || null; }).catch(()=>{});

                const intervalMs = 30 * 1000; // 30s polling
                setInterval(async () => {
                    try {
                        const res = await fetch(`${apiUrl}/api/widget/config/${businessId}?_=${Date.now()}`);
                        if (!res.ok) return;
                        const d = await res.json();
                        const newVer = d.configVersion || (d.widgetConfig && d.widgetConfig.configVersion) || null;
                        if (newVer && newVer !== currentConfigVersion) {
                            currentConfigVersion = newVer;
                            // apply the new config dynamically
                            const cfg = d.widgetConfig || {};
                            // apply primary color
                            if (cfg.primaryColor) {
                                const color = cfg.primaryColor;
                                document.getElementById('fahimo-launcher').style.background = color;
                                document.getElementById('fahimo-header').style.background = color;
                                document.getElementById('fahimo-send').style.background = color;
                                const dynamicStyle = document.createElement('style');
                                dynamicStyle.setAttribute('data-fahimo-refresh', String(Date.now()));
                                dynamicStyle.innerHTML = `
                                    .fahimo-msg.user { background: ${color} !important; }
                                    #fahimo-launcher { background: ${color} !important; }
                                `;
                                document.head.appendChild(dynamicStyle);
                            }
                            // apply avatar updates
                            if (cfg.customIconData) {
                                const avatarEl = document.getElementById('fahimo-bot-avatar');
                                const img = document.createElement('img');
                                img.src = cfg.customIconData;
                                img.alt = 'Bot';
                                img.style.width = '100%'; img.style.height = '100%'; img.style.borderRadius = '50%'; img.style.objectFit = 'cover'; img.style.display = 'block';
                                avatarEl.innerHTML = '';
                                avatarEl.appendChild(img);
                                avatarEl.style.background = 'transparent';
                            } else if (cfg.customIconUrl) {
                                const avatarEl = document.getElementById('fahimo-bot-avatar');
                                const img = document.createElement('img');
                                img.src = cfg.customIconUrl;
                                img.alt = 'Bot';
                                img.style.width = '100%'; img.style.height = '100%'; img.style.borderRadius = '50%'; img.style.objectFit = 'cover'; img.style.display = 'block';
                                img.onerror = function() { try{ img.remove(); }catch(e){}; avatarEl.style.background='rgba(255,255,255,0.12)'; avatarEl.innerText = (window.__FAHIMO_WIDGET_BOT_NAME && window.__FAHIMO_WIDGET_BOT_NAME[0]) ? window.__FAHIMO_WIDGET_BOT_NAME[0] : 'F'; };
                                avatarEl.innerHTML = '';
                                avatarEl.appendChild(img);
                                avatarEl.style.background = 'transparent';
                            }
                        }
                    } catch (e) {
                        // ignore polling errors
                    }
                }, intervalMs);
            } catch (e) {
                // ignore
            }
        })();

        // Send Message
        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, 'user');
            input.value = '';

                const typingId = 'typing-' + Date.now();
            addTypingIndicator(typingId);

            try {
                const res = await fetch(`${apiUrl}/api/chat/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, businessId, conversationId, sessionId })
                });

                const data = await res.json();
                removeTypingIndicator(typingId);

                if (data.conversationId) {
                    conversationId = data.conversationId;
                    safeSetItem('fahimo_conversation_id', conversationId);
                }

                if (data.response) {
                    // Normalize any demo-business mentions in the response to the configured bot name
                    try {
                        const configuredName = window.__FAHIMO_WIDGET_BOT_NAME || (config && (config.name || data.name)) || 'Faheemly Assistant';
                        let resp = String(data.response || '');
                        resp = resp.replace(/Faheemly\s*Demo\s*Business/gi, configuredName);
                        resp = resp.replace(/Demo\s*Business/gi, configuredName);
                        resp = resp.replace(/faheemly\s*demo\s*business/gi, configuredName);
                        const botMsgId = 'bot-' + Date.now();
                        addMessage(resp, 'bot', botMsgId);
                        // If response used KB, show a subtle badge next to the reply
                        if (data.knowledgeBaseUsed) {
                            const badge = document.createElement('div');
                            badge.className = 'fahimo-kb-badge';
                            badge.title = 'هذا الرد استُخرج من قاعدة المعرفة';
                            badge.innerText = 'من قاعدة المعرفة';
                            const botEl = document.getElementById(botMsgId);
                            if (botEl) {
                                botEl.appendChild(document.createElement('br'));
                                botEl.appendChild(badge);
                            }
                        }
                    } catch (e) {
                        addMessage(data.response, 'bot');
                    }
                    // Do not auto-show rating after every reply. Rating is shown
                    // only when the user explicitly ends the chat via End button.
                }
            } catch (err) {
                removeTypingIndicator(typingId);
                addMessage("Sorry, something went wrong.", 'bot');
            }
        }

        // Add Message
        // Simple formatter: supports **bold** and __underline__ and preserves newlines
        function formatMessage(text) {
            if (!text && text !== 0) return '';
            // Escape HTML first
            text = String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            // Bold: **text**
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Underline: __text__
            text = text.replace(/__(.*?)__/g, '<u>$1</u>');
            // Newlines to <br>
            text = text.replace(/\n/g, '<br>');
            return text;
        }

        function addMessage(text, sender, id = null) {
            const div = document.createElement('div');
            div.className = `fahimo-msg ${sender}`;
            if (sender === 'bot') {
                // Allow simple formatting in bot replies
                div.innerHTML = formatMessage(text);
            } else {
                div.innerText = text;
            }
            if (id) div.id = id;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // persist (skip when we're hydrating stored messages or when it's a typing indicator)
            if (isLoadingStored) return;
            if (id && String(id).startsWith('typing-')) return;
            try {
                storedMessages.push({ sender, text, id: id || null, ts: Date.now() });
                saveStoredMessages();
            } catch (e) {}
        }

        function addTypingIndicator(id) {
            const div = document.createElement('div');
            div.className = 'fahimo-msg bot';
            div.id = id;
            div.innerHTML = `<span class="fahimo-typing">جاري الرد<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></span>`;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function removeTypingIndicator(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }

        // Rating System
        stars.forEach(star => {
            star.onclick = () => {
                selectedRating = parseInt(star.getAttribute('data-val'), 10);
                const ratingNum = selectedRating;
                stars.forEach(s => {
                    const starVal = parseInt(s.getAttribute('data-val'), 10);
                    s.style.color = starVal <= ratingNum ? '#FFD700' : '#ccc';
                });
            };
        });

        function showRatingUI() {
            ratingContainer.style.display = 'block';
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }


        // Pre-chat form functions
        function showPrechatForm() {
            prechatFormVisible = true;
            prechatForm.style.display = 'block';
            // Focus on first input
            setTimeout(() => {
                const firstInput = document.getElementById('prechat-name');
                if (firstInput) firstInput.focus();
            }, 100);
        }

        function hidePrechatForm() {
            prechatFormVisible = false;
            prechatForm.style.display = 'none';
        }

        async function submitPrechatForm() {
            const name = document.getElementById('prechat-name').value.trim();
            const email = document.getElementById('prechat-email').value.trim();
            const phone = document.getElementById('prechat-phone').value.trim();
            const request = document.getElementById('prechat-request').value.trim();

            if (!name || !request) {
                alert('يرجى ملء الاسم ووصف الطلب على الأقل');
                return;
            }

            try {
                // Submit pre-chat data
                const res = await fetch(`${apiUrl}/api/chat/pre-chat/${businessId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        name,
                        email,
                        phone,
                        requestSummary: request
                    })
                });

                // Check if response is OK (fetch doesn't reject on HTTP errors)
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `Server returned ${res.status}`);
                }

                // Mark pre-chat as submitted for this session
                safeSetItem(`fahimo_prechat_${businessId}_${sessionId}`, 'true');

                hidePrechatForm();
                openChat();
            } catch (error) {
                console.error('Pre-chat submission error:', error);
                alert('حدث خطأ في إرسال البيانات. يرجى المحاولة مرة أخرى.');
            }
        }

        function openChat() {
            isOpen = true;
            chatWindow.classList.add('fahimo-open');
        }

        // Event Listeners
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

        // Pre-chat form event listeners
        document.getElementById('prechat-submit').onclick = submitPrechatForm;
        document.getElementById('prechat-cancel').onclick = () => {
            hidePrechatForm();
        };

        // End chat/session buttons
        // Note: endSessionBtn is already defined above (line 559), reusing it here
        const endChatBtn = document.getElementById('fahimo-end-chat');
        
        if (endChatBtn) {
            endChatBtn.onclick = () => {
                if (!conversationId) return;
                // Show rating container
                ratingContainer.style.display = 'block';
                inputArea.style.display = 'none';
            };
        }
        
        if (endSessionBtn) {
            endSessionBtn.onclick = async () => {
                try {
                    // Submit rating if selected
                    if (selectedRating > 0) {
                        await fetch(`${apiUrl}/api/rating/conversation`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                conversationId,
                                rating: selectedRating
                            })
                        });
                    }
                    
                    // Clear conversation and close chat
                    conversationId = null;
                    safeRemoveItem('fahimo_conversation_id');
                    storedMessages = [];
                    saveStoredMessages();
                    
                    // Clear messages and show welcome
                    messagesDiv.innerHTML = '';
                    addMessage('شكراً لك! تم إنهاء المحادثة. إذا كنت بحاجة لمساعدة مرة أخرى، يمكنك بدء محادثة جديدة.', 'bot');
                    
                    // Hide rating and show input
                    ratingContainer.style.display = 'none';
                    inputArea.style.display = 'flex';
                    
                    // Close chat window
                    isOpen = false;
                    chatWindow.classList.remove('fahimo-open');
                    
                } catch (error) {
                    console.error('End session error:', error);
                }
            };
        }


        // Support both click and touch on mobile to toggle the launcher
        let touchHandled = false;
        function toggleLauncher(e) {
            if (e && e.type === 'touchstart') {
                touchHandled = true;
            } else if (touchHandled && e && e.type === 'click') {
                // prevent duplicate click after touch
                touchHandled = false;
                return;
            }

            // If the chat is already open, clicking the launcher should close it
            if (isOpen) {
                isOpen = false;
                chatWindow.classList.remove('fahimo-open');
                // hide prechat form if visible
                if (prechatFormVisible) hidePrechatForm();
                return;
            }

            // If prechat is enabled and there's no conversation yet, show the form if not submitted
            if (prechatEnabled && !conversationId) {
                const prechatSubmitted = safeGetItem(`fahimo_prechat_${businessId}_${sessionId}`);
                if (!prechatSubmitted) {
                    showPrechatForm();
                    return;
                }
            }

            // Otherwise, open the chat window
            openChat();
        }

        launcher.onclick = toggleLauncher;
        launcher.ontouchstart = toggleLauncher;
        // close handler: support touchstart and click
        function closeHandler(e) {
            if (e && e.type === 'touchstart') touchHandled = true;
            isOpen = false;
            chatWindow.classList.remove('fahimo-open');
            if (prechatFormVisible) hidePrechatForm();
        }
        closeBtn.onclick = closeHandler;
        closeBtn.ontouchstart = closeHandler;
    } catch (e) {
        console.error('Fahimo widget init error', e);
    }

})();
