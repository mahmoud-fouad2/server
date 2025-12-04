"use client"

import { LayoutDashboard, MessageSquare, Database, Settings, LogOut, Globe, Moon, Sun, CreditCard, Play, TrendingUp, FileText, User, Users, Share2, Headphones, LifeBuoy } from 'lucide-react';
import useTheme from '@/lib/theme';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import { ticketApi } from '@/lib/api';

const SidebarItem = ({ icon: Icon, label, id, activeTab, setActiveTab, badge, dataTour }) => (
  <button 
    onClick={() => setActiveTab(id)}
    data-tour={dataTour}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mb-1 group relative overflow-hidden ${
      activeTab === id
        ? 'bg-brand-600/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 shadow-sm' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {activeTab === id && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r-full"></div>
    )}
    <Icon size={20} className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`} />
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
  const isAgent = userRole === 'AGENT';

  useEffect(() => {
    // Sync with document class
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    // Observer for class changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Fetch Ticket Count
    const fetchTicketCount = async () => {
      try {
        const data = await ticketApi.list();
        // Count open or in_progress tickets
        const count = data.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
        setTicketCount(count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTicketCount();

    return () => observer.disconnect();
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
      <div className="p-6">
        <div className="flex items-center justify-center mb-8">
          <FaheemAnimatedLogo size="small" showText={true} />
        </div>
        
        <nav className="flex-1 space-y-1">
          {!isAgent && <SidebarItem icon={TrendingUp} label="نظرة عامة" id="overview" activeTab={activeTab} setActiveTab={setActiveTab} dataTour="sidebar-overview" />}
          <SidebarItem icon={MessageSquare} label="المحادثات" id="conversations" activeTab={activeTab} setActiveTab={setActiveTab} dataTour="sidebar-conversations" />
          <SidebarItem icon={Headphones} label="الدعم المباشر" id="live-support" activeTab={activeTab} setActiveTab={setActiveTab} />
          {!isAgent && <SidebarItem icon={Users} label="فريق العمل" id="team" activeTab={activeTab} setActiveTab={setActiveTab} />}
          {!isAgent && <SidebarItem icon={Share2} label="قنوات الاتصال" id="channels" activeTab={activeTab} setActiveTab={setActiveTab} />}
          {!isAgent && <SidebarItem icon={FileText} label="قاعدة المعرفة" id="knowledge" activeTab={activeTab} setActiveTab={setActiveTab} dataTour="sidebar-knowledge" />}
          {!isAgent && <SidebarItem icon={Settings} label="تخصيص الويدجت" id="widget" activeTab={activeTab} setActiveTab={setActiveTab} dataTour="sidebar-widget" />}
          {!isAgent && <SidebarItem icon={Play} label="تجربة البوت" id="playground" activeTab={activeTab} setActiveTab={setActiveTab} />}
          <SidebarItem icon={LifeBuoy} label="تذاكر الدعم" id="tickets" activeTab={activeTab} setActiveTab={setActiveTab} badge={ticketCount} />
          <SidebarItem icon={User} label="إعدادات الحساب" id="settings" activeTab={activeTab} setActiveTab={setActiveTab} dataTour="sidebar-settings" />
          {!isAgent && <SidebarItem icon={CreditCard} label="الاشتراك والباقة" id="subscription" activeTab={activeTab} setActiveTab={setActiveTab} />}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-4 bg-gray-50/50 dark:bg-white/5">
        <button 
          onClick={() => setActiveTab('tickets')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 group border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
        >
          <LifeBuoy size={18} className="group-hover:rotate-12 transition-transform" />
          <span>الدعم الفني</span>
        </button>

        <div className="flex gap-2">
           <button 
            onClick={toggleTheme}
            data-tour="theme-toggle"
            className="flex-1 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/5 py-2.5 rounded-lg border border-gray-200 dark:border-white/5 hover:border-brand-500 dark:hover:border-brand-500 transition-colors shadow-sm"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-xs font-bold">{isDark ? 'Light' : 'Dark'}</span>
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
