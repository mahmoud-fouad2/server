'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/admin/login');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toUpperCase();

        // Allow both ADMIN and SUPERADMIN
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
          router.push('/dashboard'); // Redirect regular users to dashboard
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // If not authorized and not on login page, don't render children (redirect happens in useEffect)
  if (!authorized && pathname !== '/admin/login') {
    return null;
  }

  return <>{children}</>;
}
