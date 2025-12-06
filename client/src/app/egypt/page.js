import Link from 'next/link';

export const metadata = {
  title: 'شات بوت ذكي للشركات المصرية | فهيملي - أفضل حل ذكاء اصطناعي في مصر',
  description:
    'أقوى شات بوت بالذكاء الاصطناعي للشركات والمحلات المصرية. خدمة عملاء 24/7 بالمصري، رد تلقائي على واتساب، توفير 70% من تكاليف خدمة العملاء. جرب مجاناً!',
  keywords:
    'شات بوت مصري، ذكاء اصطناعي مصر، خدمة عملاء تلقائية، واتساب بوت، AI Egypt، chatbot مصري',
  openGraph: {
    title: 'شات بوت ذكي بالمصري - فهيملي',
    description:
      'خدمة عملاء ذكية 24/7 لشركتك بالذكاء الاصطناعي. بيفهم المصري ويرد تلقائياً',
    url: 'https://faheemly.com/egypt',
    siteName: 'فهيملي - Faheemly',
    locale: 'ar_EG',
    type: 'website',
  },
  alternates: {
    canonical: 'https://faheemly.com/egypt',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EgyptPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            شات بوت ذكي <span className="text-indigo-600">بيفهم المصري</span> 🇪🇬
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            خلي شات بوت فهيملي يرد على عملائك 24/7 بالمصري الأصيل
            <br />
            <strong>وفّر 70% من تكاليف خدمة العملاء</strong> واكسب رضا عملائك
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
            >
              جرب مجاناً 14 يوم
            </Link>
            <Link
              href="#examples"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              شوف أمثلة
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600">1000+</div>
              <div className="text-gray-600 mt-2">شركة مصرية</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">24/7</div>
              <div className="text-gray-600 mt-2">رد تلقائي</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">70%</div>
              <div className="text-gray-600 mt-2">توفير بالتكاليف</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">98%</div>
              <div className="text-gray-600 mt-2">رضا العملاء</div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases for Egypt */}
      <section id="examples" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            مناسب لكل أنواع الأعمال في مصر
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* مطاعم */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-3">المطاعم والكافيهات</h3>
              <ul className="text-gray-700 space-y-2">
                <li>✅ رد على استفسارات المنيو</li>
                <li>✅ أخذ طلبات الديليفري</li>
                <li>✅ حجز الطاولات</li>
                <li>✅ متابعة الأوردرات</li>
              </ul>
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <strong>مثال:</strong> &quot;عندكو بيتزا كبيرة بكام؟ وبتوصلوا مدينة
                نصر؟&quot;
              </div>
            </div>

            {/* محلات */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-3">المحلات والبوتيكات</h3>
              <ul className="text-gray-700 space-y-2">
                <li>✅ الرد على السعر والمقاسات</li>
                <li>✅ توصيات المنتجات</li>
                <li>✅ استلام الأوردرات</li>
                <li>✅ متابعة الشحن</li>
              </ul>
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <strong>مثال:</strong> &quot;عندكو بلوزة سادة لارج؟ وبكام الشحن
                للإسكندرية؟&quot;
              </div>
            </div>

            {/* عيادات */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-bold mb-3">
                العيادات والمراكز الطبية
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>✅ حجز المواعيد</li>
                <li>✅ الرد على الاستفسارات</li>
                <li>✅ تذكير بالمواعيد</li>
                <li>✅ إرسال النتائج</li>
              </ul>
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <strong>مثال:</strong> &quot;عايز أحجز كشف أسنان، فيه معاد بكرة؟&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Egyptian Businesses Success Stories */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            شركات مصرية بتستخدم فهيملي
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">🍕</div>
                <div>
                  <div className="font-bold">بيتزا كايرو</div>
                  <div className="text-sm opacity-80">القاهرة، مصر الجديدة</div>
                </div>
              </div>
              <p className="italic mb-3">
                &quot;فهيملي وفرلنا موظفة كول سنتر. بيرد على 200 أوردر في اليوم
                تلقائي!&quot;
              </p>
              <div className="text-sm opacity-80">
                📈 زيادة الطلبات: <strong>45%</strong>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-lg backdrop-blur">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">👗</div>
                <div>
                  <div className="font-bold">بوتيك نور</div>
                  <div className="text-sm opacity-80">الإسكندرية</div>
                </div>
              </div>
              <p className="italic mb-3">
                &quot;بيرد على العملاء حتى لو أنا نايمة، وبيبعتلي الأوردرات على
                واتساب!&quot;
              </p>
              <div className="text-sm opacity-80">
                💰 توفير شهري: <strong>3,500 جنيه</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            ليه فهيملي هو الأفضل للسوق المصري؟
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">🇪🇬</div>
              <h3 className="font-bold text-lg mb-2">بيفهم المصري</h3>
              <p className="text-gray-600">
                مدرّب على اللهجة المصرية الأصلية - بيفهم &quot;عايز&quot; و&quot;محتاج&quot; و&quot;ممكن&quot;
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="font-bold text-lg mb-2">الدفع بالجنيه المصري</h3>
              <p className="text-gray-600">
                أسعار بالجنيه، فودافون كاش، وفيزا مصرية
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="font-bold text-lg mb-2">واتساب مصري</h3>
              <p className="text-gray-600">
                يشتغل على واتساب الأرقام المصرية (+20)
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-bold text-lg mb-2">رد لحظي</h3>
              <p className="text-gray-600">
                رد في أقل من ثانية - أسرع من أي موظف!
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">تقارير مفصلة</h3>
              <p className="text-gray-600">
                اعرف عملائك بيسألوا عن إيه وحسّن خدمتك
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="font-bold text-lg mb-2">أمان عالي</h3>
              <p className="text-gray-600">
                بياناتك محمية ومشفرة - خصوصية 100%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            أسعار مناسبة للسوق المصري
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-transparent">
              <h3 className="text-xl font-bold mb-4">البداية</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                مجاناً
              </div>
              <div className="text-gray-600 mb-6">14 يوم تجربة</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  100 رسالة/شهر
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  واتساب + ويدجت
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  دعم فني
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-gray-200 text-center py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                ابدأ مجاناً
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-4 border-indigo-600 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                الأكثر شعبية
              </div>
              <h3 className="text-xl font-bold mb-4">المحترف</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                799 جنيه
              </div>
              <div className="text-gray-600 mb-6">شهرياً</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  5,000 رسالة/شهر
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  كل القنوات
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  تحليلات متقدمة
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  فريق متعدد
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                اشترك الآن
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-transparent">
              <h3 className="text-xl font-bold mb-4">المؤسسات</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                مخصص
              </div>
              <div className="text-gray-600 mb-6">حسب احتياجك</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  رسائل غير محدودة
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  API مخصص
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  دعم مخصص
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  تدريب الفريق
                </li>
              </ul>
              <Link
                href="/contact"
                className="block w-full bg-gray-200 text-center py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            جاهز تبدأ؟ جرب مجاناً النهارده!
          </h2>
          <p className="text-xl mb-8 opacity-90">
            ما تدفعش ولا قرش - ابدأ تجربة 14 يوم مجاناً
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 px-12 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition"
          >
            ابدأ الآن 🚀
          </Link>
          <div className="mt-6 text-sm opacity-75">
            ✓ ما تحتاجش كريدت كارد ✓ إلغاء في أي وقت ✓ دعم فني بالعربي
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            أسئلة شائعة من العملاء المصريين
          </h2>
          <div className="space-y-6">
            <details className="bg-white p-6 rounded-lg shadow">
              <summary className="font-bold cursor-pointer">
                هل فهيملي يفهم اللهجة المصرية فعلاً؟
              </summary>
              <p className="mt-4 text-gray-700">
                أيوه طبعاً! فهيملي مدرّب على آلاف المحادثات بالمصري. بيفهم
                &quot;عايز&quot;، &quot;محتاج&quot;، &quot;ممكن&quot;، &quot;لو سمحت&quot; وكل التعبيرات المصرية.
              </p>
            </details>

            <details className="bg-white p-6 rounded-lg shadow">
              <summary className="font-bold cursor-pointer">
                ازاي أدفع بالجنيه المصري؟
              </summary>
              <p className="mt-4 text-gray-700">
                نقبل الدفع بفودافون كاش، فيزا مصرية، وماستركارد. كل الأسعار
                بالجنيه المصري.
              </p>
            </details>

            <details className="bg-white p-6 rounded-lg shadow">
              <summary className="font-bold cursor-pointer">
                هل يشتغل مع الأرقام المصرية؟
              </summary>
              <p className="mt-4 text-gray-700">
                أكيد! يشتغل مع كل أرقام واتساب المصرية (+20) بدون أي مشاكل.
              </p>
            </details>

            <details className="bg-white p-6 rounded-lg shadow">
              <summary className="font-bold cursor-pointer">
                في دعم فني بالعربي؟
              </summary>
              <p className="mt-4 text-gray-700">
                طبعاً! فريق الدعم الفني بتاعنا مصري 100% وبيرد بالعربي على مدار
                الساعة.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
