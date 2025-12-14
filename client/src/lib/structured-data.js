/**
 * JSON-LD Structured Data Generator for SEO
 * Provides rich snippets for Google Search
 */

/**
 * Organization Schema
 * @returns {object} Organization structured data
 */
export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Faheemly | فهملي',
  legalName: 'Faheemly AI Solutions',
  url: 'https://faheemly.com',
  logo: 'https://faheemly.com/assets/logo-full.svg',
  description: 'أقوى منصة شات بوت عربي بالذكاء الاصطناعي للشرق الأوسط. ربط واتساب فوري، رد تلقائي 24/7',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+966-XX-XXX-XXXX',
    contactType: 'Customer Service',
    email: 'hello@faheemly.com',
    areaServed: ['SA', 'EG', 'AE', 'KW', 'QA', 'BH', 'JO', 'LB'],
    availableLanguage: ['ar', 'en']
  },
  sameAs: [
    'https://twitter.com/faheemly_ai',
    'https://linkedin.com/company/faheemly',
    'https://facebook.com/faheemly',
    'https://instagram.com/faheemly_ai'
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'SA',
    addressRegion: 'Riyadh'
  }
});

/**
 * Software Application Schema
 * @returns {object} SoftwareApplication structured data
 */
export const getSoftwareSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Faheemly AI Chatbot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
    offers: {
    '@type': 'Offer',
    price: '199',
    priceCurrency: 'SAR',
    priceValidUntil: '2025-12-31'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1'
  },
  description: 'منصة شات بوت ذكي بالذكاء الاصطناعي تدعم اللهجات العربية المتعددة مع تكامل واتساب وتيليجرام',
  featureList: [
    'دعم اللهجات العربية المتعددة',
    'تكامل واتساب فوري',
    'رد آلي 24/7',
    'تحليلات متقدمة',
    'قاعدة معرفة ذكية',
    'تعلم آلي مستمر'
  ]
});

/**
 * FAQ Schema for common questions
 * @returns {object} FAQPage structured data
 */
export const getFAQSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'ما هو فهملي؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'فهملي هو منصة شات بوت ذكي بالذكاء الاصطناعي مصممة خصيصاً للشرق الأوسط. يدعم كل اللهجات العربية ويتكامل مع واتساب وتيليجرام لخدمة عملائك 24/7.'
      }
    },
    {
      '@type': 'Question',
      name: 'كم يكلف فهملي؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'تبدأ خطط فهملي من 199 ريال سعودي شهرياً للباقة الأساسية، مع فترة تجريبية مجانية لمدة 7 أيام. تتوفر باقات Pro وEnterprise للشركات الكبرى.'
      }
    },
    {
      '@type': 'Question',
      name: 'هل يدعم فهملي اللهجات العربية المختلفة؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعم! فهملي يدعم جميع اللهجات العربية: السعودية، المصرية، الخليجية، الشامية، المغاربية وغيرها. البوت يفهم ويرد بنفس لهجة العميل.'
      }
    },
    {
      '@type': 'Question',
      name: 'كيف يتم التكامل مع واتساب؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'التكامل مع واتساب سهل وسريع. بعد التسجيل، ربط رقم واتساب الأعمال الخاص بك يستغرق أقل من 5 دقائق باستخدام WhatsApp Business API.'
      }
    },
    {
      '@type': 'Question',
      name: 'هل توجد فترة تجريبية مجانية؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعم! جميع الباقات تأتي مع فترة تجريبية مجانية لمدة 7 أيام كاملة. يمكنك تجربة جميع المميزات بدون الحاجة لبطاقة ائتمان.'
      }
    },
    {
      '@type': 'Question',
      name: 'ما هي الصناعات التي يخدمها فهملي؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'فهملي يخدم جميع الصناعات: المطاعم، العيادات، المتاجر الإلكترونية، العقارات، التعليم، الخدمات المالية، والمزيد. لدينا نماذج مخصصة لكل قطاع.'
      }
    }
  ]
});

/**
 * Breadcrumb Schema for navigation
 * @param {Array} items - Breadcrumb items [{ name, url }]
 * @returns {object} BreadcrumbList structured data
 */
export const getBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://faheemly.com${item.url}`
  }))
});

/**
 * Service Schema for pricing pages
 * @param {object} service - Service details
 * @returns {object} Service structured data
 */
export const getServiceSchema = (service) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  description: service.description,
  provider: {
    '@type': 'Organization',
    name: 'Faheemly'
  },
  areaServed: ['SA', 'EG', 'AE', 'KW', 'QA', 'BH', 'JO', 'LB'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'خطط الأسعار',
    itemListElement: service.plans?.map(plan => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: plan.name,
        description: plan.description
      },
      price: plan.price,
      priceCurrency: 'SAR',
      priceValidUntil: '2025-12-31'
    }))
  }
});

/**
 * Article Schema for blog posts
 * @param {object} article - Article details
 * @returns {object} Article structured data
 */
export const getArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  image: article.image,
  author: {
    '@type': 'Organization',
    name: 'Faheemly'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Faheemly',
    logo: {
      '@type': 'ImageObject',
      url: 'https://faheemly.com/assets/logo-full.svg'
    }
  },
  datePublished: article.publishedDate,
  dateModified: article.modifiedDate
});

/**
 * Local Business Schema for regional pages
 * @param {string} country - Country code (SA, EG, AE, KW)
 * @returns {object} LocalBusiness structured data
 */
export const getLocalBusinessSchema = (country) => {
  const locations = {
    SA: {
      name: 'Faheemly السعودية',
      address: 'الرياض، المملكة العربية السعودية',
      region: 'Riyadh',
      phone: '+966-XX-XXX-XXXX'
    },
    EG: {
      name: 'Faheemly مصر',
      address: 'القاهرة، مصر',
      region: 'Cairo',
      phone: '+20-XX-XXXX-XXXX'
    },
    AE: {
      name: 'Faheemly الإمارات',
      address: 'دبي، الإمارات العربية المتحدة',
      region: 'Dubai',
      phone: '+971-X-XXX-XXXX'
    },
    KW: {
      name: 'Faheemly الكويت',
      address: 'الكويت، الكويت',
      region: 'Kuwait City',
      phone: '+965-XXXX-XXXX'
    }
  };

  const location = locations[country] || locations.SA;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: location.name,
    image: 'https://faheemly.com/assets/logo-full.svg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressRegion: location.region,
      addressCountry: country
    },
    telephone: location.phone,
    url: `https://faheemly.com/${country.toLowerCase()}`,
    priceRange: '$$'
  };
};

/**
 * Helper to inject structured data into page
 * @param {object} schema - JSON-LD schema
 * @returns {object} Script tag props for Next.js
 */
export const injectStructuredData = (schema) => ({
  type: 'application/ld+json',
  dangerouslySetInnerHTML: { __html: JSON.stringify(schema) }
});

/**
 * Combined schemas for home page
 * @returns {Array} Multiple schemas
 */
export const getHomePageSchemas = () => [
  getOrganizationSchema(),
  getSoftwareSchema(),
  getFAQSchema()
];
