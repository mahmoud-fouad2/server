'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import FaheemAnimatedLogo from '@/components/FaheemAnimatedLogo';
import { authApi } from '@/lib/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login({ email, password });

      console.log('Login response:', data); // Debug log

      if (
        !data.user ||
        (data.user.role !== 'SUPERADMIN' && data.user.role !== 'ADMIN')
      ) {
        setError('الوصول مرفوض: أنت لست مسؤولاً');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to admin panel using router for smoother transition
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'خطأ في الاتصال. حاول مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <FaheemAnimatedLogo size="large" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            لوحة تحكم المسؤول
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            يرجى تسجيل الدخول للمتابعة
          </p>
        </div>

        <Card className="border-t-4 border-t-brand-600 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              تسجيل الدخول الآمن
            </CardTitle>
            <CardDescription>أدخل بيانات الاعتماد الخاصة بك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info@Faheemly.com"
                  required
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">كلمة المرور</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white dark:bg-gray-800"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin ml-2" />
                ) : (
                  <Lock className="ml-2 w-4 h-4" />
                )}
                دخول
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Unauthorized access is prohibited. IP Logged.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
