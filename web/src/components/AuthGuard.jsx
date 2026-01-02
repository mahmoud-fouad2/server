'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication status
    if (!token || !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/login?reason=unauthorized');
    } else {
      // Verify token validity by checking if it exists
      setChecking(false);
    }
  }, [token, isAuthenticated, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-muted-foreground">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
