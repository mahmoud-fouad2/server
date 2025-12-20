'use client';

import { useState } from 'react';
import { Login } from '../../components/Login';
import PageLayout from '@/components/layout/PageLayout';

export default function LoginPage() {
  const [lang, setLang] = useState('ar');

  return (
    <PageLayout>
      <Login lang={lang} />
    </PageLayout>
  );
}
