(function() {
    // Fahimo Widget - Enhanced Version with Tabs, Audio, and Avatar Support
    if (window.__FAHIMO_WIDGET_ENHANCED_LOADED) return;
    window.__FAHIMO_WIDGET_ENHANCED_LOADED = true;

    const scriptTag = document.currentScript;
    const businessId = scriptTag && scriptTag.getAttribute && scriptTag.getAttribute('data-business-id');
    const apiUrl = 'https://fahimo-api.onrender.com';

    if (!businessId) {
        console.error('Fahimo: Business ID is missing.');
        return;
    }

    // ===== AUDIO MANAGER =====
    class AudioManager {
        constructor() {
            this.enabled = this.getSoundPreference();
            this.audioContext = null;
            this.notificationSound = null;
        }

        getSoundPreference() {
            try {
                return localStorage.getItem('fahimo_sound_enabled') !== 'false';
            } catch (e) {
                return true;
            }
        }

        setSoundPreference(enabled) {
            this.enabled = enabled;
            try {
                localStorage.setItem('fahimo_sound_enabled', enabled);
            } catch (e) {}
        }

        playNotification() {
            if (!this.enabled) return;
            this.playTone(800, 100);
        }

        playTone(frequency, duration) {
            try {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                const ctx = this.audioContext;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = frequency;
                osc.type = 'sine';

                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration / 1000);
            } catch (e) {
                console.debug('Audio not available:', e);
            }
        }

        toggle() {
            this.setSoundPreference(!this.enabled);
            return this.enabled;
        }
    }

    const audioManager = new AudioManager();

    // ===== AVATAR MANAGER =====
    const AVATAR_OPTIONS = [
        { id: 'avatar1', name: 'أحمد', emoji: '👨‍💼', color: '#3B82F6' },
        { id: 'avatar2', name: 'فاطمة', emoji: '👩‍💼', color: '#EC4899' },
        { id: 'avatar3', name: 'محمد', emoji: '👨‍💻', color: '#10B981' },
    ];

    function getSelectedAvatar() {
        try {
            const saved = localStorage.getItem('fahimo_selected_avatar');
            return saved || AVATAR_OPTIONS[0].id;
        } catch (e) {
            return AVATAR_OPTIONS[0].id;
        }
    }

    function setSelectedAvatar(avatarId) {
        try {
            localStorage.setItem('fahimo_selected_avatar', avatarId);
        } catch (e) {}
    }

    function getAvatarData(avatarId) {
        return AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[0];
    }

    // ===== STYLES =====
    const style = document.createElement('style');
    style.textContent = `
        #fahimo-enhanced-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            direction: rtl;
        }

        #fahimo-widget-tabs {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 380px;
            max-height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Header */
        #fahimo-tab-header {
            background: linear-gradient(135deg, #003366 0%, #001a33 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        #fahimo-header-title {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        #fahimo-avatar-badge {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border: 2px solid rgba(255,255,255,0.3);
        }

        #fahimo-bot-status {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        #fahimo-bot-name {
            font-weight: 600;
            font-size: 14px;
        }

        #fahimo-bot-status-text {
            font-size: 12px;
            opacity: 0.85;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        #fahimo-online-indicator {
            width: 8px;
            height: 8px;
            background: #34d399;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        #fahimo-header-controls {
            display: flex;
            gap: 8px;
        }

        .fahimo-icon-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 0.2s;
        }

        .fahimo-icon-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        /* Tab Navigation - Bottom */
        #fahimo-bottom-nav {
            display: flex;
            background: white;
            border-top: 1px solid #e5e7eb;
            gap: 0;
        }

        .fahimo-tab-btn {
            flex: 1;
            background: white;
            border: none;
            padding: 12px 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 12px;
            color: #6b7280;
            transition: all 0.2s;
            border-bottom: 3px solid transparent;
        }

        .fahimo-tab-btn:hover {
            background: #f3f4f6;
        }

        .fahimo-tab-btn.active {
            color: #003366;
            border-bottom-color: #003366;
            background: #f0f4ff;
        }

        .fahimo-tab-icon {
            font-size: 18px;
        }

        /* Content Areas */
        #fahimo-tab-content {
            flex: 1;
            overflow-y: auto;
            background: white;
            display: flex;
            flex-direction: column;
        }

        .fahimo-tab-pane {
            display: none;
            flex: 1;
            padding: 16px;
            overflow-y: auto;
        }

        .fahimo-tab-pane.active {
            display: flex;
            flex-direction: column;
        }

        /* Chat Tab */
        #fahimo-chat-area {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .fahimo-message {
            max-width: 80%;
            padding: 12px 14px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.4;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fahimo-message.user {
            background: #003366;
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }

        .fahimo-message.bot {
            background: #f3f4f6;
            color: #1f2937;
            margin-right: auto;
            border-bottom-left-radius: 4px;
        }

        #fahimo-input-area {
            display: flex;
            gap: 10px;
            padding: 12px;
            background: white;
            border-top: 1px solid #e5e7eb;
        }

        #fahimo-message-input {
            flex: 1;
            border: 1px solid #d1d5db;
            padding: 10px 14px;
            border-radius: 20px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }

        #fahimo-message-input:focus {
            border-color: #003366;
        }

        #fahimo-send-btn {
            background: #003366;
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 0.2s;
        }

        #fahimo-send-btn:hover {
            background: #002244;
        }

        /* Files Tab */
        #fahimo-files-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .fahimo-file-item {
            padding: 12px;
            background: #f3f4f6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .fahimo-file-item:hover {
            background: #e5e7eb;
        }

        .fahimo-file-icon {
            font-size: 20px;
        }

        .fahimo-file-info {
            flex: 1;
        }

        .fahimo-file-name {
            font-weight: 500;
            font-size: 13px;
            color: #1f2937;
        }

        .fahimo-file-size {
            font-size: 11px;
            color: #6b7280;
        }

        /* Info Tab */
        #fahimo-info-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .fahimo-info-item {
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
            border-right: 3px solid #003366;
        }

        .fahimo-info-label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .fahimo-info-value {
            font-size: 13px;
            color: #1f2937;
            font-weight: 500;
        }

        /* Settings Tab - Avatar Selection */
        #fahimo-avatar-selector {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .fahimo-avatar-option {
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .fahimo-avatar-option:hover {
            border-color: #003366;
            background: #f0f4ff;
        }

        .fahimo-avatar-option.selected {
            border-color: #003366;
            background: #e0ecff;
        }

        .fahimo-avatar-emoji {
            font-size: 32px;
        }

        .fahimo-avatar-name {
            font-size: 12px;
            font-weight: 500;
            color: #1f2937;
        }

        /* Sound Toggle */
        #fahimo-sound-toggle {
            padding: 12px;
            background: #f3f4f6;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
        }

        .fahimo-toggle-switch {
            width: 48px;
            height: 28px;
            background: #d1d5db;
            border: none;
            border-radius: 14px;
            cursor: pointer;
            position: relative;
            transition: background 0.3s;
        }

        .fahimo-toggle-switch.enabled {
            background: #10b981;
        }

        .fahimo-toggle-switch::after {
            content: '';
            position: absolute;
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            top: 2px;
            right: 2px;
            transition: right 0.3s;
        }

        .fahimo-toggle-switch.enabled::after {
            right: 22px;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
            #fahimo-widget-tabs {
                width: calc(100% - 20px);
                max-height: calc(100vh - 100px);
            }
        }

        /* Scrollbar */
        #fahimo-tab-content::-webkit-scrollbar {
            width: 6px;
        }

        #fahimo-tab-content::-webkit-scrollbar-track {
            background: transparent;
        }

        #fahimo-tab-content::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
        }

        #fahimo-tab-content::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }
    `;
    document.head.appendChild(style);

    // ===== HTML STRUCTURE =====
    const container = document.createElement('div');
    container.id = 'fahimo-enhanced-widget';
    container.innerHTML = `
        <div id="fahimo-widget-tabs">
            <!-- Header -->
            <div id="fahimo-tab-header">
                <div id="fahimo-header-title">
                    <div id="fahimo-avatar-badge">👤</div>
                    <div id="fahimo-bot-status">
                        <div id="fahimo-bot-name">Faheemly</div>
                        <div id="fahimo-bot-status-text">
                            <span id="fahimo-online-indicator"></span>
                            <span>متاح</span>
                        </div>
                    </div>
                </div>
                <div id="fahimo-header-controls">
                    <button class="fahimo-icon-btn" id="fahimo-sound-toggle-btn" title="تبديل الصوت">🔊</button>
                    <button class="fahimo-icon-btn" id="fahimo-close-btn" title="إغلاق">×</button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="fahimo-tab-content">
                <!-- Chat Tab -->
                <div id="fahimo-chat-pane" class="fahimo-tab-pane active">
                    <div id="fahimo-chat-area"></div>
                </div>

                <!-- Files Tab -->
                <div id="fahimo-files-pane" class="fahimo-tab-pane">
                    <div id="fahimo-files-list">
                        <div class="fahimo-file-item">
                            <div class="fahimo-file-icon">📄</div>
                            <div class="fahimo-file-info">
                                <div class="fahimo-file-name">متطلبات المشروع</div>
                                <div class="fahimo-file-size">245 KB</div>
                            </div>
                        </div>
                        <div class="fahimo-file-item">
                            <div class="fahimo-file-icon">📊</div>
                            <div class="fahimo-file-info">
                                <div class="fahimo-file-name">تقرير الأداء</div>
                                <div class="fahimo-file-size">512 KB</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info Tab -->
                <div id="fahimo-info-pane" class="fahimo-tab-pane">
                    <div id="fahimo-info-content">
                        <div class="fahimo-info-item">
                            <div class="fahimo-info-label">🔗 أيقونة الويدجت</div>
                            <div class="fahimo-info-value">قابل للتخصيص من الداشبورد</div>
                        </div>
                        <div class="fahimo-info-item">
                            <div class="fahimo-info-label">⚡ الحالة</div>
                            <div class="fahimo-info-value">نشط ومتاح 24/7</div>
                        </div>
                        <div class="fahimo-info-item">
                            <div class="fahimo-info-label">🌐 اللغة</div>
                            <div class="fahimo-info-value">عربي (جميع اللهجات)</div>
                        </div>
                    </div>
                </div>

                <!-- Settings Tab -->
                <div id="fahimo-settings-pane" class="fahimo-tab-pane">
                    <h3 style="margin: 0 0 12px; font-size: 14px; color: #1f2937;">اختر الأفاتار</h3>
                    <div id="fahimo-avatar-selector"></div>
                    <div id="fahimo-sound-toggle">
                        <span style="font-size: 13px; color: #1f2937; font-weight: 500;">🔔 إشعارات صوتية</span>
                        <button class="fahimo-toggle-switch ${audioManager.enabled ? 'enabled' : ''}"></button>
                    </div>
                </div>
            </div>

            <!-- Input Area (Chat) -->
            <div id="fahimo-input-area">
                <input type="text" id="fahimo-message-input" placeholder="اكتب رسالتك..." />
                <button id="fahimo-send-btn">📤</button>
            </div>

            <!-- Bottom Navigation -->
            <div id="fahimo-bottom-nav">
                <button class="fahimo-tab-btn active" data-tab="chat">
                    <span class="fahimo-tab-icon">💬</span>
                    <span>دردشة</span>
                </button>
                <button class="fahimo-tab-btn" data-tab="files">
                    <span class="fahimo-tab-icon">📁</span>
                    <span>ملفات</span>
                </button>
                <button class="fahimo-tab-btn" data-tab="info">
                    <span class="fahimo-tab-icon">ℹ️</span>
                    <span>معلومات</span>
                </button>
                <button class="fahimo-tab-btn" data-tab="settings">
                    <span class="fahimo-tab-icon">⚙️</span>
                    <span>الإعدادات</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // ===== AVATAR INITIALIZATION =====
    const renderAvatars = () => {
        const selector = document.getElementById('fahimo-avatar-selector');
        selector.innerHTML = AVATAR_OPTIONS.map(avatar => `
            <div class="fahimo-avatar-option ${getSelectedAvatar() === avatar.id ? 'selected' : ''}" data-avatar="${avatar.id}">
                <div class="fahimo-avatar-emoji">${avatar.emoji}</div>
                <div class="fahimo-avatar-name">${avatar.name}</div>
            </div>
        `).join('');

        document.querySelectorAll('.fahimo-avatar-option').forEach(el => {
            el.addEventListener('click', () => {
                const avatarId = el.dataset.avatar;
                setSelectedAvatar(avatarId);
                document.querySelectorAll('.fahimo-avatar-option').forEach(e => e.classList.remove('selected'));
                el.classList.add('selected');
                
                const avatar = getAvatarData(avatarId);
                document.getElementById('fahimo-avatar-badge').textContent = avatar.emoji;
            });
        });
    };

    // ===== TAB SWITCHING =====
    document.querySelectorAll('.fahimo-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.fahimo-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.fahimo-tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`fahimo-${tabName}-pane`).classList.add('active');
        });
    });

    // ===== SOUND CONTROL =====
    document.getElementById('fahimo-sound-toggle-btn').addEventListener('click', () => {
        audioManager.toggle();
        const btn = document.getElementById('fahimo-sound-toggle-btn');
        btn.textContent = audioManager.enabled ? '🔊' : '🔇';
        
        const toggle = document.querySelector('.fahimo-toggle-switch');
        toggle.classList.toggle('enabled');
        
        if (audioManager.enabled) {
            audioManager.playNotification();
        }
    });

    document.querySelector('.fahimo-toggle-switch').addEventListener('click', () => {
        audioManager.toggle();
        document.querySelector('.fahimo-toggle-switch').classList.toggle('enabled');
        document.getElementById('fahimo-sound-toggle-btn').textContent = audioManager.enabled ? '🔊' : '🔇';
    });

    // ===== CHAT FUNCTIONALITY =====
    const chatArea = document.getElementById('fahimo-chat-area');
    
    const addMessage = (text, isUser = false) => {
        const msg = document.createElement('div');
        msg.className = `fahimo-message ${isUser ? 'user' : 'bot'}`;
        msg.textContent = text;
        chatArea.appendChild(msg);
        chatArea.scrollTop = chatArea.scrollHeight;
        
        if (!isUser) {
            audioManager.playNotification();
        }
    };

    document.getElementById('fahimo-send-btn').addEventListener('click', () => {
        const input = document.getElementById('fahimo-message-input');
        const text = input.value.trim();
        
        if (text) {
            addMessage(text, true);
            input.value = '';
            
            setTimeout(() => {
                addMessage('شكراً على رسالتك! سيتم الرد عليك قريباً.', false);
            }, 500);
        }
    });

    document.getElementById('fahimo-message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('fahimo-send-btn').click();
        }
    });

    // ===== CLOSE BUTTON =====
    document.getElementById('fahimo-close-btn').addEventListener('click', () => {
        document.getElementById('fahimo-widget-tabs').style.display = 'none';
    });

    // ===== INITIALIZATION =====
    renderAvatars();
    
    // Update avatar badge
    const selectedAvatar = getAvatarData(getSelectedAvatar());
    document.getElementById('fahimo-avatar-badge').textContent = selectedAvatar.emoji;
    
    // Update sound button
    document.getElementById('fahimo-sound-toggle-btn').textContent = audioManager.enabled ? '🔊' : '🔇';

    // Welcome message
    setTimeout(() => {
        addMessage('مرحباً! كيف يمكنني مساعدتك؟', false);
    }, 500);
})();
