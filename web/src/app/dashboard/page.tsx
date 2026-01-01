'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import useTheme from '@/lib/theme';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import FaheemAnimatedLogo from '@/components/FaheemAnimatedLogo';
import {
  Check,
  Loader2,
  Sun,
  Moon,
  AlertTriangle,
  X,
  Crown,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { api } from '@/lib/api-client';
import type { DashboardTab } from '@/types/dashboard';
import {
  useDashboardStats,
  useBusinessInfo,
  useKnowledgeBase,
} from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';

// Import Sub-components
import StatsOverview from './components/StatsOverview';
import ConversationsView from './components/ConversationsView';
import LiveSupportView from './components/LiveSupportView';
import ChannelsView from './components/ChannelsView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import TicketsView from './components/TicketsView';
import WidgetSettingsView from './components/WidgetSettingsView';
import TeamView from './components/TeamView';
import SettingsView from './components/SettingsView';
import PlaygroundView from './components/PlaygroundView';
import VisitorAnalytics from './components/VisitorAnalytics';
import CrmView from './components/CrmView';
import DashboardTour, { useDashboardTour } from './components/DashboardTour';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function DashboardContent() {
  // Hooks
  const [isDark, setIsDark] = useTheme(false);
  const { user } = useAuth();
  
  // React Query Hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { isLoading: businessLoading } = useBusinessInfo();
  const { entries: kbList, reindex } = useKnowledgeBase();

  // State
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showProAlert, setShowProAlert] = useState(false);
  const [cacheLoadingState, setCacheLoadingState] = useState({
    clearing: false,
    reindexing: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Dashboard Tour
  const { runTour, resetTour, handleComplete } = useDashboardTour();

  const loading = statsLoading || businessLoading;

  // Scroll to top when tab changes
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore in SSR/test env
    }
  }, [activeTab]);

  // Notification system
  const addNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  // Clear cache handler
  const handleClearCache = useCallback(async () => {
    if (!confirm('هل أنت متأكد أنك تريد مسح الكاش؟ قد يؤثر هذا على الجلسات الحالية.'))
      return;
    try {
      setCacheLoadingState((s) => ({ ...s, clearing: true }));
      const data = await api.business.clearCache() as { deleted?: number };
      addNotification(
        `تم مسح الكاش${data?.deleted ? ` (${data.deleted})` : ''}`,
        'success'
      );
    } catch (err) {
      console.error('Clear cache failed:', err);
      addNotification('فشل مسح الكاش', 'error');
    } finally {
      setCacheLoadingState((s) => ({ ...s, clearing: false }));
    }
  }, [addNotification]);

  // Reindex handler
  const handleReindex = useCallback(async () => {
    if (
      !confirm(
        'ابدأ عملية إعادة الفهرسة لتوليد embeddings للعناصر المفقودة. هل تريد المتابعة؟'
      )
    )
      return;
    try {
      setCacheLoadingState((s) => ({ ...s, reindexing: true }));
      await reindex();
      addNotification('تم بدء إعادة الفهرسة', 'success');
    } catch (err) {
      console.error('Reindex failed:', err);
      addNotification('فشل بدء إعادة الفهرسة', 'error');
    } finally {
      setCacheLoadingState((s) => ({ ...s, reindexing: false }));
    }
  }, [reindex, addNotification]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden relative selection:bg-brand-500/30 transition-colors duration-500 bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-white flex flex-col md:flex-row"
      dir="rtl"
    >
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/8 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/8 rounded-full blur-[120px] animate-float"></div>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />

      {/* Notifications */}
      <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2 max-w-[90vw] sm:max-w-md pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`pointer-events-auto p-3 sm:p-4 rounded-lg shadow-xl text-white flex items-center gap-2 w-full border border-white/10 ${
                n.type === 'success' ? '!bg-green-600' : '!bg-red-600'
              }`}
            >
              {n.type === 'success' ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span className="text-sm sm:text-base">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pro Feature Alert Modal */}
      <AnimatePresence>
        {showProAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowProAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-brand-500/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-brand-500/20 to-brand-500/5 p-6 text-center relative">
                <button
                  className="absolute top-2 right-2 p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  onClick={() => setShowProAlert(false)}
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-brand-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">ميزة احترافية</h3>
                <p className="text-sm text-muted-foreground">
                  هذه الميزة متاحة فقط في الباقة الاحترافية
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>إزالة شعار &quot;مدعوم من فهيم&quot;</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>تخصيص كامل للألوان والأيقونات</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>دعم فني مباشر 24/7</span>
                </div>
                <button
                  className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setActiveTab('subscription');
                    setShowProAlert(false);
                  }}
                >
                  ترقية الباقة الآن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative pt-16 md:pt-8 min-h-screen">
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 bg-transparent backdrop-blur-md p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="md:hidden">
                <FaheemAnimatedLogo size="small" showText={true} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <span className="hidden md:inline">لوحة التحكم</span>
                  <span className="md:hidden">فهملي</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  مرحباً، {user?.name || 'المستخدم'}. إليك ملخص نشاط بوتك الذكي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearCache}
                  disabled={cacheLoadingState.clearing}
                  className="text-xs sm:text-sm"
                >
                  {cacheLoadingState.clearing ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <span className="hidden sm:inline">مسح الكاش</span>
                  )}
                  <span className="sm:hidden">كاش</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReindex}
                  disabled={cacheLoadingState.reindexing}
                  className="text-xs sm:text-sm"
                >
                  {cacheLoadingState.reindexing ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <span className="hidden sm:inline">إعادة الفهرسة</span>
                  )}
                  <span className="sm:hidden">فهرسة</span>
                </Button>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => {
                    if (typeof setIsDark === 'function') {
                      setIsDark(!isDark);
                    }
                  }}
                  data-tour="theme-toggle"
                  aria-label="Toggle theme"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-600/10 dark:bg-white/5 flex items-center justify-center hover:bg-brand-600/20 transition-colors"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  )}
                </button>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-500 flex items-center justify-center text-brand-50 font-bold text-sm sm:text-base">
                  {user?.name?.[0] || 'A'}
                </div>
              </div>
            </div>
          </header>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <StatsOverview
                key="overview"
                stats={stats}
                subscription={null}
                kbList={kbList}
                chartData={[]}
                user={user}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'conversations' && <ConversationsView key="conversations" />}

            {activeTab === 'live-support' && (
              <LiveSupportView key="live-support" addNotification={addNotification} />
            )}

            {activeTab === 'channels' && (
              <ChannelsView key="channels" addNotification={addNotification} />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBaseView key="knowledge" addNotification={addNotification} />
            )}

            {activeTab === 'tickets' && (
              <TicketsView key="tickets" addNotification={addNotification} />
            )}

            {activeTab === 'widget' && (
              <WidgetSettingsView
                key="widget"
                user={user}
                addNotification={addNotification}
                setShowProAlert={setShowProAlert}
              />
            )}

            {activeTab === 'team' && <TeamView key="team" addNotification={addNotification} />}

            {activeTab === 'settings' && (
              <SettingsView key="settings" user={user} addNotification={addNotification} />
            )}

            {activeTab === 'playground' && <PlaygroundView key="playground" />}

            {activeTab === 'visitor-analytics' && <VisitorAnalytics key="analytics" />}

            {activeTab === 'crm' && (
              <CrmView key="crm" user={user} addNotification={addNotification} />
            )}

            {activeTab === 'subscription' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key="subscription"
                className="space-y-8"
              >
                <div className="text-center py-12">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">إدارة الاشتراك</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">قريباً...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Button - Restart Tour */}
          <button
            onClick={resetTour}
            className="fixed bottom-6 left-6 z-40 p-2 sm:p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg transition-all hover:scale-110"
            title="إعادة جولة المساعدة"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-6 sm:pt-8 pb-4 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/50 space-y-1">
          <p>© {new Date().getFullYear()} فهملي - جميع الحقوق محفوظة</p>
          <p className="text-xs flex items-center justify-center gap-2 flex-wrap">
            Development By{' '}
            <a
              href="https://ma-fo.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1"
            >
              <Image
                src="https://ma-fo.info/logo2.png"
                alt="Ma-Fo Logo"
                width={16}
                height={16}
                className="w-3 h-3 sm:w-4 sm:h-4"
                unoptimized
              />
              Ma-Fo
            </a>
          </p>
        </footer>
      </main>

      {/* Dashboard Tour */}
      <DashboardTour run={runTour} onComplete={handleComplete} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
