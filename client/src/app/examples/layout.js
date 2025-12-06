export const metadata = {
  title: 'أمثلة حية تفاعلية - فهملي | Live Chatbot Examples',
  description: 'شاهد فهملي في العمل من خلال أمثلة حية تفاعلية. تعرف على كيفية عمل الشات بوت الذكي في مختلف القطاعات والصناعات.',
  keywords: [
    'أمثلة فهملي',
    'شات بوت تفاعلي',
    'ذكاء اصطناعي حي',
    'chatbot examples',
    'AI chatbot demo',
    'فهملي examples',
    'live chatbot',
    'interactive examples',
    'شات بوت أمثلة',
    'ذكاء اصطناعي أمثلة'
  ],
  authors: [{ name: 'فهملي' }],
  creator: 'فهملي',
  publisher: 'فهملي',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3001'),
  alternates: {
    canonical: '/examples',
  },
  openGraph: {
    title: 'أمثلة حية تفاعلية - فهملي',
    description: 'شاهد فهملي في العمل من خلال أمثلة حية تفاعلية. تعرف على كيفية عمل الشات بوت الذكي.',
    url: 'http://localhost:3001/examples',
    siteName: 'فهملي',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'فهملي Live Examples',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أمثلة حية تفاعلية - فهملي',
    description: 'شاهد فهملي في العمل من خلال أمثلة حية تفاعلية. تعرف على كيفية عمل الشات بوت الذكي.',
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

export default function ExamplesLayout({ children }) {
  return children;
}