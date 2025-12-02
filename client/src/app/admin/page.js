"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Bot, Settings, Database, Activity, Shield, LogOut, Search, Save, Trash2, Edit, Plus, Palette, Globe, MessageSquare, Image as ImageIcon, Sun, Moon, Bell, CheckCircle, XCircle, Loader2, LifeBuoy, Share2, Headphones, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import useTheme from '@/lib/theme';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDark, setIsDark] = useTheme(false); // Default light
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalConversations: 0,
    totalMessages: 0
  });
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState(5); // Mock notification count
  const [settings, setSettings] = useState({});
  const [aiModels, setAiModels] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [newModel, setNewModel] = useState({ name: '', apiKey: '', endpoint: '', maxTokens: 1000, priority: 0 });
  const [ticketCount, setTicketCount] = useState(0);
  
  // Ticket System State
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketReply, setTicketReply] = useState('');

  useEffect(() => {
    if (activeTab === 'settings') {
      const token = localStorage.getItem('token');
      if (token) fetchSettings(token);
    }
    if (activeTab === 'bots') {
      const token = localStorage.getItem('token');
      if (token) fetchAiModels(token);
    }
    if (activeTab === 'logs') {
      const token = localStorage.getItem('token');
      if (token) fetchLogs(token);
    }
    if (activeTab === 'tickets') {
      const token = localStorage.getItem('token');
      if (token) fetchTickets(token);
    }
  }, [activeTab]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/admin/login');
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'SUPERADMIN') {
        router.push('/dashboard'); // Redirect non-admins
        return;
      }

      // Fetch Data
      await Promise.all([fetchStats(token), fetchUsers(token), fetchTicketCount(token)]);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchTicketCount = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/tickets/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
        setTicketCount(count);
      }
    } catch (err) {
      console.error("Failed to fetch ticket count", err);
    }
  };

  const fetchStats = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchUsers = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchSettings = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchAiModels = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/ai-models', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAiModels(await res.json());
    } catch (err) {
      console.error("Failed to fetch AI models", err);
    }
  };

  const fetchLogs = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSystemLogs(await res.json());
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const fetchTickets = async (token) => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/tickets/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/tickets/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(data.messages);
        // Mark as read or update local state if needed
      }
    } catch (err) {
      console.error("Failed to fetch ticket details", err);
    }
  };

  const sendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: ticketReply })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setTicketMessages([...ticketMessages, newMessage]);
        setTicketReply('');
        // Refresh tickets list to update status/counts
        fetchTickets(token);
      }
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  const updateTicketStatus = async (status) => {
    if (!selectedTicket) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket({...selectedTicket, status: updated.status});
        fetchTickets(token); // Refresh list
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleUpdatePlan = async (businessId, planType) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/admin/business/${businessId}/plan`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });
      if (res.ok) {
        fetchUsers(token); // Refresh list
      }
    } catch (err) {
      console.error("Failed to update plan", err);
    }
  };

  const handleAddModel = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/ai-models', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newModel)
      });
      if (res.ok) {
        alert('تم إضافة النموذج بنجاح');
        setNewModel({ name: '', apiKey: '', endpoint: '', maxTokens: 1000, priority: 0 });
        fetchAiModels(token);
      }
    } catch (err) {
      console.error("Failed to add model", err);
    }
  };

  const handleDeleteModel = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://fahimo-api.onrender.com/api/admin/ai-models/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAiModels(token);
    } catch (err) {
      console.error("Failed to delete model", err);
    }
  };

  const handleToggleModel = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://fahimo-api.onrender.com/api/admin/ai-models/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAiModels(token);
    } catch (err) {
      console.error("Failed to toggle model", err);
    }
  };

  const saveSettings = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error("Failed to save settings", err);
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
      onClick={() => setActiveTab(id)}
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex`} dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0 shadow-lg z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <div>
            <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">Super Admin</h1>
            <p className="text-xs text-muted-foreground">Control Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
          <SidebarItem id="settings" icon={Settings} label="إعدادات النظام" />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full px-4 py-2 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'overview' && 'نظرة عامة'}
              {activeTab === 'tickets' && 'الدعم الفني'}
              {activeTab === 'users' && 'إدارة المستخدمين'}
              {activeTab === 'bots' && 'إعدادات البوتات'}
              {activeTab === 'design' && 'التصميم والألوان'}
              {activeTab === 'seo' && 'SEO وإعدادات الموقع'}
              {activeTab === 'settings' && 'إعدادات النظام'}
            </h2>
            <p className="text-sm text-muted-foreground">مرحباً بك في لوحة التحكم المركزية</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
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
                <p className="text-sm font-bold text-gray-900 dark:text-white">Super Admin</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">المستخدمين</CardTitle>
                  <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% من الشهر الماضي</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">الشركات</CardTitle>
                  <Shield className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                  <p className="text-xs text-muted-foreground mt-1">نشاط تجاري مسجل</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">المحادثات</CardTitle>
                  <MessageSquare className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConversations}</div>
                  <p className="text-xs text-muted-foreground mt-1">محادثة نشطة</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">الرسائل</CardTitle>
                  <Activity className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">رسالة تم معالجتها</p>
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
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
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
                        <span className="font-medium text-green-700 dark:text-green-400">قاعدة البيانات</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-400">خدمات AI</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">واتساب API</span>
                      </div>
                      <span className="text-xs font-bold text-yellow-600">تحقق</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  <div className="text-center py-8 text-muted-foreground">لا توجد تذاكر</div>
                ) : (
                  tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => selectTicket(ticket)}
                      className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTicket?.id === ticket.id ? 'bg-brand-500/10 border-brand-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm truncate">{ticket.subject}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>{ticket.creator?.name}</span>
                        <span className={`font-medium ${ticket.priority === 'URGENT' ? 'text-red-500' : ''}`}>
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
                        <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                        <CardDescription>
                          {selectedTicket.creator?.name} ({selectedTicket.creator?.email}) - {selectedTicket.business?.name}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <select 
                          className="text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-transparent px-2 py-1"
                          value={selectedTicket.status}
                          onChange={(e) => updateTicketStatus(e.target.value)}
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
                      <div key={i} className={`flex gap-4 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isAdmin ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700'}`}>
                          {msg.isAdmin ? <Headphones className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div className={`flex-1 max-w-[80%] space-y-1`}>
                          <div className={`flex items-center gap-2 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}>
                            <span className="text-xs font-bold">{msg.sender?.name || (msg.isAdmin ? 'الدعم الفني' : 'العميل')}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString('ar-SA')}</span>
                          </div>
                          <div className={`p-4 rounded-xl shadow-sm text-sm leading-relaxed ${msg.isAdmin ? 'bg-brand-600 text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tr-none'}`}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                    <form onSubmit={sendTicketReply} className="flex w-full gap-3">
                      <Input 
                        value={ticketReply} 
                        onChange={(e) => setTicketReply(e.target.value)} 
                        placeholder="اكتب ردك هنا..." 
                        className="flex-1 bg-gray-50 dark:bg-gray-700"
                      />
                      <Button type="submit" disabled={!ticketReply.trim()} className="bg-brand-600 hover:bg-brand-700">
                        <Share2 className="w-4 h-4 ml-2" /> إرسال
                      </Button>
                    </form>
                  </CardFooter>
                </>
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
                  <Input placeholder="بحث عن مستخدم..." className="w-64 pr-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
                </div>
                <Button className="bg-brand-600 hover:bg-brand-700"><Plus size={16} className="ml-2" /> إضافة مستخدم</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-right">
                      <th className="pb-3 font-medium text-muted-foreground">الاسم</th>
                      <th className="pb-3 font-medium text-muted-foreground">البريد الإلكتروني</th>
                      <th className="pb-3 font-medium text-muted-foreground">الدور</th>
                      <th className="pb-3 font-medium text-muted-foreground">الباقة</th>
                      <th className="pb-3 font-medium text-muted-foreground">تاريخ التسجيل</th>
                      <th className="pb-3 font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 font-medium">{user.name}</td>
                        <td className="py-4 text-muted-foreground">{user.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                            user.role === 'AGENT' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {user.businesses?.[0] && (
                            <select 
                              value={user.businesses[0].planType}
                              onChange={(e) => handleUpdatePlan(user.businesses[0].id, e.target.value)}
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
                        <td className="py-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('ar-SA')}</td>
                        <td className="py-4 flex gap-2">
                          <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit size={16} /></Button>
                          <Button variant="ghost" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></Button>
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
              <CardHeader><CardTitle>إدارة نماذج الذكاء الاصطناعي</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <Input placeholder="اسم النموذج (مثال: llama3-8b)" value={newModel.name} onChange={(e) => setNewModel({...newModel, name: e.target.value})} />
                  <Input placeholder="API Key" type="password" value={newModel.apiKey} onChange={(e) => setNewModel({...newModel, apiKey: e.target.value})} />
                  <Input placeholder="Endpoint URL" value={newModel.endpoint} onChange={(e) => setNewModel({...newModel, endpoint: e.target.value})} />
                  <Input placeholder="Max Tokens" type="number" value={newModel.maxTokens} onChange={(e) => setNewModel({...newModel, maxTokens: e.target.value})} />
                  <Button onClick={handleAddModel} className="bg-brand-600 hover:bg-brand-700">إضافة نموذج</Button>
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
                        <tr key={model.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <td className="py-4 font-medium">{model.name}</td>
                          <td className="py-4 text-sm text-muted-foreground">{model.endpoint || 'Default'}</td>
                          <td className="py-4">{model.maxTokens}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${model.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} onClick={() => handleToggleModel(model.id)}>
                              {model.isActive ? 'نشط' : 'متوقف'}
                            </span>
                          </td>
                          <td className="py-4">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteModel(model.id)}>
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
            <CardHeader><CardTitle>سجلات النظام والأخطاء</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm h-[600px] overflow-y-auto bg-gray-900 text-gray-300 p-4 rounded-lg">
                {systemLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">لا توجد سجلات حالياً</div>
                ) : (
                  systemLogs.map(log => (
                    <div key={log.id} className="border-b border-gray-800 pb-2 mb-2 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1 rounded ${
                          log.level === 'ERROR' ? 'bg-red-900 text-red-300' : 
                          log.level === 'WARN' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'
                        }`}>
                          {log.level}
                        </span>
                        <span className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
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

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>إعدادات الأداء والتخزين المؤقت (Caching)</CardTitle>
                <CardDescription>تحسين سرعة الموقع وتقليل الحمل على الخادم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="space-y-1">
                    <h4 className="font-bold">تفعيل التخزين المؤقت للملفات الثابتة</h4>
                    <p className="text-sm text-muted-foreground">يتم تخزين الصور وملفات CSS/JS في متصفح الزائر لمدة 24 ساعة.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">مفعل تلقائياً</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="space-y-1">
                    <h4 className="font-bold">مسح ذاكرة التخزين المؤقت (Cache Purge)</h4>
                    <p className="text-sm text-muted-foreground">اضغط هنا إذا قمت بتحديث صور أو ملفات ولم تظهر التغييرات للزوار.</p>
                  </div>
                  <Button variant="outline" onClick={() => alert('تم إرسال طلب مسح الكاش بنجاح!')}>
                    <Trash2 className="w-4 h-4 ml-2" />
                    مسح الكاش الآن
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="space-y-1">
                    <h4 className="font-bold">ضغط الملفات (Gzip/Brotli)</h4>
                    <p className="text-sm text-muted-foreground">تقليل حجم الملفات المرسلة لتسريع التحميل.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">مفعل (Express)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 border-none shadow-md">
              <CardHeader><CardTitle>إعدادات Twilio WhatsApp</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account SID</label>
                  <Input 
                    value={settings.TWILIO_ACCOUNT_SID || ''} 
                    onChange={(e) => setSettings({...settings, TWILIO_ACCOUNT_SID: e.target.value})}
                    placeholder="AC..."
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auth Token</label>
                  <Input 
                    type="password"
                    value={settings.TWILIO_AUTH_TOKEN || ''} 
                    onChange={(e) => setSettings({...settings, TWILIO_AUTH_TOKEN: e.target.value})}
                    placeholder="Auth Token"
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الهاتف (Sandbox/Sender)</label>
                  <Input 
                    value={settings.TWILIO_PHONE_NUMBER || ''} 
                    onChange={(e) => setSettings({...settings, TWILIO_PHONE_NUMBER: e.target.value})}
                    placeholder="whatsapp:+14155238886"
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <Button onClick={saveSettings} className="w-full bg-brand-600 hover:bg-brand-700">حفظ إعدادات Twilio</Button>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-none shadow-md">
              <CardHeader><CardTitle>إعدادات API أخرى</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Groq API Key</label>
                  <Input 
                    type="password" 
                    value={settings.GROQ_API_KEY || ''}
                    onChange={(e) => setSettings({...settings, GROQ_API_KEY: e.target.value})}
                    placeholder="gsk_..." 
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <Button onClick={saveSettings} className="w-full bg-brand-600 hover:bg-brand-700">تحديث المفاتيح</Button>
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
      </main>
    </div>
  );
}
