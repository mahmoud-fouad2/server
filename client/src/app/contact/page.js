"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Logo from "@/components/ui/logo"
import Link from "next/link"
import { Mail, MapPin, Phone, Ticket, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col" dir="rtl">
      <nav className="w-full px-6 py-6 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Logo className="w-8 h-8" />
          </Link>
          <span className="font-bold text-xl">فهملي.كوم</span>
        </div>
        <Link href="/">
          <Button variant="ghost">العودة للرئيسية</Button>
        </Link>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-4">الدعم الفني</h1>
              <p className="text-muted-foreground text-lg">
                نحن هنا لمساعدتك. سواء كان لديك استفسار، اقتراح، أو مشكلة، فريقنا جاهز للرد عليك.
              </p>
            </div>

            {/* Ticket System Promo */}
            <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">هل أنت عميل حالي؟</h3>
                  <p className="text-muted-foreground mb-4">
                    للحصول على رد أسرع ومتابعة حالة طلبك، يفضل فتح تذكرة دعم فني من خلال لوحة التحكم الخاصة بك.
                  </p>
                  <Link href="/dashboard?tab=tickets">
                    <Button className="w-full sm:w-auto">
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
                  <p className="text-muted-foreground">+966 50 000 0000</p>
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
            className="bg-card border border-border rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-6">نموذج التواصل</h2>
            
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الاسم الأول</label>
                    <Input 
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      placeholder="محمد" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اسم العائلة</label>
                    <Input 
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      placeholder="أحمد" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">البريد الإلكتروني</label>
                  <Input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الموضوع</label>
                  <Input 
                    required
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="كيف يمكننا مساعدتك؟" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الرسالة</label>
                  <Textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    placeholder="اكتب رسالتك هنا..." 
                    className="min-h-[150px]"
                  />
                </div>

                {status === 'error' && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-lg" disabled={status === 'loading'}>
                  {status === 'loading' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo className="w-6 h-6" />
                <span className="font-bold text-lg">فهملي.كوم</span>
              </div>
              <p className="text-sm text-muted-foreground">
                أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">الشركة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary">من نحن</Link></li>
                <li><Link href="/contact" className="hover:text-primary">الدعم الفني</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">قانوني</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary">سياسة الخصوصية</Link></li>
                <li><Link href="/terms" className="hover:text-primary">شروط الخدمة</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@Faheemly.com</li>
                <li>الرياض، السعودية</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2026 Faheemly Inc. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  )
}
