import React, { useState } from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function Captcha({ onVerify }) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (verified) return;
    setLoading(true);
    // Simulate network verification
    setTimeout(() => {
      setVerified(true);
      setLoading(false);
      if (onVerify) onVerify(true);
    }, 1000);
  };

  return (
    <div 
      className={`flex items-center p-1 rounded-md border transition-all duration-300 ${
        verified 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-3 px-2 w-full">
        <button
          type="button"
          onClick={handleVerify}
          disabled={verified || loading}
          className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
            verified
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
          }`}
        >
          {loading && (
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          )}
          {verified && <CheckCircle size={16} />}
        </button>
        <span className={`text-sm select-none ${verified ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {verified ? 'تم التحقق بنجاح' : 'أنا لست روبوت'}
        </span>
        <div className="mr-auto">
            <ShieldCheck className={`w-5 h-5 ${verified ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
        </div>
      </div>
    </div>
  );
}
