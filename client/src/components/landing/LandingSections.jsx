'use client';

import React, { useState, useEffect } from 'react';
import useTheme from '@/lib/theme';
import { chatApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from '../ui/Components';
import {
  Bot,
  X,
  Moon,
  Sun,
  ShoppingBag,
  Stethoscope,
  Utensils,
  MessageCircle,
  Send,
  Check,
  Globe,
  Smile,
  User,
  Brain,
  ArrowRight,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  Rocket,
  Shield,
  Code,
  Users,
  Clock,
  Lock,
  CheckCircle,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { convertCurrency } from '@/constants';

// Helper: compute discounted offer price for countries
const computeOfferText = (country) => {
  const baseSar = 199;
  if (country === 'sa') return `${baseSar} ريال فقط`;
  const map = { eg: { code: 'EGP', label: 'جنيه' }, ae: { code: 'AED', label: 'درهم' }, kw: { code: 'KWD', label: 'دينار' } };
  const entry = map[country] || { code: 'SAR', label: 'ريال' };
  const price = convertCurrency(baseSar, entry.code);
  const discounted = Math.round(price * 0.5); // 50% discount
  return `${discounted} ${entry.label} فقط`;
};
import {
  TRANSLATIONS,
  SEO_DATA,
  REGIONAL_CONTENT,
  COMPARISON_DATA,
} from '../../constants';
import { DemoChatWindow } from '../DemoChatWindow';
import DemoChat from '../DemoChat';
import FaheemAnimatedLogo from '../FaheemAnimatedLogo';
import SalesBot from '../SalesBot';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../layout/Footer';
import LoadingScreen from '../LoadingScreen';
import { useRouter } from 'next/navigation';

// Hero Section Component
const HeroSection = ({ regionContent, t, activeCountry, isDark }) => (
  <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto text-center z-10 relative">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-white border-gray-200 shadow-sm'} border text-brand-600 dark:text-brand-400 text-sm font-bold mb-8 hover:scale-105 transition-transform cursor-default`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
        </span>
        {t.heroTag}
      </div>

      <h1 className={`text-5xl lg:text-7xl font-bold tracking-tight leading-[1.2] mb-8 bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-b from-white via-gray-100 to-gray-400' : 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600'}`}>
        {regionContent.heroTitle}
      </h1>

      <p className={`text-lg lg:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-12 leading-relaxed`}>
        {regionContent.heroSubtitle}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
        <Link href="/register" className="w-full sm:w-auto">
          <Button className={`w-full sm:w-auto h-16 px-10 text-xl rounded-2xl ${isDark ? 'bg-brand-600 hover:bg-brand-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'} border-0 shadow-2xl shadow-brand-500/30 font-bold transition-all hover:scale-110 hover:shadow-brand-500/50 relative overflow-hidden group`}>
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t.startTrial}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Button>
        </Link>
        <Link href="/solutions" className="w-full sm:w-auto">
          <button className={`w-full sm:w-auto h-16 px-10 text-lg rounded-2xl border-2 ${isDark ? 'border-white/20 hover:bg-white/10 text-white bg-white/5 backdrop-blur-sm' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'} transition-all font-bold flex items-center justify-center gap-3 shadow-lg hover:scale-105 hover:shadow-xl`}>
            <ArrowRight className="w-5 h-5" />
            استكشف الحلول
          </button>
        </Link>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <Globe size={16} className="text-brand-500" />
          {activeCountry === 'eg' ? 'يدعم اللهجة المصرية 🇪🇬' : 'يدعم اللهجة السعودية 🇸🇦'}
        </span>
        <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
          <Check size={16} className="text-green-500" strokeWidth={3} />
          <span className="text-green-700 dark:text-green-400 font-bold">تجربة مجانية 7 أيام</span>
        </span>
        <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <Shield size={16} className="text-blue-500" />
          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>بدون بطاقة ائتمانية</span>
        </span>
      </div>

      <div className="mt-20 relative z-10">
        <div className="absolute inset-0 bg-brand-500/20 blur-[100px] -z-10 rounded-full"></div>
        <DemoChat />
      </div>
    </div>
  </section>
);

// Industry Modal Component
const IndustryModal = ({ selectedIndustry, setSelectedIndustry, isDark, t }) => (
  <AnimatePresence>
    {selectedIndustry && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={() => setSelectedIndustry(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-cosmic-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-gray-200 dark:border-white/10"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedIndustry(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors z-10 backdrop-blur-sm"
          >
            <X size={20} />
          </button>

          <div className="relative h-56 sm:h-72">
            <Image
              src={selectedIndustry.image}
              alt={selectedIndustry.title}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-cosmic-900' : 'from-white'} to-transparent`}></div>
            <div className={`absolute bottom-6 right-6 w-16 h-16 rounded-2xl bg-${selectedIndustry.color}-500 text-white flex items-center justify-center shadow-lg shadow-${selectedIndustry.color}-500/30`}>
              {selectedIndustry.icon}
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedIndustry.modalTitle || selectedIndustry.title}
            </h3>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
              {selectedIndustry.modalDesc || selectedIndustry.desc}
            </p>

            <div className="flex gap-4">
              <Link href="/register" className="flex-1">
                <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-500/20 rounded-xl">
                  {t.startFreeTrial}
                </Button>
              </Link>
              <button
                onClick={() => setSelectedIndustry(null)}
                className="px-8 py-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-colors text-gray-700 dark:text-gray-300"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Coverage Section Component
const CoverageSection = ({ t, isDark }) => (
  <section className={`py-24 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-brand-900/20' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-500 to-blue-500 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500 to-pink-500 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-3xl"></div>
    </div>

    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold mb-8 ${isDark ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-300 border-2 border-green-500/30 shadow-lg shadow-green-500/20' : 'bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border-2 border-green-300 shadow-xl'}`}>
          <Globe size={20} />
          {t.coverageTag}
        </span>
        <h2 className={`text-5xl lg:text-7xl font-black mb-8 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
          {t.coverageTitle}
        </h2>
        <p className={`text-2xl lg:text-3xl max-w-4xl mx-auto leading-relaxed font-bold ${isDark ? 'text-gray-300' : 'text-[#334155]'}`}>
          {t.coverageDesc}
        </p>
      </motion.div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 md:gap-6 mt-16">
        {[
          { flag: 'SA', name: 'السعودية', code: 'SA' },
          { flag: 'EG', name: 'مصر', code: 'EG' },
          { flag: 'AE', name: 'الإمارات', code: 'AE' },
          { flag: 'KW', name: 'الكويت', code: 'KW' },
          { flag: 'QA', name: 'قطر', code: 'QA' },
          { flag: 'BH', name: 'البحرين', code: 'BH' },
          { flag: 'JO', name: 'الأردن', code: 'JO' },
          { flag: 'LB', name: 'لبنان', code: 'LB' },
          { flag: 'MA', name: 'المغرب', code: 'MA' },
        ].map((country, index) => (
          <motion.div
            key={country.code}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`group relative p-6 rounded-2xl text-center transition-all duration-300 hover:scale-110 ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl'}`}
          >
            <div className="text-5xl mb-3 transform group-hover:scale-125 transition-transform duration-300">
              <span className={`inline-block rounded-lg overflow-hidden shadow-lg fi fi-${country.code.toLowerCase()}`} style={{ fontSize: '48px', lineHeight: '48px', width: '48px', height: '48px', backgroundSize: 'cover' }}></span>
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
              {country.name}
            </p>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {country.code}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// Industry Solutions Component
const IndustrySolutions = ({ t, isDark }) => (
  <section className={`py-16 relative ${isDark ? 'bg-cosmic-950' : 'bg-gray-50'}`}>
    {isDark && <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>}
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDark ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
          {t.solutionsTag}
        </span>
        <h2 className={`text-3xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t.indTitle}
        </h2>
        <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.solutionsSubtitle}
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/solutions">
            <Button className="rounded-full px-10 py-4 text-lg shadow-lg font-bold hover:shadow-xl transition-all">
              عرض جميع الحلول
              <ArrowRight size={20} className="mr-2" />
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[
          {
            icon: <Utensils size={36} />,
            title: t.indRestTitle,
            desc: t.indRestDesc,
            modalTitle: t.indRestModalTitle,
            modalDesc: t.indRestModalDesc,
            color: 'orange',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
            link: '/solutions/restaurant',
          },
          {
            icon: <Stethoscope size={36} />,
            title: t.indClinicTitle,
            desc: t.indClinicDesc,
            modalTitle: t.indClinicModalTitle,
            modalDesc: t.indClinicModalDesc,
            color: 'blue',
            image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
            link: '/solutions/clinic',
          },
          {
            icon: <ShoppingBag size={36} />,
            title: t.indRetailTitle,
            desc: t.indRetailDesc,
            modalTitle: t.indRetailModalTitle,
            modalDesc: t.indRetailModalDesc,
            color: 'purple',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
            link: '/solutions/retail',
          },
          {
            icon: <Code size={36} />,
            title: t.indCorpTitle,
            desc: t.indCorpDesc,
            modalTitle: t.indCorpModalTitle,
            modalDesc: t.indCorpModalDesc,
            color: 'green',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
            link: '/solutions/business',
          },
          {
            icon: <Brain size={36} />,
            title: t.indEduTitle,
            desc: t.indEduDesc,
            modalTitle: t.indEduModalTitle,
            modalDesc: t.indEduModalDesc,
            color: 'indigo',
            image: '/assets/images/education.jpg',
            link: '/solutions/education',
          },
          {
            icon: <Shield size={36} />,
            title: t.indFinTitle,
            desc: t.indFinDesc,
            modalTitle: t.indFinModalTitle,
            modalDesc: t.indFinModalDesc,
            color: 'red',
            image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=600',
            link: '/solutions/realestate',
          },
        ].map((item, idx) => (
          <Link key={idx} href={item.link || '/solutions'}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 h-full ${isDark ? 'border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-brand-500/30 hover:shadow-xl' : 'border-gray-200 bg-white hover:border-brand-400 hover:shadow-xl'} hover:-translate-y-2`}>
                <div className="relative p-6">
                  <div className={`inline-flex w-14 h-14 rounded-xl items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 ${isDark ? `bg-${item.color}-500/10 text-${item.color}-400` : `bg-${item.color}-50 text-${item.color}-600`}`}>
                    {item.icon}
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm leading-relaxed min-h-[100px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.desc}
                  </p>
                </div>
                <div className={`px-6 pb-6 pt-2`}>
                  <div className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 group-hover:gap-3 ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                    اكتشف المزيد
                    <ArrowRight size={16} className="transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// Comparison Section Component
const ComparisonSection = ({ t, isDark }) => (
  <section className={`py-16 border-t ${isDark ? 'border-white/5 bg-cosmic-900/50' : 'bg-white border-gray-200'}`}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t.whyFahimo}
        </h2>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.compSub}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-center">
        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} opacity-75 hover:opacity-100 transition-all hover:-translate-y-1`}>
          <div className="flex flex-col items-center text-center mb-6 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Bot size={32} className="opacity-50" />
            </div>
            <h3 className="text-xl font-bold">{COMPARISON_DATA.old.title}</h3>
          </div>
          <ul className="space-y-4">
            {COMPARISON_DATA.old.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                <X size={16} className="mt-1 text-red-500 flex-shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-1 rounded-[2rem] bg-gradient-to-b from-brand-500 to-purple-600 relative transform scale-105 z-10 shadow-2xl shadow-brand-500/20`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
            <Sparkles size={14} /> الخيار الأذكى
          </div>
          <div className={`h-full p-8 rounded-[1.8rem] ${isDark ? 'bg-cosmic-900' : 'bg-white'}`}>
            <div className="flex flex-col items-center text-center mb-8 text-brand-500">
              <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping opacity-20"></div>
                <Brain size={40} className="text-brand-500" />
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-purple-600">
                {COMPARISON_DATA.fahimo.title}
              </h3>
            </div>
            <ul className="space-y-5">
              {COMPARISON_DATA.fahimo.points.map((p, i) => (
                <li key={i} className={`flex items-start gap-3 text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div className="mt-1 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] shadow-lg shadow-brand-500/30">
                    <Check size={12} strokeWidth={4} />
                  </div> {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <Link href="/register">
                <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-500/20 rounded-xl">
                  ابدأ الآن مجاناً
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} opacity-75 hover:opacity-100 transition-all hover:-translate-y-1`}>
          <div className="flex flex-col items-center text-center mb-6 text-blue-500">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <User size={32} className="opacity-50" />
            </div>
            <h3 className="text-xl font-bold">{COMPARISON_DATA.human.title}</h3>
          </div>
          <ul className="space-y-4">
            {COMPARISON_DATA.human.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="mt-1 text-blue-500 flex-shrink-0">•</div> {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

// Testimonials Component
const TestimonialsSection = ({ t, isDark }) => (
  <section className={`py-16 ${isDark ? 'bg-cosmic-900/50' : 'bg-gray-50'}`}>
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDark ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
          {t.testimonialsTag}
        </span>
        <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t.testimonialsTitle}
        </h2>
        <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.testimonialsDesc}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            name: 'أحمد السالم',
            role: 'مدير مطعم الذواقة',
            text: 'زادت طلباتنا 45% بعد استخدام فهملي. العملاء يحبون سرعة الرد والدقة في فهم طلباتهم!',
            rating: 5,
            avatar: '👨‍💼',
          },
          {
            name: 'فاطمة محمد',
            role: 'مديرة عيادة النور',
            text: 'تقليل 60% من المكالمات الهاتفية. الآن المرضى يحجزون مواعيدهم بسهولة عبر واتساب.',
            rating: 5,
            avatar: '👩‍⚕️',
          },
          {
            name: 'خالد العتيبي',
            role: 'صاحب متجر إلكتروني',
            text: 'فهملي غيّر شكل خدمة العملاء عندنا. الردود السريعة زادت رضا العملاء بشكل كبير.',
            rating: 5,
            avatar: '👨‍💻',
          },
        ].map((testimonial, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-lg'} hover:shadow-2xl transition-all hover:-translate-y-2`}
          >
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">⭐</span>
              ))}
            </div>
            <p className={`text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              &quot;{testimonial.text}&quot;
            </p>
            <div className="flex items-center gap-4 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-2xl">
                {testimonial.avatar}
              </div>
              <div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {testimonial.name}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {testimonial.role}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// Why Choose Section Component
const WhyChooseSection = ({ t }) => (
  <section className="py-20 px-6 bg-gradient-to-b from-brand-500 to-brand-600 text-white">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">{t.whyTag}</h2>
          <p className="text-xl opacity-90">{t.whyDesc}</p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <Zap size={32} />,
            title: t.whyFast,
            desc: t.whyFastDesc,
          },
          {
            icon: <Shield size={32} />,
            title: t.whySecure,
            desc: t.whySecureDesc,
          },
          {
            icon: <Clock size={32} />,
            title: t.whySupport,
            desc: t.whySupportDesc,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="opacity-90">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// CTA Section Component
const CTASection = ({ t, isDark }) => (
  <section className={`py-16 relative overflow-hidden ${isDark ? 'bg-cosmic-950' : 'bg-white'}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-transparent"></div>
    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="inline-block p-4 rounded-full bg-brand-500/10 mb-8">
          <Sparkles size={40} className="text-brand-500" />
        </div>
        <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t.ctaTitle}
        </h2>
        <p className={`text-xl mb-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t.ctaDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button className="h-16 px-10 text-xl rounded-2xl shadow-2xl shadow-brand-500/30 hover:scale-110 transition-all">
              <Rocket size={20} className="ml-2" />
              {t.ctaButton}
            </Button>
          </Link>
          <Link href="/contact">
            <button className={`h-16 px-10 text-xl rounded-2xl border-2 font-bold transition-all hover:scale-105 ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
              <Mail size={20} className="inline ml-2" />
              {t.ctaContact}
            </button>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 mt-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
            <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
            <span className="text-xs font-medium">4.9/5 تقييم</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
            <Shield size={16} className="text-green-500" />
            <span className="text-xs font-medium">مدفوعات آمنة</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
            <Lock size={16} className="text-blue-500" />
            <span className="text-xs font-medium">بيانات محمية SSL</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs font-medium">ضمان استرداد 30 يوم</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

// Limited Time Offer Component
const LimitedTimeOffer = ({ t, activeCountry, isDark }) => (
  <section className={`py-12 ${isDark ? 'bg-cosmic-900/50' : 'bg-gray-50'}`}>
    <div className="max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-3xl shadow-2xl ${isDark ? 'bg-gradient-to-r from-brand-900 to-cosmic-900 border border-brand-500/30' : 'bg-white border border-gray-100'}`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-10 gap-8">
          <div className="flex-1 text-center md:text-right space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-sm font-bold animate-pulse">
              <Sparkles size={14} />
              {t.offerTag}
            </div>

            <h3 className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {`${t.offerTitle} ${computeOfferText(activeCountry)}`}
            </h3>

            <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t.offerDesc}
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link href="/register">
              <Button className="h-14 px-8 text-lg rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all font-bold flex items-center gap-2">
                {t.offerButton}
                <ArrowRight size={20} />
              </Button>
            </Link>
            <p className="text-center mt-3 text-xs opacity-60">
              {t.offerGuarantee}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export {
  HeroSection,
  IndustryModal,
  CoverageSection,
  IndustrySolutions,
  ComparisonSection,
  TestimonialsSection,
  WhyChooseSection,
  CTASection,
  LimitedTimeOffer,
};