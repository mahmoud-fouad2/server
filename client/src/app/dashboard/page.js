"use client"

import { useEffect, useState } from "react"
import useTheme from '@/lib/theme'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"
import FaheemAnimatedLogo from "@/components/FaheemAnimatedLogo"
import { Check, Loader2, Sun, Moon, AlertTriangle, X, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { businessApi, knowledgeApi, widgetApi } from "@/lib/api"
import AuthGuard from "@/components/AuthGuard"

// Import Sub-components
import StatsOverview from "./components/StatsOverview"
import ConversationsView from "./components/ConversationsView"
import LiveSupportView from "./components/LiveSupportView"
import ChannelsView from "./components/ChannelsView"
import KnowledgeBaseView from "./components/KnowledgeBaseView"
import TicketsView from "./components/TicketsView"
import WidgetSettingsView from "./components/WidgetSettingsView"
import TeamView from "./components/TeamView"
import SettingsView from "./components/SettingsView"

function DashboardContent() {
  const [stats, setStats] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [kbList, setKbList] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isDark, setIsDark] = useTheme(false)
  const [showProAlert, setShowProAlert] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  const router = useRouter()

  useEffect(() => {
    // User is already authenticated by AuthGuard, just load user data
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsData, kbData, chartDataRes] = await Promise.all([
        businessApi.getStats(),
        knowledgeApi.list(),
        businessApi.getChartData()
      ]);

      setStats(statsData.stats)
      setSubscription(statsData.subscription)
      setKbList(kbData)
      setChartData(chartDataRes)
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
      // AuthGuard handles redirect, but if API returns 401, we might need to handle it too
      if (error.message && error.message.includes('401')) {
         router.push('/login');
      }
    } finally {
      setLoading(false)
    }
  }

  const addNotification = (message, type = 'success') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden relative selection:bg-brand-500/30 transition-colors duration-500 bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-white flex flex-col md:flex-row`} dir="rtl">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/8 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/8 rounded-full blur-[120px] animate-float"></div>
      </div>
      
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />

      {/* Notifications */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-lg shadow-lg text-white flex items-center gap-2 min-w-[300px] ${n.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            >
              {n.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        {/* Pro Feature Alert Modal */}
        <AnimatePresence>
          {showProAlert && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-card border border-brand-500/20 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-brand-500/20 to-brand-500/5 p-6 text-center relative">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowProAlert(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-brand-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">ميزة احترافية</h3>
                  <p className="text-sm text-muted-foreground">هذه الميزة متاحة فقط في الباقة الاحترافية</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>إزالة شعار "مدعوم من فهيم"</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>تخصيص كامل للألوان والأيقونات</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>دعم فني مباشر 24/7</span>
                  </div>
                  <Button className="w-full mt-4" onClick={() => { setActiveTab('subscription'); setShowProAlert(false); }}>
                    ترقية الباقة الآن
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex justify-between items-center mb-8 bg-transparent backdrop-blur-md p-2 rounded-md">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <FaheemAnimatedLogo size="small" showText={true} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <span className="hidden md:inline">لوحة التحكم</span>
                <span className="md:hidden">فهملي</span>
              </h1>
              <p className="text-muted-foreground">مرحباً، {user?.name}. إليك ملخص نشاط بوتك الذكي.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsDark(!isDark)} aria-label="Toggle theme" className="h-10 w-10 rounded-full bg-brand-600/10 dark:bg-white/5 flex items-center justify-center hover:bg-brand-600/20 transition-colors">
               {isDark ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-gray-700" />}
             </button>
            <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-brand-50 font-bold">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <StatsOverview 
              key="overview"
              stats={stats} 
              subscription={subscription} 
              kbList={kbList} 
              chartData={chartData} 
              user={user} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === "conversations" && (
            <ConversationsView key="conversations" />
          )}

          {activeTab === "live-support" && (
            <LiveSupportView key="live-support" addNotification={addNotification} />
          )}

          {activeTab === "channels" && (
            <ChannelsView key="channels" addNotification={addNotification} />
          )}

          {activeTab === "knowledge" && (
            <KnowledgeBaseView key="knowledge" addNotification={addNotification} />
          )}

          {activeTab === "tickets" && (
            <TicketsView key="tickets" addNotification={addNotification} />
          )}

          {activeTab === "widget" && (
            <WidgetSettingsView key="widget" user={user} addNotification={addNotification} setShowProAlert={setShowProAlert} />
          )}

          {activeTab === "team" && (
            <TeamView key="team" addNotification={addNotification} />
          )}

          {activeTab === "settings" && (
            <SettingsView key="settings" user={user} addNotification={addNotification} />
          )}

          {activeTab === "subscription" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="subscription" className="space-y-8">
               <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">إدارة الاشتراك</h2>
                  <p className="text-muted-foreground">قريباً...</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
