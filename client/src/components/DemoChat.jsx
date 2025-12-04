"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'

export default function DemoChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'أهلاً بك! 👋 أنا فهملي، مساعدك الذكي. قرأت المنيو بالكامل وأنا جاهز لاستقبال طلبات زبائنك. كيف أقدر أساعدك اليوم؟',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const conversation = [
    {
      user: 'عندكم خيارات نباتية للغداء؟ 🥗',
      bot: 'أكيد! عندنا خيارات مميزة:\n✓ سلطة الكينوا مع الأفوكادو\n✓ برجر نباتي (Beyond Meat)\n✓ باستا الخضروات المشوية',
      actions: ['اطلب الآن', 'عرض الصور']
    }
  ]

  useEffect(() => {
    if (currentStep < conversation.length) {
      const timer = setTimeout(() => {
        // Add user message
        setMessages(prev => [...prev, {
          role: 'user',
          content: conversation[currentStep].user,
          timestamp: new Date()
        }])

        // Show typing indicator
        setIsTyping(true)

        // Add bot response after delay
        setTimeout(() => {
          setIsTyping(false)
          setMessages(prev => [...prev, {
            role: 'bot',
            content: conversation[currentStep].bot,
            actions: conversation[currentStep].actions,
            timestamp: new Date()
          }])
          setCurrentStep(prev => prev + 1)
        }, 2000)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }])
    setInputValue('')
    
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'شكراً لرسالتك! هذا مثال توضيحي. في النظام الحقيقي، سأرد على استفساراتك بذكاء. 🤖',
        timestamp: new Date()
      }])
    }, 1500)
  }

  return (
    <div className="w-full max-w-md mx-auto" dir="rtl">
      <div className="bg-white dark:bg-cosmic-900 rounded-3xl shadow-2xl border-2 border-brand-500/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">Faheemly AI</div>
              <div className="text-xs opacity-90">المساعد الذكي</div>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-cosmic-950/50">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white' 
                    : 'bg-white dark:bg-cosmic-900 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
                }`}>
                  {msg.role === 'bot' && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <Sparkles size={12} />
                      <span className="font-semibold">Faheemly AI</span>
                    </div>
                  )}
                  <div className="whitespace-pre-line text-sm">{msg.content}</div>
                  {msg.actions && (
                    <div className="flex gap-2 mt-3">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="text-xs opacity-75 mt-1 text-left">أنت</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div className="bg-white dark:bg-cosmic-900 rounded-2xl px-4 py-3 border border-gray-200 dark:border-white/10">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-cosmic-900 border-t border-gray-200 dark:border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالتك..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-cosmic-950 border-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <Sparkles size={12} />
            <span>مدعوم بالذكاء الاصطناعي</span>
          </div>
        </div>

        {/* Stats Badge */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 text-center border-t border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">500+</div>
          <div className="text-xs text-green-700 dark:text-green-300">عميل نشط</div>
        </div>
      </div>
    </div>
  )
}
