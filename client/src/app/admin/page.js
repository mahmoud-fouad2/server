'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import BusinessesView from './components/BusinessesView';
import PaymentsView from './components/PaymentsView';
import AuditLogsView from './components/AuditLogsView';
import IntegrationsView from './components/IntegrationsView';
import {
  LayoutDashboard,
  Users,
  Bot,
  Briefcase,
  CreditCard,
  Settings,
  Database,
  Activity,
  Shield,
  LogOut,
  Search,
  Save,
  Trash2,
  Edit,
  Plus,
  Palette,
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Menu,
  Sun,
  Moon,
  Bell,
  CheckCircle,
  XCircle,
  Loader2,
  LifeBuoy,
  Share2,
  Headphones,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import useTheme from '@/lib/theme';
import { adminApi, ticketApi } from '@/lib/api';

export default function AdminDashboard() {
  // 1. All Hooks must be declared at the top level
  const [activeTab, setActiveTab] = useState('overview');
  const [isDark, setIsDark] = useTheme(false); // Default light
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalConversations: 0,
    totalMessages: 0,
  });
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState(5); // Mock notification count
  const [settings, setSettings] = useState({});
  const [aiModels, setAiModels] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [newModel, setNewModel] = useState({
    name: '',
    apiKey: '',
    endpoint: '',
    maxTokens: 1000,
    priority: 0,
  });
  const [ticketCount, setTicketCount] = useState(0);
  const [monitoring, setMonitoring] = useState({
    system: {},
    business: {},
    alerts: []
  });

  // Ticket System State
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketReply, setTicketReply] = useState('');

  // 2. Helper functions (hoisted or defined before use in effects)
  const fetchTicketCount = async () => {
    try {
      const data = await adminApi.getAllTickets();
      const count = data.filter(
        t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
      ).length;
      setTicketCount(count);
    } catch (err) {
      console.error('Failed to fetch ticket count', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchAiModels = async () => {
    try {
      const data = await adminApi.getAIModels();
      setAiModels(data);
    } catch (err) {
      console.error('Failed to fetch AI models', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await adminApi.getLogs();
      setSystemLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await adminApi.getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    }
  };

  const fetchMonitoring = async () => {
    try {
      const data = await adminApi.getMonitoring();
      setMonitoring(data);
    } catch (err) {
      console.error('Failed to fetch monitoring data', err);
    }
  };

  // 3. Effects
  // SECURITY: Check authentication and admin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          router.push('/admin/login');
          return;
        }

        const user = JSON.parse(userStr);
        const role = user.role?.toUpperCase();

        // Check if user has admin role
        if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
          router.push('/dashboard');
          return;
        }

        setAuthorized(true);

        // Fetch Data
        await Promise.all([fetchStats(), fetchUsers(), fetchTicketCount()]);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authorized) return; // Don't fetch if not authorized

    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'bots') fetchAiModels();
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'monitoring') fetchMonitoring();
  }, [activeTab, authorized]);

  const selectTicket = async ticket => {
    setSelectedTicket(ticket);
    try {
      const data = await ticketApi.get(ticket.id);
      setTicketMessages(data.messages);
      // Mark as read or update local state if needed
    } catch (err) {
      console.error('Failed to fetch ticket details', err);
    }
  };

  const sendTicketReply = async e => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;

    try {
      const newMessage = await ticketApi.reply(selectedTicket.id, ticketReply);
      setTicketMessages([...ticketMessages, newMessage]);
      setTicketReply('');
      // Refresh tickets list to update status/counts
      fetchTickets();
    } catch (err) {
      console.error('Failed to send reply', err);
    }
  };

  const updateTicketStatus = async status => {
    if (!selectedTicket) return;
    try {
      const updated = await ticketApi.updateStatus(selectedTicket.id, status);
      setSelectedTicket({ ...selectedTicket, status: updated.status });
      fetchTickets(); // Refresh list
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleUpdatePlan = async (businessId, planType) => {
    try {
      await adminApi.updateBusinessPlan(businessId, planType);
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Failed to update plan', err);
    }
  };

  const handleAddModel = async () => {
    try {
      await adminApi.addAIModel(newModel);
      alert('تم إضافة النموذج بنجاح');
      setNewModel({
        name: '',
        apiKey: '',
        endpoint: '',
        maxTokens: 1000,
        priority: 0,
      });
      fetchAiModels();
    } catch (err) {
      console.error('Failed to add model', err);
    }
  };

  const handleDeleteModel = async id => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await adminApi.deleteAIModel(id);
      fetchAiModels();
    } catch (err) {
      console.error('Failed to delete model', err);
    }
  };

  const handleToggleModel = async id => {
    try {
      await adminApi.toggleAIModel(id);
      fetchAiModels();
    } catch (err) {
      console.error('Failed to toggle model', err);
    }
  };

  const saveSettings = async () => {
    try {
      await adminApi.updateSettings(settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const SidebarItem = ({ id, icon: Icon, label, badge }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setShowSidebar(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-brand-600 text-white shadow-md'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium flex-1 text-right">{label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex`}
      dir="rtl"
    >
      {/* Sidebar */}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col h-screen sticky top-0 shadow-lg z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">
              Super Admin
            </h1>
            <p className="text-xs text-muted-foreground">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem
            id="overview"
            icon={LayoutDashboard}
            label="لوحة القيادة"
          />
          <SidebarItem
            id="tickets"
            icon={LifeBuoy}
            label="الدعم الفني"
            badge={ticketCount}
          />
          <SidebarItem id="users" icon={Users} label="المستخدمين" />
          <SidebarItem id="businesses" icon={Briefcase} label="الشركات" />
          <SidebarItem id="payments" icon={CreditCard} label="المدفوعات" />
          <SidebarItem id="integrations" icon={Share2} label="التكاملات" />
          <SidebarItem id="audit" icon={Activity} label="سجل التدقيق" />
          <SidebarItem id="bots" icon={Bot} label="البوتات والذكاء" />
          <SidebarItem id="design" icon={Palette} label="التصميم والألوان" />
          <SidebarItem id="seo" icon={Globe} label="SEO وإعدادات الموقع" />
          <SidebarItem
            id="content"
            icon={MessageSquare}
            label="النصوص والمحتوى"
          />
          <SidebarItem id="media" icon={ImageIcon} label="الصور والوسائط" />
          <SidebarItem
            id="performance"
            icon={Zap}
            label="الأداء والتخزين المؤقت"
          />
          <SidebarItem id="logs" icon={Activity} label="سجلات النظام" />
          <SidebarItem
            id="monitoring"
            icon={LifeBuoy}
            label="مراقبة النظام"
          />
          <SidebarItem id="settings" icon={Settings} label="إعدادات النظام" />
            <SidebarItem id="audit" icon={Activity} label="سجل التدقيق" />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar (drawer) */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${showSidebar ? '' : 'pointer-events-none'}`}
        aria-hidden={!showSidebar}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${showSidebar ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setShowSidebar(false)}
        />
        <aside className={`absolute top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <div>
                <h1 className="text-lg font-bold text-brand-600 dark:text-brand-400">Super Admin</h1>
                <p className="text-xs text-muted-foreground">Control Panel</p>
              </div>
            </div>
            <button onClick={() => setShowSidebar(false)} className="p-2 rounded-md">✕</button>
          </div>
          <nav className="p-4 space-y-2 overflow-y-auto">
            <SidebarItem id="overview" icon={LayoutDashboard} label="لوحة القيادة" />
            <SidebarItem id="tickets" icon={LifeBuoy} label="الدعم الفني" badge={ticketCount} />
            <SidebarItem id="users" icon={Users} label="المستخدمين" />
            <SidebarItem id="bots" icon={Bot} label="البوتات والذكاء" />
            <SidebarItem id="design" icon={Palette} label="التصميم والألوان" />
            <SidebarItem id="seo" icon={Globe} label="SEO وإعدادات الموقع" />
            <SidebarItem id="content" icon={MessageSquare} label="النصوص والمحتوى" />
            <SidebarItem id="media" icon={ImageIcon} label="الصور والوسائط" />
            <SidebarItem id="performance" icon={Zap} label="الأداء والتخزين المؤقت" />
            <SidebarItem id="logs" icon={Activity} label="سجلات النظام" />
            <SidebarItem id="monitoring" icon={LifeBuoy} label="مراقبة النظام" />
            <SidebarItem id="settings" icon={Settings} label="إعدادات النظام" />
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'overview' && 'نظرة عامة'}
              {activeTab === 'tickets' && 'الدعم الفني'}
              {activeTab === 'users' && 'إدارة المستخدمين'}
                  {activeTab === 'businesses' && 'إدارة الشركات'}
              {activeTab === 'payments' && 'المدفوعات والفواتير'}
              {activeTab === 'bots' && 'إعدادات البوتات'}
              {activeTab === 'design' && 'التصميم والألوان'}
              {activeTab === 'seo' && 'SEO وإعدادات الموقع'}
              {activeTab === 'monitoring' && 'مراقبة النظام'}
              {activeTab === 'settings' && 'إعدادات النظام'}
              {activeTab === 'audit' && 'سجل التدقيق'}
            </h2>
            <p className="text-sm text-muted-foreground">
              مرحباً بك في لوحة التحكم المركزية
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                  {notifications}
                </span>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Super Admin
                </p>
                <p className="text-xs text-green-500">Online</p>
              </div>
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800">
                SA
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    المستخدمين
                  </CardTitle>
                  <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +12% من الشهر الماضي
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    الشركات
                  </CardTitle>
                  <Shield className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalBusinesses}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    نشاط تجاري مسجل
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    المحادثات
                  </CardTitle>
                  <MessageSquare className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalConversations}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    محادثة نشطة
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    الرسائل
                  </CardTitle>
                  <Activity className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalMessages}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    رسالة تم معالجتها
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>آخر المستخدمين المسجلين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {user.role}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(user.createdAt).toLocaleDateString(
                              'ar-SA'
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>حالة النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          قاعدة البيانات
                        </span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          خدمات AI
                        </span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">
                          واتساب API
                        </span>
                      </div>
                      <span className="text-xs font-bold text-yellow-600">
                        تحقق
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div>
            <div className="space-y-6">
              {/* Businesses view component */}
              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  {/* Dynamic import to keep admin bundle small could be used, but simple inline import works */}
                  <BusinessesView />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="space-y-6">
              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <PaymentsView />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <div className="space-y-6">
              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <IntegrationsView />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
            {/* Tickets List */}
            <Card className="lg:col-span-1 flex flex-col h-full border-none shadow-md bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>التذاكر المفتوحة</CardTitle>
                <CardDescription>إدارة طلبات الدعم من العملاء</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد تذاكر
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => selectTicket(ticket)}
                      className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTicket?.id === ticket.id ? 'bg-brand-500/10 border-brand-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm truncate">
                          {ticket.subject}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            ticket.status === 'OPEN'
                              ? 'bg-green-100 text-green-700'
                              : ticket.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>{ticket.creator?.name}</span>
                        <span
                          className={`font-medium ${ticket.priority === 'URGENT' ? 'text-red-500' : ''}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-left">
                        {new Date(ticket.updatedAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Ticket Detail */}
            <Card className="lg:col-span-2 flex flex-col h-full border-none shadow-md bg-white dark:bg-gray-800">
              {!selectedTicket ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <LifeBuoy className="w-16 h-16 mb-4 opacity-20" />
                  <p>اختر تذكرة لعرض التفاصيل</p>
                </div>
              ) : (
                <>
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">
                          {selectedTicket.subject}
                        </CardTitle>
                        <CardDescription>
                          {selectedTicket.creator?.name} (
                          {selectedTicket.creator?.email}) -{' '}
                          {selectedTicket.business?.name}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <select
                          className="text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-transparent px-2 py-1"
                          value={selectedTicket.status}
                          onChange={e => updateTicketStatus(e.target.value)}
                        >
                          <option value="OPEN">مفتوحة</option>
                          <option value="IN_PROGRESS">جاري العمل</option>
                          <option value="RESOLVED">تم الحل</option>
                          <option value="CLOSED">مغلقة</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                    {ticketMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-4 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isAdmin ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700'}`}
                        >
                          {msg.isAdmin ? (
                            <Headphones className="w-5 h-5" />
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>
                        <div className={`flex-1 max-w-[80%] space-y-1`}>
                          <div
                            className={`flex items-center gap-2 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}
                          >
                            <span className="text-xs font-bold">
                              {msg.sender?.name ||
                                (msg.isAdmin ? 'الدعم الفني' : 'العميل')}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleString('ar-SA')}
                            </span>
                          </div>
                          <div
                            className={`p-4 rounded-xl shadow-sm text-sm leading-relaxed ${msg.isAdmin ? 'bg-brand-600 text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tr-none'}`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                    <form
                      onSubmit={sendTicketReply}
                      className="flex w-full gap-3"
                    >
                      <Input
                        value={ticketReply}
                        onChange={e => setTicketReply(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        className="flex-1 bg-gray-50 dark:bg-gray-700"
                      />
                      <Button
                        type="submit"
                        disabled={!ticketReply.trim()}
                        className="bg-brand-600 hover:bg-brand-700"
                      >
                        <Share2 className="w-4 h-4 ml-2" /> إرسال
                      </Button>
                    </form>
                  </CardFooter>
                </>
              )}

        {activeTab === 'audit' && (
          <div>
            <div className="space-y-6">
              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <AuditLogsView />
                </div>
              </div>
            </div>
          </div>
        )}
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="border-none shadow-md bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>قائمة المستخدمين ({users.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="بحث عن مستخدم..."
                    className="w-full md:w-64 pr-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <Plus size={16} className="ml-2" /> إضافة مستخدم
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-right">
                      <th className="pb-3 font-medium text-muted-foreground">
                        الاسم
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        البريد الإلكتروني
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        الدور
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        الباقة
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        تاريخ التسجيل
                      </th>
                      <th className="pb-3 font-medium text-muted-foreground">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-4 font-medium">{user.name}</td>
                        <td className="py-4 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'SUPERADMIN'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                : user.role === 'AGENT'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {user.businesses?.[0] && (
                            <select
                              value={user.businesses[0].planType}
                              onChange={e =>
                                handleUpdatePlan(
                                  user.businesses[0].id,
                                  e.target.value
                                )
                              }
                              className="text-xs border rounded p-1 bg-transparent dark:bg-gray-800 dark:border-gray-600"
                            >
                              <option value="TRIAL">Trial</option>
                              <option value="BASIC">Basic</option>
                              <option value="PRO">Pro</option>
                              <option value="AGENCY">Agency</option>
                              <option value="ENTERPRISE">Enterprise</option>
                            </select>
                          )}
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-4 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'bots' && (
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>إدارة نماذج الذكاء الاصطناعي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <Input
                    placeholder="اسم النموذج (مثال: llama3-8b)"
                    value={newModel.name}
                    onChange={e =>
                      setNewModel({ ...newModel, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="API Key"
                    type="password"
                    value={newModel.apiKey}
                    onChange={e =>
                      setNewModel({ ...newModel, apiKey: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Endpoint URL"
                    value={newModel.endpoint}
                    onChange={e =>
                      setNewModel({ ...newModel, endpoint: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Max Tokens"
                    type="number"
                    value={newModel.maxTokens}
                    onChange={e =>
                      setNewModel({ ...newModel, maxTokens: e.target.value })
                    }
                  />
                  <Button
                    onClick={handleAddModel}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    إضافة نموذج
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-right">
                        <th className="pb-3 font-medium">الاسم</th>
                        <th className="pb-3 font-medium">Endpoint</th>
                        <th className="pb-3 font-medium">Max Tokens</th>
                        <th className="pb-3 font-medium">الحالة</th>
                        <th className="pb-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map(model => (
                        <tr
                          key={model.id}
                          className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <td className="py-4 font-medium">{model.name}</td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {model.endpoint || 'Default'}
                          </td>
                          <td className="py-4">{model.maxTokens}</td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${model.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                              onClick={() => handleToggleModel(model.id)}
                            >
                              {model.isActive ? 'نشط' : 'متوقف'}
                            </span>
                          </td>
                          <td className="py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="border-none shadow-md bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>سجلات النظام والأخطاء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm h-[600px] overflow-y-auto bg-gray-900 text-gray-300 p-4 rounded-lg">
                {systemLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    لا توجد سجلات حالياً
                  </div>
                ) : (
                  systemLogs.map(log => (
                    <div
                      key={log.id}
                      className="border-b border-gray-800 pb-2 mb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-1 rounded ${
                            log.level === 'ERROR'
                              ? 'bg-red-900 text-red-300'
                              : log.level === 'WARN'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-blue-900 text-blue-300'
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="break-all">{log.message}</p>
                      {log.context && (
                        <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    حالة النظام
                  </CardTitle>
                  <Activity className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">صحي</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    جميع الخدمات تعمل
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    وقت التشغيل
                  </CardTitle>
                  <Database className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monitoring.system?.uptime?.formatted || 'غير متوفر'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    منذ آخر إعادة تشغيل
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    استخدام الذاكرة
                  </CardTitle>
                  <Bot className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monitoring.system?.memory?.percentage || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {monitoring.system?.memory?.heapUsed || 'غير متوفر'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    التنبيهات
                  </CardTitle>
                  <Bell className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {monitoring.alerts?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    تنبيهات نشطة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Services Status */}
            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>حالة الخدمات</CardTitle>
                <CardDescription>مراقبة حالة جميع خدمات النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        قاعدة البيانات
                      </span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        خدمات AI
                      </span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700 dark:text-yellow-400">
                        Redis Cache
                      </span>
                    </div>
                    <span className="text-xs font-bold text-yellow-600">
                      جاري الفحص
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        الخادم
                      </span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts and Business Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card className="border-none shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>التنبيهات الأخيرة</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('تم مسح جميع التنبيهات')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    مسح الكل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monitoring.alerts?.length > 0 ? (
                      monitoring.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : alert.severity === 'WARNING'
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-700'
                                  : alert.severity === 'WARNING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString('ar-SA')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{alert.type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>لا توجد تنبيهات نشطة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business Metrics */}
              <Card className="border-none shadow-md bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>المقاييس التجارية</CardTitle>
                  <CardDescription>إحصائيات الأداء والاستخدام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium">إجمالي المستخدمين</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {monitoring.business?.users || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium">الشركات النشطة</span>
                      <span className="text-2xl font-bold text-green-600">
                        {monitoring.business?.businesses?.active || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium">إجمالي المحادثات</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {monitoring.business?.conversations || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium">الرسائل (آخر 24 ساعة)</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {monitoring.business?.messages?.last24h || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Providers Status */}
            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>حالة مزودي الذكاء الاصطناعي</CardTitle>
                <CardDescription>مراقبة توفر وأداء نماذج AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Groq', status: 'active', latency: '120ms' },
                    { name: 'Gemini', status: 'active', latency: '95ms' },
                    { name: 'Cerebras', status: 'active', latency: '85ms' },
                    { name: 'DeepSeek', status: 'active', latency: '110ms' },
                  ].map((provider) => (
                    <div
                      key={provider.name}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {provider.latency}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-none shadow-md">
              <CardHeader>
                <CardTitle>إعدادات Twilio WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account SID</label>
                  <Input
                    value={settings.TWILIO_ACCOUNT_SID || ''}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        TWILIO_ACCOUNT_SID: e.target.value,
                      })
                    }
                    placeholder="AC..."
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auth Token</label>
                  <Input
                    type="password"
                    value={settings.TWILIO_AUTH_TOKEN || ''}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        TWILIO_AUTH_TOKEN: e.target.value,
                      })
                    }
                    placeholder="Auth Token"
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    رقم الهاتف (Sandbox/Sender)
                  </label>
                  <Input
                    value={settings.TWILIO_PHONE_NUMBER || ''}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        TWILIO_PHONE_NUMBER: e.target.value,
                      })
                    }
                    placeholder="whatsapp:+14155238886"
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <Button
                  onClick={saveSettings}
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  حفظ إعدادات Twilio
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-none shadow-md">
              <CardHeader>
                <CardTitle>إعدادات API أخرى</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Groq API Key</label>
                  <Input
                    type="password"
                    value={settings.GROQ_API_KEY || ''}
                    onChange={e =>
                      setSettings({ ...settings, GROQ_API_KEY: e.target.value })
                    }
                    placeholder="gsk_..."
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <Button
                  onClick={saveSettings}
                  className="w-full bg-brand-600 hover:bg-brand-700"
                >
                  تحديث المفاتيح
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs placeholders with consistent styling */}
        {['bots', 'design', 'seo'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
            <Settings className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold">قريباً</h3>
            <p>جاري العمل على تطوير هذا القسم</p>
          </div>
        )}

        {/* Footer - Copyright */}
        <footer className="mt-16 pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border/50 space-y-1">
          <p>© {new Date().getFullYear()} فهملي - جميع الحقوق محفوظة</p>
          <p className="text-xs flex items-center justify-center gap-2">
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
                className="w-4 h-4"
                unoptimized
              />
              Ma-Fo
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
