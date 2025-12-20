export const metadata = {
  title: 'التوثيق الشامل - فهملي | Complete Documentation',
  description: 'دليل شامل ومفصل لاستخدام فهملي. تعلم كيفية إعداد وتخصيص الشات بوت الذكي، إدارة قواعد المعرفة، والحصول على أفضل النتائج.',
  keywords: [
    'توثيق فهملي',
    'دليل المستخدم',
    'شات بوت دليل',
    'ذكاء اصطناعي دليل',
    'فهملي documentation',
    'chatbot guide',
    'AI documentation',
    'user manual',
    'فهملي guide',
    'شات بوت تعليمات'
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
    canonical: '/docs',
  },
  openGraph: {
    title: 'التوثيق الشامل - فهملي',
    description: 'دليل شامل ومفصل لاستخدام فهملي. تعلم كيفية إعداد وتخصيص الشات بوت الذكي.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://faheemly.com'}/docs`,
    siteName: 'فهملي',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'فهملي Documentation',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'التوثيق الشامل - فهملي',
    description: 'دليل شامل ومفصل لاستخدام فهملي. تعلم كيفية إعداد وتخصيص الشات بوت الذكي.',
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

export default function DocsLayout({ children }) {
  return children;
}