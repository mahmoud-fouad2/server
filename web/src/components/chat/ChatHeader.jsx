'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ChatHeader() {
  return (
    <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-cosmic-800 dark:to-cosmic-900 px-4 py-3 border-b border-gray-300 dark:border-white/10">
      <div className="flex items-center justify-between">
        {/* macOS Traffic Lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 cursor-pointer"></div>
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
              Faheemly AI
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>
          </div>
        </div>

        {/* Empty space for balance */}
        <div className="w-16"></div>
      </div>
    </div>
  );
}
