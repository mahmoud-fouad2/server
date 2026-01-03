import { PrismaClient, Role, BusinessStatus, PlanType, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
  const userPassword = process.env.ADMIN_INITIAL_PASSWORD1 || 'user123';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(userPassword, 10);

  // 1. Create Super Admin
  const adminEmail = 'admin@faheemly.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: adminHash,
      name: 'Super Admin',
      fullName: 'Faheemly Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user upserted: ${admin.email}`);

  // 2. Create Premium User (Our Business)
  const premiumEmail = 'hello@faheemly.com';
  const premiumUser = await prisma.user.upsert({
    where: { email: premiumEmail },
    update: {
      password: userHash,
      role: Role.CLIENT,
      isActive: true,
    },
    create: {
      email: premiumEmail,
      password: userHash,
      name: 'Faheemly Team',
      fullName: 'Faheemly Official',
      role: Role.CLIENT,
      isActive: true,
    },
  });
  console.log(`✅ Premium user upserted: ${premiumUser.email}`);

  // 3. Create Business for Premium User
  const businessId = 'cmjx5hz7a000br594zctuurus';
  const business = await prisma.business.upsert({
    where: { id: businessId },
    update: {
      userId: premiumUser.id,
      name: 'Faheemly Official',
      status: BusinessStatus.ACTIVE,
      planType: PlanType.ENTERPRISE,
    },
    create: {
      id: businessId,
      userId: premiumUser.id,
      name: 'Faheemly Official',
      activityType: ActivityType.OTHER,
      // industry: 'Technology',
      language: 'ar',
      status: BusinessStatus.ACTIVE,
      planType: PlanType.ENTERPRISE,
      botTone: 'professional',
      messageQuota: 1000000,
      allowedOrigins: ['https://faheemly.com', 'http://localhost:3000'],
    },
  });
  console.log(`✅ Business upserted: ${business.name} (${business.id})`);

  // 4. Seed Knowledge Base
  // Clear existing KB for this business to avoid duplicates/stale data
  await prisma.knowledgeBase.deleteMany({
    where: { businessId: business.id },
  });

  const kbEntries = [
    {
      title: 'عن فهملي (About Faheemly)',
      content: `فهملي هو منصة شات بوت ذكاء اصطناعي متطورة مصممة خصيصاً للسوق العربي.
      نحن نقدم حلولاً ذكية لخدمة العملاء عبر واتساب والمواقع الإلكترونية.
      يتميز فهملي بقدرته على فهم اللهجات العربية المختلفة (المصرية، السعودية، الخليجية، الشامية) والرد بها بطلاقة.
      هدفنا هو مساعدة الشركات على أتمتة خدمة العملاء وزيادة المبيعات وتحسين رضا العملاء على مدار 24 ساعة.`,
      tags: 'about, intro, mission',
    },
    {
      title: 'خدماتنا (Our Services)',
      content: `1. **ربط واتساب فوري**: تحويل رقم الواتساب الخاص بنشاطك التجاري إلى مساعد ذكي يرد تلقائياً.
      2. **ويدجت للموقع الإلكتروني**: شات بوت مدمج في موقعك الإلكتروني للتفاعل مع الزوار.
      3. **دعم اللهجات العربية**: فهم دقيق للهجات المحلية والرد بنفس اللهجة.
      4. **تحليل المشاعر**: معرفة حالة العميل (سعيد، غاضب، محايد) للتعامل معه بشكل مناسب.
      5. **لوحة تحكم متكاملة**: إدارة المحادثات، العملاء، والتحليلات من مكان واحد.
      6. **التسليم البشري الذكي**: تحويل المحادثة لموظف حقيقي عند الحاجة أو طلب العميل.`,
      tags: 'services, features, whatsapp, widget',
    },
    {
      title: 'الأسعار والباقات (Pricing)',
      content: `نقدم باقات مرنة تناسب جميع الأحجام:
      
      **1. باقة التجربة المجانية (7 أيام):**
      - تجربة كاملة للمميزات.
      - عدد محدود من الرسائل.
      - دعم فني أساسي.
      
      **2. الباقة الأساسية (Basic):**
      - مناسبة للشركات الناشئة.
      - ربط واتساب واحد.
      - 1000 رسالة شهرياً.
      - دعم فني عبر البريد الإلكتروني.
      
      **3. الباقة الاحترافية (Pro):**
      - الخيار الأفضل للشركات المتوسطة.
      - ربط واتساب + ويدجت موقع.
      - 5000 رسالة شهرياً.
      - دعم فني ذو أولوية.
      - إزالة شعار "فهملي".
      
      **4. باقة المؤسسات (Enterprise):**
      - للشركات الكبرى والاحتياجات الخاصة.
      - رسائل غير محدودة.
      - تدريب مخصص للذكاء الاصطناعي.
      - مدير حساب مخصص.
      - تكامل مع أنظمة CRM الخاصة بكم.`,
      tags: 'pricing, plans, cost',
    },
    {
      title: 'كيفية الاشتراك (How to Subscribe)',
      content: `يمكنك البدء فوراً بالتسجيل في موقعنا faheemly.com.
      1. أنشئ حساباً جديداً.
      2. اختر "تجربة مجانية" أو اختر الباقة المناسبة.
      3. قم بربط رقم الواتساب الخاص بك عبر مسح رمز QR.
      4. ابدأ في تدريب البوت الخاص بك بإضافة معلومات عن نشاطك التجاري في قسم "قاعدة المعرفة".`,
      tags: 'subscribe, start, guide',
    },
    {
      title: 'الدعم الفني (Support)',
      content: `فريق دعم فهملي متاح لمساعدتكم.
      يمكنكم التواصل معنا عبر البريد الإلكتروني: support@faheemly.com
      أو عبر الشات المباشر في لوحة التحكم.
      ساعات العمل: من الأحد للخميس، 9 صباحاً حتى 5 مساءً بتوقيت مكة المكرمة.`,
      tags: 'support, contact, help',
    }
  ];

  for (const entry of kbEntries) {
    await prisma.knowledgeBase.create({
      data: {
        businessId: business.id,
        title: entry.title,
        content: entry.content,
        source: 'system_seed',
        tags: entry.tags,
      },
    });
  }
  console.log(`✅ Knowledge Base seeded with ${kbEntries.length} entries.`);

  console.log('🌱 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
