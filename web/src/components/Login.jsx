import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from './ui/Components';
import { Lock, Mail, Bot, Home, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import Captcha from './Captcha';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [sessionToast, setSessionToast] = useState('');
  const [showSessionToast, setShowSessionToast] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    try {
      const fromStorage = localStorage.getItem('sessionExpired');
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');

      if (fromStorage || reason === 'session_expired') {
        const msg = t('auth.sessionExpired', 'انتهت الجلسة، الرجاء تسجيل الدخول مرة أخرى');
        setSessionToast(msg);
        setShowSessionToast(true);
        localStorage.removeItem('sessionExpired');

        if (reason) {
          params.delete('reason');
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, document.title, newUrl);
        }

        setTimeout(() => setShowSessionToast(false), 6000);
      }
    } catch (e) {
      // ignore
    }
  }, [t]);

  const onSubmit = async (data) => {
    if (!isVerified) {
      setGlobalError(t('auth.captchaRequired', 'يرجى التحقق من أنك لست روبوت'));
      return;
    }
    setGlobalError('');
    
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      setGlobalError(err.message || t('auth.loginFailed', 'فشل تسجيل الدخول'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-white dark:bg-cosmic-950 p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-100 animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-100 animate-float" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-gray-200 dark:border-white/10 bg-[#f8f8fa] dark:bg-cosmic-900">
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

          <div className="text-center mb-8">
            {/* Animated Faheem Character */}
            <div className="flex justify-center mb-6">
              <FaheemAnimatedLogo size="medium" showText={true} />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {t('auth.welcomeBack', 'مرحباً بعودتك')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('auth.loginSubtitle', 'سجل دخولك للمتابعة إلى لوحة التحكم')}
            </p>
          </div>

          {showSessionToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200"
            >
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{sessionToast}</span>
            </motion.div>
          )}

          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-200"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{globalError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <div className="relative group">
                <Mail className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder', 'البريد الإلكتروني')}
                  className={`pr-12 h-12 bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 focus:border-brand-500 dark:focus:border-brand-500 rounded-xl transition-all ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mr-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <Lock className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                <Input
                  type="password"
                  placeholder={t('auth.passwordPlaceholder', 'كلمة المرور')}
                  className={`pr-12 h-12 bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 focus:border-brand-500 dark:focus:border-brand-500 rounded-xl transition-all ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mr-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 transition-colors" />
                <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {t('auth.rememberMe', 'تذكرني')}
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
              >
                {t('auth.forgotPassword', 'نسيت كلمة المرور؟')}
              </Link>
            </div>

            <div className="py-2">
              <Captcha onVerify={setIsVerified} />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>{t('auth.loggingIn', 'جاري الدخول...')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>{t('auth.loginButton', 'تسجيل الدخول')}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('auth.noAccount', 'ليس لديك حساب؟')}
            </p>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-gray-200 dark:border-white/10 hover:border-brand-500 dark:hover:border-brand-500 text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl font-bold transition-all bg-transparent"
              >
                {t('auth.createAccount', 'إنشاء حساب جديد')}
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 text-center">
             <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors">
               <Home size={16} />
               <span>{t('auth.backToHome', 'العودة للرئيسية')}</span>
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
