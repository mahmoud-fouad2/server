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
import { Upload, Check, ArrowRight, ArrowLeft, Loader2, Home, Sun, Moon, Palette, Bot, FileText } from "lucide-react"

export default function Wizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useTheme(true)
  const [isVerified, setIsVerified] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    businessType: "restaurant",
    botName: "Faheemly Bot",
    botTone: "friendly",
    primaryColor: "#4f46e5",
    file: null
  })
  const router = useRouter()

  // Theme is managed by the shared `useTheme` hook which persists to localStorage

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] })
  }

  const nextStep = () => {
    if (step === 1 && !isVerified) {
      alert("يرجى التحقق من أنك لست روبوت");
      return;
    }
    setStep(step + 1)
  }
  const prevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Map business types to Prisma Enum
      let activityType = formData.businessType.toUpperCase();
      if (activityType === 'SERVICE') activityType = 'COMPANY'; // Map service to COMPANY as SERVICE is not in enum

      // 1. Register User
      const authRes = await fetch('https://fahimo-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.businessName,
          activityType: activityType
        })
      })
      const authData = await authRes.json()
      
      if (!authRes.ok) throw new Error(authData.error)

      const token = authData.token;

      // 2. Update Widget Config (Color, Tone)
      await fetch('https://fahimo-api.onrender.com/api/widget/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          welcomeMessage: `مرحباً بك في ${formData.businessName}! كيف يمكنني مساعدتك؟`,
          primaryColor: formData.primaryColor,
          personality: formData.botTone,
          showBranding: true
        })
      });

      // 3. Upload Knowledge (if any)
      if (formData.file) {
        const uploadData = new FormData()
        uploadData.append('file', formData.file)
        
        await fetch('https://fahimo-api.onrender.com/api/knowledge/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadData
        })
      }

      // Save token and redirect
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      router.push('/dashboard')
    } catch (error) {
      alert("Error: " + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-cosmic-950 p-4 font-sans relative overflow-hidden transition-colors duration-300" dir="rtl">
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

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[100px]"></div>
      </div>

      <div className="mb-8 text-center">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="inline-block"
        >
          <FaheemAnimatedLogo size="medium" showText={true} className="mx-auto mb-4" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">إعداد مساعد فهملي</h1>
        <p className="text-sm text-muted-foreground">جاهز في 3 دقائق فقط ⚡</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between px-2 relative">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
              step >= i ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" : "bg-muted text-muted-foreground"
            }`}>
              {step > i ? <Check className="w-5 h-5" /> : i}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {i === 1 ? "الحساب" : i === 2 ? "النشاط" : i === 3 ? "التخصيص" : "المعرفة"}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-0">
          <div 
            className="h-full bg-brand-600 transition-all duration-500" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-2xl border-gray-200 dark:border-white/10 bg-[#f8f8fa] dark:bg-cosmic-900">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
              {step === 1 && "إنشاء حساب جديد"}
              {step === 2 && "تفاصيل النشاط التجاري"}
              {step === 3 && "تخصيص مظهر البوت"}
              {step === 4 && "تدريب الذكاء الاصطناعي"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 && "ابدأ فترتك التجربة المجانية لمدة 7 أيام"}
              {step === 2 && "أخبرنا عن نشاطك لنختار النبرة المناسبة"}
              {step === 3 && "اختر الألوان والشخصية التي تناسب علامتك"}
              {step === 4 && "ارفع ملفاتك ليتعلم منها البوت فوراً"}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      <option value="restaurant">مطعم (نبرة شهية ومرحبة)</option>
                      <option value="retail">متجر تجزئة (نبرة أنيقة)</option>
                      <option value="service">خدمات (نبرة احترافية)</option>
                      <option value="clinic">عيادة طبية (نبرة هادئة ومطمئنة)</option>
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

