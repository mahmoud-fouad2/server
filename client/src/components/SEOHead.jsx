'use client';

import Head from 'next/head';
import { SEO_DATA, APP_NAME } from '@/constants';

export default function SEOHead({
  country = 'sa',
  page = 'home',
  customTitle,
  customDesc,
  customKeywords,
  lang = 'ar',
}) {
  const seoData = SEO_DATA[country]?.[page] || SEO_DATA['sa'][page];

  const title =
    customTitle || seoData?.title || `${APP_NAME} - الموظف الذي لا ينام`;
  const description =
    customDesc ||
    seoData?.desc ||
    'أقوى شات بوت عربي ذكي للمطاعم والمتاجر والعيادات';
  const keywords =
    customKeywords || seoData?.keywords || 'شات بوت عربي, ذكاء اصطناعي, واتساب';

  const url = `https://faheemly.com${country !== 'sa' ? `/${country}` : ''}${page !== 'home' ? `/${page}` : ''}`;
  const image = 'https://faheemly.com/logo.webp';

  // Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '99',
      priceCurrency: 'SAR',
      priceValidUntil: '2025-12-31',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '500',
    },
    description: description,
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: 'https://faheemly.com',
    logo: image,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+966-530047640',
      contactType: 'Customer Service',
      email: 'mahmoud.a.fouad2@gmail.com',
      areaServed: ['SA', 'EG', 'AE', 'KW'],
      availableLanguage: ['ar', 'en'],
    },
    sameAs: [
      'https://twitter.com/faheemly',
      'https://linkedin.com/company/faheemly',
    ],
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={APP_NAME} />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <link rel="canonical" href={url} />

      {/* Language & Region */}
      <meta httpEquiv="content-language" content={lang} />
      <link rel="alternate" hrefLang="ar" href="https://faheemly.com" />
      <link rel="alternate" hrefLang="ar-SA" href="https://faheemly.com" />
      <link rel="alternate" hrefLang="ar-EG" href="https://faheemly.com/eg" />
      <link rel="alternate" hrefLang="ar-AE" href="https://faheemly.com/ae" />
      <link rel="alternate" hrefLang="ar-KW" href="https://faheemly.com/kw" />
      <link rel="alternate" hrefLang="en" href="https://faheemly.com/en" />
      <link rel="alternate" hrefLang="x-default" href="https://faheemly.com" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_SA' : 'en_US'} />
      <meta property="og:site_name" content={APP_NAME} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta name="twitter:creator" content="@faheemly" />

      {/* Mobile & PWA */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="apple-mobile-web-app-title" content={APP_NAME} />

      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/logo.webp" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
    </Head>
  );
}
