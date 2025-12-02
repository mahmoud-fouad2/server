import { Industry, BotConfig, KnowledgeItem } from './types';

export const APP_NAME = "فهملي";

export const SEO_DATA = {
  home: {
    title: "فهملي - الموظف الذكي الذي لا ينام ولا يطلب راتب",
    desc: "أفضل منصة شات بوت عربي للمتاجر والمطاعم. تفعيل فوري، دعم واتساب، وذكاء اصطناعي يفهم اللهجات. الموظف الذكي الذي لا ينام ولا يطلب راتب.",
    keywords: "شات بوت, ذكاء اصطناعي, واتساب للأعمال, رد آلي, خدمة عملاء, السعودية, مصر, فهملي, الموظف الذكي الذي لا ينام ولا يطلب راتب"
  },
  about: {
    title: "قصتنا - فهملي",
    desc: "كيف بدأت فهملي من فكرة بسيطة إلى أقوى نظام ذكاء اصطناعي عربي للأعمال.",
  },
  pricing: {
    title: "باقات الأسعار - فهملي",
    desc: "باقات مرنة تناسب حجم عملك. ابدأ مجاناً.",
  },
  privacy: {
    title: "سياسة الخصوصية - فهملي",
    desc: "نحن نهتم بخصوصية بياناتك وبيانات عملائك."
  },
  terms: {
    title: "الشروط والأحكام - فهملي",
    desc: "شروط استخدام منصة فهملي للذكاء الاصطناعي."
  }
};

export const DIALECT_OPTIONS = [
  { value: 'sa', label: 'سعودي (نجدي/عامي)' },
  { value: 'eg', label: 'مصري (عامية)' },
  { value: 'official', label: 'عربي فصحى (رسمي)' },
];

export const REGIONAL_CONTENT = {
  sa: {
    heroTitle: "الموظف الذكي الذي لا ينام ولا يطلب راتب",
    heroSubtitle: "فهملي هو نظام الرد الآلي العربي الأول. يمسك إدارة طلباتك، يحجز مواعيدك، ويرد على عملاءك في واتساب وموقعك بلهجة سعودية تبيض الوجه.",
    pricing: {
      currency: "ر.س",
      starter: { price: "149", name: "انطلاقة" },
      pro: { price: "399", name: "نمو" },
      agency: { price: "999", name: "شركات" }
    }
  },
  eg: {
    heroTitle: "الموظف الذكي اللي مبيناش ومبيطلبش مرتب",
    heroSubtitle: "فهملي هو الشات بوت العربي الأول. بيمسك إدارة طلباتك، يحجز مواعيدك، ويرد على زباينك في الواتساب والموقع باللهجة المصرية اللي تفتح النفس.",
    pricing: {
      currency: "ج.م",
      starter: { price: "499", name: "البداية" },
      pro: { price: "1499", name: "الاحترافية" },
      agency: { price: "3999", name: "الوحش" }
    }
  }
};

export const COMPARISON_DATA = {
  old: {
    title: "الشات بوت التقليدي",
    points: [
      "يحتاج برمجة معقدة",
      "ردود جامدة ومحفوظة",
      "لا يفهم اللهجات",
      "تكلفة عالية للصيانة"
    ]
  },
  human: {
    title: "موظف خدمة العملاء",
    points: [
      "غير متاح 24/7",
      "بطء في الرد وقت الذروة",
      "تكاليف رواتب شهرية",
      "تعاطف بشري (فهملي يقترب!)"
    ]
  },
  fahimo: {
    title: "فهملي.كوم AI",
    points: [
      "تدريب على ملفاتك في ثوانٍ",
      "يفهم اللهجات (سعودي/مصري)",
      "تكامل واتساب بضغطة زر",
      "تعلم مستمر من المحادثات"
    ]
  }
};

// ZERO COST RESPONSES
export const STATIC_RESPONSES = {
  sa: {
    greetings: ['يا هلا والله!', 'هلا بك، آمرني؟', 'مرحباً، حياك الله في متجرنا'],
    thanks: ['بالخدمة طال عمرك', 'العفو، واجبي', 'حياك الله أي وقت'],
    fallback: 'والله المعذرة، هالمعلومة مو متوفرة عندي حالياً. تبي أحولك لموظف بشري؟',
    goodbye: 'بحفظ الله، ننتظرك مرة ثانية'
  },
  eg: {
    greetings: ['أهلاً يا باشا! منورنا', 'أؤمرني يا ريس', 'يا هلا بيك، إزاي أقدر أساعدك؟'],
    thanks: ['على راسي يا غالي', 'العفو يا باشا، ده واجبي', 'عيوني ليك'],
    fallback: 'لامؤاخذة يا ريس، المعلومة دي مش عندي دلوقتي. تحب أوصلك بالإدارة؟',
    goodbye: 'مع السلامة يا بطل، شرفت المحل'
  },
  official: {
    greetings: ['مرحباً بك', 'أهلاً وسهلاً، كيف يمكنني مساعدتك؟', 'سعداء بتواجدك معنا'],
    thanks: ['عفواً، نحن في الخدمة', 'لا شكر على واجب', 'بكل سرور'],
    fallback: 'عذراً، هذه المعلومة غير متوفرة في قاعدة بياناتي الحالية.',
    goodbye: 'إلى اللقاء، نتمنى لك يوماً سعيداً'
  }
};

export const DEMO_PROJECTS = {
  'Al-Baik': {
    config: { name: 'مسعد (البيك)', tone: 'friendly', dialect: 'sa', strictMode: true },
    kb: [
      { id: '1', type: 'text', title: 'المنيو والأسعار', content: 'وجبة دجاج مسحب 4 قطع بـ 18 ريال. وجبة دجاج مسحب 8 قطع بـ 28 ريال. بروستد 4 قطع بـ 20 ريال. البيك الايس كريم بـ 2 ريال.', status: 'active', dateAdded: Date.now() },
      { id: '2', type: 'text', title: 'الفروع', content: 'فروعنا في جدة، الرياض، مكة، المدينة. أوقات العمل من 10 صباحاً حتى 2 فجراً.', status: 'active', dateAdded: Date.now() }
    ]
  },
  'Zara': {
    config: { name: 'سارة (زارا)', tone: 'professional', dialect: 'official', strictMode: false },
    kb: [
      { id: '1', type: 'text', title: 'سياسة الاستبدال', content: 'يمكن استبدال القطع خلال 30 يوم من تاريخ الشراء بشرط وجود الفاتورة والبطاقة التعريفية.', status: 'active', dateAdded: Date.now() }
    ]
  },
  'Dr. Magdy': {
    config: { name: 'د. مجدي (العيادة)', tone: 'professional', dialect: 'eg', strictMode: true },
    kb: [
      { id: '1', type: 'text', title: 'أسعار الكشف', content: 'سعر الكشف 300 جنيه. الاستشارة مجانية خلال أسبوعين. مواعيد العيادة من 5 مساءً لـ 10 مساءً.', status: 'active', dateAdded: Date.now() }
    ]
  }
};

export const TRANSLATIONS = {
  ar: {
    // General
    dashboard: "لوحة التحكم",
    chat: "المحادثة",
    knowledge: "قاعدة المعرفة",
    settings: "إعدادات البوت",
    analytics: "التحليلات",
    newChat: "محادثة جديدة",
    sendMessage: "اكتب رسالتك هنا...",
    industry: "مجال العمل",
    cacheHit: "ذاكرة",
    kbMatch: "ملفاتي",
    apiCall: "ذكاء اصطناعي",
    templateHit: "رد جاهز (مجاني)",
    save: "حفظ الإعدادات",
    upload: "رفع ملف PDF",
    addText: "إضافة نص يدوي",
    overview: "نظرة عامة",
    totalRequests: "إجمالي المحادثات",
    cacheRate: "نسبة التوفير",
    activeKB: "المصادر النشطة",
    creditsUsed: "الرصيد المستخدم",
    creditsRemaining: "المتبقي",
    upgrade: "ترقية الباقة",
    whatsappStatus: "حالة واتساب",
    connected: "متصل",
    disconnected: "غير متصل",
    
    // Settings
    generalSettings: "الإعدادات العامة",
    widgetSettings: "تخصيص الويدجت",
    botIdentity: "هوية المساعد",
    botNamePlaceholder: "مثال: مساعد المبيعات",
    strictMode: "الوضع الصارم (لا يهلوس)",
    strictModeDesc: "البوت يجاوب فقط من المعلومات اللي عطيته إياها (قاعدة المعرفة). لو ما عرف، يعتذر.",
    dialect: "اللهجة",
    widgetColor: "لون الويدجت",
    preview: "تجربة حية",
    embedCode: "كود الربط",
    copyCode: "نسخ الكود",

    // Auth & Wizard
    login: "دخول المشتركين",
    register: "ابدأ التجربة المجانية",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    welcomeBack: "أهلاً بك مجدداً",
    loginSubtitle: "أدخل بياناتك لمتابعة عملائك",
    createAccount: "أنشئ حساب عملك",
    step1: "البيانات الشخصية",
    step2: "تفاصيل النشاط",
    step3: "تخصيص المساعد",
    fullName: "اسم المدير",
    businessName: "اسم النشاط التجاري",
    botName: "اسم المساعد (مثل: موظف الاستقبال)",
    botTone: "شخصية المساعد",
    next: "التالي",
    back: "رجوع",
    complete: "إطلاق المساعد",
    dontHaveAccount: "ليس لديك حساب؟",
    haveAccount: "مشترك بالفعل؟",
    signIn: "دخول",
    signUp: "جرب مجاناً",

    // Landing Page
    heroTag: "شريكك الذكي لنمو أعمالك 🚀",
    startTrial: "جـرب مجـاناً",
    liveDemo: "تحدث مع المساعد",
    loginBtn: "دخول",
    features: "المميزات",
    pricing: "الأسعار",
    aboutUs: "من نحن",
    contactUs: "اتصل بنا",
    footerMadeBy: "Developed By Ma-Fo.info",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    
    // Industries
    indTitle: "حلول مفصلة على مقاسك",
    indRestTitle: "المطاعم والكافيهات",
    indRestDesc: "عرض المنيو بالصور، حجز الطاولات، والرد على استفسارات الموقع وأوقات العمل بلهجة تفتح النفس.",
    indRestModalTitle: "المطاعم والكافيهات",
    indRestModalDesc: "حول زوار موقعك ومنصات التواصل إلى زبائن دائمين. فهملي يستعرض المنيو بصور شهية، يحجز الطاولات، ويجيب على أسئلة 'عندكم توصيل؟' و 'إيش أوقات العمل؟' بلهجة ترحيبية وكأنك وظفت أفضل مضيف استقبال، لكنه متاح 24 ساعة ولا يكل ولا يمل.",
    
    indClinicTitle: "العيادات والمراكز",
    indClinicDesc: "حجز المواعيد تلقائياً، الإجابة على الأسئلة الطبية الشائعة، وتذكير المرضى بمواعيدهم.",
    indClinicModalTitle: "العيادات والمراكز الطبية",
    indClinicModalDesc: "قلل نسبة التغيب عن المواعيد ووفر وقت موظفي الاستقبال. فهملي يقوم بجدولة المواعيد، الرد على استفسارات الأسعار والخدمات، وإرسال تذكيرات للمرضى. تعامل احترافي وخصوصية تامة لبيانات مرضاك.",

    indRetailTitle: "المتاجر والوكالات",
    indRetailDesc: "مساعد تسوق ذكي يقترح المنتجات، يتابع حالة الطلب، ويقلل من استرجاع البضائع.",
    indRetailModalTitle: "المتاجر الإلكترونية والوكالات",
    indRetailModalDesc: "زود مبيعاتك بمساعد ذكي يقترح المنتجات المناسبة لكل عميل بناءً على تفضيلاته. يتابع حالة الشحنات، يعالج طلبات الاسترجاع والاستبدال وفق سياستك، ويضمن تجربة تسوق سلسة تزيد من ولاء العملاء.",

    // Integrations
    integrationTitle: "موجود وين ما كان عميلك",
    whatsappDesc: "رد آلي على واتساب الرسمي",
    websiteDesc: "أيقونة محادثة ذكية لموقعك",
    apiDesc: "ربط برمجي مع أنظمتك",

    // Pricing
    pricingTitle: "باقات مرنة ومربحة",
    pricingSub: "جرب مجاناً لمدة 14 يوم. بدون بطاقة ائتمان.",
    
    planStarterDesc: "للبدايات القوية",
    feat1: "1 مساعد ذكي",
    feat2: "500 محادثة شهرياً",
    feat3: "ويدجت الموقع الإلكتروني",
    feat4: "دعم فني عبر التذاكر",
    
    planProDesc: "للشركات الطموحة",
    featPro1: "3 مساعدين أذكياء",
    featPro2: "10,000 محادثة شهرياً",
    featPro3: "تكامل واتساب للأعمال",
    featPro4: "إزالة شعار فهملي",
    
    planAgencyDesc: "للوكالات والشركات الكبرى",
    featEnt1: "عدد غير محدود من المساعدين",
    featEnt2: "محادثات غير محدودة",
    featEnt3: "لوحة تحكم خاصة لعملائك (White Label)",
    featEnt4: "مدير حساب خاص",
    
    choosePlan: "اشترك الآن",
    popular: "الأكثر طلباً",
    
    // Admin
    adminPanel: "لوحة الأدمن (المالك)",
    totalUsers: "المشتركين",
    totalRev: "الإيرادات",
    serverStatus: "حالة السيرفر",

    // Comparison
    whyFahimo: "لماذا فهملي.كوم؟",
    compSub: "مقارنة سريعة مع الحلول التقليدية",
    oldWayTitle: "الشات بوت التقليدي",
    humanTitle: "موظف خدمة العملاء",
    fahimoTitle: "فهملي.كوم AI",
  },
  en: {
    // Basic EN fallback
    dashboard: "Dashboard",
    chat: "Chat",
    knowledge: "Knowledge Base",
    settings: "Bot Settings",
    analytics: "Analytics",
    newChat: "New Chat",
    sendMessage: "Send a message...",
    industry: "Industry",
    cacheHit: "Served from Cache",
    kbMatch: "Extracted from KB",
    apiCall: "Generated by Gemini",
    templateHit: "Template (Free)",
    save: "Save Settings",
    upload: "Upload",
    addText: "Add Text",
    overview: "Overview",
    totalRequests: "Total Requests",
    cacheRate: "Cache Rate",
    activeKB: "Active Knowledge",
    creditsUsed: "Credits Used",
    creditsRemaining: "Remaining",
    upgrade: "Upgrade",
    whatsappStatus: "WhatsApp Status",
    connected: "Connected",
    disconnected: "Disconnected",
    
    // Settings
    generalSettings: "General Settings",
    widgetSettings: "Widget Customization",
    botIdentity: "Bot Identity",
    botNamePlaceholder: "e.g., Sales Assistant",
    strictMode: "Strict Mode",
    strictModeDesc: "Only answer from Knowledge Base. Prevents AI hallucinations.",
    dialect: "Dialect",
    widgetColor: "Widget Color",
    preview: "Live Preview",
    embedCode: "Embed Code",
    copyCode: "Copy Code",

    // Auth & Wizard
    login: "Login",
    register: "Start Free Trial",
    email: "Email",
    password: "Password",
    welcomeBack: "Welcome Back",
    loginSubtitle: "Login to manage your bots",
    createAccount: "Create Business Account",
    step1: "Personal Info",
    step2: "Business Details",
    step3: "AI Setup",
    fullName: "Full Name",
    businessName: "Business Name",
    botName: "Bot Name",
    botTone: "Tone",
    next: "Next",
    back: "Back",
    complete: "Launch Bot",
    dontHaveAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signIn: "Sign In",
    signUp: "Sign Up",

    // Landing Page
    heroTag: "New: Agency Dashboard 🚀",
    startTrial: "Start Free Trial",
    liveDemo: "Live Demo",
    loginBtn: "Login",
    features: "Features",
    pricing: "Pricing",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    footerMadeBy: "Developed By Ma-Fo.info",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    
    // Industries
    indTitle: "Tailored Solutions",
    indRestTitle: "Restaurants",
    indRestDesc: "Smart menu & reservations.",
    indClinicTitle: "Clinics",
    indClinicDesc: "Appointments & medical FAQs.",
    indRetailTitle: "Retail",
    indRetailDesc: "Sales assistant & tracking.",

    // Integrations
    integrationTitle: "Seamless Integrations",
    whatsappDesc: "WhatsApp Auto-reply",
    websiteDesc: "Website Widget",
    apiDesc: "REST API",

    // Pricing
    pricingTitle: "Pay As You Grow",
    pricingSub: "No hidden fees. Cancel anytime.",
    planStarterDesc: "Great for startups",
    feat1: "1 AI Bot",
    feat2: "500 Messages/mo",
    feat3: "Web Widget",
    feat4: "Ticket Support",
    planProDesc: "For growing businesses",
    featPro1: "3 AI Bots",
    featPro2: "10,000 Messages/mo",
    featPro3: "WhatsApp Business",
    featPro4: "No Branding",
    planAgencyDesc: "For Agencies",
    featEnt1: "Unlimited Bots",
    featEnt2: "Unlimited Messages",
    featEnt3: "White Label Dashboard",
    featEnt4: "Account Manager",
    choosePlan: "Subscribe",
    popular: "Best Value",
    
    adminPanel: "Super Admin",
    totalUsers: "Users",
    totalRev: "Revenue",
    serverStatus: "Server Status",

    whyFahimo: "Why Choose Faheemly.com?",
    compSub: "A quick comparison",
    oldWayTitle: "Old Chatbots",
    humanTitle: "Human Agent",
    fahimoTitle: "Faheemly.com AI",
  }
};

export const SYSTEM_INSTRUCTIONS = {
  [Industry.RESTAURANT]: "أنت مساعد ذكي لمطعم. تتحدث بلهجة ودودة ومرحة (سعودية أو مصرية حسب السياق). هدفك عرض المنيو وتشجيع العميل على الطلب.",
  [Industry.RETAIL]: "أنت مساعد تسوق أنيق. تتحدث باحترافية وتساعد العميل في اختيار المقاسات والألوان المناسبة. هدفك إتمام عملية البيع.",
  [Industry.SERVICES]: "أنت سكرتير طبي/خدمي محترف. تتحدث بدقة واحترام. هدفك تنظيم المواعيد والإجابة على الاستفسارات بوضوح.",
  [Industry.GENERAL]: "أنت مساعد أعمال ذكي من منصة فهملي."
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
  brand600: '#6D28D9'
};
