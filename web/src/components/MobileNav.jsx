'use client';

import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  MessageSquare,
  Database,
  Settings,
  LogOut,
  Moon,
  Sun,
  CreditCard,
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
import { useRouter } from 'next/navigation';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';

export default function MobileNav({ activeTab, setActiveTab, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();
  const isAgent = userRole === 'AGENT';

  useEffect(() => {
    const checkTheme = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Close menu when tab changes
  useEffect(() => {
    setIsOpen(false);
  }, [activeTab]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const MenuItem = ({ icon: Icon, label, id, dataTour }) => (
    <button
      onClick={() => setActiveTab(id)}
      data-tour={dataTour}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 ${
        activeTab === id
          ? 'bg-brand-600/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 border-r-4 border-brand-500'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-cosmic-800 active:bg-gray-200 dark:active:bg-cosmic-700'
      }`}
    >
        {Icon ? <Icon size={22} /> : null}
      <span className="font-medium text-base">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-cosmic-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-cosmic-800 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-cosmic-800 transition-colors focus-visible-ring"
            aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {isOpen ? (
              <X size={24} className="text-gray-700 dark:text-gray-200" />
            ) : (
              <Menu size={24} className="text-gray-700 dark:text-gray-200" />
            )}
          </button>

          <div className="w-8 h-8">
            <FaheemAnimatedLogo size="tiny" showText={false} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-cosmic-800 transition-colors focus-visible-ring"
              aria-label={
                isDark ? 'التبديل للوضع النهاري' : 'التبديل للوضع الليلي'
              }
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-500" />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-cosmic-950 z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-cosmic-800 bg-gradient-to-b from-gray-50 dark:from-cosmic-900 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <FaheemAnimatedLogo size="small" showText={true} />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-cosmic-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
            {!isAgent && (
              <MenuItem
                icon={TrendingUp}
                label="نظرة عامة"
                id="overview"
                dataTour="sidebar-overview"
              />
            )}
            <MenuItem
              icon={MessageSquare}
              label="المحادثات"
              id="conversations"
              dataTour="sidebar-conversations"
            />
            <MenuItem
              icon={Headphones}
              label="الدعم المباشر"
              id="live-support"
            />
            {!isAgent && (
              <>
                <MenuItem 
                  icon={BarChart3} 
                  label="تحليلات الزوار" 
                  id="visitor-analytics" 
                />
                <MenuItem icon={Users} label="فريق العمل" id="team" />
                <MenuItem icon={Share2} label="قنوات الاتصال" id="channels" />
                <MenuItem
                  icon={FileText}
                  label="قاعدة المعرفة"
                  id="knowledge"
                  dataTour="sidebar-knowledge"
                />
                <MenuItem
                  icon={Settings}
                  label="تخصيص الويدجت"
                  id="widget"
                  dataTour="sidebar-widget"
                />
                <MenuItem icon={Play} label="تجربة البوت" id="playground" />
              </>
            )}
            <MenuItem icon={LifeBuoy} label="تذاكر الدعم" id="tickets" />
            {!isAgent && (
              <>
                <MenuItem
                  icon={ContactRound}
                  label="إدارة العملاء"
                  id="crm"
                />
                <MenuItem
                  icon={Users}
                  label="عملاء محتملون"
                  id="leads"
                />
              </>
            )}
            <MenuItem
              icon={User}
              label="إعدادات الحساب"
              id="settings"
              dataTour="sidebar-settings"
            />
            {!isAgent && (
              <MenuItem
                icon={CreditCard}
                label="الاشتراك والباقة"
                id="subscription"
              />
            )}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-cosmic-800 bg-gradient-to-t from-gray-50 dark:from-cosmic-900 to-transparent space-y-3">
            <button
              onClick={() => setActiveTab('tickets')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors font-medium"
            >
              <LifeBuoy size={20} />
              <span>الدعم الفني</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
