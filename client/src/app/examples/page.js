import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"

export default function Examples() {
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">أمثلة حية</h1>
          <p className="text-xl text-muted-foreground">
            شاهد كيف يتغير أسلوب فهيم ليفهم طبيعة كل عمل
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Restaurant */}
          <Card className="neumorphic border-none bg-orange-50/50 dark:bg-orange-950/10">
            <CardHeader>
              <div className="text-4xl mb-2">🍔</div>
              <CardTitle className="text-orange-700 dark:text-orange-400">مطعم برجر</CardTitle>
              <p className="text-xs text-muted-foreground">النبرة: شهية وودودة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-black p-3 rounded-xl text-sm shadow-sm">
                👤: عندكم شي سبايسي؟
              </div>
              <div className="bg-orange-500 text-white p-3 rounded-xl text-sm shadow-sm">
                🤖: يا هلا! 🔥 أكيد، جرب "فولكينو برجر" بصوصنا الحار الخاص، نار وشرار! تحب نطلبه لك؟
              </div>
              <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">جرب الآن</Button>
            </CardContent>
          </Card>

          {/* Fashion */}
          <Card className="neumorphic border-none bg-purple-50/50 dark:bg-purple-950/10">
            <CardHeader>
              <div className="text-4xl mb-2">👗</div>
              <CardTitle className="text-purple-700 dark:text-purple-400">متجر أزياء</CardTitle>
              <p className="text-xs text-muted-foreground">النبرة: أنيقة وناصحة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-black p-3 rounded-xl text-sm shadow-sm">
                👤: وش يناسب الفستان الأسود؟
              </div>
              <div className="bg-purple-600 text-white p-3 rounded-xl text-sm shadow-sm">
                🤖: الأسود ملك الألوان! ✨ أنصحك بكعب فضي لامع لإطلالة سهرة، أو جاكيت جينز لطلعة كاجوال. عندنا تشكيلة اكسسوارات بتعجبك!
              </div>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">جرب الآن</Button>
            </CardContent>
          </Card>

          {/* Corporate */}
          <Card className="neumorphic border-none bg-blue-50/50 dark:bg-blue-950/10">
            <CardHeader>
              <div className="text-4xl mb-2">🏢</div>
              <CardTitle className="text-blue-700 dark:text-blue-400">شركة خدمات</CardTitle>
              <p className="text-xs text-muted-foreground">النبرة: رسمية ودقيقة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-black p-3 rounded-xl text-sm shadow-sm">
                👤: متى دوامكم؟
              </div>
              <div className="bg-blue-600 text-white p-3 rounded-xl text-sm shadow-sm">
                🤖: مرحباً بك. ساعات العمل الرسمية من الأحد إلى الخميس، من الساعة 9:00 صباحاً حتى 5:00 مساءً. نسعد بخدمتكم.
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">جرب الآن</Button>
            </CardContent>
          </Card>

          {/* Clinic */}
          <Card className="neumorphic border-none bg-teal-50/50 dark:bg-teal-950/10">
            <CardHeader>
              <div className="text-4xl mb-2">🦷</div>
              <CardTitle className="text-teal-700 dark:text-teal-400">عيادة أسنان</CardTitle>
              <p className="text-xs text-muted-foreground">النبرة: مهنية ومطمئنة</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-black p-3 rounded-xl text-sm shadow-sm">
                👤: خايف من خلع الضرس
              </div>
              <div className="bg-teal-600 text-white p-3 rounded-xl text-sm shadow-sm">
                🤖: لا تقلق أبداً. أطباؤنا يستخدمون أحدث تقنيات التخدير لضمان تجربة مريحة وبدون ألم. صحتك تهمنا. هل تحب نحجز لك استشارة؟
              </div>
              <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white">جرب الآن</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
            <Link href="/wizard">
              <Button size="lg" className="bg-primary text-lg h-14 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all">
                اصنع بوت خاص بك الآن
              </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
