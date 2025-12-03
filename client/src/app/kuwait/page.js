"use client"

import { LandingPage } from '@/components/LandingPage'
import { useState } from 'react'

// Metadata removed - cannot use with 'use client'

const metadata = {
  title: 'فهملي - شات بوت ذكي باللهجة الكويتية | خدمة عملاء 24/7',
  description: 'أفضل حل شات بوت ذكي يفهم اللهجة الكويتية. زود مبيعاتك وارضي عملاءك بخدمة ذكية 24 ساعة.',
  keywords: 'شات بوت كويتي، ذكاء اصطناعي، خدمة عملاء، اللهجة الكويتية، واتساب بوت',
  openGraph: {
    title: 'فهملي - شات بوت ذكي باللهجة الكويتية',
    description: 'أفضل حل شات بوت ذكي يفهم اللهجة الكويتية',
    url: 'https://faheemly.com/kuwait',
    siteName: 'فهملي',
    locale: 'ar_KW',
    type: 'website',
  }
}

export default function KuwaitPage() {
  const [country, setCountry] = useState('kw')
  
  return <LandingPage country={country} setCountry={setCountry} lang="ar" />
}
