"use client"

import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const [lang, setLang] = useState('ar');
  
  return <LandingPage country="sa" lang={lang} setLang={setLang} />;
}
