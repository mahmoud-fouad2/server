'use client';

import { useState, useEffect, useCallback } from 'react';
import useTheme from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FaheemAnimatedLogo from '@/components/FaheemAnimatedLogo';
import Captcha from '@/components/Captcha';
import {
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Home,
  Sun,
  Moon,
  Palette,
  Bot,
  FileText,
  User,
  Building2,
  Crown,
  Rocket,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { authApi, widgetApi, knowledgeApi, businessApi } from '@/lib/api';
import Confetti from 'react-confetti';

// Plans Configuration
const PLANS = {
  TRIAL: {
    id: 'trial',
    name: 'تجربة مجانية',
    duration: '7 أيام',
    price: 0,
    priceSAR: 0,
    priceEGP: 0,
    priceAED: 0,
    priceKWD: 0,
    features: [
      '200 محادثة',
      'بوت ذكي واحد',
      'قاعدة معرفة أساسية',
      'دعم فني بالإيميل',
    ],
    color: 'green',
  },
  BASIC: {
    id: 'basic',
    name: 'الباقة الأساسية',
    duration: 'شهرياً',
    price: 99,
    priceSAR: 99,
    priceEGP: 559,
    priceAED: 99,
    priceKWD: 8,
    features: [
      '500 محادثة شهرياً',
      '1 قاعدة معرفة',
      'لا يحتوي على خدمة عملاء',
      'لا يحتوي على تكامل واتساب',
      'دعم فني email',
      'لا يحتوي على تقارير متقدمة',
      'لا يحتوي على أولوية الرد',
    ],
    color: 'blue',
    popular: false,
  },
  PRO: {
    id: 'pro',
    name: 'الباقة الاحترافية',
    duration: 'شهرياً',
    price: 299,
    priceSAR: 299,
    priceEGP: 1688,
    priceAED: 299,
    priceKWD: 24,
    features: [
      '1,500 محادثة شهرياً',
      '2 قاعدة معرفة',
      '1 موظف خدمة عملاء',
      'تكامل متعدد القنوات (محدود)',
      'تقارير وتحليلات متقدمة',
      'دعم فني ذو أولوية',
      'أولوية الرد',
      'تدريب مجاني',
    ],
    color: 'purple',
    popular: true,
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'باقة المؤسسات',
    duration: 'شهرياً',
    price: 999,
    priceSAR: 999,
    priceEGP: 5639,
    priceAED: 999,
    priceKWD: 81,
    features: [
      '6,000 محادثة شهرياً',
      'قاعدة معرفية غير محدودة',
      '5 موظفي خدمة عملاء',
      'تكامل متعدد القنوات',
      'عملاء متعددين (White label)',
      'API مخصصة',
      'مدير حساب مخصص',
      'دعم 24/7',
      'أولوية الرد',
      'تدريب مجاني',
    ],
    color: 'gold',
  },
};

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useTheme(true);
  const [isVerified, setIsVerified] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [copied, setCopied] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',

    // Step 2: Business
    businessName: '',
    businessType: 'restaurant',
    phone: '',
    website: '',

    // Step 3: Plan
    selectedPlan: 'trial',

    // Step 4: Customization
    botName: '',
    botTone: 'friendly',
    primaryColor: '#4f46e5',
    welcomeMessage: '',
    dialect: 'sa',

    // Step 5: Knowledge
    file: null,
    knowledgeText: '',
    knowledgeUrl: '',

    // Terms acceptance
    acceptTerms: false,
  });

  const router = useRouter();
  const totalSteps = 6;

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (step > 1 && step < 6) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [saveDraft, step]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('wizard_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  const saveDraft = useCallback(() => {
    localStorage.setItem('wizard_draft', JSON.stringify(formData));
    setLastSaved(new Date());
  }, [formData]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = e => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const validateStep = stepNumber => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = 'البريد الإلكتروني غير صحيح';

        if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
        else if (formData.password.length < 8)
          newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';

        if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = 'كلمة المرور غير متطابقة';

        if (!isVerified) newErrors.captcha = 'يرجى التحقق من أنك لست روبوت';
        break;

      case 2:
        if (!formData.businessName) newErrors.businessName = 'اسم النشاط مطلوب';
        if (!formData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
        break;

      case 4:
        if (!formData.botName) newErrors.botName = 'اسم البوت مطلوب';
        if (!formData.welcomeMessage)
          newErrors.welcomeMessage = 'رسالة الترحيب مطلوبة';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      saveDraft();
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Map business types to Prisma Enum
      let activityType = formData.businessType.toUpperCase();

      // 1. Register User
      const authData = await authApi.register({
        email: formData.email,
        password: formData.password,
        name: formData.businessName,
        activityType: activityType,
      });

      const token = authData.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setBusinessId(authData.user.id);

      // 2. Update Business with plan
      const planType = formData.selectedPlan.toUpperCase();
      await businessApi.updatePlan({ planType });

      // 3. Update Widget Config
      await widgetApi.updateConfig({
        welcomeMessage:
          formData.welcomeMessage ||
          `مرحباً بك في ${formData.businessName}! كيف يمكنني مساعدتك؟`,
        primaryColor: formData.primaryColor,
        personality: formData.botTone,
        showBranding: true,
        botName: formData.botName || 'مساعد فهملي',
        dialect: formData.dialect,
      });

      // 4. Upload Knowledge
      if (formData.file) {
        const uploadData = new FormData();
        uploadData.append('file', formData.file);
        await knowledgeApi.upload(uploadData);
      }

      if (formData.knowledgeText) {
        await knowledgeApi.addText({
          text: formData.knowledgeText,
          title: 'معلومات أساسية',
        });
      }

      if (formData.knowledgeUrl) {
        await knowledgeApi.addUrl({ url: formData.knowledgeUrl });
      }

      // Clear draft
      localStorage.removeItem('wizard_draft');

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Move to final step
      setStep(6);
    } catch (error) {
      alert('خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const widgetCode = `<script 
  src="https://server-production-0883.up.railway.app/widget/fahimo-widget-enhanced.js" 
  data-business-id="${businessId || formData.email?.split('@')[0] || 'your-business-id'}"
></script>`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-cosmic-950 dark:to-cosmic-900 p-4 font-sans relative overflow-hidden transition-colors duration-300"
      dir="rtl"
    >
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Navigation & Theme Toggle */}
      <div className="absolute top-6 left-6 flex gap-3 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10"
          >
            <Home className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[100px]"></div>
      </div>

      {/* Logo & Title */}
      <div className="mb-6 text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block mb-4"
        >
          <div
            className="rounded-3xl p-4 shadow-xl inline-block"
            style={{ backgroundColor: '#f6f8fa' }}
          >
            <FaheemAnimatedLogo size="small" showText={false} />
          </div>
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          إطلاق مساعدك الذكي
        </h1>
        <p className="text-sm text-muted-foreground">
          جاهز في 6 خطوات بسيطة ⚡
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-3xl mb-6">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-sm font-medium text-muted-foreground">
            الخطوة {step} من {totalSteps}
          </span>
          {lastSaved && step < 6 && (
            <span className="text-xs text-muted-foreground">
              آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-4 px-2">
          {[
            { num: 1, icon: User, label: 'الحساب' },
            { num: 2, icon: Building2, label: 'النشاط' },
            { num: 3, icon: Crown, label: 'الباقة' },
            { num: 4, icon: Palette, label: 'التخصيص' },
            { num: 5, icon: FileText, label: 'المعرفة' },
            { num: 6, icon: Rocket, label: 'الإطلاق' },
          ].map(({ num, icon: Icon, label }) => (
            <div key={num} className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step > num
                    ? 'bg-green-500 text-white'
                    : step === num
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {step > num ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= num
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400'
                } hidden sm:block`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl"
      >
        <Card className="shadow-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-cosmic-900">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {step === 1 && (
                <>
                  <User className="w-6 h-6 text-brand-500" /> إنشاء حساب جديد
                </>
              )}
              {step === 2 && (
                <>
                  <Building2 className="w-6 h-6 text-brand-500" /> تفاصيل النشاط
                  التجاري
                </>
              )}
              {step === 3 && (
                <>
                  <Crown className="w-6 h-6 text-brand-500" /> اختر باقتك
                  المناسبة
                </>
              )}
              {step === 4 && (
                <>
                  <Palette className="w-6 h-6 text-brand-500" /> تخصيص المظهر
                  والشخصية
                </>
              )}
              {step === 5 && (
                <>
                  <FileText className="w-6 h-6 text-brand-500" /> تدريب الذكاء
                  الاصطناعي
                </>
              )}
              {step === 6 && (
                <>
                  <Rocket className="w-6 h-6 text-green-500" /> مبروك! جاهز
                  للإطلاق 🎉
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'ابدأ فترتك التجربية المجانية لمدة 7 أيام'}
              {step === 2 && 'أخبرنا عن نشاطك لنخصص التجربة'}
              {step === 3 && 'اختر الباقة المناسبة لحجم عملك'}
              {step === 4 && 'صمم البوت ليعكس هوية علامتك التجارية'}
              {step === 5 && 'ارفع ملفاتك أو أضف معلومات ليتعلم منها البوت'}
              {step === 6 && 'كل شيء جاهز! ابدأ في تركيب البوت على موقعك'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      البريد الإلكتروني
                    </label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20 text-right"
                      dir="ltr"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كلمة المرور</label>
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20 text-right"
                      dir="ltr"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      تأكيد كلمة المرور
                    </label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20 text-right"
                      dir="ltr"
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Captcha onVerify={setIsVerified} />
                    {errors.captcha && (
                      <p className="text-xs text-red-500">{errors.captcha}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      اسم النشاط التجاري
                    </label>
                    <Input
                      name="businessName"
                      placeholder="مثال: مطعم البيك"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20"
                    />
                    {errors.businessName && (
                      <p className="text-xs text-red-500">
                        {errors.businessName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رقم الهاتف</label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20"
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع النشاط</label>
                    <select
                      name="businessType"
                      className="flex h-10 w-full rounded-md border border-input bg-white/50 dark:bg-black/20 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onChange={handleInputChange}
                      value={formData.businessType}
                    >
                      <optgroup label="🍽️ الأطعمة والمشروبات">
                        <option value="restaurant">
                          مطعم (نبرة شهية ومرحبة)
                        </option>
                        <option value="cafe">مقهى (نبرة عصرية وودية)</option>
                        <option value="bakery">
                          مخبز / حلويات (نبرة دافئة)
                        </option>
                      </optgroup>

                      <optgroup label="🏥 الرعاية الصحية">
                        <option value="clinic">
                          عيادة طبية (نبرة هادئة ومطمئنة)
                        </option>
                        <option value="hospital">مستشفى (نبرة احترافية)</option>
                        <option value="pharmacy">صيدلية (نبرة استشارية)</option>
                        <option value="dental">عيادة أسنان (نبرة لطيفة)</option>
                      </optgroup>

                      <optgroup label="🛍️ التجارة والتجزئة">
                        <option value="retail">متجر تجزئة (نبرة أنيقة)</option>
                        <option value="fashion">
                          أزياء وموضة (نبرة عصرية)
                        </option>
                        <option value="electronics">
                          إلكترونيات (نبرة تقنية)
                        </option>
                        <option value="jewelry">مجوهرات (نبرة راقية)</option>
                        <option value="furniture">أثاث (نبرة استشارية)</option>
                      </optgroup>

                      <optgroup label="💼 الأعمال والخدمات">
                        <option value="company">شركة (نبرة احترافية)</option>
                        <option value="consulting">
                          استشارات (نبرة خبيرة)
                        </option>
                        <option value="legal">
                          خدمات قانونية (نبرة رسمية)
                        </option>
                        <option value="accounting">محاسبة (نبرة دقيقة)</option>
                        <option value="realestate">
                          عقارات (نبرة استثمارية)
                        </option>
                      </optgroup>

                      <optgroup label="🎓 التعليم والتدريب">
                        <option value="education">
                          مركز تدريب (نبرة تعليمية)
                        </option>
                        <option value="school">مدرسة (نبرة تربوية)</option>
                        <option value="university">
                          جامعة (نبرة أكاديمية)
                        </option>
                      </optgroup>

                      <optgroup label="💰 الخدمات المالية">
                        <option value="bank">بنك (نبرة موثوقة)</option>
                        <option value="insurance">تأمين (نبرة أمان)</option>
                        <option value="investment">
                          استثمار (نبرة استراتيجية)
                        </option>
                      </optgroup>

                      <optgroup label="🏨 السياحة والضيافة">
                        <option value="hotel">فندق (نبرة مضيافة)</option>
                        <option value="travel">وكالة سفر (نبرة مغامرة)</option>
                        <option value="tourism">سياحة (نبرة ترحيبية)</option>
                      </optgroup>

                      <optgroup label="💅 الجمال والعناية">
                        <option value="salon">صالون تجميل (نبرة أنيقة)</option>
                        <option value="spa">سبا (نبرة مريحة)</option>
                        <option value="gym">نادي رياضي (نبرة محفزة)</option>
                      </optgroup>

                      <optgroup label="🚗 السيارات والنقل">
                        <option value="automotive">
                          معرض سيارات (نبرة تسويقية)
                        </option>
                        <option value="carmaintenance">
                          صيانة سيارات (نبرة تقنية)
                        </option>
                        <option value="logistics">لوجستيات (نبرة منظمة)</option>
                      </optgroup>

                      <optgroup label="🏗️ البناء والعقار">
                        <option value="construction">
                          مقاولات (نبرة هندسية)
                        </option>
                        <option value="architecture">
                          هندسة معمارية (نبرة إبداعية)
                        </option>
                        <option value="interior">
                          تصميم داخلي (نبرة فنية)
                        </option>
                      </optgroup>

                      <optgroup label="🔧 الخدمات الفنية">
                        <option value="it">تقنية معلومات (نبرة تقنية)</option>
                        <option value="maintenance">صيانة (نبرة حلول)</option>
                        <option value="security">أمن وحماية (نبرة يقظة)</option>
                      </optgroup>

                      <optgroup label="📱 التكنولوجيا">
                        <option value="software">برمجيات (نبرة تقنية)</option>
                        <option value="telecom">اتصالات (نبرة سريعة)</option>
                        <option value="digital">
                          خدمات رقمية (نبرة عصرية)
                        </option>
                      </optgroup>

                      <optgroup label="🎨 الإبداع والفنون">
                        <option value="marketing">تسويق (نبرة إبداعية)</option>
                        <option value="design">تصميم (نبرة فنية)</option>
                        <option value="photography">
                          تصوير (نبرة احترافية)
                        </option>
                        <option value="events">
                          تنظيم فعاليات (نبرة حماسية)
                        </option>
                      </optgroup>

                      <optgroup label="📦 التجارة الإلكترونية">
                        <option value="ecommerce">
                          متجر إلكتروني (نبرة تسويقية)
                        </option>
                        <option value="dropshipping">
                          دروبشيبينج (نبرة سريعة)
                        </option>
                      </optgroup>

                      <optgroup label="🏢 أخرى">
                        <option value="other">أخرى (نبرة عامة)</option>
                      </optgroup>
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Plans Selection */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.values(PLANS).map(plan => (
                      <div
                        key={plan.id}
                        onClick={() =>
                          setFormData({ ...formData, selectedPlan: plan.id })
                        }
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          formData.selectedPlan === plan.id
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/10 shadow-lg'
                            : 'border-gray-200 dark:border-white/10 hover:border-brand-400'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 right-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                            الأكثر طلباً
                          </span>
                        )}
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-3xl font-black mb-4">
                          {plan.price === 0
                            ? 'مجاناً'
                            : plan.price
                              ? `${plan.price} ريال`
                              : 'حسب الطلب'}
                          {plan.price > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.duration}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="w-4 h-4" /> اسم البوت
                    </label>
                    <Input
                      name="botName"
                      placeholder="مثال: مساعد المبيعات"
                      value={formData.botName}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20"
                    />
                    {errors.botName && (
                      <p className="text-xs text-red-500">{errors.botName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رسالة الترحيب</label>
                    <Input
                      name="welcomeMessage"
                      placeholder="مثال: مرحباً! كيف يمكنني مساعدتك اليوم؟"
                      value={formData.welcomeMessage}
                      onChange={handleInputChange}
                      className="bg-white/50 dark:bg-black/20"
                    />
                    {errors.welcomeMessage && (
                      <p className="text-xs text-red-500">
                        {errors.welcomeMessage}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" /> اللون الرئيسي
                    </label>
                    <div className="flex gap-3">
                      {[
                        '#4f46e5',
                        '#EC4899',
                        '#10B981',
                        '#F59E0B',
                        '#3B82F6',
                      ].map(color => (
                        <div
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${formData.primaryColor === color ? 'ring-2 ring-offset-2 ring-brand-600' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setFormData({ ...formData, primaryColor: color })
                          }
                        />
                      ))}
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            primaryColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="w-4 h-4" /> شخصية البوت
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'friendly' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() =>
                          setFormData({ ...formData, botTone: 'friendly' })
                        }
                      >
                        😊 ودود
                      </div>
                      <div
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'formal' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() =>
                          setFormData({ ...formData, botTone: 'formal' })
                        }
                      >
                        👔 رسمي
                      </div>
                      <div
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'funny' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() =>
                          setFormData({ ...formData, botTone: 'funny' })
                        }
                      >
                        😂 مرح
                      </div>
                      <div
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'empathetic' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() =>
                          setFormData({ ...formData, botTone: 'empathetic' })
                        }
                      >
                        ❤️ متعاطف
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="border-2 border-dashed border-brand-500/30 rounded-xl p-8 text-center hover:bg-brand-500/5 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileChange}
                      accept=".pdf,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer w-full h-full block"
                    >
                      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-brand-600" />
                      </div>
                      <p className="font-medium text-foreground">
                        {formData.file
                          ? formData.file.name
                          : 'اضغط لرفع ملف PDF'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        الحد الأقصى 10 ميجابايت. سيقوم الذكاء الاصطناعي بتحليله
                        فوراً.
                      </p>
                    </label>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    يمكنك تخطي هذه الخطوة وإضافة المعلومات لاحقاً من لوحة
                    التحكم.
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            acceptTerms: e.target.checked,
                          })
                        }
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-foreground">
                        أوافق على{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="text-brand-600 hover:underline font-medium"
                        >
                          الشروط والأحكام
                        </Link>{' '}
                        و{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="text-brand-600 hover:underline font-medium"
                        >
                          سياسة الخصوصية
                        </Link>
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      مبروك! تم إنشاء البوت بنجاح 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      الآن يمكنك تركيب البوت على موقعك بسهولة
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                    <h4 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                      كود الويدجت الخاص بك:
                    </h4>
                    <div className="bg-black rounded-lg p-4 mb-4">
                      <code className="text-green-400 text-sm font-mono break-all">
                        {widgetCode}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(widgetCode)}
                      className="mb-6"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      نسخ الكود
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                      طرق التركيب:
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          📄 HTML / PHP
                        </h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          انسخ الكود أعلاه وضعه في ملف HTML أو PHP قبل إغلاق الوسم &lt;/body&gt;
                        </p>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                          🔧 WordPress
                        </h5>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          اذهب إلى المظهر ← محرر القوالب ← footer.php وأضف الكود قبل &lt;/body&gt;
                        </p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                          ⚛️ React / Next.js
                        </h5>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          أضف الكود في مكون _app.js أو layout.js في قسم &lt;Head&gt;
                        </p>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                        <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                          🎨 Wix / Shopify
                        </h5>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          اذهب إلى إعدادات الموقع ← تتبع وتحليل ← أضف كود مخصص
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          نصيحة مهمة
                        </h5>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          تأكد من أن الكود يظهر على جميع صفحات موقعك. يمكنك اختبار البوت من خلال زيارة موقعك والنقر على أيقونة الدردشة في الزاوية السفلية اليمنى.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            {step > 1 && step < 6 && (
              <Button variant="ghost" onClick={prevStep} disabled={loading}>
                <ArrowRight className="ml-2 w-4 h-4" /> السابق
              </Button>
            )}
            {step < 5 ? (
              <Button
                className="mr-auto bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-500/30 transition-all"
                onClick={() => nextStep()}
                disabled={loading}
              >
                التالي <ArrowLeft className="mr-2 w-4 h-4" />
              </Button>
            ) : step === 5 ? (
              <Button
                className="mr-auto bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg shadow-brand-500/30 transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={loading || !formData.acceptTerms}
              >
                {loading ? (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                ) : (
                  'إطلاق البوت 🚀'
                )}
              </Button>
            ) : step === 6 ? (
              <div className="flex gap-4 w-full justify-center">
                <Link href="/login">
                  <Button variant="outline" className="flex-1">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white">
                    لوحة التحكم
                  </Button>
                </Link>
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
