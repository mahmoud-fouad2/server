'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '../../components/ui/Components';
import { Mail, ArrowLeft, CheckCircle, Loader2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaheemAnimatedLogo from '../../components/FaheemAnimatedLogo';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(email);

      setSuccess(true);
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
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white transition-colors bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm"
      >
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

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <FaheemAnimatedLogo size="medium" showText={false} />
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    استرجاع كلمة المرور
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
                  </p>
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
                      <Mail size={16} className="text-brand-500" /> البريد
                      الإلكتروني
                    </label>
                    <div className="relative group">
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 bg-gray-50 dark:bg-cosmic-800/50 border-gray-200 dark:border-white/10 focus:ring-brand-500 focus:border-brand-500 transition-all group-hover:border-brand-500/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-6 text-lg font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <span>إرسال رابط الاسترجاع</span>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium hover:underline transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      العودة لتسجيل الدخول
                    </Link>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <CheckCircle size={64} className="text-green-500" />
                  </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  تم الإرسال بنجاح!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
                  <br />
                  يرجى التحقق من صندوق الوارد أو البريد المزعج.
                </p>

                <Button
                  onClick={() => router.push('/login')}
                  className="px-8 py-3"
                >
                  العودة لتسجيل الدخول
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            لم تستلم البريد؟ تحقق من صندوق البريد المزعج أو{' '}
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="underline hover:text-gray-300"
            >
              أعد المحاولة
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
