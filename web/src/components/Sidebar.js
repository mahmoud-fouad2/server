'use client';

import {
  MessageSquare,
  Settings,
  LogOut,
  Moon,
  Sun,
  Play,
  TrendingUp,
  FileText,
  User,
  Users,
  Share2,
  Headphones,
  LifeBuoy,
  BarChart3,
  ContactRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import { useTranslation } from 'react-i18next';
import { useTickets, useUnreadMessages } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';

const SidebarItem = ({
  icon: Icon,
  label,
  id,
  activeTab,
  setActiveTab,
  badge,
  dataTour,
}) => (
  <button
    onClick={() => setActiveTab(id)}
    data-tour={dataTour}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 group relative overflow-hidden focus-visible-ring ${
      activeTab === id
        ? 'bg-brand-600/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 shadow-sm font-semibold'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {activeTab === id && (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-500 rounded-l-full"></div>
    )}
    {Icon ? (
      <Icon
        size={20}
        className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}
      />
    ) : null}
    <span className="font-medium flex-1 text-right">{label}</span>
    {badge > 0 && (
      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

export default function Sidebar({ activeTab, setActiveTab, userRole }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  
  // Use React Query for data fetching
  const { data: tickets = [] } = useTickets();
  const { data: unreadCount = 0 } = useUnreadMessages();
  
  const ticketCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const isAgent = userRole === 'AGENT';

  useEffect(() => {
    // Sync with document class
    const checkTheme = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    // Observer for class changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex w-72 flex-shrink-0 bg-white/95 dark:bg-cosmic-900/80 backdrop-blur-xl border-l border-gray-200/70 dark:border-white/10 flex-col h-screen sticky top-0 transition-colors duration-300 shadow-xl z-40 overflow-hidden">
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-center border-b border-gray-100 dark:border-white/5 relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-purple-500/5 animate-pulse"></div>
        <FaheemAnimatedLogo size="sidebar" className="relative z-10" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mb-2 tracking-wide">
          {t('dashboard.overview')}
        </div>
        <SidebarItem
          id="overview"
          label={t('dashboard.overview')}
          icon={BarChart3}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dataTour="overview-tab"
        />
        <SidebarItem
          id="conversations"
          label={t('dashboard.conversations')}
          icon={MessageSquare}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          badge={unreadCount}
          dataTour="conversations-tab"
        />
        <SidebarItem
          id="live-support"
          label={t('dashboard.liveSupport')}
          icon={Headphones}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {!isAgent && (
          <>
            <div className="mt-6 mb-2 px-4">
              <div className="h-px bg-gray-100 dark:bg-white/5"></div>
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mb-2 tracking-wide">
              {t('dashboard.channels')}
            </div>
            <SidebarItem
              id="channels"
              label={t('dashboard.channels')}
              icon={Share2}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="knowledge"
              label={t('dashboard.knowledgeBase')}
              icon={FileText}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dataTour="knowledge-tab"
            />
            <SidebarItem
              id="playground"
              label={t('dashboard.playground')}
              icon={Play}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </>
        )}

        <div className="mt-6 mb-2 px-4">
          <div className="h-px bg-gray-100 dark:bg-white/5"></div>
        </div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mb-2 tracking-wide">
          {t('dashboard.team')}
        </div>

        <SidebarItem
          id="tickets"
          label={t('dashboard.tickets')}
          icon={LifeBuoy}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          badge={ticketCount}
        />
        {!isAgent && (
          <>
            <SidebarItem
              id="team"
              label={t('dashboard.team')}
              icon={Users}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="crm"
              label={t('dashboard.crm')}
              icon={ContactRound}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="leads"
              label="عملاء محتملون"
              icon={Users}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="visitor-analytics"
              label={t('dashboard.visitorAnalytics')}
              icon={TrendingUp}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="widget"
              label={t('dashboard.widgetSettings')}
              icon={Settings}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <SidebarItem
              id="settings"
              label={t('dashboard.settings')}
              icon={User}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm transition-all mb-2 focus-visible-ring"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">
            {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-sm transition-all group focus-visible-ring"
        >
          <LogOut
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">{t('dashboard.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
