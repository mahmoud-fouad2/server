export const metadata = {
  title: 'دليل استكشاف الأخطاء - فهملي | Troubleshooting Guide',
  description: 'دليل شامل لحل المشاكل الشائعة في بوت فهملي. تعلم كيفية إصلاح مشاكل عدم الرد على الرسائل وتحسين دقة الإجابات.',
  keywords: [
    'استكشاف الأخطاء فهملي',
    'troubleshooting فهملي',
    'مشاكل البوت',
    'إصلاح البوت',
    'دعم فهملي',
    'مساعدة فهملي',
    'أخطاء شائعة',
    'حل المشاكل',
    'دليل الإصلاح',
    'Bot troubleshooting',
    'فهملي support'
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
    canonical: '/docs/troubleshooting',
  },
  openGraph: {
    title: 'دليل استكشاف الأخطاء - فهملي',
    description: 'دليل شامل لحل المشاكل الشائعة في بوت فهملي. تعلم كيفية إصلاح مشاكل عدم الرد وتحسين دقة الإجابات.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://faheemly.com'}/docs/troubleshooting`,
    siteName: 'فهملي',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'فهملي Troubleshooting Guide',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل استكشاف الأخطاء - فهملي',
    description: 'دليل شامل لحل المشاكل الشائعة في بوت فهملي.',
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
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function TroubleshootingLayout({ children }) {
  return <>{children}</>;
}