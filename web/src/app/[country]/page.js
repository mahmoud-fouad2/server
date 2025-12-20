import { LandingPage } from '@/components/LandingPage';

export function generateStaticParams() {
  return [
    { country: 'eg' },
    { country: 'ae' },
    { country: 'kw' },
    { country: 'sa' },
    { country: 'api' },
  ];
}

export function generateMetadata({ params }) {
  const country = params.country;

  const metadata = {
    sa: {
      title: 'شات بوت واتساب السعودية | فهملي - الموظف الذكي',
      description:
        'أفضل منصة شات بوت في السعودية. ربط واتساب للأعمال، رد آلي باللهجة السعودية، وزيادة مبيعاتك 24/7. ابدأ تجربتك المجانية الآن.',
      keywords: [
        'شات بوت السعودية',
        'واتساب أعمال السعودية',
        'رد آلي واتساب',
        'ذكاء اصطناعي السعودية',
        'خدمة عملاء آلية',
      ],
    },
    eg: {
      title: 'شات بوت واتساب مصر | فهملي - خدمة عملاء آلية',
      description:
        'أقوى شات بوت في مصر يدعم اللهجة المصرية. أتمتة الردود على واتساب وفيسبوك، وزود مبيعاتك بسهولة. جرب مجاناً.',
      keywords: [
        'شات بوت مصر',
        'واتساب بيزنس مصر',
        'رد تلقائي واتساب',
        'ذكاء اصطناعي مصر',
        'خدمة عملاء مصر',
      ],
    },
    ae: {
      title: 'شات بوت واتساب الإمارات | فهملي - حلول الذكاء الاصطناعي',
      description:
        'منصة الشات بوت الأولى في الإمارات. دعم كامل للهجة الإماراتية، حجز مواعيد، وخدمة عملاء مميزة على مدار الساعة.',
      keywords: [
        'شات بوت الإمارات',
        'واتساب أعمال دبي',
        'ذكاء اصطناعي الإمارات',
        'أتمتة خدمة العملاء',
        'Chatbot UAE',
      ],
    },
    kw: {
      title: 'شات بوت واتساب الكويت | فهملي - الموظف الذكي',
      description:
        'خدمة شات بوت ذكية في الكويت. ردود فورية باللهجة الكويتية، إدارة طلبات، وحجز مواعيد تلقائي. سجل الآن.',
      keywords: [
        'شات بوت الكويت',
        'واتساب الكويت',
        'رد آلي الكويت',
        'ذكاء اصطناعي الكويت',
        'خدمة عملاء الكويت',
      ],
    },
  };

  const data = metadata[country] || metadata.sa;

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: `https://faheemly.com/${country}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `https://faheemly.com/${country}`,
      locale:
        country === 'eg'
          ? 'ar_EG'
          : country === 'ae'
            ? 'ar_AE'
            : country === 'kw'
              ? 'ar_KW'
              : 'ar_SA',
    },
  };
}

export default function CountryPage({ params }) {
  return <LandingPage country={params.country} />;
}
