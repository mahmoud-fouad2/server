/**
 * Faheemly™ - Admin Dashboard Training Tour
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * PROPRIETARY SOFTWARE - Unauthorized copying or distribution is prohibited.
 * 
 * Interactive tour component using Shepherd.js to guide admins through
 * the dashboard features and capabilities.
 * 
 * @module components/AdminTour
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { ShepherdTour, ShepherdTourContext } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

// Custom tour styles
const tourOptions = {
  defaultStepOptions: {
    classes: 'faheemly-tour-step',
    scrollTo: { behavior: 'smooth', block: 'center' },
    cancelIcon: {
      enabled: true
    },
    modalOverlayOpeningPadding: 4,
    modalOverlayOpeningRadius: 8
  },
  useModalOverlay: true
};

// Tour steps configuration
const tourSteps = [
  {
    id: 'welcome',
    text: [
      '<h3>🎉 مرحباً بك في لوحة تحكم Faheemly!</h3>',
      '<p>سنأخذك في جولة سريعة لتتعرف على جميع المميزات القوية المتاحة لك كمدير نظام.</p>',
      '<p class="tour-subtitle">⏱️ المدة: 3-5 دقائق</p>'
    ].join(''),
    buttons: [
      {
        text: 'تخطي الجولة',
        action() {
          this.complete();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'ابدأ الجولة 🚀',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'dashboard-overview',
    attachTo: { element: '[data-tour="dashboard"]', on: 'bottom' },
    text: [
      '<h3>📊 لوحة التحكم الرئيسية</h3>',
      '<p>هنا تجد ملخص شامل لجميع إحصائيات النظام:</p>',
      '<ul class="tour-list">',
      '<li>✅ عدد المستخدمين النشطين</li>',
      '<li>💬 عدد المحادثات اليوم</li>',
      '<li>🏢 الشركات المسجلة</li>',
      '<li>📈 معدلات الأداء</li>',
      '</ul>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'user-management',
    attachTo: { element: '[data-tour="users"]', on: 'right' },
    text: [
      '<h3>👥 إدارة المستخدمين</h3>',
      '<p>تحكم كامل في جميع مستخدمي النظام:</p>',
      '<ul class="tour-list">',
      '<li>➕ إنشاء مستخدمين جدد</li>',
      '<li>✏️ تعديل بيانات المستخدمين</li>',
      '<li>🔒 تغيير كلمات المرور</li>',
      '<li>🚫 تعطيل/تفعيل الحسابات</li>',
      '<li>🗑️ حذف المستخدمين (مع إمكانية الاسترجاع)</li>',
      '<li>📋 تصدير بيانات المستخدمين (GDPR)</li>',
      '</ul>',
      '<p class="tour-tip">💡 يمكنك البحث والتصفية حسب الدور، الحالة، وتاريخ التسجيل</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'system-control',
    attachTo: { element: '[data-tour="system"]', on: 'right' },
    text: [
      '<h3>⚙️ لوحة التحكم في النظام</h3>',
      '<p>سيطرة كاملة على جميع إعدادات Faheemly:</p>',
      '<ul class="tour-list">',
      '<li>🤖 <strong>AI Providers</strong>: إدارة OpenAI, Claude, Gemini</li>',
      '<li>📝 <strong>System Prompts</strong>: تحديث تعليمات الذكاء الاصطناعي</li>',
      '<li>🔧 <strong>API Configuration</strong>: ضبط نقاط النهاية</li>',
      '<li>🚩 <strong>Feature Flags</strong>: تفعيل/تعطيل المميزات</li>',
      '<li>⚙️ <strong>System Settings</strong>: إعدادات عامة</li>',
      '</ul>',
      '<p class="tour-warning">⚠️ التغييرات هنا تؤثر على جميع المستخدمين</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'ai-providers',
    attachTo: { element: '[data-tour="ai-providers"]', on: 'bottom' },
    text: [
      '<h3>🤖 إدارة مزودي الذكاء الاصطناعي</h3>',
      '<p>تحكم في جميع نماذج AI المستخدمة:</p>',
      '<ul class="tour-list">',
      '<li>🔑 إضافة/تحديث API Keys</li>',
      '<li>🔄 تبديل بين النماذج (GPT-4, Claude, etc.)</li>',
      '<li>🏥 اختبار صحة الاتصال</li>',
      '<li>📊 مراقبة الأداء والتكاليف</li>',
      '<li>⚡ ضبط المعاملات (temperature, max_tokens)</li>',
      '</ul>',
      '<p class="tour-tip">💡 يمكنك اختبار كل مزود قبل التفعيل</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'feature-flags',
    attachTo: { element: '[data-tour="feature-flags"]', on: 'bottom' },
    text: [
      '<h3>🚩 Feature Flags (إدارة المميزات)</h3>',
      '<p>تحكم متقدم في إطلاق المميزات:</p>',
      '<ul class="tour-list">',
      '<li>🎯 <strong>Gradual Rollout</strong>: إطلاق تدريجي (10%, 50%, 100%)</li>',
      '<li>👥 <strong>Target Users</strong>: تفعيل لمستخدمين محددين</li>',
      '<li>🧪 <strong>A/B Testing</strong>: اختبار نسختين من الميزة</li>',
      '<li>🔄 <strong>Quick Toggle</strong>: تفعيل/تعطيل فوري</li>',
      '<li>📊 <strong>Analytics</strong>: تتبع استخدام المميزات</li>',
      '</ul>',
      '<p class="tour-tip">💡 استخدم Rollout Percentage لاختبار المميزات الجديدة بأمان</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'health-monitoring',
    attachTo: { element: '[data-tour="health"]', on: 'bottom' },
    text: [
      '<h3>📊 مراقبة صحة النظام</h3>',
      '<p>تتبع أداء Faheemly في الوقت الفعلي:</p>',
      '<ul class="tour-list">',
      '<li>💚 <strong>System Health</strong>: حالة النظام (Up/Down)</li>',
      '<li>⚡ <strong>Response Time</strong>: سرعة الاستجابة</li>',
      '<li>🗄️ <strong>Database</strong>: حالة قاعدة البيانات</li>',
      '<li>🤖 <strong>AI Status</strong>: حالة مزودي AI</li>',
      '<li>📈 <strong>Metrics</strong>: CPU, Memory, Requests/sec</li>',
      '</ul>',
      '<p class="tour-warning">⚠️ تنبيهات تلقائية عند حدوث مشاكل</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'audit-log',
    attachTo: { element: '[data-tour="audit"]', on: 'bottom' },
    text: [
      '<h3>📋 سجل التدقيق (Audit Log)</h3>',
      '<p>تتبع جميع الإجراءات في النظام:</p>',
      '<ul class="tour-list">',
      '<li>👤 من قام بالإجراء؟</li>',
      '<li>⏰ متى حدث؟</li>',
      '<li>📝 ماذا تغير؟</li>',
      '<li>🔍 تصفية حسب المستخدم، الإجراء، التاريخ</li>',
      '<li>📊 تصدير التقارير</li>',
      '</ul>',
      '<p class="tour-tip">💡 مهم للامتثال (GDPR, ISO 27001)</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'knowledge-base',
    attachTo: { element: '[data-tour="knowledge"]', on: 'right' },
    text: [
      '<h3>📚 قاعدة المعرفة</h3>',
      '<p>إدارة محتوى الذكاء الاصطناعي:</p>',
      '<ul class="tour-list">',
      '<li>📄 رفع ملفات (PDF, Word, TXT)</li>',
      '<li>🖼️ معالجة الصور</li>',
      '<li>🎤 تحويل الصوت إلى نص</li>',
      '<li>🔍 بحث ذكي في المحتوى</li>',
      '<li>✏️ تعديل وتنظيم المعلومات</li>',
      '</ul>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'التالي',
        action() {
          this.next();
        }
      }
    ]
  },
  {
    id: 'version-management',
    attachTo: { element: '[data-tour="versions"]', on: 'left' },
    text: [
      '<h3>📦 إدارة الإصدارات</h3>',
      '<p>تتبع تحديثات النظام:</p>',
      '<ul class="tour-list">',
      '<li>🔖 سجل جميع الإصدارات</li>',
      '<li>📝 ملاحظات كل إصدار</li>',
      '<li>🔄 Rollback إلى إصدار سابق</li>',
      '<li>🔐 Zero-downtime upgrades</li>',
      '</ul>',
      '<p class="tour-tip">💡 النظام يدعم التحديث بدون توقف الخدمة</p>'
    ].join(''),
    buttons: [
      {
        text: 'رجوع',
        action() {
          this.back();
        },
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'إنهاء الجولة',
        action() {
          this.complete();
        }
      }
    ]
  },
  {
    id: 'complete',
    text: [
      '<h3>🎊 تهانينا! أكملت الجولة</h3>',
      '<p>الآن أنت جاهز لاستخدام جميع مميزات Faheemly المتقدمة!</p>',
      '<div class="tour-complete-box">',
      '<h4>📚 موارد إضافية:</h4>',
      '<ul class="tour-list">',
      '<li><a href="/docs" target="_blank">📖 الدليل الكامل</a></li>',
      '<li><a href="/api-docs" target="_blank">🔧 وثائق API</a></li>',
      '<li><a href="mailto:support@faheemly.com">💬 الدعم الفني</a></li>',
      '</ul>',
      '</div>',
      '<p class="tour-tip">💡 يمكنك إعادة الجولة في أي وقت من الإعدادات</p>'
    ].join(''),
    buttons: [
      {
        text: 'ابدأ الاستخدام 🚀',
        action() {
          this.complete();
        }
      }
    ]
  }
];

/**
 * AdminTour Component
 * Provides interactive guided tour for admin dashboard
 */
export default function AdminTour({ onComplete, autoStart = false }) {
  const tourRef = useRef(null);
  const [isTourActive, setIsTourActive] = React.useState(false);

  useEffect(() => {
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem('faheemly_admin_tour_completed');
    
    if (autoStart && !tourCompleted) {
      // Auto-start tour on first visit
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, [autoStart]);

  const startTour = () => {
    setIsTourActive(true);
    if (tourRef.current) {
      tourRef.current.start();
    }
  };

  const handleTourComplete = () => {
    setIsTourActive(false);
    localStorage.setItem('faheemly_admin_tour_completed', 'true');
    localStorage.setItem('faheemly_admin_tour_completed_at', new Date().toISOString());
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleTourCancel = () => {
    setIsTourActive(false);
  };

  return (
    <>
      {/* Start Tour Button */}
      {!isTourActive && (
        <button
          onClick={startTour}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 z-50 group"
          aria-label="بدء جولة لوحة التحكم"
        >
          <span className="text-xl">🎯</span>
          <span className="font-semibold">بدء الجولة</span>
          <span className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">
            (3 دقائق)
          </span>
        </button>
      )}

      {/* Shepherd Tour */}
      <ShepherdTour
        steps={tourSteps}
        tourOptions={tourOptions}
        ref={tourRef}
      >
        <ShepherdTourContext.Consumer>
          {(tour) => {
            if (tour) {
              // Store tour instance
              tourRef.current = tour;

              // Add complete and cancel listeners
              tour.on('complete', handleTourComplete);
              tour.on('cancel', handleTourCancel);
            }
            return null;
          }}
        </ShepherdTourContext.Consumer>
      </ShepherdTour>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Faheemly Tour Custom Styles */
        .faheemly-tour-step {
          max-width: 480px !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
          font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif !important;
          direction: rtl !important;
        }

        .faheemly-tour-step .shepherd-header {
          background: linear-gradient(135deg, #003366 0%, #004d99 100%) !important;
          padding: 16px 20px !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .faheemly-tour-step .shepherd-text {
          padding: 24px !important;
          font-size: 15px !important;
          line-height: 1.8 !important;
          color: #333 !important;
        }

        .faheemly-tour-step h3 {
          color: #003366 !important;
          font-size: 20px !important;
          font-weight: 700 !important;
          margin: 0 0 12px 0 !important;
        }

        .faheemly-tour-step p {
          margin: 8px 0 !important;
          color: #555 !important;
        }

        .tour-list {
          margin: 12px 0 !important;
          padding-right: 20px !important;
          list-style: none !important;
        }

        .tour-list li {
          margin: 8px 0 !important;
          padding-right: 24px !important;
          position: relative !important;
        }

        .tour-list li:before {
          content: "→" !important;
          position: absolute !important;
          right: 0 !important;
          color: #003366 !important;
          font-weight: bold !important;
        }

        .tour-subtitle {
          font-size: 13px !important;
          color: #666 !important;
          font-style: italic !important;
        }

        .tour-tip {
          background: #e3f2fd !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          border-right: 4px solid #2196f3 !important;
          margin: 12px 0 !important;
          font-size: 14px !important;
        }

        .tour-warning {
          background: #fff3e0 !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          border-right: 4px solid #ff9800 !important;
          margin: 12px 0 !important;
          font-size: 14px !important;
        }

        .tour-complete-box {
          background: #f5f5f5 !important;
          padding: 16px !important;
          border-radius: 8px !important;
          margin: 16px 0 !important;
        }

        .tour-complete-box h4 {
          color: #003366 !important;
          font-size: 16px !important;
          margin: 0 0 8px 0 !important;
        }

        .tour-complete-box a {
          color: #2196f3 !important;
          text-decoration: none !important;
        }

        .tour-complete-box a:hover {
          text-decoration: underline !important;
        }

        .faheemly-tour-step .shepherd-footer {
          padding: 16px 20px !important;
          background: #f8f9fa !important;
          border-radius: 0 0 12px 12px !important;
          display: flex !important;
          justify-content: space-between !important;
          gap: 12px !important;
        }

        .faheemly-tour-step .shepherd-button {
          padding: 10px 20px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: all 0.2s ease !important;
          border: none !important;
          cursor: pointer !important;
        }

        .faheemly-tour-step .shepherd-button:not(.shepherd-button-secondary) {
          background: linear-gradient(135deg, #003366 0%, #004d99 100%) !important;
          color: white !important;
        }

        .faheemly-tour-step .shepherd-button:not(.shepherd-button-secondary):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 51, 102, 0.3) !important;
        }

        .faheemly-tour-step .shepherd-button-secondary {
          background: white !important;
          color: #666 !important;
          border: 2px solid #ddd !important;
        }

        .faheemly-tour-step .shepherd-button-secondary:hover {
          background: #f5f5f5 !important;
          border-color: #bbb !important;
        }

        .shepherd-modal-overlay-container {
          z-index: 9998 !important;
        }

        .faheemly-tour-step {
          z-index: 9999 !important;
        }
      `}</style>
    </>
  );
}

/**
 * Hook to reset tour completion (for testing or re-training)
 */
export function useResetTour() {
  return () => {
    localStorage.removeItem('faheemly_admin_tour_completed');
    localStorage.removeItem('faheemly_admin_tour_completed_at');
  };
}

/**
 * Check if tour was completed
 */
export function isTourCompleted() {
  return localStorage.getItem('faheemly_admin_tour_completed') === 'true';
}
