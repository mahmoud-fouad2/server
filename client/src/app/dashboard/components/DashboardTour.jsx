'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Dashboard Onboarding Tour (Custom Implementation for React 19)
 * Guides new users through key features
 */

const TOUR_STEPS = [
  {
    target: '#dashboard-overview',
    title: 'مرحباً بك في فهملي! 👋',
    content: 'دعنا نأخذك في جولة سريعة للتعرف على لوحة التحكم وكيفية الاستفادة القصوى من المساعد الذكي.',
    position: 'center'
  },
  {
    target: '[data-tour="stats-overview"]',
    title: 'نظرة عامة 📊',
    content: 'هنا تجد ملخص إحصائياتك: عدد المحادثات، معدل الرضا، وأداء البوت في الوقت الفعلي.',
    position: 'bottom'
  },
  {
    target: '[data-tour="sidebar-conversations"]',
    title: 'المحادثات 💬',
    content: 'تابع جميع محادثات العملاء مع البوت، وتدخل في أي وقت للرد بنفسك.',
    position: 'right'
  },
  {
    target: '[data-tour="sidebar-knowledge"]',
    title: 'قاعدة المعرفة 📚',
    content: 'هنا العقل المدبر! أضف ملفات PDF، نصوص، أو روابط لتدريب البوت على معلومات عملك.',
    position: 'right'
  },
  {
    target: '[data-tour="sidebar-widget"]',
    title: 'تخصيص الويدجت 🎨',
    content: 'تحكم في شكل وألوان نافذة الدردشة لتناسب هوية علامتك التجارية.',
    position: 'right'
  },
  {
    target: '[data-tour="sidebar-settings"]',
    title: 'الإعدادات ⚙️',
    content: 'أدر اشتراكك، فريق العمل، وربط القنوات المختلفة (واتساب، تيليجرام، وغيرها).',
    position: 'right'
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: 'الوضع الليلي 🌙',
    content: 'يمكنك التبديل بين الوضع الليلي والنهاري من هنا لراحة عينيك.',
    position: 'top'
  },
  {
    target: 'body',
    title: 'أنت جاهز للانطلاق! 🚀',
    content: 'ابدأ الآن في تحسين خدمة عملائك. يمكنك دائماً إعادة هذه الجولة من زر المساعدة.',
    position: 'center'
  },
];

export function useDashboardTour() {
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(
    typeof window !== 'undefined' && localStorage.getItem('dashboardTourCompleted') === 'true'
  );

  useEffect(() => {
    if (!tourCompleted) {
      // Delay starting the tour slightly so the page UI stabilizes
      const t = setTimeout(() => setRunTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [tourCompleted]);

  const startTour = () => setRunTour(true);
  const stopTour = () => setRunTour(false);
  const resetTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboardTourCompleted');
    }
    setTourCompleted(false);
    setRunTour(true);
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardTourCompleted', 'true');
    }
    setTourCompleted(true);
    setRunTour(false);
  };

  return { runTour, tourCompleted, startTour, stopTour, resetTour, handleComplete };
}

export default function DashboardTour({ run, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (run) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [run]);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (step.target === 'body' || step.target === '#dashboard-overview') {
      setTargetRect(null); // Center modal
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Skip step if target not found — advance safely without referencing external handler
      setCurrentStep(prev => (prev < TOUR_STEPS.length - 1 ? prev + 1 : prev));
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem('dashboardTourCompleted', 'true');
    if (onComplete) onComplete(true);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isCenter = !targetRect;

  // Calculate tooltip position
  let tooltipStyle = {};
  if (targetRect) {
    const gap = 15;
    if (step.position === 'right') {
      tooltipStyle = {
        top: targetRect.top + (targetRect.height / 2) - 100,
        left: targetRect.right + gap,
      };
    } else if (step.position === 'bottom') {
      tooltipStyle = {
        top: targetRect.bottom + gap,
        left: targetRect.left + (targetRect.width / 2) - 150,
      };
    } else if (step.position === 'top') {
      tooltipStyle = {
        bottom: window.innerHeight - targetRect.top + gap,
        left: targetRect.left + (targetRect.width / 2) - 150,
      };
    }
    
    // Ensure tooltip stays within viewport
    // (Simplified logic for this demo)
    // Clamp tooltip position to viewport bounds so the next button is reachable
    const tooltipWidth = 350;
    const tooltipHeight = 220; // approximate
    // calculate raw values
    let rawLeft = tooltipStyle.left ?? (window.innerWidth - tooltipWidth) / 2;
    let rawTop = tooltipStyle.top ?? (window.innerHeight - tooltipHeight) / 2;

    // clamp
    const minMargin = 8;
    const maxLeft = Math.max(minMargin, window.innerWidth - tooltipWidth - minMargin);
    const maxTop = Math.max(minMargin, window.innerHeight - tooltipHeight - minMargin);

    tooltipStyle.left = Math.min(Math.max(rawLeft, minMargin), maxLeft);
    tooltipStyle.top = Math.min(Math.max(rawTop, minMargin), maxTop);
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop with hole effect (simulated with 4 divs or just dark overlay for now) */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity duration-300" />

      {/* Highlight Target */}
      {targetRect && (
        <div 
          className="absolute border-2 border-brand-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out pointer-events-none"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
        />
      )}

      {/* Tooltip Card */}
      <div 
        className={`absolute pointer-events-auto transition-all duration-300 ease-out ${isCenter ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={!isCenter ? tooltipStyle : {}}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={currentStep}
          className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-[350px] border border-gray-200 dark:border-gray-700 relative"
        >
          <button 
            onClick={handleFinish}
            className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>

          <div className="mb-4">
            <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-full">
              خطوة {currentStep + 1} من {TOUR_STEPS.length}
            </span>
          </div>

          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
            {step.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  السابق
                </button>
              )}
            </div>
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'إنهاء الجولة' : 'التالي'}
              {currentStep < TOUR_STEPS.length - 1 && <ChevronLeft size={16} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

