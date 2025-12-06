'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wizard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-cosmic-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">جاري التحويل...</p>
      </div>
    </div>
  );
}
