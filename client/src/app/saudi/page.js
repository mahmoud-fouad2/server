"use client"

import { LandingPage } from '@/components/LandingPage'
import { useState } from 'react'

export const metadata = {
  title: 'فهملي - شات بوت ذكي باللهجة السعودية | خدمة عملاء 24/7',
  description: 'أفضل حل شات بوت ذكي يفهم اللهجة السعودية. زود مبيعاتك وارضي عملاءك بخدمة ذكية 24 ساعة.',
  keywords: 'شات بوت سعودي، ذكاء اصطناعي، خدمة عملاء، اللهجة السعودية، واتساب بوت',
  openGraph: {
    title: 'فهملي - شات بوت ذكي باللهجة السعودية',
    description: 'أفضل حل شات بوت ذكي يفهم اللهجة السعودية',
    url: 'https://faheemly.com/saudi',
    siteName: 'فهملي',
    locale: 'ar_SA',
    type: 'website',
  }
}

export default function SaudiPage() {
  const [country, setCountry] = useState('sa')
  
  return <LandingPage country={country} setCountry={setCountry} lang="ar" />
}
