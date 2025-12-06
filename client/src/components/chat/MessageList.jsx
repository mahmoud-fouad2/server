'use client';

import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function MessageList({ messages, isTyping }) {
  return (
    <div className="h-[480px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-cosmic-950 dark:to-cosmic-900">
      <AnimatePresence>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} index={idx} />
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}
    </div>
  );
}
