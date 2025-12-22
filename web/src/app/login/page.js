'use client';

import { Login } from '../../components/Login';
import PageLayout from '@/components/layout/PageLayout';

export default function LoginPage() {
  const lang = 'ar';

  return (
    <PageLayout>
      <Login lang={lang} />
    </PageLayout>
  );
}
