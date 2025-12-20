'use client';

import { useState } from 'react';
import { Login } from '../../components/Login';

export default function LoginPage() {
  const [lang, setLang] = useState('ar');

  return <Login lang={lang} />;
}
