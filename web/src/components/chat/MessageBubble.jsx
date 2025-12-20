'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import React from 'react';

// Helper: parse **bold** markers and return array of React nodes
function parseBoldSegments(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    parts.push(<strong key={idx} className="font-semibold">{match[2]}</strong>);
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Render message content. For assistant messages, if there are multiple lines
// render as a numbered list. Also support **bold**.
function renderMessageContent(message) {
  const content = message?.content || '';
  // Normalize newlines
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const isAssistant = message?.role && message.role !== 'user';

  if (isAssistant && lines.length > 1) {
    return (
      <ol className="list-decimal list-inside space-y-1">
        {lines.map((ln, i) => (
          <li key={i} className="text-sm">
            {parseBoldSegments(ln)}
          </li>
        ))}
      </ol>
    );
  }

  // Single line or user: render inline, with bold parsing
  return <div className="text-sm">{parseBoldSegments(content)}</div>;
}

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
        <div className="text-sm whitespace-pre-wrap break-words">
          {renderMessageContent(message)}
        </div>
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
