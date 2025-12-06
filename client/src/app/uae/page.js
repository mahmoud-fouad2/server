'use client';

import { LandingPage } from '@/components/LandingPage';
import { useState } from 'react';

// Metadata removed - cannot use with 'use client'

const metadata = {
  title: 'فهملي - شات بوت ذكي باللهجة الإماراتية | خدمة عملاء 24/7',
  description:
    'أفضل حل شات بوت ذكي يفهم اللهجة الإماراتية. زود مبيعاتك وارضي عملاءك بخدمة ذكية 24 ساعة.',
  keywords:
    'شات بوت إماراتي، ذكاء اصطناعي، خدمة عملاء، اللهجة الإماراتية، واتساب بوت',
  openGraph: {
    title: 'فهملي - شات بوت ذكي باللهجة الإماراتية',
    description: 'أفضل حل شات بوت ذكي يفهم اللهجة الإماراتية',
    url: 'https://faheemly.com/uae',
    siteName: 'فهملي',
    locale: 'ar_AE',
    type: 'website',
  },
};

export default function UAEPage() {
  const [country, setCountry] = useState('ae');

  return <LandingPage country={country} setCountry={setCountry} lang="ar" />;
}
