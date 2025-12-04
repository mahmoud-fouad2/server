"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import PageLayout from "@/components/layout/PageLayout"
import Link from "next/link"
import { Mail, MapPin, Phone, Ticket, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { contactApi } from "@/lib/api"
import Captcha from "@/components/Captcha"

// export const metadata = {
//   title: 'اتصل بنا - فهملي | تواصل معنا للحصول على استشارة مجانية',
//   description: 'تواصل مع فريق فهملي للحصول على استشارة مجانية حول كيفية تحويل أعمالك رقمياً. الهاتف: +966530047640 | البريد: mahmoud.a.fouad2@gmail.com',
//   keywords: 'اتصل بنا, تواصل معنا, استشارة مجانية, دعم فني, خدمة عملاء فهملي',
// }

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [captchaValid, setCaptchaValid] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaValid) {
      setStatus('error');
      return;
    }
    
    setStatus('loading');

    try {
      // Send to mahmoud.a.fouad2@gmail.com
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          to: 'mahmoud.a.fouad2@gmail.com'
        })
      });

      if (!response.ok) throw new Error('Failed to send');

      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      setCaptchaValid(false);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        <main className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">الدعم الفني</h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                نحن هنا لمساعدتك. سواء كان لديك استفسار، اقتراح، أو مشكلة، فريقنا جاهز للرد عليك.
              </p>
            </div>

            {/* Ticket System Promo */}
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-200 dark:border-brand-800 rounded-3xl p-8 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-purple-500"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  <Ticket className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">هل أنت عميل حالي؟</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    للحصول على رد أسرع ومتابعة دقيقة لحالة طلبك، نوصي بفتح تذكرة دعم فني مباشرة من لوحة التحكم.
                  </p>
                  <Link href="/dashboard?tab=tickets">
                    <Button className="w-full sm:w-auto bg-white text-brand-600 hover:bg-gray-50 border border-brand-200 shadow-sm font-bold">
                      فتح تذكرة دعم فني
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">البريد الإلكتروني</h3>
                  <p className="text-muted-foreground">info@Faheemly.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">الهاتف</h3>
                  <p className="text-muted-foreground" dir="ltr">+966 530047640</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">المقر الرئيسي</h3>
                  <p className="text-muted-foreground">الرياض، المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-3xl p-8 shadow-xl"
          >
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">نموذج التواصل</h2>
            
            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">تم إرسال رسالتك بنجاح!</h3>
                <p className="text-muted-foreground mb-6">سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
                <Button onClick={() => setStatus('idle')} variant="outline">إرسال رسالة أخرى</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الاسم الأول</label>
                    <Input 
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      placeholder="محمد" 
                      className="h-12 bg-gray-50 dark:bg-background border-gray-300 dark:border-input focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">اسم العائلة</label>
                    <Input 
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      placeholder="أحمد" 
                      className="h-12 bg-gray-50 dark:bg-background border-gray-300 dark:border-input focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                  <Input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com" 
                    className="h-12 bg-gray-50 dark:bg-background border-gray-300 dark:border-input focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الموضوع</label>
                  <Input 
                    required
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="كيف يمكننا مساعدتك؟" 
                    className="h-12 bg-gray-50 dark:bg-background border-gray-300 dark:border-input focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الرسالة</label>
                  <Textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    placeholder="اكتب رسالتك هنا..." 
                    className="min-h-[150px] bg-gray-50 dark:bg-background border-gray-300 dark:border-input focus:ring-2 focus:ring-brand-500 p-4"
                  />
                </div>

                {/* Captcha */}
                <div className="space-y-2">
                  <Captcha onValidate={setCaptchaValid} />
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {!captchaValid ? 'يرجى التحقق من أنك لست روبوت' : 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.'}
                  </div>
                )}

                <Button type="submit" className="w-full h-14 text-lg font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]" disabled={status === 'loading' || !captchaValid}>
                  {status === 'loading' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
        </main>
      </div>
    </PageLayout>
  )
}
