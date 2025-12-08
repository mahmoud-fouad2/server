'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/Footer';

const SalesBot = dynamic(() => import('@/components/SalesBot'), { ssr: false });

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && <SalesBot />}
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
