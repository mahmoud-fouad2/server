'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '../../components/ui/Components';
import { Lock, CheckCircle, Loader2, Home, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import FaheemAnimatedLogo from '../../components/FaheemAnimatedLogo';
import { authApi } from '@/lib/api';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('رابط غير صالح. يرجى طلب رابط جديد.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword({ token, newPassword: password });

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
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

      <Link href="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white transition-colors bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm">
        <Home size={18} />
        <span className="text-sm font-medium">الرئيسية</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-white/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>

          {!success ? (
            <>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <FaheemAnimatedLogo size="medium" showText={false} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">إعادة تعيين كلمة المرور</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">اختر كلمة مرور جديدة وقوية</p>
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
                    <Lock size={16} className="text-brand-500" /> كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-gray-50 dark:bg-cosmic-800/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Lock size={16} className="text-brand-500" /> تأكيد كلمة المرور
                  </label>
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-cosmic-800/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg font-bold rounded-xl" 
                  disabled={loading || !token}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'تعيين كلمة المرور'}
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">تم بنجاح!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                تم إعادة تعيين كلمة المرور بنجاح.
                <br />
                جاري تحويلك لصفحة تسجيل الدخول...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
