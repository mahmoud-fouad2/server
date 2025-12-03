"use client"

import { LandingPage } from '@/components/LandingPage'
import { useState } from 'react'

export default function SaudiPage() {
  const [country, setCountry] = useState('sa')
  
  return <LandingPage country={country} setCountry={setCountry} lang="ar" />
}
