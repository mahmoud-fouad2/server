export const metadata = {
  title: 'مرجع API الشامل - فهملي | REST API Documentation',
  description: 'دليل شامل لواجهة برمجة التطبيقات (API) لفهملي. تعلم كيفية التكامل مع نظام الشات بوت الذكي، إرسال الرسائل، إدارة المحادثات والمزيد.',
  keywords: [
    'API فهملي',
    'REST API',
    'واجهة برمجة التطبيقات',
    'تكامل فهملي',
    'شات بوت API',
    'ذكاء اصطناعي API',
    'API documentation',
    'فهملي integration',
    'chatbot API',
    'AI API'
  ],
  authors: [{ name: 'فهملي' }],
  creator: 'فهملي',
  publisher: 'فهملي',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://faheemly.com'),
  alternates: {
    canonical: '/api',
  },
  openGraph: {
    title: 'مرجع API الشامل - فهملي',
    description: 'دليل شامل لواجهة برمجة التطبيقات (API) لفهملي. تعلم كيفية التكامل مع نظام الشات بوت الذكي.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://faheemly.com'}/api`,
    siteName: 'فهملي',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'فهملي API Documentation',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مرجع API الشامل - فهملي',
    description: 'دليل شامل لواجهة برمجة التطبيقات (API) لفهملي. تعلم كيفية التكامل مع نظام الشات بوت الذكي.',
    images: ['/logo.webp'],
    creator: '@faheemly',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function ApiLayout({ children }) {
  return children;
}