'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { API_CONFIG } from '@/lib/config';

const SalesBot = ({ lang = 'ar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'أهلاً بك في فهملي! 👋 هل تبحث عن حل لزيادة مبيعاتك؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef(null);
  const pathname = usePathname();

  // Hide on dashboard, admin, login, register, wizard pages
  const hiddenPaths = [
    '/dashboard',
    '/admin',
    '/login',
    '/register',
    '/wizard',
  ];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isBotTyping]);

  if (shouldHide) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsBotTyping(true);

    try {
      // Using production chat endpoint with Faheemly business ID
      const FAHEEMLY_BUSINESS_ID = 'cmir2oyaz00013ltwis4xc4tp'; // Faheemly's business ID

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: FAHEEMLY_BUSINESS_ID,
          message: userText,
          visitorId: 'landing-page-visitor', // Unique identifier for landing page visitors
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        console.error('Chat error:', data);
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.',
          },
        ]);
      }
    } catch (error) {
      console.error('Chat network error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.',
        },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans"
      dir="rtl"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-panel w-80 h-[32rem] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden border border-white/10 ring-1 ring-black/5 bg-white dark:bg-gray-900"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative overflow-hidden border border-white/20 backdrop-blur-sm">
                  <img
                    src="/logo.webp"
                    alt="Bot"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-brand-600 z-10 animate-pulse"></span>
                </div>
                <div>
                  <p className="font-bold text-sm">مساعد فهملي</p>
                  <p className="text-[10px] opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                    متصل الآن
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1.5 transition-colors relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm"
              ref={scrollRef}
            >
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm backdrop-blur-md ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none shadow-brand-500/20'
                        : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isBotTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-white/10 p-3.5 rounded-2xl rounded-bl-none shadow-sm backdrop-blur-md flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-white/5 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                  placeholder="اكتب رسالتك..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={isBotTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isBotTyping}
                  className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-center pt-1">
                <a
                  href="/"
                  className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap size={10} className="text-brand-500" /> مدعوم بواسطة
                  فهملي AI
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white rounded-full shadow-xl shadow-brand-500/40 flex items-center justify-center transition-all relative group"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20"></span>
        {isOpen ? (
          <X size={28} />
        ) : (
          <MessageCircle size={32} className="fill-current" />
        )}
      </motion.button>
    </div>
  );
};

export default SalesBot;
