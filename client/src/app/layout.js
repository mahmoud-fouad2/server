import './globals.css'

export const metadata = {
  metadataBase: new URL('https://faheemly.com'),
  title: {
    default: 'فهملي.كوم | الموظف الذكي الذي لا ينام ولا يطلب راتب',
    template: '%s | فهملي.كوم'
  },
  description: 'أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي. أتمتة خدمة العملاء، حجز مواعيد، وردود فورية على واتساب وموقعك بلهجة سعودية ومصرية. الموظف الذكي الذي لا ينام ولا يطلب راتب.',
  keywords: ['شات بوت', 'ذكاء اصطناعي', 'واتساب للأعمال', 'خدمة عملاء', 'رد آلي', 'السعودية', 'مصر', 'AI Chatbot', 'Faheemly', 'فهملي', 'Chatbot Arabic', 'الموظف الذكي الذي لا ينام ولا يطلب راتب'],
  authors: [{ name: 'Ma-Fo.info', url: 'https://ma-fo.info' }],
  creator: 'Ma-Fo.info',
  publisher: 'Faheemly.com',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'فهملي.كوم | يفهمك ويفهم طلبك',
    description: 'حول زوار موقعك إلى عملاء دائمين مع فهملي. شات بوت ذكي يفهم اللهجات ويدير أعمالك 24/7.',
    url: 'https://faheemly.com',
    siteName: 'Faheemly.com',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Faheemly AI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهملي.كوم | يفهمك ويفهم طلبك',
    description: 'أقوى منصة شات بوت عربي. جرب مجاناً الآن!',
    creator: '@faheemly_ai',
    images: ['/twitter-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Beiruti:wght@200..900&display=swap" rel="stylesheet" />
        {/* Inline script to apply saved theme before React mounts (prevents flash) - Default to LIGHT */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){} })();` }} />

        {/* Quick placeholder override early to avoid other scripts reading null from getElementById */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var ids=['share-modal','share-button','share-btn','share-trigger','share-modal-root'];var orig=document.getElementById.bind(document);document.getElementById=function(id){try{var f=orig(id);if(f) return f;}catch(e){} if(ids.indexOf(id)!==-1){var el=document.createElement('div');el.id=id;el.style.display='none';el.style.pointerEvents='none';if(document.body)document.body.appendChild(el);else document.documentElement.appendChild(el);return el;} return null;};}catch(e){console.warn('early-placeholder failed',e);} })();` }} />
      </head>
      <body className={`font-sans overflow-x-hidden bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-brand-500/30`}>
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center', background: '#fee2e2', color: '#991b1b', borderBottom: '1px solid #f87171' }}>
            <strong>تنبيه:</strong> هذا الموقع يتطلب تفعيل JavaScript ليعمل بشكل صحيح. يرجى تفعيل JavaScript في إعدادات المتصفح للحصول على أفضل تجربة.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  )
}
