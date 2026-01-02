import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFaheemly() {
  console.log('🌱 Seeding Faheemly data...');

  // Find Faheemly business
  const user = await prisma.user.findUnique({
    where: { email: 'hello@faheemly.com' },
    include: { businesses: true }
  });

  if (!user || user.businesses.length === 0) {
    console.error('❌ Faheemly user or business not found!');
    return;
  }

  const business = user.businesses[0];

  console.log(`✅ Found business: ${business.name} (${business.id})`);

  // Knowledge Base - خدمات فهملي
  const knowledgeEntries = [
    {
      title: 'ما هي فهملي؟',
      content: 'فهملي هي منصة ذكية للدردشة الآلية مدعومة بالذكاء الاصطناعي، تساعد الشركات على التواصل مع عملائها بشكل تلقائي وفعّال على مدار الساعة.',
      tags: 'فهملي,تعريف,منصة,AI',
    },
    {
      title: 'خدمات فهملي',
      content: `فهملي تقدم عدة خدمات:
1. 🤖 Chatbot ذكي مدعوم بالـ AI
2. 💬 Live Chat للمحادثات الفورية
3. 📊 لوحة تحكم شاملة للإحصائيات
4. 🎨 Widget قابل للتخصيص بالكامل
5. 🔗 تكامل سهل مع أي موقع
6. 📱 دعم متعدد اللغات (عربي/إنجليزي)
7. 🧠 تعلم آلي من المحادثات السابقة`,
      tags: 'خدمات,مميزات,chatbot,AI',
    },
    {
      title: 'كيف أبدأ مع فهملي؟',
      content: `للبدء مع فهملي:
1. سجل حساب مجاناً على https://faheemly.com/register
2. احصل على Widget Code من لوحة التحكم
3. ضع الكود في موقعك قبل إغلاق </body>
4. ابدأ بتدريب البوت من خلال Knowledge Base
5. استمتع بالدردشة الآلية الذكية!`,
      tags: 'البداية,تسجيل,تركيب',
    },
    {
      title: 'أسعار فهملي',
      content: `فهملي تقدم عدة باقات:
- 🆓 تجربة مجانية: 14 يوم كاملة
- 💼 Basic: $29/شهر - 1000 محادثة
- 🚀 Pro: $79/شهر - 5000 محادثة + مميزات إضافية
- 🏢 Enterprise: حسب الطلب - محادثات غير محدودة + دعم مخصص`,
      tags: 'أسعار,باقات,اشتراك',
    },
    {
      title: 'دعم اللغة العربية',
      content: 'نعم! فهملي مصمم خصيصاً للدعم الكامل باللغة العربية. البوت يفهم العربية بطلاقة ويرد بشكل طبيعي، مع دعم اللهجات المختلفة.',
      tags: 'عربي,لغة,دعم',
    },
    {
      title: 'تخصيص Widget',
      content: `يمكنك تخصيص Widget بالكامل:
- 🎨 الألوان (primary, background, text)
- 📍 الموضع (يمين/يسار)
- 💬 رسالة الترحيب
- 🖼️ صورة البوت
- ⚙️ سلوك البوت (تلقائي/يدوي)
- 🔔 الأصوات والإشعارات
كل ذلك من لوحة Settings → Widget Customization`,
      tags: 'widget,تخصيص,إعدادات',
    },
    {
      title: 'التكامل مع أنظمة أخرى',
      content: `نعم! فهملي يدعم التكامل مع:
- Webhooks للإشعارات
- REST API كاملة
- Zapier و Make.com
- CRM systems (Salesforce, HubSpot)
- E-commerce platforms
- Custom integrations عبر API`,
      tags: 'API,تكامل,webhooks',
    },
    {
      title: 'الذكاء الاصطناعي في فهملي',
      content: `فهملي يستخدم تقنيات AI متقدمة:
- 🧠 NLP لفهم النوايا والسياق
- 📚 Vector embeddings للبحث الدلالي
- 🤖 GPT models للردود الذكية
- 📊 Machine Learning للتحسين المستمر
- 🔍 Semantic search في قاعدة المعرفة
البوت يتعلم من كل محادثة ويتحسن تلقائياً!`,
      tags: 'AI,NLP,ذكاء اصطناعي',
    },
  ];

  console.log('📚 Creating knowledge base entries...');
  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBase.create({
      data: {
        ...entry,
        businessId: business.id,
        source: 'manual',
      },
    });
  }
  console.log(`✅ Created ${knowledgeEntries.length} knowledge base entries`);

  // Update business widget config
  await prisma.business.update({
    where: { id: business.id },
    data: {
      widgetConfig: JSON.stringify({
        primaryColor: '#6366f1',
        position: 'bottom-right',
        welcomeMessage: 'مرحباً! أنا مساعد فهملي الذكي 🤖\nكيف يمكنني مساعدتك اليوم؟',
        botName: 'فهملي بوت',
        botAvatar: '🤖',
        enableSounds: true,
        enableNotifications: true,
        language: 'ar',
        theme: 'light',
      }),
    },
  });
  console.log('✅ Updated widget configuration');

  console.log('\n🎉 Seeding complete!');
  console.log(`\n📊 Business Details:`);
  console.log(`   ID: ${business.id}`);
  console.log(`   Name: ${business.name}`);
  console.log(`   API Key: ${business.apiKey || 'Generated'}`);
  console.log(`   Knowledge Base: ${knowledgeEntries.length} entries`);
  console.log(`\n🔗 Widget Code:`);
  console.log(`<script src="https://fahimo-api.onrender.com/fahimo-widget.js" data-business-id="${business.id}"></script>`);
}

seedFaheemly()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);nowledgeEntries.length
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
