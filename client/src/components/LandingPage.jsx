'use client';

import React, { useState, useEffect, useRef } from 'react';
import useTheme from '@/lib/theme';
import { chatApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from './ui/Components';
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
} from 'lucide-react';
import Image from 'next/image';
import {
  TRANSLATIONS,
  SEO_DATA,
  REGIONAL_CONTENT,
  COMPARISON_DATA,
} from '../constants';
import { DemoChatWindow } from './DemoChatWindow';
import DemoChat from './DemoChat';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './LoadingScreen';
import { useRouter } from 'next/navigation';

// Import the section components
import {
  HeroSection,
  IndustryModal,
  CoverageSection,
  IndustrySolutions,
  ComparisonSection,
  TestimonialsSection,
  WhyChooseSection,
  CTASection,
  LimitedTimeOffer,
} from './landing/LandingSections';

import Navigation from './landing/Navigation';

export const LandingPage = ({
  lang: initialLang = 'ar',
  setLang: externalSetLang,
  country = 'sa',
}) => {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);

  const setLang = newLang => {
    setLangState(newLang);
    if (externalSetLang) externalSetLang(newLang);
  };

  const t = TRANSLATIONS[lang];
  const activeCountry = country;

  const changeCountry = code => {
    if (code === 'sa') router.push('/');
    else router.push(`/${code}`);
  };

  const regionContent =
    lang === 'en'
      ? {
          heroTitle: 'The Smart Employee That Never Sleeps',
          heroSubtitle:
            'Faheemly is the #1 Arabic AI Chatbot. It manages your orders, books appointments, and replies to your customers on WhatsApp and your website.',
        }
      : REGIONAL_CONTENT[activeCountry] || REGIONAL_CONTENT['sa'];

  const [isDark, setIsDark] = useTheme(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Set page title based on country
    const seoData = SEO_DATA[activeCountry] || SEO_DATA['sa'];
    document.title = seoData.home.title;

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeCountry]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const FlagIcon = ({ code }) => {
    if (code === 'sa')
      return (
        <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">
          🇸🇦
        </span>
      );
    if (code === 'eg')
      return (
        <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">
          🇪🇬
        </span>
      );
    return null;
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div
      className={`min-h-screen font-sans overflow-x-hidden relative selection:bg-brand-500/30 transition-colors duration-500 bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-white`}
    >
      {/* SalesBot is loaded globally in ClientLayout */}

      {/* Dynamic Background */}
      {mounted && isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px] animate-float"></div>
          <div
            className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>
      )}

      <Navigation
        lang={lang}
        setLang={setLang}
        activeCountry={activeCountry}
        changeCountry={changeCountry}
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        t={t}
      />

      {/* Hero Section */}
      <HeroSection
        regionContent={regionContent}
        t={t}
        activeCountry={activeCountry}
        isDark={isDark}
      />

      {/* Industry Modal */}
      <IndustryModal
        selectedIndustry={selectedIndustry}
        setSelectedIndustry={setSelectedIndustry}
        isDark={isDark}
        t={t}
      />

      {/* Coverage Section */}
      <CoverageSection t={t} isDark={isDark} />

      {/* Industry Solutions */}
      <IndustrySolutions t={t} isDark={isDark} />

      {/* Comparison Section */}
      <ComparisonSection t={t} isDark={isDark} />

      {/* Testimonials Section */}
      <TestimonialsSection t={t} isDark={isDark} />

      {/* Why Choose Faheemly */}
      <WhyChooseSection t={t} />

      {/* CTA Section */}
      <CTASection t={t} isDark={isDark} />

      {/* Limited Time Offer */}
      <LimitedTimeOffer t={t} activeCountry={activeCountry} isDark={isDark} />

      {/* Footer is loaded globally in ClientLayout */}
    </div>
  );
};
