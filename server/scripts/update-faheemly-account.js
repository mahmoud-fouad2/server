const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'hello@faheemly.com';
  console.log(`Searching for user: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { businesses: true }
  });

  if (!user) {
    console.error('User not found!');
    process.exit(1);
  }

  console.log(`User found: ${user.name} (${user.id})`);

  if (user.businesses.length === 0) {
    console.error('No business found for this user.');
    process.exit(1);
  }

  const business = user.businesses[0];
  console.log(`Updating business: ${business.name} (${business.id})...`);

  // 1. Update Quota to Unlimited (effectively)
  await prisma.business.update({
    where: { id: business.id },
    data: {
      messageQuota: 10000000, // 10 Million messages
      planType: 'ENTERPRISE',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Quota updated to 10,000,000 messages.');

  // 2. Seed Knowledge Base
  console.log('Seeding Knowledge Base...');
  
  const knowledgeEntries = [
    {
      title: 'ما هو فهملي؟',
      content: 'فهملي هو منصة شات بوت ذكي متقدمة مصممة خصيصاً للسوق العربي. نحن نستخدم الذكاء الاصطناعي لفهم اللهجات العربية المختلفة (السعودية، المصرية، الخليجية، الشامية) والرد على العملاء بشكل طبيعي وتلقائي على مدار 24 ساعة.',
      type: 'TEXT',
      tags: ['about', 'general']
    },
    {
      title: 'أسعار الباقات',
      content: 'نقدم 3 باقات رئيسية:\n1. باقة البداية (99 ريال/شهر): تشمل 1000 رسالة، بوت واحد، ودعم أساسي.\n2. باقة النمو (299 ريال/شهر): تشمل 5000 رسالة، 3 بوتات، وربط واتساب.\n3. باقة الشركات (تواصل معنا): رسائل غير محدودة، تدريب مخصص، وربط مع أنظمتك الخاصة.',
      type: 'TEXT',
      tags: ['pricing', 'plans']
    },
    {
      title: 'كيفية الاشتراك',
      content: 'يمكنك الاشتراك بسهولة عبر موقعنا faheemly.com. اختر الباقة المناسبة، سجل حسابك، وقم بربط الواتساب الخاص بك في دقائق معدودة.',
      type: 'TEXT',
      tags: ['signup', 'howto']
    },
    {
      title: 'هل يدعم اللهجات العامية؟',
      content: 'نعم، فهملي متميز في فهم اللهجات العامية العربية. سواء كان عميلك يتحدث بالسعودي "أبغى أحجز"، أو بالمصري "عايز أطلب"، أو بالكويتي "ابي موعد"، سيفهمه البوت ويرد عليه باللهجة المناسبة.',
      type: 'TEXT',
      tags: ['dialects', 'features']
    },
    {
      title: 'الدعم الفني',
      content: 'فريق الدعم الفني متاح لمساعدتك عبر البريد الإلكتروني support@faheemly.com أو عبر الشات المباشر في لوحة التحكم.',
      type: 'TEXT',
      tags: ['support', 'contact']
    },
    {
      title: 'مميزات فهملي',
      content: 'أهم المميزات:\n- رد آلي فوري 24/7\n- فهم اللهجات العربية\n- ربط سهل مع واتساب وتيليجرام\n- لوحة تحكم عربية بالكامل\n- تقارير وإحصائيات مفصلة\n- إمكانية تحويل المحادثة لموظف بشري عند الحاجة.',
      type: 'TEXT',
      tags: ['features']
    }
  ];

  for (const entry of knowledgeEntries) {
    // Check if exists to avoid duplicates
    const existing = await prisma.knowledgeBase.findFirst({
      where: {
        businessId: business.id,
        question: entry.title // Assuming 'question' maps to title in schema or content
      }
    });

    if (!existing) {
      await prisma.knowledgeBase.create({
        data: {
          businessId: business.id,
          question: entry.title,
          content: entry.content,
          type: entry.type,
          tags: entry.tags
        }
      });
    }
  }

  console.log(`✅ Added ${knowledgeEntries.length} knowledge base entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
