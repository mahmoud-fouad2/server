import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from './ui/Components';
import { APP_NAME, TRANSLATIONS } from '../constants';
import { Lock, Mail, Bot, Home, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import Captcha from './Captcha';

export const Login = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const t = TRANSLATIONS[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setError('يرجى التحقق من أنك لست روبوت');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      // Handle login success
      console.log('Logged in:', data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-cosmic-950 p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-100 animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-100 animate-float" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none"></div>

      {/* Return to Home Button */}
      <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white transition-colors bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm">
        <Home size={18} />
        <span className="text-sm font-medium">الرئيسية</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-white/20 ring-1 ring-black/5">
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

          <div className="text-center mb-8">
            {/* Animated Faheem Character */}
            <div className="flex justify-center mb-6">
              <FaheemAnimatedLogo size="medium" showText={true} />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t.welcomeBack}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail size={16} className="text-brand-500" /> {t.email}
              </label>
              <div className="relative group">
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-cosmic-800/50 border-gray-200 dark:border-white/10 focus:ring-brand-500 focus:border-brand-500 transition-all group-hover:border-brand-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lock size={16} className="text-brand-500" /> {t.password}
                </label>
                <a href="/contact" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">نسيت كلمة المرور؟</a>
              </div>
              <div className="relative group">
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-cosmic-800/50 border-gray-200 dark:border-white/10 focus:ring-brand-500 focus:border-brand-500 transition-all group-hover:border-brand-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
               <Captcha onVerify={setIsVerified} />
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 rounded-xl" 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">{t.login} <ArrowRight size={18} /></span>}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-cosmic-900 text-gray-500">أو</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t.dontHaveAccount}{' '}
                <Link href="/register" className="text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-bold hover:underline transition-all">
                  {t.signUp}
                </Link>
              </p>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400 dark:text-gray-500">
             محمي بواسطة نظام فهملي الأمني وتطبق <Link href="/privacy" className="underline hover:text-gray-300">سياسة الخصوصية</Link> و <Link href="/terms" className="underline hover:text-gray-300">شروط الخدمة</Link>.
           </p>
        </div>
      </motion.div>
    </div>
  );
};
