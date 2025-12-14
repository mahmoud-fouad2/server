import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Bot, MessageSquare, Loader2, Bell } from 'lucide-react';
import { chatApi, authApi } from '@/lib/api';
import { io } from 'socket.io-client';
import { API_CONFIG } from '@/lib/config';

export default function ConversationsView() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let mounted = true;
    let localSocket = null;

    const init = async () => {
      try {
        // fetch conversations (local helper)
        try {
          const response = await chatApi.getConversations();
          const conversationsList = Array.isArray(response) ? response : (response.data || []);
          if (mounted) setConversations(conversationsList);
        } catch (err) {
          console.error('Failed to fetch conversations (init):', err);
          if (mounted) setConversations([]);
        } finally {
          // Ensure the loading spinner is cleared after initial fetch attempt
          if (mounted) setLoading(false);
        }

        // setup socket
        try {
          const profile = await authApi.getProfile();
          if (profile && profile.businessId) {
            localSocket = io(API_CONFIG.BASE_URL.replace('/api', ''), { transports: ['websocket'] });

            localSocket.on('connect', () => {
              // ...existing code...
              localSocket.emit('join_room', `business_${profile.businessId}`);
            });

            localSocket.on('handover_request', (data) => {
              playNotificationSound();
              if (Notification.permission === 'granted') {
                new Notification('طلب مساعدة جديد', { body: data.message });
              }
              // refresh list
              (async () => {
                try {
                  const r2 = await chatApi.getConversations();
                  const list = Array.isArray(r2) ? r2 : (r2.data || []);
                  if (mounted) setConversations(list);
                } catch (e) {
                  console.error('Failed to refresh conversations after handover:', e);
                }
              })();
            });

            if (mounted) setSocket(localSocket);

            if (Notification.permission !== 'granted') {
              Notification.requestPermission();
            }
          }
        } catch (e) {
          console.error('Socket setup failed', e);
        }
      } catch (e) {
        console.error('Initialization failed', e);
      }
    };

    init();

    return () => {
      mounted = false;
      if (localSocket) localSocket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  // helper: produce a compact, friendly visitor id (alphanumeric, upper, first 6 chars)
  const formatVisitorId = id => {
    try {
      if (!id) return '—';
      const s = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return s.length <= 6 ? s : s.slice(0, 6);
    } catch (e) {
      return String(id).slice(-4);
    }
  };

  // helper: sanitize assistant/demo strings from message content for UI
  const sanitizeContent = txt => {
    if (!txt) return txt;
    return String(txt)
      .replace(/Faheemly Demo Business/gi, 'فريق الدعم')
      .replace(/Faheemly Demo/gi, 'فهملي')
      .trim();
  };

  // Render assistant content: support numbered lists for multi-line replies and **bold**
  const renderAssistantContent = (txt, role) => {
    if (!txt) return null;
    const content = sanitizeContent(txt);
    const lines = String(content).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const isAssistant = role && role !== 'USER' && role !== 'user';

    const parseBold = text => {
      const parts = [];
      const regex = /(\*\*([^*]+)\*\*)/g;
      let last = 0;
      let m;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        parts.push(<strong key={m.index} className="font-semibold">{m[2]}</strong>);
        last = m.index + m[0].length;
      }
      if (last < text.length) parts.push(text.slice(last));
      return parts;
    };

    if (isAssistant && lines.length > 1) {
      return (
        <ol className="list-decimal list-inside space-y-1">
          {lines.map((ln, i) => (
            <li key={i} className="text-sm">
              {parseBold(ln)}
            </li>
          ))}
        </ol>
      );
    }

    return <div className="text-sm">{parseBold(content)}</div>;
  };

  const fetchConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      // Handle both array and paginated response format
      const conversationsList = Array.isArray(response) ? response : (response.data || []);
      setConversations(conversationsList);
    } catch (err) {
      console.error(err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async conv => {
    setSelectedConversation(conv);
    try {
      const response = await chatApi.getMessages(conv.id);
      // Handle both array and paginated response format
      const messagesList = Array.isArray(response) ? response : (response.data || []);
      setConversationMessages(messagesList);
      // Mark messages as read for business
      try { await chatApi.markRead(conv.id); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('unread:changed')); } catch (e) {}
    } catch (err) {
      console.error(err);
      setConversationMessages([]);
    }
  };

  const sendReply = async e => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedConversation) return;
    setSendingReply(true);
    try {
      const newMsg = await chatApi.reply(selectedConversation.id, replyInput);
      setConversationMessages(prev => [...prev, newMsg]);
      setReplyInput('');
    } catch (err) {
      console.error('Failed to send reply', err);
      // Ideally show notification here
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      // Use a responsive height: on small screens use min-height so content can grow,
      // on large screens keep the previous fixed available-height layout.
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[60vh] lg:h-[calc(100vh-250px)]"
    >
      {/* Conversations List */}
      <Card className="lg:col-span-1 flex flex-col h-full">
        <CardHeader>
          <CardTitle>المحادثات النشطة</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد محادثات
            </div>
            ) : (
            <>
              {conversations.slice(0, showAll ? conversations.length : 10).map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-muted'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">
                    {conv.country || conv.countryCode || '—'} • {formatVisitorId(conv.id)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conv.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {sanitizeContent(conv.messages[0]?.content) || 'لا توجد رسائل'}
                </div>
              </div>
              ))}
              {conversations.length > 10 && (
                <div className="flex justify-center mt-4">
                  <Button size="sm" onClick={() => setShowAll(s => !s)} className="bg-brand-600 text-white hover:bg-brand-700">
                    {showAll ? 'عرض أقل' : `عرض الكل (${conversations.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {selectedConversation.country || selectedConversation.countryCode || '—'} • {formatVisitorId(selectedConversation.id)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    عبر {selectedConversation.channel}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {conversationMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'ASSISTANT' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    {msg.role === 'ASSISTANT' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 border border-border rounded-tr-none'}`}
                  >
                    {renderAssistantContent(msg.content, msg.role)}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t p-3">
              <form onSubmit={sendReply} className="flex w-full gap-2">
                <Input
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button
                  type="submit"
                  disabled={sendingReply || !replyInput.trim()}
                >
                  {sendingReply ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'إرسال'
                  )}
                </Button>
              </form>
            </CardFooter>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>اختر محادثة للبدء</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
