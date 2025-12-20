/**
 * SEO Helper Functions for Faheemly
 * Comprehensive SEO optimization with regional support
 */

export const generateStructuredData = (type, data) => {
  const baseUrl = 'https://faheemly.com';

  const schemas = {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Faheemly - فهملي',
      alternateName: 'فهملي.كوم',
      url: baseUrl,
      logo: `${baseUrl}/logo.webp`,
      description:
        'أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي للشرق الأوسط',
      foundingDate: '2023',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+966-XX-XXX-XXXX',
        contactType: 'Customer Service',
        areaServed: ['SA', 'EG', 'AE', 'KW', 'QA', 'BH'],
        availableLanguage: ['Arabic', 'English'],
      },
      sameAs: [
        'https://twitter.com/faheemly_ai',
        'https://linkedin.com/company/faheemly',
        'https://instagram.com/faheemly_ai',
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'SA',
        addressRegion: 'Riyadh',
      },
    },

    softwareApplication: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Faheemly AI Chatbot',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: data?.price || '149',
        priceCurrency: data?.currency || 'SAR',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '500',
        bestRating: '5',
        worstRating: '1',
      },
      description: data?.description || 'شات بوت ذكي للأعمال العربية',
    },

    service: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: data?.name || 'Faheemly Chatbot Service',
      description: data?.description,
      provider: {
        '@type': 'Organization',
        name: 'Faheemly',
      },
      areaServed: {
        '@type': 'Country',
        name: data?.country || 'Saudi Arabia',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Chatbot Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'WhatsApp Integration',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Website Widget',
            },
          },
        ],
      },
    },

    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement:
        data?.breadcrumbs?.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.url}`,
        })) || [],
    },

    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity:
        data?.faqs?.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })) || [],
    },

    product: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data?.name,
      image: data?.image,
      description: data?.description,
      brand: {
        '@type': 'Brand',
        name: 'Faheemly',
      },
      offers: {
        '@type': 'Offer',
        url: data?.url,
        priceCurrency: data?.currency || 'SAR',
        price: data?.price,
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '500',
      },
    },
  };

  return schemas[type] || schemas.organization;
};

export const generateHreflangTags = pathname => {
  const baseUrl = 'https://faheemly.com';
  const languages = [
    { lang: 'ar', region: 'sa', url: `${baseUrl}${pathname}` },
    { lang: 'ar', region: 'eg', url: `${baseUrl}/egypt${pathname}` },
    { lang: 'ar', region: 'ae', url: `${baseUrl}/uae${pathname}` },
    { lang: 'ar', region: 'kw', url: `${baseUrl}/kuwait${pathname}` },
    { lang: 'en', region: '', url: `${baseUrl}/en${pathname}` },
    { lang: 'x-default', region: '', url: `${baseUrl}${pathname}` },
  ];

  return languages;
};

export const getCanonicalUrl = (pathname, country = 'sa') => {
  const baseUrl = 'https://faheemly.com';
  const countryPaths = {
    sa: '',
    eg: '/egypt',
    ae: '/uae',
    kw: '/kuwait',
  };

  return `${baseUrl}${countryPaths[country] || ''}${pathname}`;
};

export const generateRobotsMeta = (noindex = false, nofollow = false) => {
  if (noindex && nofollow) return 'noindex, nofollow';
  if (noindex) return 'noindex, follow';
  if (nofollow) return 'index, nofollow';
  return 'index, follow';
};

export const generateOpenGraphTags = data => {
  const baseUrl = 'https://faheemly.com';

  return {
    'og:type': data.type || 'website',
    'og:url': data.url || baseUrl,
    'og:title': data.title,
    'og:description': data.description,
    'og:image': data.image || `${baseUrl}/og-image.jpg`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': data.imageAlt || 'Faheemly AI Chatbot Platform',
    'og:site_name': 'Faheemly.com',
    'og:locale': data.locale || 'ar_SA',
    'og:locale:alternate': ['ar_EG', 'ar_AE', 'ar_KW', 'en_US'],
  };
};

export const generateTwitterTags = data => {
  const baseUrl = 'https://faheemly.com';

  return {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@faheemly_ai',
    'twitter:creator': '@faheemly_ai',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': data.image || `${baseUrl}/twitter-image.jpg`,
    'twitter:image:alt': data.imageAlt || 'Faheemly AI Chatbot',
  };
};

export const generateMetaTags = (seoData, country = 'sa', lang = 'ar') => {
  return {
    title: seoData.title,
    description: seoData.desc,
    keywords: seoData.keywords,
    robots: generateRobotsMeta(false, false),
    author: 'Faheemly.com',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
    'theme-color': '#7C3AED',
    'msapplication-TileColor': '#7C3AED',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    ...generateOpenGraphTags({
      title: seoData.title,
      description: seoData.desc,
      locale: lang === 'ar' ? `ar_${country.toUpperCase()}` : 'en_US',
    }),
    ...generateTwitterTags({
      title: seoData.title,
      description: seoData.desc,
    }),
  };
};
