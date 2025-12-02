import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import { MessageSquare, Mic, Upload, Globe } from "lucide-react"

export default function Services() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="w-full border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold">Fahimo</span>
          </Link>
          <Link href="/">
            <Button variant="ghost">العودة للرئيسية</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">خدماتنا</h1>
          <p className="text-xl text-muted-foreground">
            ربط واتساب في دقيقة واحدة – ردود ذكية من بياناتك فقط!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="neumorphic border-none bg-background hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl text-green-600">
                <MessageSquare className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">ربط واتساب الذكي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed">
                اربط رقمك التجاري بمنصة فهيم، وسيقوم البوت بالرد على استفسارات العملاء، أخذ الطلبات، وحجز المواعيد تلقائياً 24/7.
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic border-none bg-background hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Globe className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">ويدجت الموقع الإلكتروني</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed">
                أضف أيقونة دردشة أنيقة لموقعك. قابلة للتخصيص بالكامل (الألوان، الترحيب) وتعمل بنفس ذكاء بوت الواتساب.
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic border-none bg-background hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Mic className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">الردود الصوتية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed">
                ميزة حصرية! عميلك يرسل رسالة صوتية؟ فهيم يسمعها، يفهمها، ويرد عليها نصياً أو صوتياً (قريباً).
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic border-none bg-background hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                <Upload className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">التعلم من الملفات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed">
                لا داعي لإدخال الأسئلة والأجوبة يدوياً. فقط ارفع ملف PDF (منيو، بروفايل الشركة) والذكاء الاصطناعي سيتعلم منه فوراً.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
            <Link href="/wizard">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-lg h-14 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all">
                ابدأ تجربتك المجانية الآن
              </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
