import React from 'react';
import { Sparkles, ArrowLeft, Send, Paperclip, Mic } from 'lucide-react';

export const DemoChatWindow = () => {
  return (
    <div
      className="w-full max-w-3xl mx-auto font-sans relative group"
      dir="rtl"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative bg-white dark:bg-cosmic-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 ring-1 ring-black/5">
        {/* Window Header */}
        <div className="bg-gray-50 dark:bg-cosmic-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/20"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600/20"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600/20"></div>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            faheemly-live-demo
          </div>
          <div className="w-14"></div> {/* Spacer */}
        </div>

        {/* Chat Area */}
        <div className="bg-gray-100/50 dark:bg-cosmic-950 p-6 min-h-[400px] flex flex-col gap-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none"></div>

          {/* Bot Message */}
          <div className="flex gap-4 items-start relative z-10 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-[1px] flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20 relative group">
              <div className="w-full h-full bg-white dark:bg-cosmic-800 rounded-[14px] flex items-center justify-center overflow-hidden relative">
                <img
                  src="/logo2.png"
                  alt="Faheemly AI"
                  className="w-full h-full object-contain animate-pulse-slow"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-cosmic-900 rounded-full z-20"></div>
            </div>
            <div className="bg-white dark:bg-cosmic-800 text-gray-800 dark:text-gray-100 p-4 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-sm border border-gray-200 dark:border-white/5">
              <p className="font-bold text-brand-600 dark:text-brand-400 text-xs mb-1">
                المساعد الذكي
              </p>
              أهلاً بك! 👋 أنا فهملي، مساعدك الذكي. قرأت المنيو بالكامل وأنا
              جاهز لاستقبال طلبات زبائنك. كيف أقدر أساعدك اليوم؟
            </div>
          </div>

          {/* User Message */}
          <div
            className="flex gap-4 items-start flex-row-reverse relative z-10 animate-fade-in-up"
            style={{ animationDelay: '1s' }}
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-cosmic-700 flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-cosmic-600 shadow-sm">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                أنت
              </span>
            </div>
            <div className="bg-brand-600 text-white p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-lg shadow-brand-500/20">
              عندكم خيارات نباتية للغداء؟ 🥗
            </div>
          </div>

          {/* Bot Reply (Simulated) */}
          <div
            className="flex gap-4 items-start relative z-10 animate-fade-in-up"
            style={{ animationDelay: '2.5s' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-[1px] flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-white dark:bg-cosmic-800 rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src="/logo2.png"
                  alt="Faheemly AI"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="bg-white dark:bg-cosmic-800 text-gray-800 dark:text-gray-100 p-4 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-sm border border-gray-200 dark:border-white/5">
              <p className="font-bold text-brand-600 dark:text-brand-400 text-xs mb-1">
                المساعد الذكي
              </p>
              أكيد! عندنا خيارات مميزة:
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> سلطة الكينوا مع
                  الأفوكادو
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> برجر نباتي (Beyond
                  Meat)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> باستا الخضروات
                  المشوية
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex gap-2">
                <button className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
                  اطلب الآن
                </button>
                <button className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                  عرض الصور
                </button>
              </div>
            </div>
          </div>

          {/* Typing Indicator */}
          <div
            className="flex gap-4 items-end mt-auto animate-fade-in"
            style={{ animationDelay: '4s' }}
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-cosmic-800 flex items-center justify-center flex-shrink-0 opacity-50 overflow-hidden">
              <img
                src="/logo2.png"
                alt="AI"
                className="w-full h-full object-contain grayscale"
              />
            </div>
            <div className="bg-white dark:bg-cosmic-800 p-3 rounded-2xl rounded-tr-none w-14 h-10 flex items-center justify-center gap-1 border border-gray-200 dark:border-white/5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-cosmic-900 p-4 border-t border-gray-200 dark:border-white/5">
          <div className="bg-gray-50 dark:bg-cosmic-800 rounded-full p-2 pl-4 flex items-center gap-3 border border-gray-200 dark:border-white/5 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <button className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white transition-all shadow-lg shadow-brand-500/20 hover:scale-105">
              <Send size={18} className="ml-0.5" />
            </button>
            <input
              type="text"
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 text-right px-2 text-sm"
              disabled
            />
            <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-white/10 mr-2">
              <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors">
                <Mic size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors">
                <Paperclip size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
