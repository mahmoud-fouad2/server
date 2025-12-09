'use client';

import { useState, useEffect } from 'react';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';

const DEMO_CONVERSATION = [
  {
    user: 'أهلاً بك! 👋 أنا فهملي، مساعدك الذكي. قرأت المنيو بالكامل وأنا جاهز لاستقبال طلبات زبائنك. كيف أقدر أساعدك اليوم؟',
    bot: '',
    actions: [],
  },
  {
    user: 'عندكم خيارات نباتية للغداء؟ 🥗',
    bot: 'أكيد! عندنا خيارات مميزة:\n✓ سلطة الكينوا مع الأفوكادو\n✓ برجر نباتي (Beyond Meat)\n✓ باستا الخضروات المشوية',
    actions: ['اطلب الآن', 'عرض الصور'],
  },
];

export default function DemoChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content:
        'أهلاً بك! 👋 أنا فهملي، مساعدك الذكي. قرأت المنيو بالكامل وأنا جاهز لاستقبال طلبات زبائنك. كيف أقدر أساعدك اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // use the module-level DEMO_CONVERSATION

  useEffect(() => {
    if (currentStep < DEMO_CONVERSATION.length) {
      const timer = setTimeout(() => {
        // Add user message
        setMessages(prev => [
          ...prev,
          {
            role: 'user',
            content: DEMO_CONVERSATION[currentStep].user,
            timestamp: new Date(),
          },
        ]);

        // Show typing indicator
        setIsTyping(true);

        // Add bot response after delay
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              content: DEMO_CONVERSATION[currentStep].bot,
              actions: DEMO_CONVERSATION[currentStep].actions,
              timestamp: new Date(),
            },
          ]);
          setCurrentStep(prev => prev + 1);
        }, 2000);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleSend = message => {
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content:
            'شكراً لرسالتك! هذا مثال توضيحي. في النظام الحقيقي، سأرد على استفساراتك بذكاء. 🤖',
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto" dir="rtl">
      <div
        className="bg-white dark:bg-cosmic-900 rounded-2xl shadow-2xl border border-gray-300 dark:border-white/20 overflow-hidden"
        style={{ minHeight: '600px' }}
      >
        <ChatHeader />
        <MessageList messages={messages} isTyping={isTyping} />
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
