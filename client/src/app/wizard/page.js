"use client"

import { useState, useEffect } from "react"
import useTheme from '@/lib/theme'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import FaheemAnimatedLogo from "@/components/FaheemAnimatedLogo"
import Captcha from "@/components/Captcha"
import { 
  Upload, Check, ArrowRight, ArrowLeft, Loader2, Home, Sun, Moon, Palette, Bot, FileText,
  User, Building2, Crown, Rocket, Copy, CheckCircle2, AlertCircle, Sparkles, Zap
} from "lucide-react"
import { authApi, widgetApi, knowledgeApi, businessApi } from '@/lib/api'
import Confetti from 'react-confetti'

// Plans Configuration
const PLANS = {
  TRIAL: {
    id: 'trial',
    name: 'تجربة مجانية',
    duration: '7 أيام',
    price: 0,
    features: [
      '1,000 رسالة',
      'بوت ذكي واحد',
      'قاعدة معرفة أساسية',
      'دعم فني بالإيميل'
    ],
    color: 'green'
  },
  BASIC: {
    id: 'basic',
    name: 'الباقة الأساسية',
    duration: 'شهرياً',
    price: 99,
    features: [
      '5,000 رسالة شهرياً',
      '3 بوتات ذكية',
      'قاعدة معرفة متقدمة',
      'تحليلات مفصلة',
      'دعم فني ذو أولوية',
      'تخصيص كامل'
    ],
    color: 'blue',
    popular: true
  },
  PRO: {
    id: 'pro',
    name: 'الباقة الاحترافية',
    duration: 'شهرياً',
    price: 299,
    features: [
      '25,000 رسالة شهرياً',
      'بوتات غير محدودة',
      'AI متقدم (GPT-4)',
      'تكاملات خارجية',
      'دعم WhatsApp & Telegram',
      'API Access',
      'دعم فني 24/7'
    ],
    color: 'purple'
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'الباقة المؤسسية',
    duration: 'حسب الطلب',
    price: null,
    features: [
      'رسائل غير محدودة',
      'حلول مخصصة',
      'AI مخصص لعملك',
      'فريق مخصص',
      'SLA مضمون',
      'White Label',
      'مدير حساب مخصص'
    ],
    color: 'gold'
  }
}

export default function Wizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useTheme(true)
  const [isVerified, setIsVerified] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [errors, setErrors] = useState({})
  const [lastSaved, setLastSaved] = useState(null)
  const [copied, setCopied] = useState(false)
  const [businessId, setBusinessId] = useState(null)
  
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: "",
    password: "",
    confirmPassword: "",
    
    // Step 2: Business
    businessName: "",
    businessType: "restaurant",
    phone: "",
    website: "",
    
    // Step 3: Plan
    selectedPlan: "trial",
    
    // Step 4: Customization
    botName: "",
    botTone: "friendly",
    primaryColor: "#4f46e5",
    welcomeMessage: "",
    dialect: "sa",
    
    // Step 5: Knowledge
    file: null,
    knowledgeText: "",
    knowledgeUrl: ""
  })
  
  const router = useRouter()
  const totalSteps = 6

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (step > 1 && step < 6) {
        saveDraft()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [formData, step])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('wizard_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  const saveDraft = () => {
    localStorage.setItem('wizard_draft', JSON.stringify(formData))
    setLastSaved(new Date())
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] })
  }

  const validateStep = (stepNumber) => {
    const newErrors = {}
    
    switch(stepNumber) {
      case 1:
        if (!formData.email) newErrors.email = "البريد الإلكتروني مطلوب"
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "البريد الإلكتروني غير صحيح"
        
        if (!formData.password) newErrors.password = "كلمة المرور مطلوبة"
        else if (formData.password.length < 8) newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
        
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "كلمة المرور غير متطابقة"
        
        if (!isVerified) newErrors.captcha = "يرجى التحقق من أنك لست روبوت"
        break
        
      case 2:
        if (!formData.businessName) newErrors.businessName = "اسم النشاط مطلوب"
        if (!formData.phone) newErrors.phone = "رقم الهاتف مطلوب"
        break
        
      case 4:
        if (!formData.botName) newErrors.botName = "اسم البوت مطلوب"
        if (!formData.welcomeMessage) newErrors.welcomeMessage = "رسالة الترحيب مطلوبة"
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      saveDraft()
      setStep(step + 1)
    }
  }
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Map business types to Prisma Enum
      let activityType = formData.businessType.toUpperCase();

      // 1. Register User
      const authData = await authApi.register({
        email: formData.email,
        password: formData.password,
        name: formData.businessName,
        activityType: activityType
      });

      const token = authData.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(authData.user))
      setBusinessId(authData.user.id)

      // 2. Update Business with plan
      const planType = formData.selectedPlan.toUpperCase()
      await businessApi.updatePlan({ planType })

      // 3. Update Widget Config
      await widgetApi.updateConfig({
        welcomeMessage: formData.welcomeMessage || `مرحباً بك في ${formData.businessName}! كيف يمكنني مساعدتك؟`,
        primaryColor: formData.primaryColor,
        personality: formData.botTone,
        showBranding: true,
        botName: formData.botName || 'مساعد فهملي',
        dialect: formData.dialect
      });

      // 4. Upload Knowledge
      if (formData.file) {
        const uploadData = new FormData()
        uploadData.append('file', formData.file)
        await knowledgeApi.upload(uploadData);
      }
      
      if (formData.knowledgeText) {
        await knowledgeApi.addText({
          text: formData.knowledgeText,
          title: 'معلومات أساسية'
        });
      }
      
      if (formData.knowledgeUrl) {
        await knowledgeApi.addUrl({ url: formData.knowledgeUrl });
      }

      // Clear draft
      localStorage.removeItem('wizard_draft')
      
      // Show confetti
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
      
      // Move to final step
      setStep(6)
      
    } catch (error) {
      alert("خطأ: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const widgetCode = `<script 
  src="https://server-production-0883.up.railway.app/widget/fahimo-widget-enhanced.js" 
  data-business-id="${businessId || formData.email?.split('@')[0] || 'your-business-id'}"
></script>`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-cosmic-950 dark:to-cosmic-900 p-4 font-sans relative overflow-hidden transition-colors duration-300" dir="rtl">
      
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
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block mb-4"
        >
          <div className="bg-white dark:bg-cosmic-800 rounded-3xl p-4 shadow-xl inline-block">
            <FaheemAnimatedLogo size="small" showText={false} />
          </div>
        </motion.div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          إطلاق مساعدك الذكي
        </h1>
        <p className="text-sm text-muted-foreground">جاهز في 6 خطوات بسيطة ⚡</p>
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
            transition={{ duration: 0.5, ease: "easeOut" }}
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
            { num: 6, icon: Rocket, label: 'الإطلاق' }
          ].map(({ num, icon: Icon, label }) => (
            <div key={num} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step > num ? 'bg-green-500 text-white' :
                step === num ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' :
                'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {step > num ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-medium ${
                step >= num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              } hidden sm:block`}>
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
              {step === 1 && <><User className="w-6 h-6 text-brand-500" /> إنشاء حساب جديد</>}
              {step === 2 && <><Building2 className="w-6 h-6 text-brand-500" /> تفاصيل النشاط التجاري</>}
              {step === 3 && <><Crown className="w-6 h-6 text-brand-500" /> اختر باقتك المناسبة</>}
              {step === 4 && <><Palette className="w-6 h-6 text-brand-500" /> تخصيص المظهر والشخصية</>}
              {step === 5 && <><FileText className="w-6 h-6 text-brand-500" /> تدريب الذكاء الاصطناعي</>}
              {step === 6 && <><Rocket className="w-6 h-6 text-green-500" /> مبروك! جاهز للإطلاق 🎉</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && "ابدأ فترتك التجربية المجانية لمدة 7 أيام"}
              {step === 2 && "أخبرنا عن نشاطك لنخصص التجربة"}
              {step === 3 && "اختر الباقة المناسبة لحجم عملك"}
              {step === 4 && "صمم البوت ليعكس هوية علامتك التجارية"}
              {step === 5 && "ارفع ملفاتك أو أضف معلومات ليتعلم منها البوت"}
              {step === 6 && "كل شيء جاهز! ابدأ في تركيب البوت على موقعك"}
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
                    <label className="text-sm font-medium">البريد الإلكتروني</label>
                    <Input name="email" type="email" placeholder="you@example.com" onChange={handleInputChange} className="bg-white/50 dark:bg-black/20 text-right" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كلمة المرور</label>
                    <Input name="password" type="password" placeholder="••••••••" onChange={handleInputChange} className="bg-white/50 dark:bg-black/20 text-right" dir="ltr" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Captcha onVerify={setIsVerified} />
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
                    <label className="text-sm font-medium">اسم النشاط التجاري</label>
                    <Input name="businessName" placeholder="مثال: مطعم البيك" onChange={handleInputChange} className="bg-white/50 dark:bg-black/20" />
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
                        <option value="restaurant">مطعم (نبرة شهية ومرحبة)</option>
                        <option value="cafe">مقهى (نبرة عصرية وودية)</option>
                        <option value="bakery">مخبز / حلويات (نبرة دافئة)</option>
                      </optgroup>
                      
                      <optgroup label="🏥 الرعاية الصحية">
                        <option value="clinic">عيادة طبية (نبرة هادئة ومطمئنة)</option>
                        <option value="hospital">مستشفى (نبرة احترافية)</option>
                        <option value="pharmacy">صيدلية (نبرة استشارية)</option>
                        <option value="dental">عيادة أسنان (نبرة لطيفة)</option>
                      </optgroup>
                      
                      <optgroup label="🛍️ التجارة والتجزئة">
                        <option value="retail">متجر تجزئة (نبرة أنيقة)</option>
                        <option value="fashion">أزياء وموضة (نبرة عصرية)</option>
                        <option value="electronics">إلكترونيات (نبرة تقنية)</option>
                        <option value="jewelry">مجوهرات (نبرة راقية)</option>
                        <option value="furniture">أثاث (نبرة استشارية)</option>
                      </optgroup>
                      
                      <optgroup label="💼 الأعمال والخدمات">
                        <option value="company">شركة (نبرة احترافية)</option>
                        <option value="consulting">استشارات (نبرة خبيرة)</option>
                        <option value="legal">خدمات قانونية (نبرة رسمية)</option>
                        <option value="accounting">محاسبة (نبرة دقيقة)</option>
                        <option value="realestate">عقارات (نبرة استثمارية)</option>
                      </optgroup>
                      
                      <optgroup label="🎓 التعليم والتدريب">
                        <option value="education">مركز تدريب (نبرة تعليمية)</option>
                        <option value="school">مدرسة (نبرة تربوية)</option>
                        <option value="university">جامعة (نبرة أكاديمية)</option>
                      </optgroup>
                      
                      <optgroup label="💰 الخدمات المالية">
                        <option value="bank">بنك (نبرة موثوقة)</option>
                        <option value="insurance">تأمين (نبرة أمان)</option>
                        <option value="investment">استثمار (نبرة استراتيجية)</option>
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
                        <option value="automotive">معرض سيارات (نبرة تسويقية)</option>
                        <option value="carmaintenance">صيانة سيارات (نبرة تقنية)</option>
                        <option value="logistics">لوجستيات (نبرة منظمة)</option>
                      </optgroup>
                      
                      <optgroup label="🏗️ البناء والعقار">
                        <option value="construction">مقاولات (نبرة هندسية)</option>
                        <option value="architecture">هندسة معمارية (نبرة إبداعية)</option>
                        <option value="interior">تصميم داخلي (نبرة فنية)</option>
                      </optgroup>
                      
                      <optgroup label="🔧 الخدمات الفنية">
                        <option value="it">تقنية معلومات (نبرة تقنية)</option>
                        <option value="maintenance">صيانة (نبرة حلول)</option>
                        <option value="security">أمن وحماية (نبرة يقظة)</option>
                      </optgroup>
                      
                      <optgroup label="📱 التكنولوجيا">
                        <option value="software">برمجيات (نبرة تقنية)</option>
                        <option value="telecom">اتصالات (نبرة سريعة)</option>
                        <option value="digital">خدمات رقمية (نبرة عصرية)</option>
                      </optgroup>
                      
                      <optgroup label="🎨 الإبداع والفنون">
                        <option value="marketing">تسويق (نبرة إبداعية)</option>
                        <option value="design">تصميم (نبرة فنية)</option>
                        <option value="photography">تصوير (نبرة احترافية)</option>
                        <option value="events">تنظيم فعاليات (نبرة حماسية)</option>
                      </optgroup>
                      
                      <optgroup label="📦 التجارة الإلكترونية">
                        <option value="ecommerce">متجر إلكتروني (نبرة تسويقية)</option>
                        <option value="dropshipping">دروبشيبينج (نبرة سريعة)</option>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Palette className="w-4 h-4" /> اللون الرئيسي
                    </label>
                    <div className="flex gap-3">
                      {['#4f46e5', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'].map(color => (
                        <div 
                          key={color}
                          className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${formData.primaryColor === color ? 'ring-2 ring-offset-2 ring-brand-600' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, primaryColor: color })}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
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
                        onClick={() => setFormData({ ...formData, botTone: 'friendly' })}
                      >
                        😊 ودود
                      </div>
                      <div 
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'formal' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() => setFormData({ ...formData, botTone: 'formal' })}
                      >
                        👔 رسمي
                      </div>
                      <div 
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'funny' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() => setFormData({ ...formData, botTone: 'funny' })}
                      >
                        😂 مرح
                      </div>
                      <div 
                        className={`p-3 rounded-lg border cursor-pointer text-center text-sm ${formData.botTone === 'empathetic' ? 'border-brand-600 bg-brand-500/10' : 'border-border hover:bg-accent'}`}
                        onClick={() => setFormData({ ...formData, botTone: 'empathetic' })}
                      >
                        ❤️ متعاطف
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="border-2 border-dashed border-brand-500/30 rounded-xl p-8 text-center hover:bg-brand-500/5 transition-colors cursor-pointer relative">
                    <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} accept=".pdf,.txt" />
                    <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
                      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-brand-600" />
                      </div>
                      <p className="font-medium text-foreground">
                        {formData.file ? formData.file.name : "اضغط لرفع ملف PDF"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        الحد الأقصى 10 ميجابايت. سيقوم الذكاء الاصطناعي بتحليله فوراً.
                      </p>
                    </label>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    يمكنك تخطي هذه الخطوة وإضافة المعلومات لاحقاً من لوحة التحكم.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            {step > 1 && (
              <Button variant="ghost" onClick={prevStep} disabled={loading}>
                <ArrowRight className="ml-2 w-4 h-4" /> السابق
              </Button>
            )}
            {step < 4 ? (
              <Button className="mr-auto bg-brand-600 hover:bg-brand-700" onClick={nextStep}>
                التالي <ArrowLeft className="mr-2 w-4 h-4" />
              </Button>
            ) : (
              <Button className="mr-auto bg-gradient-to-r from-brand-600 to-brand-700 hover:opacity-90 w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : "إطلاق البوت 🚀"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

