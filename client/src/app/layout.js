import './globals.css';
import { Beiruti } from 'next/font/google';

const beiruti = Beiruti({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/lib/fetch-proxy';
import ClientLayout from './ClientLayout';
import { getOrganizationSchema } from '@/lib/structured-data';
// WidgetLoader is a client component that appends the widget script when appropriate.
// Import it directly — Next will render this as a client component at runtime.
import WidgetLoader from '@/components/WidgetLoader';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata = {
  metadataBase: new URL('https://faheemly.com'),
  title: {
    default:
      'فهملي - شات بوت ذكاء اصطناعي عربي | واتساب للأعمال السعودية ومصر والخليج',
    template: '%s | فهملي - شات بوت ذكاء اصطناعي',
  },
  description:
    'أقوى منصة شات بوت عربي بالذكاء الاصطناعي للسعودية ومصر والإمارات والكويت. ربط واتساب فوري، رد تلقائي 24/7 بكل اللهجات العربية. للمطاعم والعيادات والمتاجر. جرب مجاناً 7 أيام!',
  keywords: [
    'شات بوت',
    'ذكاء اصطناعي',
    'واتساب للأعمال',
    'خدمة عملاء',
    'رد آلي',
    'AI Chatbot',
    'Faheemly',
    'فهملي',
    'Chatbot Arabic',
    'شات بوت عربي',
    'السعودية',
    'مصر',
    'الإمارات',
    'الكويت',
    'قطر',
    'البحرين',
    'الأردن',
    'لبنان',
    'المغرب',
    'الشرق الأوسط',
    'حجز مواعيد',
    'أتمتة المطاعم',
    'أتمتة العيادات',
    'بوت واتساب',
    'الموظف الذكي',
    'تكامل تيليجرام',
    'خدمات سحابية',
    'شات بوت مصري',
    'شات بوت سعودي',
    'شات بوت إماراتي',
    'شات بوت كويتي',
    'ردود آلية ذكية',
    'خدمة عملاء 24 ساعة',
  ],
  authors: [{ name: 'Ma-Fo.info', url: 'https://ma-fo.info' }],
  creator: 'Ma-Fo.info',
  publisher: 'Faheemly.com',
  category: 'Technology',
  classification: 'Business Software',
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
  verification: {
    google: 'your-google-site-verification-code',
  },
  alternates: {
    canonical: 'https://faheemly.com',
    languages: {
      'ar-SA': 'https://faheemly.com/sa',
      'ar-EG': 'https://faheemly.com/eg',
      'ar-AE': 'https://faheemly.com/ae',
      'ar-KW': 'https://faheemly.com/kw',
      'x-default': 'https://faheemly.com',
    },
  },
  openGraph: {
    title:
      'فهملي.كوم | الموظف الذكي الذي يفهمك ويفهم عملائك بكل اللهجات العربية',
    description:
      'حول زوار موقعك إلى عملاء دائمين مع فهملي. شات بوت ذكي يفهم اللهجات العربية من الخليج إلى المغرب ويدير أعمالك 24/7. ابدأ الآن بـ99 ريال فقط.',
    url: 'https://faheemly.com',
    siteName: 'Faheemly.com',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Faheemly AI Platform - شات بوت ذكاء اصطناعي للشرق الأوسط',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فهملي.كوم | الموظف الذكي الذي لا ينام - AI Chatbot',
    description:
      'أقوى منصة شات بوت عربي للشرق الأوسط. يغطي كل اللهجات العربية. جرب مجاناً الآن!',
    creator: '@faheemly_ai',
    site: '@faheemly_ai',
    images: ['/twitter-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    // Use `favicon.ico` as the primary shortcut to avoid 404s when only .ico exists
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Fonts handled by next/font (Beiruti) for automatic optimization */}
        {/* Explicit favicons to ensure browsers pick them up and avoid caching issues */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css"
        />
        {/* Content Security Policy: allow API host from env */}
        {
          (() => {
            // Force production URL in production build
            let apiHost = process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com';
            
            // In production, ignore localhost and force Render URL
            if (process.env.NODE_ENV === 'production') {
              apiHost = 'https://fahimo-api.onrender.com';
            }

            const apiOrigin = apiHost.replace(/\/api$/, '');
            const apiWs = apiOrigin.replace(/^http/, 'ws');

            const csp = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fonts.googleapis.com ${apiOrigin}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' ${apiOrigin} ${apiWs}; frame-src 'self';`;
            return <meta httpEquiv="Content-Security-Policy" content={csp} />;
          })()
        }
        {/* Inline script to apply saved theme before React mounts (prevents flash) - Default to LIGHT */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){} })();`,
          }}
        />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Faheemly - فهملي',
              alternateName: ['فهملي.كوم', 'Faheemly.com'],
              url: 'https://faheemly.com',
              logo: 'https://faheemly.com/logo.webp',
              description:
                'أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي للشرق الأوسط',
              foundingDate: '2023',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                areaServed: [
                  'SA',
                  'EG',
                  'AE',
                  'KW',
                  'QA',
                  'BH',
                  'JO',
                  'LB',
                  'MA',
                ],
                availableLanguage: ['Arabic', 'English'],
              },
              sameAs: [
                'https://twitter.com/faheemly_ai',
                'https://linkedin.com/company/faheemly',
                'https://instagram.com/faheemly_ai',
              ],
            }),
          }}
        />

        {/* Structured Data - Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Faheemly AI Chatbot',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '149',
                highPrice: '999',
                priceCurrency: 'SAR',
                offerCount: '3',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '500',
                bestRating: '5',
                worstRating: '1',
              },
            }),
          }}
        />

        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Faheemly',
              url: 'https://faheemly.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://faheemly.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* Structured Data - FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'ما هو فهملي؟',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'فهملي هي أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي. نساعد الشركات على أتمتة خدمة العملاء وزيادة المبيعات 24/7 بكل اللهجات العربية.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'كيف يعمل فهملي؟',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'فهملي يستخدم تقنيات الذكاء الاصطناعي المتقدمة لفهم استفسارات العملاء باللهجات العربية المختلفة والرد عليها تلقائياً. يمكن دمجه مع واتساب وموقعك الإلكتروني وتيليجرام.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'ما هي تكلفة استخدام فهملي؟',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'نوفر عدة خطط تبدأ من 149 ريال شهرياً مع تجربة مجانية 7 أيام. تشمل جميع الخطط الدعم الفني والتحديثات المستمرة.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'هل يدعم فهملي اللهجات العربية المختلفة؟',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'نعم، فهملي يدعم جميع اللهجات العربية من الخليج إلى المغرب العربي، بما في ذلك السعودية، مصر، الإمارات، الكويت، وغيرها.',
                  },
                },
              ],
            }),
          }}
        />

        {/* Structured Data - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'الرئيسية',
                  item: 'https://faheemly.com',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'الخدمات',
                  item: 'https://faheemly.com/services',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'الأسعار',
                  item: 'https://faheemly.com/pricing',
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: 'تواصل معنا',
                  item: 'https://faheemly.com/contact',
                },
              ],
            }),
          }}
        />

        {/* Preload critical resources */}

        {/* DNS Prefetch for other external resources kept if needed */}

        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
        {/* Widget loader is handled client-side to avoid injecting the widget on sensitive routes like /wizard. */}
      </head>
      <body
        className={`${beiruti.className} overflow-x-hidden bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-brand-500/30`}
      >
        <ErrorBoundary>
          <ClientLayout>{children}</ClientLayout>
        </ErrorBoundary>
        {/* Client-only widget loader (will no-op on blocked routes like /wizard) */}
        <WidgetLoader />
      </body>
    </html>
  );
}
