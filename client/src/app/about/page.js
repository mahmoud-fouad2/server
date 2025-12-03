"use client"

import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import Link from "next/link"
import { motion } from "framer-motion"
import { Brain, Heart, Rocket, Users } from "lucide-react"

export default function AboutPage() {
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">قصة فهملي</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              لم نكن نريد بناء مجرد "شات بوت". أردنا بناء عقل يفهم، يتعلم، ويتحدث بلسانك.
            </p>
          </motion.div>
        </section>

        {/* The Story */}
        <section className="py-16 px-4 container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">البداية</h2>
              <p className="text-muted-foreground leading-relaxed">
                بدأت فهملي عندما لاحظنا فجوة كبيرة في السوق العربي. الشركات تستخدم ردوداً آلية جامدة "اضغط 1 للغة العربية"، والعملاء يشعرون بالإحباط.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                سألنا أنفسنا: ماذا لو كان الذكاء الاصطناعي يفهم اللهجة السعودية؟ والمصرية؟ ماذا لو كان بإمكانه قراءة ملفات PDF الخاصة بالشركة والرد منها فوراً؟
              </p>
              <p className="text-muted-foreground leading-relaxed">
                وهكذا ولد "فهملي". ليس مجرد برنامج، بل موظف ذكي لا ينام.
              </p>
            </div>
            <div className="bg-muted rounded-3xl p-8 h-[400px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
              <Logo className="w-40 h-40 opacity-20" />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">قيمنا</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">الذكاء الحقيقي</h3>
                <p className="text-sm text-muted-foreground">لا نعتمد على الكلمات المفتاحية، بل نفهم المعنى.</p>
              </div>
              <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">اللمسة الإنسانية</h3>
                <p className="text-sm text-muted-foreground">التكنولوجيا يجب أن تخدم الإنسان، لا أن تعقده.</p>
              </div>
              <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">السرعة</h3>
                <p className="text-sm text-muted-foreground">إعداد البوت يجب أن يكون أسرع من إعداد القهوة.</p>
              </div>
              <div className="text-center p-6 bg-background rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2">للجميع</h3>
                <p className="text-sm text-muted-foreground">من المتجر الصغير إلى الشركة العملاقة.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">انضم لثورة الذكاء الاصطناعي العربي</h2>
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-lg rounded-full">
              ابدأ رحلتك مجاناً
            </Button>
          </Link>
        </section>
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
                <li><Link href="/contact" className="hover:text-primary">اتصل بنا</Link></li>
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
