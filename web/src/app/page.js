'use client';

import { useState, Suspense, lazy } from 'react';
import Loading from './loading';

const LandingPage = lazy(() => import('@/components/LandingPage').then(mod => ({ default: mod.LandingPage })));

export default function Home() {
  const [lang, setLang] = useState('ar');

  return (
    <>
      <noscript>
        <div
          style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl',
            textAlign: 'center',
          }}
        >
          <h1>فهملي - شات بوت ذكاء اصطناعي عربي</h1>
          <p style={{ fontSize: '18px', lineHeight: '1.8', marginTop: '20px' }}>
            أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي للسعودية ومصر
            والإمارات والكويت. ربط واتساب فوري، رد تلقائي 24/7 بكل اللهجات
            العربية.
          </p>
          <h2>خدماتنا</h2>
          <ul style={{ textAlign: 'right', lineHeight: '2', fontSize: '16px' }}>
            <li>ربط واتساب للأعمال في دقيقة واحدة</li>
            <li>رد تلقائي ذكي على استفسارات العملاء 24/7</li>
            <li>دعم كل اللهجات العربية (سعودي، مصري، إماراتي، كويتي)</li>
            <li>حجز المواعيد والطلبات تلقائياً</li>
            <li>تكامل مع موقعك الإلكتروني</li>
          </ul>
          <h2>الأسعار</h2>
          <p>تبدأ من 199 ريال سعودي شهرياً | تجربة مجانية 7 أيام</p>
          <a
            href="/register"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              background: '#7C3AED',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              marginTop: '20px',
            }}
          >
            ابدأ التجربة المجانية
          </a>
          <p style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
            للحصول على أفضل تجربة، يرجى تمكين JavaScript في متصفحك
          </p>
        </div>
      </noscript>
      <Suspense fallback={<Loading />}>
        <LandingPage country="sa" lang={lang} setLang={setLang} />
      </Suspense>
    </>
  );
}
