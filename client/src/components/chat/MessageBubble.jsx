'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function MessageBubble({ message, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-brand-600 text-white'
            : 'bg-white dark:bg-cosmic-900 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10'
        }`}
      >
        {message.role === 'bot' && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Sparkles size={12} />
            <span className="font-semibold">Faheemly AI</span>
          </div>
        )}
        <div className="whitespace-pre-line text-sm">{message.content}</div>
        {message.actions && (
          <div className="flex gap-2 mt-3">
            {message.actions.map((action, i) => (
              <button
                key={i}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}
        {message.role === 'user' && (
          <div className="text-xs opacity-75 mt-1 text-left">أنت</div>
        )}
      </div>
    </motion.div>
  );
}
