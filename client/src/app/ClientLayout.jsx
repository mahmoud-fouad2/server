'use client';

import dynamic from 'next/dynamic';

const SalesBot = dynamic(() => import('@/components/SalesBot'), { ssr: false });

export default function ClientLayout({ children }) {
  return (
    <>
      <SalesBot />
      {children}
    </>
  );
}
