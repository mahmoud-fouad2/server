'use client';

import {
  MessageSquare,
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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import { ticketApi, notificationsApi } from '@/lib/api';
import { API_CONFIG } from '@/lib/config';
import { io } from 'socket.io-client';

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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 group relative overflow-hidden ${
      activeTab === id
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-sm font-semibold'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {activeTab === id && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full"></div>
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
  const [isDark, setIsDark] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
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

    // Fetch Ticket Count
    const fetchTicketCount = async () => {
      try {
        const data = await ticketApi.list();
        // Count open or in_progress tickets
        const count = data.filter(
          t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
        ).length;
        setTicketCount(count);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Sidebar: failed to fetch tickets', err);
        }
      }
    };
    // Fetch unread counts
    const fetchUnread = async () => {
      try {
        const data = await notificationsApi.getUnreadCounts();
        // Show number of tickets that have unread messages (avoid counting individual ticket messages)
        const ticketsWithUnread = data.ticketsUnread || 0;
        setUnreadCount(ticketsWithUnread);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Sidebar: failed to fetch unread counts', err);
        }
      }
    };
    fetchTicketCount();
    fetchUnread();

    // Poll for ticket updates every 60 seconds
    const ticketInterval = setInterval(fetchTicketCount, 60000);

    // Setup socket to get real-time notification increments
    try {
      const rawUser = localStorage.getItem('user');
      const profile = rawUser ? JSON.parse(rawUser) : null;
      if (profile && profile.businessId && API_CONFIG.BASE_URL) {
        const socketUrl = API_CONFIG.BASE_URL.replace('/api', '');
        const socket = io(socketUrl, { transports: ['websocket'] });
        
        socket.on('connect', () => {
          socket.emit('join_room', `business_${profile.businessId}`);
        });
        
        socket.on('notification:new', () => fetchUnread());
        socket.on('ticket:updated', () => fetchTicketCount()); // Listen for ticket updates if backend supports it
        
        // Update on explicit events too
        const onUnreadChanged = () => fetchUnread();
        window.addEventListener('unread:changed', onUnreadChanged);

        // clean up on unmount
        const cleanup = () => {
          try {
            socket.disconnect();
          } catch (socketError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Sidebar: failed to disconnect socket', socketError);
            }
          }
          window.removeEventListener('unread:changed', onUnreadChanged);
          clearInterval(ticketInterval);
        };
        window.addEventListener('beforeunload', cleanup);
        return cleanup; // Return cleanup function for useEffect
      }
    } catch (e) {
      console.error('Socket setup failed', e);
    }

    return () => {
      observer.disconnect();
      clearInterval(ticketInterval);
    };
  }, []);

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

  return (
    <aside className="w-64 border-l border-gray-200 dark:border-white/5 flex flex-col bg-white/80 dark:bg-cosmic-950/80 backdrop-blur-xl z-20 hidden md:flex h-screen sticky top-0 shadow-2xl shadow-brand-900/5">
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-center mb-8">
          <FaheemAnimatedLogo size="small" showText={true} />
        </div>

        <nav className="space-y-1">
          {!isAgent && (
            <SidebarItem
              icon={TrendingUp}
              label="نظرة عامة"
              id="overview"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dataTour="sidebar-overview"
            />
          )}
          <SidebarItem
            icon={MessageSquare}
            label="المحادثات"
            id="conversations"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dataTour="sidebar-conversations"
          />
          <SidebarItem
            icon={Headphones}
            label="الدعم المباشر"
            id="live-support"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          {!isAgent && (
            <SidebarItem
              icon={BarChart3}
              label="تحليلات الزوار"
              id="analytics"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          {!isAgent && (
            <SidebarItem
              icon={Users}
              label="فريق العمل"
              id="team"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          {!isAgent && (
            <SidebarItem
              icon={Share2}
              label="قنوات الاتصال"
              id="channels"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          {!isAgent && (
            <SidebarItem
              icon={FileText}
              label="قاعدة المعرفة"
              id="knowledge"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dataTour="sidebar-knowledge"
            />
          )}
          {!isAgent && (
            <SidebarItem
              icon={Settings}
              label="تخصيص الويدجت"
              id="widget"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dataTour="sidebar-widget"
            />
          )}
          {!isAgent && (
            <SidebarItem
              icon={Play}
              label="تجربة البوت"
              id="playground"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          <SidebarItem
            icon={LifeBuoy}
            label="تذاكر الدعم"
            id="tickets"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            badge={unreadCount > 0 ? unreadCount : ticketCount}
          />
          {!isAgent && (
            <SidebarItem
              icon={ContactRound}
              label="إدارة العملاء"
              id="crm"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          <SidebarItem
            icon={User}
            label="إعدادات الحساب"
            id="settings"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dataTour="sidebar-settings"
          />
          {!isAgent && (
            <SidebarItem
              icon={CreditCard}
              label="الاشتراك والباقة"
              id="subscription"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-4 bg-gray-50/50 dark:bg-white/5">
        <button
          onClick={() => setActiveTab('tickets')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 group border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
        >
          <LifeBuoy
            size={18}
            className="group-hover:rotate-12 transition-transform"
          />
          <span>الدعم الفني</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            data-tour="theme-toggle"
            className="flex-1 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/5 py-2.5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-brand-500 dark:hover:border-brand-500 transition-colors shadow-sm"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-xs font-bold">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-10 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 py-2.5 rounded-lg border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
