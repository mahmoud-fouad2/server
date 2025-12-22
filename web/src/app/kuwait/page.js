'use client';

import { LandingPage } from '@/components/LandingPage';
import { useState } from 'react';

export default function KuwaitPage() {
  const [country, setCountry] = useState('kw');

  return <LandingPage country={country} setCountry={setCountry} lang="ar" />;
}
