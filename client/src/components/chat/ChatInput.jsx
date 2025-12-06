'use client';

import { Send, Sparkles } from 'lucide-react';

export default function ChatInput({ inputValue, setInputValue, onSend }) {
  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue);
    setInputValue('');
  };

  return (
    <div className="p-4 bg-white dark:bg-cosmic-900 border-t border-gray-200 dark:border-white/10">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
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
        <span>فهملي</span>
      </div>
    </div>
  );
}
