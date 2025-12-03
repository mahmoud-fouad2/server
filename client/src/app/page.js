import { Metadata } from 'next';
import Link from 'next/link';
import { 
  MessageCircle, Zap, Shield, BarChart3, Globe, Users, 
  CheckCircle2, ArrowRight, Star, TrendingUp, Clock, 
  Headphones, Lock, Rocket, Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'فهيملي - أقوى شات بوت بالذكاء الاصطناعي للشركات العربية | Faheemly AI',
  description: 'حوّل خدمة عملائك بالذكاء الاصطناعي. شات بوت ذكي يرد تلقائياً على واتساب، تليجرام، والموقع. وفّر 70% من التكاليف وزوّد رضا عملائك. جرب مجاناً!',
  keywords: 'شات بوت، ذكاء اصطناعي، AI chatbot، خدمة عملاء تلقائية، واتساب بوت، تليجرام بوت، Arabic AI',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={28} />
              <span className="text-2xl font-bold text-gray-900">فهيملي</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-gray-700 hover:text-indigo-600 transition">الخدمات</Link>
              <Link href="/solutions" className="text-gray-700 hover:text-indigo-600 transition">الحلول</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-indigo-600 transition">الأسعار</Link>
              <Link href="/about" className="text-gray-700 hover:text-indigo-600 transition">من نحن</Link>
              <Link href="/contact" className="text-gray-700 hover:text-indigo-600 transition">تواصل معنا</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-indigo-600 transition">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🚀 الأول في العالم العربي
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                شات بوت ذكي
                <br />
                <span className="text-indigo-600">يفهم عملائك</span>
                <br />
                ويرد تلقائياً
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                حوّل محادثاتك إلى مبيعات. شات بوت بالذكاء الاصطناعي يعمل 24/7 
                على واتساب، تليجرام، وموقعك. <strong>وفّر 70% من التكاليف</strong> وزوّد رضا عملائك.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                  جرب مجاناً 14 يوم
                  <ArrowRight size={20} />
                </Link>
                <Link href="#demo" className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-indigo-200 hover:border-indigo-600 transition flex items-center gap-2">
                  <MessageCircle size={20} />
                  شاهد عرض تجريبي
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  بدون كريدت كارد
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  تفعيل فوري
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  دعم عربي 24/7
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">مساعد فهيملي</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      متصل الآن
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-none max-w-[80%]">
                      السلام عليكم، عندكم خدمة توصيل؟
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none max-w-[80%]">
                      وعليكم السلام! نعم، نوفر خدمة توصيل سريعة لجميع المدن 🚚
                      <br /><br />
                      • التوصيل المجاني للطلبات فوق 200 ريال
                      <br />
                      • التوصيل خلال 24-48 ساعة
                      <br />
                      • تتبع الشحنة لحظياً
                      <br /><br />
                      هل تريد تقديم طلب الآن؟
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t text-center">
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Zap size={14} className="text-yellow-500" />
                    ردّ تلقائي في أقل من ثانية
                  </div>
                </div>
              </div>
              
              {/* Floating Stats */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-indigo-600">98%</div>
                <div className="text-xs text-gray-600">رضا العملاء</div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-xs text-gray-600">رد تلقائي</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 mb-8 text-sm font-semibold">
            يثق بنا أكثر من 1,000 شركة في الوطن العربي
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold">🇸🇦 السعودية</div>
            <div className="text-2xl font-bold">🇪🇬 مصر</div>
            <div className="text-2xl font-bold">🇦🇪 الإمارات</div>
            <div className="text-2xl font-bold">🇰🇼 الكويت</div>
            <div className="text-2xl font-bold">🇶🇦 قطر</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              لماذا تختار فهيملي؟
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              كل ما تحتاجه لتحويل خدمة عملائك إلى تجربة استثنائية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="text-indigo-600" size={32} />,
                title: 'رد تلقائي ذكي',
                description: 'يرد على عملائك بذكاء ويفهم سياق المحادثة، مدرّب على عملك الخاص'
              },
              {
                icon: <Globe className="text-blue-600" size={32} />,
                title: 'كل القنوات',
                description: 'واتساب، تليجرام، موقعك الإلكتروني - كل شيء في مكان واحد'
              },
              {
                icon: <Zap className="text-yellow-600" size={32} />,
                title: 'سرعة فائقة',
                description: 'رد في أقل من ثانية - أسرع من أي موظف خدمة عملاء'
              },
              {
                icon: <BarChart3 className="text-green-600" size={32} />,
                title: 'تحليلات متقدمة',
                description: 'تقارير مفصلة عن أداء البوت واحتياجات عملائك'
              },
              {
                icon: <Shield className="text-red-600" size={32} />,
                title: 'أمان عالي',
                description: 'بياناتك محمية ومشفرة بأعلى معايير الأمان العالمية'
              },
              {
                icon: <Users className="text-purple-600" size={32} />,
                title: 'دعم فريق العمل',
                description: 'تعاون فريقك بسهولة مع نظام إدارة متقدم'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              حلول لكل القطاعات
            </h2>
            <p className="text-xl text-gray-600">
              مهما كان مجال عملك، فهيملي يساعدك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🍽️', title: 'المطاعم والكافيهات', link: '/solutions/restaurants' },
              { emoji: '🛍️', title: 'التجارة الإلكترونية', link: '/solutions/ecommerce' },
              { emoji: '🏥', title: 'العيادات والمراكز', link: '/solutions/healthcare' },
              { emoji: '🏨', title: 'الفنادق والسياحة', link: '/solutions/hospitality' },
              { emoji: '🎓', title: 'التعليم والتدريب', link: '/solutions/education' },
              { emoji: '💼', title: 'الشركات والخدمات', link: '/solutions/business' },
              { emoji: '🏪', title: 'المحلات والبوتيكات', link: '/solutions/retail' },
              { emoji: '🚗', title: 'السيارات والنقل', link: '/solutions/automotive' }
            ].map((industry, index) => (
              <Link 
                key={index} 
                href={industry.link}
                className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl hover:shadow-lg transition border border-gray-200 hover:border-indigo-300 group"
              >
                <div className="text-4xl mb-3">{industry.emoji}</div>
                <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                  {industry.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Pages */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              حلول مخصصة لكل دولة
            </h2>
            <p className="text-xl opacity-90">
              نفهم لهجتك، نفهم سوقك، نفهم عملائك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { flag: '🇸🇦', name: 'السعودية', link: '/saudi', users: '500+' },
              { flag: '🇪🇬', name: 'مصر', link: '/egypt', users: '400+' },
              { flag: '🇦🇪', name: 'الإمارات', link: '/uae', users: '300+' },
              { flag: '🇰🇼', name: 'الكويت', link: '/kuwait', users: '200+' }
            ].map((country, index) => (
              <Link 
                key={index}
                href={country.link}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-xl hover:bg-white/20 transition border border-white/20 text-center group"
              >
                <div className="text-6xl mb-4">{country.flag}</div>
                <div className="text-2xl font-bold mb-2">{country.name}</div>
                <div className="text-sm opacity-80 mb-4">{country.users} شركة</div>
                <div className="text-sm font-semibold group-hover:underline">
                  اعرف المزيد ←
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-indigo-400 mb-2">1,000+</div>
              <div className="text-gray-400">شركة تثق بنا</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-400 mb-2">10M+</div>
              <div className="text-gray-400">رسالة شهرياً</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-yellow-400 mb-2">98%</div>
              <div className="text-gray-400">رضا العملاء</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-gray-400">دعم متواصل</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            جاهز لتحويل خدمة عملائك؟
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ابدأ مجاناً اليوم. بدون كريدت كارد. تفعيل فوري.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-12 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
            ابدأ تجربتك المجانية
            <Rocket size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-indigo-400" size={24} />
                <span className="text-xl font-bold text-white">فهيملي</span>
              </div>
              <p className="text-sm">
                شات بوت ذكي بالذكاء الاصطناعي للشركات العربية
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">المنتج</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/services" className="hover:text-white transition">الخدمات</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">الأسعار</Link></li>
                <li><Link href="/solutions" className="hover:text-white transition">الحلول</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">الشركة</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">من نحن</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">تواصل معنا</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">الشروط</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">الخصوصية</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">تابعنا</h3>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition">Twitter</a>
                <a href="#" className="hover:text-white transition">LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 فهيملي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
