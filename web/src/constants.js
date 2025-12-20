import { Industry, BotConfig, KnowledgeItem } from './types';

export const APP_NAME = 'فهملي';

// Currency Exchange Rates (SAR as base)
export const CURRENCY_RATES = {
  SAR: 1,
  EGP: 13, // 1 SAR = 13 EGP (updated per request)
  AED: 1.0, // 1 SAR = 1.0 AED (approximate parity)
  KWD: 0.081, // 1 SAR = 0.081 KWD
};

// Convert price from SAR to target currency
export const convertCurrency = (sarPrice, targetCurrency = 'SAR') => {
  const rate = CURRENCY_RATES[targetCurrency] || 1;
  return Math.round(sarPrice * rate);
};

// Comprehensive SEO Data for all regions and dialects
export const SEO_DATA = {
  sa: {
    home: {
      title:
        'فهملي السعودية - شات بوت ذكاء اصطناعي بالسعودي | الموظف الذي ما ينام',
      desc: 'أقوى شات بوت عربي سعودي للمطاعم والمتاجر والعيادات. ربط واتساب فوري، رد تلقائي 24/7، يفهم اللهجة السعودية النجدية والحجازية. جرب مجاناً الحين!',
      keywords:
        'شات بوت سعودي, بوت واتساب السعودية, ذكاء اصطناعي الرياض, جدة, خدمة عملاء تلقائية, رد آلي سعودي, فهملي, chatbot Saudi Arabia, WhatsApp bot KSA, AI السعودية',
    },
    services: {
      title: 'خدمات فهملي السعودية - ربط واتساب وتكامل ذكي | Faheemly KSA',
      desc: 'خدمات شات بوت متكاملة: ربط واتساب بزنس، ويدجت الموقع، تيليجرام، تحليلات ذكية. للمطاعم والمتاجر والعيادات بالسعودية.',
      keywords:
        'خدمات شات بوت السعودية, ربط واتساب للأعمال, ويدجت محادثة, تكامل تيليجرام, chatbot services Saudi',
    },
    solutions: {
      title:
        'حلول فهملي للأعمال السعودية - مطاعم، عيادات، متاجر | AI Solutions',
      desc: 'حلول ذكاء اصطناعي مخصصة للمطاعم والكافيهات، العيادات الطبية، المتاجر الإلكترونية، العقارات والتعليم في السعودية.',
      keywords:
        'حلول أعمال سعودية, شات بوت مطاعم, بوت عيادات طبية, متاجر إلكترونية السعودية, AI business solutions KSA',
    },
    pricing: {
      title: 'أسعار فهملي بالريال السعودي - باقات من 199 ريال شهرياً',
      desc: 'باقات مرنة تبدأ من 199 ريال سعودي شهرياً. تجربة مجانية 7 أيام بدون بطاقة ائتمان. أسعار واضحة وشفافة.',
      keywords:
        'أسعار شات بوت السعودية, باقات فهملي بالريال, 199 ريال, تجربة مجانية, chatbot pricing Saudi Arabia',
    },
  },
  eg: {
    home: {
      title: 'فهملي مصر - شات بوت ذكاء اصطناعي بالمصري | الموظف اللي مبينامش',
      desc: 'أحسن شات بوت عربي مصري للمحلات والمطاعم والعيادات. ربط واتساب فوري، رد تلقائي 24/7، بيفهم اللهجة المصرية العامية. جرب مجاناً دلوقتي!',
      keywords:
        'شات بوت مصري, بوت واتساب مصر, ذكاء اصطناعي القاهرة, الإسكندرية, خدمة عملاء تلقائية, رد آلي مصري, فهملي, chatbot Egypt, WhatsApp bot Egypt, AI مصر',
    },
    services: {
      title: 'خدمات فهملي مصر - ربط واتساب وتكامل ذكي | Faheemly Egypt',
      desc: 'خدمات شات بوت متكاملة: ربط واتساب بيزنس، ويدجت الموقع، تيليجرام، تحليلات ذكية. للمحلات والمطاعم والعيادات في مصر.',
      keywords:
        'خدمات شات بوت مصر, ربط واتساب للأعمال مصر, ويدجت محادثة, تكامل تيليجرام مصري, chatbot services Egypt',
    },
    solutions: {
      title: 'حلول فهملي للأعمال المصرية - مطاعم، عيادات، محلات | AI Solutions',
      desc: 'حلول ذكاء اصطناعي مخصصة للمطاعم والكافيهات، العيادات الطبية، المحلات التجارية، العقارات والتعليم في مصر.',
      keywords:
        'حلول أعمال مصرية, شات بوت مطاعم مصر, بوت عيادات طبية مصر, محلات تجارية مصر, AI business solutions Egypt',
    },
    pricing: {
      title: `أسعار فهملي بالجنيه المصري - باقات من ${convertCurrency(199, 'EGP')} جنيه شهرياً`,
      desc: `باقات مرنة تبدأ من ${convertCurrency(199, 'EGP')} جنيه مصري شهرياً (199 ريال سعودي). تجربة مجانية 7 أيام بدون بطاقة ائتمان. أسعار واضحة وشفافة.`,
      keywords:
        `أسعار شات بوت مصر, باقات فهملي بالجنيه, ${convertCurrency(199, 'EGP')} جنيه, 199 ريال, تجربة مجانية مصر, chatbot pricing Egypt`,
    },
  },
  ae: {
    home: {
      title: 'فهملي الإمارات - شات بوت ذكاء اصطناعي | الموظف الذكي 24/7',
      desc: 'أفضل شات بوت عربي للأعمال في الإمارات. ربط واتساب فوري، رد تلقائي احترافي، يفهم اللهجة الإماراتية والخليجية. جرب مجاناً الآن!',
      keywords:
        'شات بوت الإمارات, بوت واتساب دبي, ذكاء اصطناعي أبوظبي, خدمة عملاء تلقائية UAE, رد آلي إماراتي, فهملي, chatbot UAE, WhatsApp bot Dubai, AI الإمارات',
    },
    services: {
      title: 'خدمات فهملي الإمارات - ربط واتساب وتكامل ذكي | Faheemly UAE',
      desc: 'خدمات شات بوت متكاملة: ربط واتساب بزنس، ويدجت الموقع، تيليجرام، تحليلات ذكية. للمطاعم والمتاجر والشركات في الإمارات.',
      keywords:
        'خدمات شات بوت الإمارات, ربط واتساب للأعمال دبي, ويدجت محادثة UAE, تكامل تيليجرام, chatbot services UAE',
    },
    solutions: {
      title:
        'حلول فهملي للأعمال الإماراتية - مطاعم، عيادات، متاجر | AI Solutions',
      desc: 'حلول ذكاء اصطناعي مخصصة للمطاعم، العيادات الطبية، المتاجر الإلكترونية، العقارات والشركات في الإمارات.',
      keywords:
        'حلول أعمال إماراتية, شات بوت مطاعم دبي, بوت عيادات UAE, متاجر إلكترونية الإمارات, AI business solutions UAE',
    },
    pricing: {
      title: 'أسعار فهملي بالدرهم الإماراتي - باقات من 199 درهم شهرياً',
      desc: 'باقات مرنة تبدأ من 199 درهم إماراتي شهرياً. تجربة مجانية 7 أيام بدون بطاقة ائتمان. أسعار واضحة وشفافة.',
      keywords:
        'أسعار شات بوت الإمارات, باقات فهملي بالدرهم, 199 درهم, تجربة مجانية UAE, chatbot pricing UAE',
    },
  },
  kw: {
    home: {
      title: 'فهملي الكويت - شات بوت ذكاء اصطناعي بالكويتي | خدمة 24/7',
      desc: 'أحسن شات بوت عربي كويتي للمحلات والمطاعم والشركات. ربط واتساب فوري، رد تلقائي، يفهم اللهجة الكويتية. جرب مجاناً الحين!',
      keywords:
        'شات بوت كويتي, بوت واتساب الكويت, ذكاء اصطناعي الكويت, خدمة عملاء تلقائية, رد آلي كويتي, فهملي, chatbot Kuwait, WhatsApp bot Kuwait, AI الكويت',
    },
    services: {
      title: 'خدمات فهملي الكويت - ربط واتساب وتكامل ذكي | Faheemly Kuwait',
      desc: 'خدمات شات بوت متكاملة: ربط واتساب بزنس، ويدجت الموقع، تيليجرام، تحليلات ذكية. للمحلات والمطاعم والشركات في الكويت.',
      keywords:
        'خدمات شات بوت الكويت, ربط واتساب للأعمال, ويدجت محادثة الكويت, تكامل تيليجرام, chatbot services Kuwait',
    },
    solutions: {
      title:
        'حلول فهملي للأعمال الكويتية - مطاعم، عيادات، محلات | AI Solutions',
      desc: 'حلول ذكاء اصطناعي مخصصة للمطاعم، العيادات الطبية، المحلات التجارية، العقارات والتعليم في الكويت.',
      keywords:
        'حلول أعمال كويتية, شات بوت مطاعم الكويت, بوت عيادات الكويت, محلات تجارية الكويت, AI business solutions Kuwait',
    },
    pricing: {
      title: 'أسعار فهملي بالدينار الكويتي - باقات من 8 دينار شهرياً',
      desc: 'باقات مرنة تبدأ من 8 دينار كويتي شهرياً (199 ريال سعودي). تجربة مجانية 7 أيام بدون بطاقة ائتمان. أسعار واضحة وشفافة.',
      keywords:
        'أسعار شات بوت الكويت, باقات فهملي بالدينار, 8 دينار, 199 ريال, تجربة مجانية الكويت, chatbot pricing Kuwait',
    },
  },
  en: {
    home: {
      title:
        'Faheemly - AI Chatbot for Middle East Businesses | 24/7 Smart Assistant',
      desc: 'Best Arabic AI chatbot for restaurants, clinics, and retail businesses. Instant WhatsApp integration, automatic replies in all Arabic dialects. Start your free trial today!',
      keywords:
        'Arabic chatbot, AI chatbot Middle East, WhatsApp bot, automated customer service, Faheemly, chatbot Saudi Arabia, Egypt, UAE, Kuwait, business automation',
    },
    services: {
      title: 'Faheemly Services - WhatsApp Integration & Smart Solutions',
      desc: 'Complete chatbot services: WhatsApp Business integration, website widget, Telegram bot, smart analytics. For businesses across the Middle East.',
      keywords:
        'chatbot services, WhatsApp business integration, website chat widget, Telegram bot, AI analytics, Middle East',
    },
    solutions: {
      title:
        'Faheemly Business Solutions - Restaurants, Clinics, Retail | AI-Powered',
      desc: 'Specialized AI solutions for restaurants, medical clinics, e-commerce, real estate, and education across the Middle East.',
      keywords:
        'business AI solutions, restaurant chatbot, clinic automation, retail bot, real estate AI, education technology',
    },
    pricing: {
      title: 'Faheemly Pricing - Plans Starting from $40/month',
      desc: 'Flexible plans starting from $40 per month. 7-day free trial with no credit card required. Transparent pricing for all businesses.',
      keywords:
        'chatbot pricing, AI bot cost, $40 monthly, free trial, affordable chatbot, Middle East pricing',
    },
  },
};

export const DIALECT_OPTIONS = [
  { value: 'sa', label: 'سعودي (نجدي/عامي)' },
  { value: 'eg', label: 'مصري (عامية)' },
  { value: 'official', label: 'عربي فصحى (رسمي)' },
];

export const REGIONAL_CONTENT = {
  sa: {
    heroTitle: 'الموظف الذكي الذي لا ينام ولا يطلب راتب',
    heroSubtitle:
      'فهملي هو نظام الرد الآلي العربي الأول. يمسك إدارة طلباتك، يحجز مواعيدك، ويرد على عملاءك في واتساب وموقعك بلهجة سعودية تبيض الوجه.',
    pricing: {
      currency: 'ر.س',
      currencyCode: 'SAR',
      starter: { price: '199', name: 'الأساسية' },
      pro: { price: '399', name: 'الاحترافية' },
      agency: { price: '999', name: 'المتاجر والشركات' },
    },
  },
  eg: {
    heroTitle: 'الموظف الذكي اللي مبينامش ومبيطلبش مرتب',
    heroSubtitle:
      'فهملي هو الشات بوت العربي الأول. بيمسك إدارة طلباتك، يحجز مواعيدك، ويرد على زباينك في الواتساب والموقع باللهجة المصرية اللي تفتح النفس.',
    pricing: {
      currency: 'ج.م',
      currencyCode: 'EGP',
        starter: {
        price: convertCurrency(199, 'EGP').toString(),
        name: 'الأساسية',
      },
      pro: {
        price: convertCurrency(399, 'EGP').toString(),
        name: 'الاحترافية',
      },
      agency: {
        price: convertCurrency(999, 'EGP').toString(),
        name: 'المتاجر والشركات',
      },
    },
  },
  ae: {
    heroTitle: 'الموظف الذكي الذي لا ينام ولا يطلب راتب',
    heroSubtitle:
      'فهملي هو نظام الرد الآلي العربي الأول. يمسك إدارة طلباتك، يحجز مواعيدك، ويرد على عملاءك في واتساب وموقعك بلهجة إماراتية احترافية.',
    pricing: {
      currency: 'د.إ',
      currencyCode: 'AED',
      starter: {
        price: convertCurrency(199, 'AED').toString(),
        name: 'الأساسية',
      },
      pro: {
        price: convertCurrency(399, 'AED').toString(),
        name: 'الاحترافية',
      },
      agency: {
        price: convertCurrency(999, 'AED').toString(),
        name: 'المتاجر والشركات',
      },
    },
  },
  kw: {
    heroTitle: 'الموظف الذكي الذي لا ينام ولا يطلب راتب',
    heroSubtitle:
      'فهملي هو نظام الرد الآلي العربي الأول. يمسك إدارة طلباتك، يحجز مواعيدك، ويرد على عملاءك في واتساب وموقعك بلهجة كويتية احترافية.',
    pricing: {
      currency: 'د.ك',
      currencyCode: 'KWD',
      starter: {
        price: convertCurrency(199, 'KWD').toString(),
        name: 'الأساسية',
      },
      pro: {
        price: convertCurrency(399, 'KWD').toString(),
        name: 'الاحترافية',
      },
      agency: {
        price: convertCurrency(999, 'KWD').toString(),
        name: 'المتاجر والشركات',
      },
    },
  },
};

export const COMPARISON_DATA = {
  old: {
    title: 'الشات بوت التقليدي',
    points: [
      'يحتاج برمجة معقدة',
      'ردود جامدة ومحفوظة',
      'لا يفهم اللهجات',
      'تكلفة عالية للصيانة',
    ],
  },
  human: {
    title: 'موظف خدمة العملاء',
    points: [
      'غير متاح 24/7',
      'بطء في الرد وقت الذروة',
      'تكاليف رواتب شهرية',
      'تعاطف بشري (فهملي يقترب!)',
    ],
  },
  fahimo: {
    title: 'فهملي.كوم AI',
    points: [
      'تدريب على ملفاتك في ثوانٍ',
      'يفهم اللهجات (سعودي/مصري)',
      'تكامل واتساب بضغطة زر',
      'تعلم مستمر من المحادثات',
    ],
  },
};

// ZERO COST RESPONSES
export const STATIC_RESPONSES = {
  sa: {
    greetings: [
      'يا هلا والله!',
      'هلا بك، آمرني؟',
      'مرحباً، حياك الله في متجرنا',
    ],
    thanks: ['بالخدمة طال عمرك', 'العفو، واجبي', 'حياك الله أي وقت'],
    fallback:
      'والله المعذرة، هالمعلومة مو متوفرة عندي حالياً. تبي أحولك لموظف بشري؟',
    goodbye: 'بحفظ الله، ننتظرك مرة ثانية',
  },
  eg: {
    greetings: [
      'أهلاً يا باشا! منورنا',
      'أؤمرني يا ريس',
      'يا هلا بيك، إزاي أقدر أساعدك؟',
    ],
    thanks: ['على راسي يا غالي', 'العفو يا باشا، ده واجبي', 'عيوني ليك'],
    fallback:
      'لامؤاخذة يا ريس، المعلومة دي مش عندي دلوقتي. تحب أوصلك بالإدارة؟',
    goodbye: 'مع السلامة يا بطل، شرفت المحل',
  },
  official: {
    greetings: [
      'مرحباً بك',
      'أهلاً وسهلاً، كيف يمكنني مساعدتك؟',
      'سعداء بتواجدك معنا',
    ],
    thanks: ['عفواً، نحن في الخدمة', 'لا شكر على واجب', 'بكل سرور'],
    fallback: 'عذراً، هذه المعلومة غير متوفرة في قاعدة بياناتي الحالية.',
    goodbye: 'إلى اللقاء، نتمنى لك يوماً سعيداً',
  },
};

export const DEMO_PROJECTS = {
  'Al-Baik': {
    config: {
      name: 'مسعد (البيك)',
      tone: 'friendly',
      dialect: 'sa',
      strictMode: true,
    },
    kb: [
      {
        id: '1',
        type: 'text',
        title: 'المنيو والأسعار',
        content:
          'وجبة دجاج مسحب 4 قطع بـ 18 ريال. وجبة دجاج مسحب 8 قطع بـ 28 ريال. بروستد 4 قطع بـ 20 ريال. البيك الايس كريم بـ 2 ريال.',
        status: 'active',
        dateAdded: Date.now(),
      },
      {
        id: '2',
        type: 'text',
        title: 'الفروع',
        content:
          'فروعنا في جدة، الرياض، مكة، المدينة. أوقات العمل من 10 صباحاً حتى 2 فجراً.',
        status: 'active',
        dateAdded: Date.now(),
      },
    ],
  },
  Zara: {
    config: {
      name: 'سارة (زارا)',
      tone: 'professional',
      dialect: 'official',
      strictMode: false,
    },
    kb: [
      {
        id: '1',
        type: 'text',
        title: 'سياسة الاستبدال',
        content:
          'يمكن استبدال القطع خلال 30 يوم من تاريخ الشراء بشرط وجود الفاتورة والبطاقة التعريفية.',
        status: 'active',
        dateAdded: Date.now(),
      },
    ],
  },
  'Dr. Magdy': {
    config: {
      name: 'د. مجدي (العيادة)',
      tone: 'professional',
      dialect: 'eg',
      strictMode: true,
    },
    kb: [
      {
        id: '1',
        type: 'text',
        title: 'أسعار الكشف',
        content:
          'سعر الكشف 300 جنيه. الاستشارة مجانية خلال أسبوعين. مواعيد العيادة من 5 مساءً لـ 10 مساءً.',
        status: 'active',
        dateAdded: Date.now(),
      },
    ],
  },
};

export const TRANSLATIONS = {
  ar: {
    // General
    dashboard: 'لوحة التحكم',
    chat: 'المحادثة',
    knowledge: 'قاعدة المعرفة',
    settings: 'إعدادات البوت',
    analytics: 'التحليلات',
    newChat: 'محادثة جديدة',
    sendMessage: 'اكتب رسالتك هنا...',
    industry: 'مجال العمل',
    cacheHit: 'ذاكرة',
    kbMatch: 'ملفاتي',
    apiCall: 'ذكاء اصطناعي',
    templateHit: 'رد جاهز (مجاني)',
    save: 'حفظ الإعدادات',
    upload: 'رفع ملف PDF',
    addText: 'إضافة نص يدوي',
    overview: 'نظرة عامة',
    totalRequests: 'إجمالي المحادثات',
    cacheRate: 'نسبة التوفير',
    activeKB: 'المصادر النشطة',
    creditsUsed: 'الرصيد المستخدم',
    creditsRemaining: 'المتبقي',
    upgrade: 'ترقية الباقة',
    whatsappStatus: 'حالة واتساب',
    connected: 'متصل',
    disconnected: 'غير متصل',

    // Settings
    generalSettings: 'الإعدادات العامة',
    widgetSettings: 'تخصيص الويدجت',
    botIdentity: 'هوية المساعد',
    botNamePlaceholder: 'مثال: مساعد المبيعات',
    strictMode: 'الوضع الصارم (لا يهلوس)',
    strictModeDesc:
      'البوت يجاوب فقط من المعلومات اللي عطيته إياها (قاعدة المعرفة). لو ما عرف، يعتذر.',
    dialect: 'اللهجة',
    widgetColor: 'لون الويدجت',
    preview: 'تجربة حية',
    embedCode: 'كود الربط',
    copyCode: 'نسخ الكود',

    // Auth & Wizard
    login: 'دخول المشتركين',
    register: 'ابدأ التجربة المجانية',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    welcomeBack: 'أهلاً بك مجدداً',
    loginSubtitle: 'أدخل بياناتك لمتابعة عملائك',
    createAccount: 'أنشئ حساب عملك',
    step1: 'البيانات الشخصية',
    step2: 'تفاصيل النشاط',
    step3: 'تخصيص المساعد',
    fullName: 'اسم المدير',
    businessName: 'اسم النشاط التجاري',
    botName: 'اسم المساعد (مثل: موظف الاستقبال)',
    botTone: 'شخصية المساعد',
    next: 'التالي',
    back: 'رجوع',
    complete: 'إطلاق المساعد',
    dontHaveAccount: 'ليس لديك حساب؟',
    haveAccount: 'مشترك بالفعل؟',
    signIn: 'دخول',
    signUp: 'جرب مجاناً',

    // Landing Page
    heroTag: 'شريكك الذكي لنمو أعمالك 🚀',
    startTrial: 'جـرب مجـاناً',
    liveDemo: 'تحدث مع المساعد',
    loginBtn: 'دخول',
    features: 'المميزات',
    pricing: 'الأسعار',
    aboutUs: 'من نحن',
    contactUs: 'اتصل بنا',
    footerMadeBy: 'Developed By Ma-Fo.info',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',

    // Industries
    indTitle: 'حلول مفصلة على مقاسك',
    indRestTitle: 'المطاعم والكافيهات',
    indRestDesc:
      'عرض المنيو بالصور، حجز الطاولات، والرد على استفسارات الموقع وأوقات العمل بلهجة تفتح النفس.',
    indRestModalTitle: 'المطاعم والكافيهات',
    indRestModalDesc:
      "حول زوار موقعك ومنصات التواصل إلى زبائن دائمين. فهملي يستعرض المنيو بصور شهية، يحجز الطاولات، ويجيب على أسئلة 'عندكم توصيل؟' و 'إيش أوقات العمل؟' بلهجة ترحيبية وكأنك وظفت أفضل مضيف استقبال، لكنه متاح 24 ساعة ولا يكل ولا يمل.",

    indClinicTitle: 'العيادات والمراكز',
    indClinicDesc:
      'حجز المواعيد تلقائياً، الإجابة على الأسئلة الطبية الشائعة، وتذكير المرضى بمواعيدهم.',
    indClinicModalTitle: 'العيادات والمراكز الطبية',
    indClinicModalDesc:
      'قلل نسبة التغيب عن المواعيد ووفر وقت موظفي الاستقبال. فهملي يقوم بجدولة المواعيد، الرد على استفسارات الأسعار والخدمات، وإرسال تذكيرات للمرضى. تعامل احترافي وخصوصية تامة لبيانات مرضاك.',

    indRetailTitle: 'المتاجر والوكالات',
    indRetailDesc:
      'مساعد تسوق ذكي يقترح المنتجات، يتابع حالة الطلب، ويقلل من استرجاع البضائع.',
    indRetailModalTitle: 'المتاجر الإلكترونية والوكالات',
    indRetailModalDesc:
      'زود مبيعاتك بمساعد ذكي يقترح المنتجات المناسبة لكل عميل بناءً على تفضيلاته. يتابع حالة الشحنات، يعالج طلبات الاسترجاع والاستبدال وفق سياستك، ويضمن تجربة تسوق سلسة تزيد من ولاء العملاء.',

    indCorpTitle: 'الشركات والمؤسسات',
    indCorpDesc:
      'دعم فني ذكي، نظام تذاكر متقدم، إدارة طلبات الخدمة، قاعدة معرفية تفاعلية، وتقارير تحليلية مفصلة للأداء.',
    indCorpModalTitle: 'حلول الشركات والمؤسسات',
    indCorpModalDesc:
      'نظام دعم فني متكامل مع قاعدة معرفية ذكية وتقارير تحليلية تفصيلية.',

    indEduTitle: 'التعليم والتدريب',
    indEduDesc:
      'تسجيل الطلاب، إرسال المواد التعليمية، متابعة الحضور والغياب، الرد على الاستفسارات الأكاديمية، وتنبيهات الامتحانات.',
    indEduModalTitle: 'حلول التعليم والتدريب',
    indEduModalDesc:
      'أتمتة العمليات الإدارية وتحسين التواصل مع الطلاب وأولياء الأمور.',

    indFinTitle: 'الخدمات المالية',
    indFinDesc:
      'استفسارات عن الحسابات والأرصدة، طلبات القروض، دعم فني آمن ومشفر، إشعارات المعاملات، وتقارير مالية فورية.',
    indFinModalTitle: 'حلول الخدمات المالية',
    indFinModalDesc:
      'خدمات مصرفية ذكية وآمنة عبر واتساب مع حماية عالية للبيانات.',

    // Integrations
    integrationTitle: 'موجود وين ما كان عميلك',
    whatsappDesc: 'رد آلي على واتساب الرسمي',
    websiteDesc: 'أيقونة محادثة ذكية لموقعك',
    apiDesc: 'ربط برمجي مع أنظمتك',

    // Pricing
    pricingTitle: 'باقات مرنة ومربحة',
    pricingSub: 'جرب مجاناً لمدة 14 يوم. بدون بطاقة ائتمان.',

    planStarterDesc: 'للبدايات القوية',
    feat1: '1 مساعد ذكي',
    feat2: '500 محادثة شهرياً',
    feat3: 'ويدجت الموقع الإلكتروني',
    feat4: 'دعم فني عبر التذاكر',

    planProDesc: 'للشركات الطموحة',
    featPro1: '3 مساعدين أذكياء',
    featPro2: '10,000 محادثة شهرياً',
    featPro3: 'تكامل واتساب للأعمال',
    featPro4: 'إزالة شعار فهملي',

    planAgencyDesc: 'للوكالات والشركات الكبرى',
    featEnt1: 'عدد غير محدود من المساعدين',
    featEnt2: 'محادثات غير محدودة',
    featEnt3: 'لوحة تحكم خاصة لعملائك (White Label)',
    featEnt4: 'مدير حساب خاص',

    choosePlan: 'اشترك الآن',
    popular: 'الأكثر طلباً',

    // Admin
    adminPanel: 'لوحة الأدمن (المالك)',
    totalUsers: 'المشتركين',
    totalRev: 'الإيرادات',
    serverStatus: 'حالة السيرفر',

    // Comparison
    whyFahimo: 'لماذا فهملي.كوم؟',
    compSub: 'مقارنة سريعة مع الحلول التقليدية',
    oldWayTitle: 'الشات بوت التقليدي',
    humanTitle: 'موظف خدمة العملاء',
    fahimoTitle: 'فهملي.كوم AI',

    // Coverage
    coverageTag: 'نغطي جميع دول الشرق الأوسط',
    coverageTitle: 'نتحدث بكل اللهجات العربية',
    coverageDesc:
      'من الخليج إلى المغرب، فهملي يفهم ويتحدث بلهجة عملائك المحليين',

    // Testimonials
    testimonialsTag: 'ماذا يقول عملاؤنا',
    testimonialsTitle: 'قصص نجاح حقيقية',
    testimonialsDesc: 'انضم لمئات الشركات التي نجحت مع فهملي',

    // Why Choose
    whyTag: 'لماذا تختار فهملي؟',
    whyDesc: 'أسباب تجعلنا الخيار الأفضل',
    whyFast: 'إعداد سريع',
    whyFastDesc: 'ابدأ في أقل من 5 دقائق',
    whySecure: 'أمان عالي',
    whySecureDesc: 'بياناتك محمية بأعلى معايير الأمان',
    whySupport: 'دعم 24/7',
    whySupportDesc: 'فريق دعم متاح على مدار الساعة',

    // CTA
    ctaTitle: 'جاهز لتحويل تجربة عملائك؟',
    ctaDesc: 'ابدأ تجربتك المجانية اليوم - بدون بطاقة ائتمانية - 7 أيام كاملة',
    ctaButton: 'ابدأ التجربة المجانية',
    ctaContact: 'تواصل معنا',

    // Offer
    offerTag: 'عرض خاص لفترة محدودة',
    offerTitle: 'ابدأ رحلتك بـ',
    offerDesc: 'احصل على جميع المميزات الاحترافية + دعم فني 24/7',
    offerButton: 'اشترك الآن',
    offerGuarantee: '* ضمان استرداد الأموال لمدة 30 يوم',
  },
  en: {
    // Basic EN fallback
    dashboard: 'Dashboard',
    chat: 'Chat',
    knowledge: 'Knowledge Base',
    settings: 'Bot Settings',
    analytics: 'Analytics',
    newChat: 'New Chat',
    sendMessage: 'Send a message...',
    industry: 'Industry',
    cacheHit: 'Served from Cache',
    kbMatch: 'Extracted from KB',
    apiCall: 'Generated by Gemini',
    templateHit: 'Template (Free)',
    save: 'Save Settings',
    upload: 'Upload',
    addText: 'Add Text',
    overview: 'Overview',
    totalRequests: 'Total Requests',
    cacheRate: 'Cache Rate',
    activeKB: 'Active Knowledge',
    creditsUsed: 'Credits Used',
    creditsRemaining: 'Remaining',
    upgrade: 'Upgrade',
    whatsappStatus: 'WhatsApp Status',
    connected: 'Connected',
    disconnected: 'Disconnected',

    // Settings
    generalSettings: 'General Settings',
    widgetSettings: 'Widget Customization',
    botIdentity: 'Bot Identity',
    botNamePlaceholder: 'e.g., Sales Assistant',
    strictMode: 'Strict Mode',
    strictModeDesc:
      'Only answer from Knowledge Base. Prevents AI hallucinations.',
    dialect: 'Dialect',
    widgetColor: 'Widget Color',
    preview: 'Live Preview',
    embedCode: 'Embed Code',
    copyCode: 'Copy Code',

    // Auth & Wizard
    login: 'Login',
    register: 'Start Free Trial',
    email: 'Email',
    password: 'Password',
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Login to manage your bots',
    createAccount: 'Create Business Account',
    step1: 'Personal Info',
    step2: 'Business Details',
    step3: 'AI Setup',
    fullName: 'Full Name',
    businessName: 'Business Name',
    botName: 'Bot Name',
    botTone: 'Tone',
    next: 'Next',
    back: 'Back',
    complete: 'Launch Bot',
    dontHaveAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signIn: 'Sign In',
    signUp: 'Sign Up',

    // Landing Page
    heroTag: 'New: Agency Dashboard 🚀',
    startTrial: 'Start Free Trial',
    liveDemo: 'Live Demo',
    loginBtn: 'Login',
    features: 'Features',
    pricing: 'Pricing',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    footerMadeBy: 'Developed By Ma-Fo.info',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',

    // Additional Landing Page translations
    coverageTitle: 'Covering All Middle East Countries',
    coverageSubtitle: 'We Speak All Arabic Dialects',
    coverageDescription:
      "From the Gulf to Morocco, Faheemly understands and speaks your local customers' dialect",
    solutionsTag: 'Specialized Solutions for All Sectors',
    solutionsSubtitle:
      'Choose the right solution for your business and discover how Faheemly can make a difference',
    startFreeTrial: 'Start Free Trial',
    closeBtn: 'Close',

    // Menu items
    home: 'Home',
    services: 'Services',
    solutions: 'Solutions',
    about: 'About',
    contact: 'Contact',

    // Industries
    indTitle: 'Tailored Solutions',
    indRestTitle: 'Restaurants & Cafes',
    indRestDesc:
      'Display menu with images, table reservations, and answer inquiries about location and working hours.',
    indRestModalTitle: 'Restaurants & Cafes',
    indRestModalDesc:
      "Turn your website visitors into regular customers. Faheemly showcases your menu with appetizing images, handles table reservations, and answers questions like 'Do you deliver?' and 'What are your hours?' with a welcoming tone, as if you hired the best receptionist - but available 24/7 without getting tired.",

    indClinicTitle: 'Clinics & Medical Centers',
    indClinicDesc:
      'Automatic appointment booking, answering common medical questions, and reminding patients of appointments.',
    indClinicModalTitle: 'Clinics & Medical Centers',
    indClinicModalDesc:
      "Reduce no-shows and save reception staff time. Faheemly schedules appointments, answers pricing and service inquiries, and sends patient reminders. Professional handling with complete privacy for your patients' data.",

    indRetailTitle: 'Stores & Agencies',
    indRetailDesc:
      'Smart shopping assistant suggesting products, tracking order status, and reducing returns.',
    indRetailModalTitle: 'Online Stores & Agencies',
    indRetailModalDesc:
      'Boost your sales with a smart assistant that suggests the right products for each customer based on their preferences. Tracks shipment status, processes returns and exchanges according to your policy, and ensures a smooth shopping experience that increases customer loyalty.',

    indCorpTitle: 'Companies & Institutions',
    indCorpDesc:
      'Smart technical support, advanced ticketing system, service request management, interactive knowledge base, and detailed performance analytics.',
    indCorpModalTitle: 'Corporate Solutions',
    indCorpModalDesc:
      'Integrated technical support system with smart knowledge base and detailed analytical reports.',

    indEduTitle: 'Education & Training',
    indEduDesc:
      'Student registration, sending educational materials, tracking attendance, answering academic inquiries, and exam alerts.',
    indEduModalTitle: 'Education Solutions',
    indEduModalDesc:
      'Automating administrative processes and improving communication with students and parents.',

    indFinTitle: 'Financial Services',
    indFinDesc:
      'Account and balance inquiries, loan applications, secure and encrypted technical support, transaction notifications, and instant financial reports.',
    indFinModalTitle: 'Financial Solutions',
    indFinModalDesc:
      'Smart and secure banking services via WhatsApp with high data protection.',

    // Integrations
    integrationTitle: 'Wherever Your Customer Is',
    whatsappDesc: 'Auto-reply on official WhatsApp',
    websiteDesc: 'Smart chat icon for your website',
    apiDesc: 'API integration with your systems',

    // Pricing
    pricingTitle: 'Pay As You Grow',
    pricingSub: 'No hidden fees. Cancel anytime.',
    planStarterDesc: 'Great for startups',
    feat1: '1 AI Bot',
    feat2: '500 Messages/mo',
    feat3: 'Web Widget',
    feat4: 'Ticket Support',
    planProDesc: 'For growing businesses',
    featPro1: '3 AI Bots',
    featPro2: '10,000 Messages/mo',
    featPro3: 'WhatsApp Business',
    featPro4: 'No Branding',
    planAgencyDesc: 'For Agencies',
    featEnt1: 'Unlimited Bots',
    featEnt2: 'Unlimited Messages',
    featEnt3: 'White Label Dashboard',
    featEnt4: 'Account Manager',
    choosePlan: 'Subscribe',
    popular: 'Best Value',

    adminPanel: 'Super Admin',
    totalUsers: 'Users',
    totalRev: 'Revenue',
    serverStatus: 'Server Status',

    whyFahimo: 'Why Choose Faheemly.com?',
    compSub: 'A quick comparison',
    oldWayTitle: 'Old Chatbots',
    humanTitle: 'Human Agent',
    fahimoTitle: 'Faheemly.com AI',

    // Coverage
    coverageTag: 'Covering All Middle East Countries',
    coverageTitle: 'We Speak All Arabic Dialects',
    coverageDesc:
      "From the Gulf to Morocco, Faheemly understands and speaks your local customers' dialect",

    // Testimonials
    testimonialsTag: 'What Our Clients Say',
    testimonialsTitle: 'Real Success Stories',
    testimonialsDesc: 'Join hundreds of businesses succeeding with Faheemly',

    // Why Choose
    whyTag: 'Why Choose Faheemly?',
    whyDesc: 'Reasons why we are the best choice',
    whyFast: 'Fast Setup',
    whyFastDesc: 'Start in less than 5 minutes',
    whySecure: 'High Security',
    whySecureDesc: 'Your data is protected with highest security standards',
    whySupport: '24/7 Support',
    whySupportDesc: 'Support team available around the clock',

    // CTA
    ctaTitle: 'Ready to Transform Your Customer Experience?',
    ctaDesc:
      'Start your free trial today - No credit card required - Full 7 days',
    ctaButton: 'Start Free Trial',
    ctaContact: 'Contact Us',

    // Offer
    offerTag: 'Limited Time Offer',
    offerTitle: 'Start your journey for',
    offerDesc: 'Get all professional features + 24/7 support',
    offerButton: 'Subscribe Now',
    offerGuarantee: '* 30-day money-back guarantee',
  },
};

export const SYSTEM_INSTRUCTIONS = {
  [Industry.RESTAURANT]:
    'أنت مساعد ذكي لمطعم. تتحدث بلهجة ودودة ومرحة (سعودية أو مصرية حسب السياق). هدفك عرض المنيو وتشجيع العميل على الطلب.',
  [Industry.RETAIL]:
    'أنت مساعد تسوق أنيق. تتحدث باحترافية وتساعد العميل في اختيار المقاسات والألوان المناسبة. هدفك إتمام عملية البيع.',
  [Industry.SERVICES]:
    'أنت سكرتير طبي/خدمي محترف. تتحدث بدقة واحترام. هدفك تنظيم المواعيد والإجابة على الاستفسارات بوضوح.',
  [Industry.GENERAL]: 'أنت مساعد أعمال ذكي من منصة فهملي.',
};

export const MOCK_ANALYTICS = [
  { date: '2023-10-01', requests: 120, cacheHits: 40, costSaved: 0.8 },
  { date: '2023-10-02', requests: 150, cacheHits: 60, costSaved: 1.2 },
  { date: '2023-10-03', requests: 180, cacheHits: 90, costSaved: 1.8 },
  { date: '2023-10-04', requests: 200, cacheHits: 120, costSaved: 2.4 },
  { date: '2023-10-05', requests: 170, cacheHits: 85, costSaved: 1.7 },
  { date: '2023-10-06', requests: 250, cacheHits: 150, costSaved: 3.0 },
  { date: '2023-10-07', requests: 300, cacheHits: 200, costSaved: 4.0 },
];

// Brand color tokens used across the app (fallbacks for inline styles)
export const BRAND = {
  brand400: '#8B5CF6',
  brand500: '#7C3AED',
  brand600: '#6D28D9',
};
