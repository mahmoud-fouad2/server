'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import Head from 'next/head';
import {
  Check,
  X,
  Sparkles,
  Rocket,
  Crown,
  Zap,
  Shield,
  HeadphonesIcon,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { convertCurrency } from '@/constants';

// Base prices in SAR
const BASE_PRICES = {
  starter: 199,
  pro: 399,
  agency: 999,
};

const plans = {
  sa: {
    starter: {
      price: BASE_PRICES.starter.toString(),
      currency: 'ريال',
      agents: '1',
    },
    pro: { price: BASE_PRICES.pro.toString(), currency: 'ريال', agents: '3' },
    agency: {
      price: BASE_PRICES.agency.toString(),
      currency: 'ريال',
      agents: 'مخصص',
    },
  },
  eg: {
    starter: {
      price: convertCurrency(BASE_PRICES.starter, 'EGP').toString(),
      currency: 'جنيه',
      agents: '1',
    },
    pro: {
      price: convertCurrency(BASE_PRICES.pro, 'EGP').toLocaleString('ar-EG'),
      currency: 'جنيه',
      agents: '3',
    },
    agency: {
      price: convertCurrency(BASE_PRICES.agency, 'EGP').toLocaleString('ar-EG'),
      currency: 'جنيه',
      agents: 'مخصص',
    },
  },
  ae: {
    starter: {
      price: convertCurrency(BASE_PRICES.starter, 'AED').toString(),
      currency: 'درهم',
      agents: '1',
    },
    pro: {
      price: convertCurrency(BASE_PRICES.pro, 'AED').toString(),
      currency: 'درهم',
      agents: '3',
    },
    agency: {
      price: convertCurrency(BASE_PRICES.agency, 'AED').toString(),
      currency: 'درهم',
      agents: 'مخصص',
    },
  },
  kw: {
    starter: {
      price: convertCurrency(BASE_PRICES.starter, 'KWD').toString(),
      currency: 'دينار',
      agents: '1',
    },
    pro: {
      price: convertCurrency(BASE_PRICES.pro, 'KWD').toString(),
      currency: 'دينار',
      agents: '3',
    },
    agency: {
      price: convertCurrency(BASE_PRICES.agency, 'KWD').toString(),
      currency: 'دينار',
      agents: 'مخصص',
    },
  },
};

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const [country, setCountry] = useState('sa');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    setMounted(true);

    // Detect country from URL path
    const path = window.location.pathname;
    if (path.includes('/eg')) setCountry('eg');
    else if (path.includes('/ae')) setCountry('ae');
    else if (path.includes('/kw')) setCountry('kw');
    else setCountry('sa');
  }, []);

  if (!mounted) return null;

  const pricing = plans[country];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden border-b border-gray-200 dark:border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent"></div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-bold mb-6">
                أسعار واضحة وشفافة
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                اختر الباقة المناسبة لعملك
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                جميع الباقات تشمل تجربة مجانية لمدة 7 أيام - لا حاجة لبطاقة
                ائتمانية
              </p>

              {/* Country Selector */}
              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <button
                  onClick={() => setCountry('sa')}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${
                    country === 'sa'
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  🇸🇦 السعودية
                </button>
                <button
                  onClick={() => setCountry('eg')}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${
                    country === 'eg'
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  🇪🇬 مصر
                </button>
                <button
                  onClick={() => setCountry('ae')}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${
                    country === 'ae'
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  🇦🇪 الإمارات
                </button>
                <button
                  onClick={() => setCountry('kw')}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${
                    country === 'kw'
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                  }`}
                >
                  🇰🇼 الكويت
                </button>
              </div>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-4 p-2 bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full font-bold transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  سنوي
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    وفر 20%
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-cosmic-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
                    <Zap size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      الباقة الأساسية
                    </h3>
                    <p className="text-sm text-gray-500">للمشاريع الصغيرة</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      {billingCycle === 'yearly'
                        ? Math.round(
                            pricing.starter.price.replace(',', '') * 0.8
                          )
                        : pricing.starter.price}
                    </span>
                    <span className="text-gray-500">{pricing.currency}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {billingCycle === 'yearly' ? 'يدفع سنوياً' : 'شهرياً'}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> 500 محادثة
                    شهرياً
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> 1 قاعدة معرفة
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> موظف خدمة عملاء
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
                    <X size={18} /> تكامل واتساب
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> دعم فني
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
                    <X size={18} /> تقارير متقدمة
                  </li>
                  <li className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
                    <X size={18} /> أولوية الرد
                  </li>
                </ul>

                <Link href="/register">
                  <Button
                    variant="secondary"
                    className="w-full h-12 rounded-xl font-bold"
                  >
                    ابدأ التجربة المجانية
                  </Button>
                </Link>
              </motion.div>

              {/* Pro Plan (Popular) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-b from-brand-500 to-brand-600 rounded-3xl p-1 relative transform scale-105 shadow-2xl"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-cosmic-900 px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-sm">
                    <Sparkles size={16} /> الأكثر شعبية
                  </div>
                </div>

                <div className="bg-white dark:bg-cosmic-900 rounded-[1.4rem] p-8 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
                      <Rocket size={24} className="text-brand-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                        الباقة الاحترافية
                      </h3>
                      <p className="text-sm text-gray-500">للأعمال المتنامية</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-bold text-gray-900 dark:text-white">
                        {billingCycle === 'yearly'
                          ? Math.round(pricing.pro.price.replace(',', '') * 0.8)
                          : pricing.pro.price}
                      </span>
                      <span className="text-gray-500">{pricing.currency}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {billingCycle === 'yearly' ? 'يدفع سنوياً' : 'شهرياً'}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      1,500 محادثة شهرياً
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      2 قاعدة معرفة
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      1 موظف خدمة عملاء
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      تكامل متعدد القنوات (محدود)
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      تقارير وتحليلات متقدمة
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      دعم فني ذو أولوية
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      أولوية الرد
                    </li>
                    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                          strokeWidth={3}
                        />
                      </div>
                      تدريب مجاني
                    </li>
                  </ul>

                  <Link href="/register">
                    <Button className="w-full h-12 rounded-xl font-bold shadow-lg">
                      ابدأ التجربة المجانية
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Agency Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-cosmic-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Crown size={24} className="text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      المتاجر والشركات
                    </h3>
                    <p className="text-sm text-gray-500">للشركات المتنامية</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      {billingCycle === 'yearly'
                        ? Math.round(
                            pricing.agency.price.replace(',', '') * 0.8
                          )
                        : pricing.agency.price}
                    </span>
                    <span className="text-gray-500">{pricing.currency}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {billingCycle === 'yearly' ? 'يدفع سنوياً' : 'شهرياً'}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> 6,000 محادثة
                    شهرياً
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> قاعدة معرفية
                    غير محدودة
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> 5 موظفي خدمة
                    عملاء
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> تكامل متعدد
                    القنوات
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> عملاء متعددين
                    (White label)
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> API مخصصة
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> مدير حساب
                    مخصص
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> دعم 24/7
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> أولوية الرد
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={18} className="text-green-500" /> تدريب مجاني
                  </li>
                </ul>

                <Link href="/register">
                  <Button
                    variant="secondary"
                    className="w-full h-12 rounded-xl font-bold"
                  >
                    ابدأ التجربة المجانية
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-20 px-6 bg-white dark:bg-cosmic-900 border-y border-gray-200 dark:border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
              مقارنة شاملة بين الباقات
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-right py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                      الميزة
                    </th>
                    <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-bold">
                      أساسية
                    </th>
                    <th className="text-center py-4 px-6 text-brand-600 dark:text-brand-400 font-bold">
                      احترافية
                    </th>
                    <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-bold">
                      وكالات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: 'عدد المحادثات',
                      starter: '500',
                      pro: '1,500',
                      agency: '6,000',
                    },
                    {
                      feature: 'قاعدة المعرفة',
                      starter: '1',
                      pro: '2',
                      agency: 'غير محدود',
                    },
                    {
                      feature: 'موظفي خدمة عملاء',
                      starter: 'لا',
                      pro: '1',
                      agency: '5',
                    },
                    {
                      feature: 'تكامل واتساب',
                      starter: false,
                      pro: true,
                      agency: true,
                    },
                    {
                      feature: 'تكامل تيليجرام',
                      starter: false,
                      pro: true,
                      agency: true,
                    },
                    {
                      feature: 'تقارير متقدمة',
                      starter: false,
                      pro: true,
                      agency: true,
                    },
                    {
                      feature: 'API مخصصة',
                      starter: false,
                      pro: false,
                      agency: true,
                    },
                    {
                      feature: 'White Label',
                      starter: false,
                      pro: false,
                      agency: true,
                    },
                    {
                      feature: 'مدير حساب',
                      starter: false,
                      pro: false,
                      agency: true,
                    },
                    {
                      feature: 'دعم فني',
                      starter: 'Email',
                      pro: 'أولوية',
                      agency: '24/7',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="py-4 px-6 text-gray-900 dark:text-white font-medium">
                        {row.feature}
                      </td>
                      <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check
                              size={20}
                              className="text-green-500 inline"
                            />
                          ) : (
                            <X size={20} className="text-gray-400 inline" />
                          )
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="text-center py-4 px-6 text-gray-900 dark:text-white font-medium">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check
                              size={20}
                              className="text-green-500 inline"
                            />
                          ) : (
                            <X size={20} className="text-gray-400 inline" />
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="text-center py-4 px-6 text-gray-600 dark:text-gray-400">
                        {typeof row.agency === 'boolean' ? (
                          row.agency ? (
                            <Check
                              size={20}
                              className="text-green-500 inline"
                            />
                          ) : (
                            <X size={20} className="text-gray-400 inline" />
                          )
                        ) : (
                          row.agency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Agency Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-brand-500/10 to-purple-500/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-cosmic-900 rounded-3xl p-12 border-2 border-brand-500 shadow-2xl"
            >
              <div className="text-6xl mb-6">🏢</div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                هل لديك احتياجات خاصة أو تبحث عن حلول مؤسسية؟
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                نقدم حلول مخصصة للمؤسسات الكبرى مع باقات خاصة وأسعار تنافسية.
                احصل على White Label، API مخصص، ومدير حساب متخصص.
              </p>
              <div className="flex justify-center">
                <Link href="/contact">
                  <Button className="h-14 px-10 text-lg rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg">
                    تواصل معنا للحصول على عرض خاص
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
              الأسئلة الشائعة
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'هل يمكنني تغيير الباقة لاحقاً؟',
                  a: 'بالتأكيد! يمكنك الترقية أو الرجوع لباقة أقل في أي وقت. سيتم احتساب الفرق في الفواتير القادمة.',
                },
                {
                  q: 'ماذا يحدث بعد انتهاء التجربة المجانية؟',
                  a: 'بعد 7 أيام، سيتم تحويلك تلقائياً للباقة المختارة. يمكنك الإلغاء في أي وقت قبل انتهاء التجربة.',
                },
                {
                  q: 'هل تدعمون جميع اللهجات العربية؟',
                  a: 'نعم! فهملي يدعم اللهجات السعودية، المصرية، الإماراتية، الكويتية والعديد من اللهجات الأخرى.',
                },
                {
                  q: 'هل يمكن تخصيص البوت حسب احتياجاتي؟',
                  a: 'نعم، جميع الباقات تتيح تخصيص البوت. الباقة الاحترافية والوكالات توفر خيارات تخصيص متقدمة.',
                },
                {
                  q: 'كيف يتم احتساب المحادثات؟',
                  a: 'كل تفاعل منفصل مع عميل يحتسب كمحادثة واحدة، بغض النظر عن عدد الرسائل المتبادلة.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-cosmic-900 rounded-2xl p-6 border border-gray-200 dark:border-white/10"
                >
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {item.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 bg-gradient-to-b from-brand-500 to-brand-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              جاهز لتحويل تجربة عملائك؟
            </h2>
            <p className="text-xl mb-10 opacity-90">
              ابدأ اليوم واحصل على 7 أيام مجانية - بدون أي التزامات
            </p>
            <Link href="/register">
              <Button className="h-16 px-12 text-xl rounded-full bg-white text-brand-600 hover:bg-gray-100 shadow-2xl font-bold">
                ابدأ التجربة المجانية الآن
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
