'use client';

import dynamic from 'next/dynamic';
import Footer from '@/components/layout/Footer';

const SalesBot = dynamic(() => import('@/components/SalesBot'), { ssr: false });

export default function ClientLayout({ children }) {
  return (
    <>
      <SalesBot />
      {children}
      <Footer />
    </>
  );
}
