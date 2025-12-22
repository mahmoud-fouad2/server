'use client';

import { LandingPage } from '@/components/LandingPage';
import { useState } from 'react';

export default function UAEPage() {
  const [country, setCountry] = useState('ae');

  return <LandingPage country={country} setCountry={setCountry} lang="ar" />;
}
