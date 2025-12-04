(function() {
    // Fahimo Widget - The "Understanding" Interface
    // Non-removable branding: "Powered by Fahimo"
    
    const scriptTag = document.currentScript;
    const businessId = scriptTag.getAttribute('data-business-id');
    const apiUrl = 'http://localhost:3001'; // Change for production

    if (!businessId) {
        console.error('Fahimo: Business ID is missing.');
        return;
    }

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #fahimo-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: 'Tajawal', 'Segoe UI', sans-serif;
        }
        #fahimo-launcher {
            width: 60px;
            height: 60px;
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
        #fahimo-launcher:hover {
            transform: scale(1.1);
        }
        #fahimo-launcher svg {
            width: 30px;
            height: 30px;
            fill: white;
        }
        #fahimo-chat-window {
            display: none;
            width: 380px;
            height: 600px;
            max-height: 80vh;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            flex-direction: column;
            overflow: hidden;
            position: absolute;
            bottom: 80px;
            right: 0;
            animation: fahimo-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(0,0,0,0.05);
        }
        @keyframes fahimo-slide-up {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        #fahimo-header {
            background: linear-gradient(135deg, #003366, #001a33);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        #fahimo-bot-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #fahimo-bot-avatar {
            width: 35px;
            height: 35px;
            background: rgba(255,255,255,0.1);
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
    `;
    document.head.appendChild(style);

    // Create Widget HTML
    const container = document.createElement('div');
    container.id = 'fahimo-widget-container';
    container.innerHTML = `
        <div id="fahimo-chat-window">
            <div id="fahimo-header">
                <div id="fahimo-bot-info">
                    <div id="fahimo-bot-avatar">F</div>
                    <div>
                        <div id="fahimo-bot-name" style="font-weight:bold; font-size:15px;">مساعد فهملي</div>
                        <div style="font-size:11px; opacity:0.8;">● Online</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <span style="cursor:pointer; font-size:12px; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px;" id="fahimo-end-chat">End</span>
                    <span style="cursor:pointer; opacity:0.7;" id="fahimo-close">✕</span>
                </div>
            </div>
            <div id="fahimo-messages"></div>
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

    // Logic
    const launcher = document.getElementById('fahimo-launcher');
    const chatWindow = document.getElementById('fahimo-chat-window');
    const closeBtn = document.getElementById('fahimo-close');
    const input = document.getElementById('fahimo-input');
    const sendBtn = document.getElementById('fahimo-send');
    const messagesDiv = document.getElementById('fahimo-messages');
    let isOpen = false;
    let conversationId = localStorage.getItem('fahimo_conversation_id');

    // Load Config
    fetch(`${apiUrl}/api/widget/config/${businessId}`)
        .then(res => res.json())
        .then(data => {
            const config = data.widgetConfig || {};
            // Use business name from data.name, fallback to config.name, then default
            const botName = data.name || config.name || "مساعد فهملي";
            document.getElementById('fahimo-bot-name').innerText = botName;
            
            // Add welcome message if no history
            if (!conversationId) {
                addMessage(config.welcomeMessage || "Hello! How can I help?", 'bot');
            } else {
                // Load history (optional, skipping for simplicity)
            }
        })
        .catch(err => console.log('Fahimo: Could not load config'));

    if (sendBtn) sendBtn.onclick = sendMessage;
    if (input) input.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };

    async function sendMessage() {
        const text = input.value.trim();
        if(!text) return;
        
        addMessage(text, 'user');
        input.value = '';
        
        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        addMessage('...', 'bot', typingId);

        try {
            const res = await fetch(`${apiUrl}/api/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text, 
                    businessId, 
                    conversationId 
                })
            });
            
            const data = await res.json();
            
            // Remove typing indicator
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();

            if (data.conversationId) {
                conversationId = data.conversationId;
                localStorage.setItem('fahimo_conversation_id', conversationId);
            }

            if (data.response) {
                addMessage(data.response, 'bot');
            }
            
            // Check for handover action or rating request
            if (data.action === 'handover_complete') {
                // Maybe show a special UI
            }

        } catch (err) {
            console.error(err);
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();
            addMessage("Sorry, something went wrong.", 'bot');
        }
    }

    function addMessage(text, sender, id = null) {
        const div = document.createElement('div');
        div.className = `fahimo-msg ${sender}`;
        div.innerText = text;
        if(id) div.id = id;
        if (messagesDiv) {
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }

    const endBtn = document.getElementById('fahimo-end-chat');
    
    if (endBtn) endBtn.onclick = () => {
        if (!conversationId) return;
        showRatingUI();
    };

    function showRatingUI() {
        const div = document.createElement('div');
        div.className = 'fahimo-msg bot';
        div.style.textAlign = 'center';
        div.innerHTML = `
            <div style="margin-bottom:10px; font-weight:bold;">Rate your experience</div>
            <div style="display:flex; justify-content:center; gap:5px; margin-bottom:10px;">
                ${[1,2,3,4,5].map(i => `<span class="fahimo-star" data-val="${i}" style="cursor:pointer; font-size:20px; color:#ccc;">★</span>`).join('')}
            </div>
            <textarea id="fahimo-feedback" placeholder="Any feedback?" style="width:100%; border:1px solid #eee; border-radius:5px; padding:5px; font-size:12px;"></textarea>
            <button id="fahimo-submit-rating" style="margin-top:5px; background:#003366; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; width:100%;">Submit</button>
        `;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        const stars = div.querySelectorAll('.fahimo-star');
        let selectedRating = 0;

        stars.forEach(star => {
            star.onclick = () => {
                selectedRating = star.getAttribute('data-val');
                stars.forEach(s => s.style.color = s.getAttribute('data-val') <= selectedRating ? '#FFD700' : '#ccc');
            };
        });

        div.querySelector('#fahimo-submit-rating').onclick = async () => {
            if (!selectedRating) return;
            const feedback = div.querySelector('#fahimo-feedback').value;
            
            try {
                await fetch(`${apiUrl}/api/chat/rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversationId, rating: selectedRating, feedback })
                });
                div.innerHTML = '<div style="color:green;">Thank you for your feedback!</div>';
                localStorage.removeItem('fahimo_conversation_id');
                conversationId = null;
            } catch (e) {
                console.error(e);
            }
        };
    }

    if (launcher) launcher.onclick = () => {
        isOpen = !isOpen;
        if (chatWindow) chatWindow.style.display = isOpen ? 'flex' : 'none';
    };
    if (closeBtn) closeBtn.onclick = () => {
        isOpen = false;
        if (chatWindow) chatWindow.style.display = 'none';
    };

})();
