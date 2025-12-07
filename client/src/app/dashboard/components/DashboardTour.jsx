'use client';

import { useState, useEffect } from 'react';
// import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'; // Temporarily disabled due to React 19 incompatibility

/**
 * Dashboard Onboarding Tour
 * Guides new users through key features
 */

const TOUR_STEPS = [
  {
    target: '#dashboard-overview',
    content:
      '👋 مرحباً بك في لوحة التحكم! دعنا نأخذك في جولة سريعة للتعرف على المميزات الأساسية.',
    placement: 'center',
    disableBeacon: true,
    locale: { skip: 'تخطي', next: 'التالي', back: 'السابق', last: 'إنهاء' },
  },
  {
    target: '[data-tour="stats-overview"]',
    content:
      '📊 هنا تجد ملخص إحصائياتك: عدد المحادثات، معدل الرضا، وأداء البوت.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sidebar-conversations"]',
    content: '💬 قسم المحادثات: اطلع على جميع محادثات العملاء مع البوت.',
    placement: 'left',
  },
  {
    target: '[data-tour="sidebar-knowledge"]',
    content: '📚 قاعدة المعرفة: أضف ملفات، نصوص، أو روابط لتدريب البوت.',
    placement: 'left',
  },
  {
    target: '[data-tour="sidebar-widget"]',
    content: '🎨 إعدادات الويدجت: خصص الألوان، الرسائل، وشكل البوت.',
    placement: 'left',
  },
  {
    target: '[data-tour="sidebar-settings"]',
    content: '⚙️ الإعدادات: أدر اشتراكك، الفريق، والتكاملات.',
    placement: 'left',
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: '🌙 يمكنك التبديل بين الوضع الليلي والنهاري من هنا.',
    placement: 'bottom',
  },
  {
    target: 'body',
    content:
      '🎉 رائع! أنت الآن جاهز للبدء. يمكنك دائماً إعادة الجولة من قائمة المساعدة.',
    placement: 'center',
  },
];

export default function DashboardTour({ run, onComplete }) {
  // Temporarily disabled due to React 19 incompatibility
  useEffect(() => {
    if (run && onComplete) {
      console.log('Dashboard tour disabled for React 19 compatibility');
      onComplete(true);
    }
  }, [run, onComplete]);

  return null;
  
  /* React 18 version - will be restored when react-joyride supports React 19
  const [stepIndex, setStepIndex] = useState(0);

  const handleJoyrideCallback = data => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setStepIndex(0);

      if (status === STATUS.FINISHED) {
        localStorage.setItem('dashboardTourCompleted', 'true');
        localStorage.setItem(
          'dashboardTourCompletedAt',
          new Date().toISOString()
        );
      }

      if (onComplete) onComplete(status === STATUS.FINISHED);
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          primaryColor: '#4F46E5', // brand-600
          textColor: '#1F2937',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          fontSize: '15px',
          padding: '20px',
          borderRadius: '12px',
        },
        tooltipContainer: {
          textAlign: 'right', // RTL support
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          fontSize: '14px',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#6B7280',
          fontSize: '14px',
          marginLeft: '10px',
        },
        buttonSkip: {
          color: '#9CA3AF',
          fontSize: '13px',
        },
        beacon: {
          inner: '#4F46E5',
          outer: '#4F46E5',
        },
      }}
      locale={{
        back: 'السابق',
        close: 'إغلاق',
        last: 'إنهاء',
        next: 'التالي',
        open: 'فتح',
        skip: 'تخطي',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  */
}

/**
 * Hook to manage tour state
 */
export function useDashboardTour() {
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    // Check if user has completed the tour
    const completed = localStorage.getItem('dashboardTourCompleted');
    const isFirstVisit = !localStorage.getItem('hasVisitedDashboard');

    if (!completed && isFirstVisit) {
      // Wait a bit before starting tour (let dashboard load)
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }

    // Mark that user has visited dashboard
    localStorage.setItem('hasVisitedDashboard', 'true');
    setTourCompleted(!!completed);
  }, []);

  const startTour = () => setRunTour(true);
  const stopTour = () => setRunTour(false);
  const resetTour = () => {
    localStorage.removeItem('dashboardTourCompleted');
    localStorage.removeItem('dashboardTourCompletedAt');
    setTourCompleted(false);
    setRunTour(true);
  };

  const handleComplete = finished => {
    setRunTour(false);
    setTourCompleted(finished);
  };

  return {
    runTour,
    tourCompleted,
    startTour,
    stopTour,
    resetTour,
    handleComplete,
  };
}
