"use client"

import { useEffect, useState, useRef } from "react"
import useTheme from '@/lib/theme'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Sidebar from "@/components/Sidebar"
import FaheemAnimatedLogo from "@/components/FaheemAnimatedLogo"
import { MessageSquare, Copy, Check, Loader2, TrendingUp, Users, Zap, Upload, Link as LinkIcon, FileText, Settings, Play, Save, RefreshCw, Sun, Moon, Globe, Trash2, Sparkles, User, CreditCard, Crown, Clock, AlertTriangle, X, Bot, Headphones, Briefcase, Code, Share2, Phone, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BRAND } from '../../constants'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isDark, setIsDark] = useTheme(false)
  const [showProAlert, setShowProAlert] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  // Telegram State
  const [telegramToken, setTelegramToken] = useState("")
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false)
  const [telegramIntegration, setTelegramIntegration] = useState(null)
  const [showTelegramInput, setShowTelegramInput] = useState(false)

  // Tickets State
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketMessages, setTicketMessages] = useState([])
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'MEDIUM' })
  const [ticketReply, setTicketReply] = useState('')
  const [creatingTicket, setCreatingTicket] = useState(false)

  // Conversations State
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [replyInput, setReplyInput] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [handoverRequests, setHandoverRequests] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '' })
  const [addingMember, setAddingMember] = useState(false)
  const audioRef = useRef(null)

  // Helper for relative time
  const timeAgo = (date) => {
    if (!date) return 'غير معروف';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
    return "منذ لحظات";
  };

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations()
    }
    if (activeTab === 'live-support') {
      fetchHandoverRequests()
      // Poll every 10 seconds
      const interval = setInterval(fetchHandoverRequests, 10000)
      return () => clearInterval(interval)
    }
    if (activeTab === 'channels') {
      fetchIntegrations()
    }
    if (activeTab === 'tickets') {
      fetchTickets()
    }
  }, [activeTab])

  const fetchTickets = async () => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/tickets/my-tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) setTickets(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setCreatingTicket(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(newTicket)
      })
      if (res.ok) {
        addNotification("تم إنشاء التذكرة بنجاح")
        setNewTicket({ subject: '', message: '', priority: 'MEDIUM' })
        fetchTickets()
      } else {
        addNotification("فشل إنشاء التذكرة", 'error')
      }
    } catch (err) {
      addNotification("خطأ في الاتصال", 'error')
    } finally {
      setCreatingTicket(false)
    }
  }

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket)
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/tickets/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTicketMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sendTicketReply = async (e) => {
    e.preventDefault()
    if (!ticketReply.trim()) return
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ message: ticketReply })
      })
      if (res.ok) {
        const newMsg = await res.json()
        setTicketMessages(prev => [...prev, newMsg])
        setTicketReply("")
      }
    } catch (err) {
      addNotification("فشل الإرسال", 'error')
    }
  }

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/business/integrations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        const telegram = data.find(i => i.type === 'TELEGRAM')
        setTelegramIntegration(telegram)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleTelegramConnect = async () => {
    if (!telegramToken) return
    setIsConnectingTelegram(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/telegram/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ token: telegramToken })
      })
      const data = await res.json()
      if (res.ok) {
        addNotification("تم ربط بوت تيليجرام بنجاح")
        setTelegramIntegration({ isActive: true, config: { botInfo: data.bot } })
        setShowTelegramInput(false)
        setTelegramToken("")
      } else {
        addNotification(data.error || "فشل الربط", 'error')
      }
    } catch (err) {
      addNotification("خطأ في الاتصال", 'error')
    } finally {
      setIsConnectingTelegram(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/team', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) setTeamMembers(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAddingMember(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/team', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(newMember)
      })
      if (res.ok) {
        addNotification("تم إضافة الموظف بنجاح")
        setNewMember({ name: '', email: '', password: '' })
        fetchTeamMembers()
      } else {
        const data = await res.json()
        addNotification(data.error || "فشل الإضافة", 'error')
      }
    } catch (err) {
      addNotification("خطأ في الاتصال", 'error')
    } finally {
      setAddingMember(false)
    }
  }

  const handleDeleteMember = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/team/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        addNotification("تم الحذف بنجاح")
        fetchTeamMembers()
      }
    } catch (err) {
      addNotification("فشل الحذف", 'error')
    }
  }

  const fetchHandoverRequests = async () => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/chat/handover-requests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Check if new request came in to play sound
        if (data.length > handoverRequests.length) {
           playNotificationSound()
           addNotification("طلب دعم جديد!", "success")
        }
        setHandoverRequests(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
  }

  const fetchConversations = async () => {
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) setConversations(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const selectConversation = async (conv) => {
    setSelectedConversation(conv)
    try {
      const res = await fetch(`https://fahimo-api.onrender.com/api/chat/${conv.id}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) setConversationMessages(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!replyInput.trim() || !selectedConversation) return
    setSendingReply(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/chat/reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ conversationId: selectedConversation.id, message: replyInput })
      })
      if (res.ok) {
        const newMsg = await res.json()
        setConversationMessages(prev => [...prev, newMsg])
        setReplyInput("")
      }
    } catch (err) {
      addNotification("فشل الإرسال", 'error')
    } finally {
      setSendingReply(false)
    }
  }

  const addNotification = (message, type = 'success') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }
  
  // Knowledge Base State
  const [kbList, setKbList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [textTitle, setTextTitle] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [kbTab, setKbTab] = useState("text")
  const [chartData, setChartData] = useState([])

  // Widget Settings State
  const [widgetConfig, setWidgetConfig] = useState({
    welcomeMessage: "",
    primaryColor: "#000000",
    personality: "friendly",
    showBranding: true,
    avatar: "robot" // Default avatar
  })
  const [savingConfig, setSavingConfig] = useState(false)

  // Profile & Settings State
  const [profileData, setProfileData] = useState({ name: "", email: "", password: "" })
  const [businessData, setBusinessData] = useState({ name: "", activityType: "", botTone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // Playground State
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const chatEndRef = useRef(null)

  const router = useRouter()

  // Theme handled by shared `useTheme` hook

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    // Auto-setup demo credentials if none exist
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setProfileData({ name: parsedUser.name, email: parsedUser.email, password: "" })
    }

    fetchData(token)
  }, [router])

  const fetchData = async (token) => {
    try {
      // Fetch Stats
      const statsRes = await fetch('https://fahimo-api.onrender.com/api/business/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (statsRes.status === 401 || statsRes.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const statsData = await statsRes.json()
      setStats(statsData.stats)
      setRecentActivity(statsData.recentActivity || [])
      setSubscription(statsData.subscription)

      // Fetch Knowledge Base
      const kbRes = await fetch('https://fahimo-api.onrender.com/api/knowledge', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (kbRes.ok) setKbList(await kbRes.json())

      // Fetch Chart Data
      const chartRes = await fetch('https://fahimo-api.onrender.com/api/business/chart-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (chartRes.ok) setChartData(await chartRes.json())

      // Fetch Widget Config & Business Settings
      const storedUser = JSON.parse(localStorage.getItem('user'))
      if (storedUser?.businessId) {
        const configRes = await fetch(`https://fahimo-api.onrender.com/api/widget/config/${storedUser.businessId}`)
        if (configRes.ok) {
          const data = await configRes.json()
          setWidgetConfig(prev => ({ ...prev, ...(data?.widgetConfig || {}) }))
        }

        const settingsRes = await fetch('https://fahimo-api.onrender.com/api/business/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (settingsRes.ok) {
          const business = await settingsRes.json()
          if (business) {
            setBusinessData({ 
              name: business.name, 
              activityType: business.activityType, 
              botTone: business.botTone 
            })
          }
        }
      }

    } catch (error) {
      console.error('Failed to fetch data', error)
      // Removed offline mode fallback to prevent unauthorized access
    } finally {
      setLoading(false)
    }
  }

  // ... (Keep existing handlers: handleFileUpload, handleTextSubmit, handleUrlSubmit, handleDeleteKb) ...
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        addNotification("تم رفع الملف بنجاح")
        fetchData(localStorage.getItem('token'))
        e.target.value = null // Reset input
      } else {
        addNotification(`فشل الرفع: ${data.error || 'خطأ غير معروف'}`, 'error')
      }
    } catch (err) {
      addNotification("حدث خطأ: " + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput) return
    setUploading(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/knowledge/text', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ text: textInput, title: textTitle })
      })
      const data = await res.json()
      if (res.ok) {
        addNotification("تم إضافة النص بنجاح")
        setTextInput("")
        setTextTitle("")
        fetchData(localStorage.getItem('token'))
      } else {
        addNotification(`فشل: ${data.error || 'خطأ غير معروف'}`, 'error')
      }
    } catch (err) {
      addNotification("حدث خطأ: " + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput) return
    setUploading(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/knowledge/url', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ url: urlInput })
      })
      const data = await res.json()
      if (res.ok) {
        addNotification("تم استجلاب الرابط بنجاح")
        setUrlInput("")
        fetchData(localStorage.getItem('token'))
      } else {
        addNotification(`فشل: ${data.error || 'خطأ غير معروف'}`, 'error')
      }
    } catch (err) {
      addNotification("حدث خطأ: " + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteKb = async (id) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return
    try {
      await fetch(`https://fahimo-api.onrender.com/api/knowledge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      fetchData(localStorage.getItem('token'))
      addNotification("تم الحذف بنجاح")
    } catch (err) {
      addNotification("فشل الحذف", 'error')
    }
  }

  const saveWidgetConfig = async () => {
    setSavingConfig(true)
    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/widget/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(widgetConfig)
      })
      if (res.ok) addNotification("تم حفظ الإعدادات")
    } catch (err) {
      addNotification("فشل الحفظ", 'error')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleIconUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('icon', file)

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/widget/upload-icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setWidgetConfig(prev => ({ ...prev, customIconUrl: data.url, avatar: 'custom' }))
        addNotification("تم رفع الأيقونة بنجاح")
      } else {
        addNotification("فشل رفع الأيقونة", 'error')
      }
    } catch (err) {
      addNotification("خطأ في الاتصال", 'error')
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      // Update User
      const userRes = await fetch('https://fahimo-api.onrender.com/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(profileData)
      })
      
      // Update Business
      const businessRes = await fetch('https://fahimo-api.onrender.com/api/business/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(businessData)
      })

      if (userRes.ok && businessRes.ok) {
        addNotification("تم تحديث البيانات بنجاح")
        // Update local storage user
        const updatedUser = await userRes.json()
        const currentUser = JSON.parse(localStorage.getItem('user'))
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser.user }))
      } else {
        addNotification("حدث خطأ أثناء التحديث", 'error')
      }
    } catch (err) {
      addNotification("خطأ: " + err.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const newMessage = { role: 'user', content: chatInput }
    setChatHistory([...chatHistory, newMessage])
    setChatInput("")
    setChatLoading(true)

    if (!user?.businessId) {
      addNotification("خطأ: معرف العمل مفقود. يرجى تسجيل الدخول مرة أخرى.", 'error');
      setChatLoading(false);
      return;
    }

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: chatInput, 
          businessId: user.businessId,
          conversationId: conversationId // Send existing conversation ID
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Server Error");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId) // Save conversation ID for next message
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || "عذراً، لم أتلق رداً من الخادم." }])
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `عذراً، حدث خطأ: ${err.message}` }])
    } finally {
      setChatLoading(false)
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const copyWidgetCode = () => {
    const businessId = user?.businessId || 'YOUR_BUSINESS_ID' 
    const code = `<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${businessId}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    addNotification("تم نسخ الكود")
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
      {/* Decorative background blurs like landing page for visual parity */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-600/8 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/8 rounded-full blur-[120px] animate-float"></div>
      </div>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full bg-brand-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-[100px]"></div>
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full bg-brand-400/3 blur-[80px] transform -translate-x-1/2 -translate-y-1/2"></div>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="overview">
              {/* Usage Bar Section */}
              <div className="mb-8 glass-panel smooth-transition soft-shadow rounded-xl p-6">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h2 className="text-lg font-semibold">الرصيد المستخدم</h2>
                    <p className="text-sm text-muted-foreground">تاريخ التجديد: {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-brand-500">{subscription?.messagesUsed || 0}</span>
                    <span className="text-muted-foreground"> / {subscription?.messageQuota || 2000}</span>
                  </div>
                </div>
                <div className="w-full bg-muted h-4 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((subscription?.messagesUsed || 0) / (subscription?.messageQuota || 2000)) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full"
                  ></motion.div>
                </div>
                <div className="text-right mt-1 text-xs text-muted-foreground">تم استخدام {Math.round(((subscription?.messagesUsed || 0) / (subscription?.messageQuota || 2000)) * 100)}%</div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="glass-panel glass-panel-hover smooth-transition">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                      الباقة الحالية
                      <div className="p-2 bg-brand-500/10 rounded-lg"><Crown className="h-4 w-4 text-brand-500" /></div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subscription?.planType === 'TRIAL' && 'تجريبية'}
                      {subscription?.planType === 'BASIC' && 'الأساسية'}
                      {subscription?.planType === 'PRO' && 'الاحترافية'}
                      {subscription?.planType === 'ENTERPRISE' && 'الشركات'}
                      {subscription?.planType === 'AGENCY' && 'الوكالات'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subscription?.trialEndsAt 
                        ? `تنتهي في ${new Date(subscription.trialEndsAt).toLocaleDateString('ar-SA')}`
                        : 'اشتراك نشط'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glass-panel glass-panel-hover smooth-transition">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                      الرصيد المتبقي
                      <div className="p-2 bg-green-500/10 rounded-lg"><MessageSquare className="h-4 w-4 text-green-500" /></div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(subscription?.messageQuota || 0) - (subscription?.messagesUsed || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">رسالة متاحة</p>
                  </CardContent>
                </Card>

                <Card className="glass-panel glass-panel-hover smooth-transition">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                      إجمالي المحادثات
                      <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="h-4 w-4 text-purple-500" /></div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">محادثة مسجلة</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Sources List */}
                <Card className="lg:col-span-1 h-full glass-panel smooth-transition">
                  <CardHeader>
                    <CardTitle>المصادر النشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {kbList.slice(0, 3).map((kb) => (
                        <div key={kb.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                            <div className="truncate">
                              <p className="font-medium text-sm truncate">
                                {kb.metadata?.filename || kb.metadata?.title || kb.metadata?.url || "بدون عنوان"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {kb.type === 'PDF' ? `تمت المعالجة · ${kb.metadata?.pageCount || '?'} صفحة` : `نشط · ${timeAgo(kb.updatedAt)}`}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-1 bg-muted rounded uppercase">{kb.type}</span>
                        </div>
                      ))}
                      {kbList.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                          لا يوجد مصادر نشطة
                        </div>
                      )}
                      <div className="pt-4 border-t border-dashed">
                        <p className="text-xs text-muted-foreground mb-3">أضف المزيد من المصادر لتحسين الدقة</p>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('knowledge')}>رفع جديد</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Traffic Analysis Chart (Real) */}
                <Card className="lg:col-span-2 glass-panel smooth-transition">
                  <CardHeader>
                    <CardTitle>تحليل المحادثات (آخر 7 أيام)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 px-2">
                      {chartData.length > 0 ? chartData.map((item, i) => (
                        <div key={i} className="w-full bg-brand-500/10 rounded-t-lg relative group hover:bg-brand-500/20 transition-colors flex flex-col justify-end items-center" style={{ height: '100%' }}>
                          <div className="mb-2 font-bold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</div>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((item.count / Math.max(...chartData.map(d => d.count), 1)) * 100, 5)}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                            className="w-full bg-brand-500 rounded-t-lg opacity-80 group-hover:opacity-100"
                          ></motion.div>
                          <div className="mt-2 text-xs text-muted-foreground">{item.date}</div>
                        </div>
                      )) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          لا توجد بيانات كافية للعرض
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Embed Code Section - Moved here for visibility */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>كود التضمين</CardTitle>
                    <CardDescription>انسخ هذا الكود وضعه في وسم body في موقعك</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative group" dir="ltr">
                      <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all border border-border">
                        &lt;script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="{user?.businessId}"&gt;&lt;/script&gt;
                      </div>
                      <Button 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={copyWidgetCode}
                      >
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? "تم النسخ" : "نسخ"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "conversations" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="conversations" className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
              {/* Conversations List */}
              <Card className="lg:col-span-1 flex flex-col h-full">
                <CardHeader>
                  <CardTitle>المحادثات النشطة</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد محادثات</div>
                  ) : (
                    conversations.map(conv => (
                      <div 
                        key={conv.id} 
                        onClick={() => selectConversation(conv)}
                        className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-muted'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">زائر #{conv.id.slice(-4)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {conv.messages[0]?.content || 'لا توجد رسائل'}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Chat Window */}
              <Card className="lg:col-span-2 flex flex-col h-full">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">زائر #{selectedConversation.id.slice(-4)}</CardTitle>
                          <CardDescription className="text-xs">عبر {selectedConversation.channel}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                      {conversationMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'ASSISTANT' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            {msg.role === 'ASSISTANT' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'ASSISTANT' ? 'bg-brand-500 text-white rounded-tl-none' : 'bg-white dark:bg-gray-800 border border-border rounded-tr-none'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="border-t p-3">
                      <form onSubmit={sendReply} className="flex w-full gap-2">
                        <Input 
                          value={replyInput} 
                          onChange={(e) => setReplyInput(e.target.value)} 
                          placeholder="اكتب ردك هنا..." 
                          className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <Button type="submit" disabled={sendingReply || !replyInput.trim()}>
                          {sendingReply ? <Loader2 className="animate-spin" /> : 'إرسال'}
                        </Button>
                      </form>
                    </CardFooter>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
                    <MessageSquare className="w-12 h-12 opacity-20" />
                    <p>اختر محادثة للبدء</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === "live-support" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="live-support" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">الدعم المباشر (Live Agent)</h2>
                  <p className="text-muted-foreground">إدارة طلبات التحويل للموظفين</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    النظام نشط
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>طلبات الانتظار</CardTitle>
                  <CardDescription>العملاء الذين يطلبون التحدث مع موظف</CardDescription>
                </CardHeader>
                <CardContent>
                  {handoverRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Headphones className="w-8 h-8 opacity-50" />
                      </div>
                      <p>لا توجد طلبات انتظار حالياً</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mock Request for UI Demo if empty */}
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold">أحمد محمد</h4>
                            <p className="text-sm text-muted-foreground">مشكلة في الدفع - منذ 5 دقائق</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">تجاهل</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">قبول المحادثة</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "channels" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="channels" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">قنوات الاتصال</h2>
                <p className="text-muted-foreground">ربط البوت بتطبيقات المحادثة</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WhatsApp Card */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle>WhatsApp Business</CardTitle>
                          <CardDescription>الرد الآلي على واتساب</CardDescription>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">غير متصل</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                      اربط حساب واتساب للأعمال الخاص بك لتمكين الرد الآلي على استفسارات العملاء 24/7.
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <LinkIcon className="w-4 h-4 ml-2" />
                      ربط الحساب (QR Code)
                    </Button>
                  </CardContent>
                </Card>

                {/* Telegram Card */}
                <Card className={`border-l-4 ${telegramIntegration?.isActive ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${telegramIntegration?.isActive ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          <Share2 className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle>Telegram Bot</CardTitle>
                          <CardDescription>الرد الآلي على تيليجرام</CardDescription>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${telegramIntegration?.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {telegramIntegration?.isActive ? 'متصل' : 'غير متصل'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {telegramIntegration?.isActive ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-700 dark:text-green-400">البوت متصل بنجاح</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            اسم البوت: <span className="font-mono font-bold">{telegramIntegration.config?.botInfo?.username || 'Unknown'}</span>
                          </p>
                        </div>
                        <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                           // Implement disconnect logic if needed
                           alert('لإلغاء الربط، يرجى التواصل مع الدعم الفني');
                        }}>
                          إلغاء الربط
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-6">
                          أنشئ بوت على تيليجرام واربطه هنا للرد على المشتركين في قناتك أو مجموعتك.
                        </p>
                        {!showTelegramInput ? (
                          <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => setShowTelegramInput(true)}>
                            <LinkIcon className="w-4 h-4 ml-2" />
                            إضافة توكن البوت
                          </Button>
                        ) : (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Bot Token</label>
                              <Input 
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                className="font-mono text-sm"
                              />
                              <p className="text-[10px] text-muted-foreground">احصل عليه من @BotFather</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1 bg-blue-500 hover:bg-blue-600" 
                                onClick={handleTelegramConnect}
                                disabled={isConnectingTelegram || !telegramToken}
                              >
                                {isConnectingTelegram ? <Loader2 className="animate-spin" /> : 'ربط الآن'}
                              </Button>
                              <Button variant="ghost" onClick={() => setShowTelegramInput(false)}>إلغاء</Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "knowledge" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="knowledge" className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
              
              {/* Left Column: Active Sources */}
              <Card className="lg:col-span-1 flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">المصادر النشطة ({kbList.length})</CardTitle>
                  <div className="p-2 bg-muted rounded-lg"><FileText className="w-4 h-4" /></div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {kbList.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">قاعدة المعرفة فارغة</p>
                        <p className="text-xs mt-1">أضف نصوصاً أو روابط لتدريب البوت</p>
                      </div>
                    ) : (
                      kbList.map((kb) => (
                        <div key={kb.id} className="group flex items-center justify-between p-3 bg-card border border-border hover:border-brand-500/50 transition-all rounded-xl shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              kb.type === 'PDF' ? 'bg-red-500/10 text-red-500' : 
                              kb.type === 'URL' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                            }`}>
                              {kb.type === 'PDF' && <FileText className="w-5 h-5" />}
                              {kb.type === 'URL' && <Globe className="w-5 h-5" />}
                              {kb.type === 'TEXT' && <FileText className="w-5 h-5" />}
                            </div>
                            <div className="truncate">
                              <p className="font-medium text-sm truncate max-w-[150px]">
                                {kb.metadata?.filename || kb.metadata?.title || kb.metadata?.url || "بدون عنوان"}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kb.type}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteKb(kb.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Input Area */}
              <Card className="lg:col-span-2 flex flex-col h-full border-brand-500/20 shadow-lg">
                <div className="flex border-b border-border">
                  <button 
                    onClick={() => setKbTab('text')}
                    className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'text' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <FileText className="w-4 h-4 inline-block ml-2" />
                    نص (Text)
                  </button>
                  <button 
                    onClick={() => setKbTab('url')}
                    className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'url' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <Globe className="w-4 h-4 inline-block ml-2" />
                    رابط (URL)
                  </button>
                  <button 
                    onClick={() => setKbTab('pdf')}
                    className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 ${kbTab === 'pdf' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}
                  >
                    <Upload className="w-4 h-4 inline-block ml-2" />
                    ملف (PDF)
                  </button>
                </div>

                <CardContent className="flex-1 p-6">
                  <AnimatePresence mode="wait">
                    {kbTab === 'text' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="text" className="space-y-4 h-full flex flex-col">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">العنوان / الموضوع</label>
                          <Input 
                            placeholder="مثال: سياسة الاسترجاع" 
                            value={textTitle} 
                            onChange={(e) => setTextTitle(e.target.value)} 
                            className="bg-white dark:bg-gray-800 border-border focus:bg-background transition-colors text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col">
                          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">المحتوى</label>
                          <textarea 
                            className="flex-1 w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-background transition-colors resize-none text-sm leading-relaxed focus:ring-2 focus:ring-brand-500/20 outline-none" 
                            placeholder="الصق النص هنا... يمكنك إضافة معلومات عن عملك، الأسعار، الخدمات، أو أي شيء تريد أن يعرفه البوت."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                          ></textarea>
                        </div>
                        <Button onClick={handleTextSubmit} disabled={uploading || !textInput} className="w-full h-12 text-lg shadow-lg shadow-brand-500/20">
                          {uploading ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 w-5 h-5" />}
                          حفظ المعلومات
                        </Button>
                      </motion.div>
                    )}

                    {kbTab === 'url' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="url" className="flex flex-col justify-center h-full space-y-6 max-w-md mx-auto w-full">
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold">استجلاب من رابط</h3>
                          <p className="text-sm text-muted-foreground">سيقوم البوت بزيارة الرابط وقراءة المحتوى ليتعلم منه.</p>
                        </div>
                        <div className="space-y-4">
                          <Input 
                            placeholder="https://example.com/about" 
                            value={urlInput} 
                            onChange={(e) => setUrlInput(e.target.value)} 
                            className="h-12 text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <Button onClick={handleUrlSubmit} disabled={uploading || !urlInput} className="w-full h-12" variant="default">
                            {uploading ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2 w-5 h-5" />}
                            بدء المعالجة
                          </Button>
                        </div>
                        <div className="bg-yellow-500/10 p-4 rounded-lg text-xs text-yellow-600 dark:text-yellow-400 flex gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <p>تأكد من أن الرابط عام ويمكن الوصول إليه. الصفحات التي تتطلب تسجيل دخول لن تعمل.</p>
                        </div>
                      </motion.div>
                    )}

                    {kbTab === 'pdf' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="pdf" className="flex flex-col justify-center h-full space-y-6">
                        <div className="border-2 border-dashed border-brand-500/30 rounded-2xl p-12 text-center hover:bg-brand-500/5 transition-all cursor-pointer relative group">
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} accept=".pdf" disabled={uploading} />
                          <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            {uploading ? <Loader2 className="w-10 h-10 text-brand-500 animate-spin" /> : <Upload className="w-10 h-10 text-brand-500" />}
                          </div>
                          <h3 className="text-xl font-bold mb-2">اسحب الملف هنا أو اضغط للرفع</h3>
                          <p className="text-muted-foreground">ملفات PDF فقط (الحد الأقصى 10 ميجابايت)</p>
                          <div className="mt-6 flex justify-center gap-4">
                            <span className="px-3 py-1 bg-muted rounded-full text-xs">Menu.pdf</span>
                            <span className="px-3 py-1 bg-muted rounded-full text-xs">Policy.pdf</span>
                            <span className="px-3 py-1 bg-muted rounded-full text-xs">Info.pdf</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "tickets" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="tickets" className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
              {/* Tickets List & Create */}
              <Card className="lg:col-span-1 flex flex-col h-full">
                <CardHeader>
                  <CardTitle>تذاكر الدعم</CardTitle>
                  <CardDescription>تواصل مع فريق الدعم الفني</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  <Button className="w-full mb-4" onClick={() => setSelectedTicket(null)}>
                    <Plus className="w-4 h-4 ml-2" /> تذكرة جديدة
                  </Button>
                  
                  {tickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">لا توجد تذاكر</div>
                  ) : (
                    tickets.map(ticket => (
                      <div 
                        key={ticket.id} 
                        onClick={() => selectTicket(ticket)}
                        className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTicket?.id === ticket.id ? 'bg-brand-500/10 border-brand-500' : 'bg-card hover:bg-muted border-border'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm truncate">{ticket.subject}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{new Date(ticket.updatedAt).toLocaleDateString('ar-SA')}</span>
                          <span className={`font-medium ${ticket.priority === 'URGENT' ? 'text-red-500' : ''}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Ticket Detail / Create Form */}
              <Card className="lg:col-span-2 flex flex-col h-full">
                {!selectedTicket ? (
                  <div className="p-6 h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-6">إنشاء تذكرة جديدة</h3>
                    <form onSubmit={handleCreateTicket} className="space-y-4 flex-1">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">الموضوع</label>
                        <Input 
                          required
                          value={newTicket.subject}
                          onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                          placeholder="عنوان المشكلة"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">الأولوية</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                        >
                          <option value="LOW">منخفضة</option>
                          <option value="MEDIUM">متوسطة</option>
                          <option value="HIGH">عالية</option>
                          <option value="URGENT">عاجلة</option>
                        </select>
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium">تفاصيل المشكلة</label>
                        <textarea 
                          required
                          className="flex min-h-[200px] w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newTicket.message}
                          onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                          placeholder="اشرح مشكلتك بالتفصيل..."
                        ></textarea>
                      </div>
                      <Button type="submit" className="w-full" disabled={creatingTicket}>
                        {creatingTicket ? <Loader2 className="animate-spin ml-2" /> : 'إرسال التذكرة'}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <>
                    <CardHeader className="border-b py-4 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                          <CardDescription>تذكرة #{selectedTicket.id.slice(-4)}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                           {/* Status Badge */}
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            selectedTicket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                            selectedTicket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedTicket.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
                      {ticketMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-4 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.isAdmin ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-700'}`}>
                            {msg.isAdmin ? <Headphones className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className={`flex-1 max-w-[80%] space-y-1`}>
                            <div className={`flex items-center gap-2 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs font-bold">{msg.sender?.name || (msg.isAdmin ? 'الدعم الفني' : 'أنت')}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString('ar-SA')}</span>
                            </div>
                            <div className={`p-4 rounded-xl shadow-sm text-sm leading-relaxed ${msg.isAdmin ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-border rounded-tl-none'}`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="border-t p-4 bg-background">
                      <form onSubmit={sendTicketReply} className="flex w-full gap-3">
                        <Input 
                          value={ticketReply} 
                          onChange={(e) => setTicketReply(e.target.value)} 
                          placeholder="اكتب ردك هنا..." 
                          className="flex-1 bg-muted/50"
                          disabled={selectedTicket.status === 'CLOSED'}
                        />
                        <Button type="submit" disabled={!ticketReply.trim() || selectedTicket.status === 'CLOSED'}>
                          <Share2 className="w-4 h-4 ml-2" /> إرسال
                        </Button>
                      </form>
                    </CardFooter>
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === "widget" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="widget" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المظهر والسلوك</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رسالة الترحيب</label>
                    <Input 
                      value={widgetConfig.welcomeMessage} 
                      onChange={(e) => setWidgetConfig({...widgetConfig, welcomeMessage: e.target.value})}
                      placeholder="أهلاً بك! كيف يمكنني مساعدتك؟" 
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">اللون الرئيسي</label>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={widgetConfig.primaryColor} 
                        onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                        className="w-12 h-10 p-1 cursor-pointer bg-white dark:bg-gray-800" 
                      />
                      <Input 
                        value={widgetConfig.primaryColor} 
                        onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                        className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">أيقونة البوت</label>
                    <div className="grid grid-cols-6 gap-3">
                      {[
                        { id: 'robot', icon: Bot, label: 'Robot' },
                        { id: 'support', icon: Headphones, label: 'Support' },
                        { id: 'chat', icon: MessageSquare, label: 'Chat' },
                        { id: 'sparkles', icon: Sparkles, label: 'AI' },
                        { id: 'business', icon: Briefcase, label: 'Business' },
                        { id: 'user', icon: User, label: 'Agent' },
                      ].map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => setWidgetConfig({...widgetConfig, avatar: item.id})}
                          className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer border-2 transition-all hover:scale-105 ${widgetConfig.avatar === item.id ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20 text-brand-500' : 'border-border hover:bg-muted dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white'}`}
                          title={item.label}
                        >
                          <item.icon className="w-6 h-6" />
                        </div>
                      ))}
                      
                      {/* Custom Upload */}
                      <div className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-brand-500 hover:bg-muted flex items-center justify-center cursor-pointer transition-all group overflow-hidden relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleIconUpload} accept="image/*" />
                        {widgetConfig.avatar === 'custom' && widgetConfig.customIconUrl ? (
                          <img src={widgetConfig.customIconUrl} alt="Custom" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-brand-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">شخصية البوت</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['formal', 'friendly', 'fun'].map((p) => (
                        <div 
                          key={p}
                          onClick={() => setWidgetConfig({...widgetConfig, personality: p})}
                          className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${widgetConfig.personality === p ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20 text-brand-500' : 'border-border hover:bg-muted dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white'}`}
                        >
                          <div className="text-2xl mb-1">
                            {p === 'formal' && '👔'}
                            {p === 'friendly' && '😊'}
                            {p === 'fun' && '🤪'}
                          </div>
                          <div className="text-xs font-medium">
                            {p === 'formal' && 'رسمي'}
                            {p === 'friendly' && 'ودود'}
                            {p === 'fun' && 'مرح'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">علامة "مدعوم من فهيم"</label>
                      <p className="text-xs text-muted-foreground">إظهار شعار فهيم في أسفل الويدجت (متاح فقط في الباقة الاحترافية)</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={widgetConfig.showBranding} 
                      onChange={(e) => {
                        if (user?.planType !== 'PRO' && user?.planType !== 'ENTERPRISE' && user?.planType !== 'AGENCY') {
                          setShowProAlert(true);
                          return;
                        }
                        setWidgetConfig({...widgetConfig, showBranding: e.target.checked})
                      }}
                      className="toggle"
                    />
                  </div>

                  <Button onClick={saveWidgetConfig} disabled={savingConfig} className="w-full">
                    {savingConfig ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 w-4 h-4" />}
                    حفظ الإعدادات
                  </Button>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card className="overflow-hidden border-2 border-dashed">
                <CardHeader className="bg-muted/50 pb-4">
                  <CardTitle className="text-sm text-center text-muted-foreground">معاينة حية</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[500px] relative bg-white dark:bg-gray-900 flex items-end justify-end p-6">
                  {/* Mock Widget */}
                  <div className="w-[350px] h-[450px] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: widgetConfig.primaryColor || BRAND.brand500 }}>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden text-lg">
                        {widgetConfig.avatar === 'custom' && widgetConfig.customIconUrl ? (
                          <img src={widgetConfig.customIconUrl} alt="Bot" className="w-full h-full object-cover" />
                        ) : (
                          (() => {
                            const Icon = {
                              'robot': Bot, 'support': Headphones, 'chat': MessageSquare, 
                              'sparkles': Sparkles, 'business': Briefcase, 'user': User
                            }[widgetConfig.avatar] || Bot;
                            return <Icon className="w-5 h-5 text-white" />;
                          })()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">مساعدك الذكي</h3>
                        <p className="text-xs opacity-80">متصل الآن</p>
                      </div>
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 p-4 bg-muted/30 space-y-4 overflow-y-auto">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tr-none shadow-sm text-sm max-w-[80%]">
                          {widgetConfig.welcomeMessage || "مرحباً! كيف يمكنني مساعدتك اليوم؟"}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t bg-background">
                      <div className="h-10 bg-muted rounded-full w-full"></div>
                      {widgetConfig.showBranding && (
                        <div className="text-center mt-2">
                          <span className="text-[10px] text-gray-400">Powered by <span className="font-bold">فهملي.كوم</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="team" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">فريق العمل</h2>
                  <p className="text-muted-foreground">إدارة موظفي خدمة العملاء والصلاحيات</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Member Form */}
                <Card className="md:col-span-1 h-fit">
                  <CardHeader>
                    <CardTitle>إضافة موظف جديد</CardTitle>
                    <CardDescription>سيتم إرسال بيانات الدخول للموظف</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">الاسم</label>
                        <Input 
                          required
                          value={newMember.name}
                          onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                          placeholder="اسم الموظف"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">البريد الإلكتروني</label>
                        <Input 
                          required
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                          placeholder="email@example.com"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">كلمة المرور</label>
                        <Input 
                          required
                          type="password"
                          value={newMember.password}
                          onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                          placeholder="******"
                          className="bg-white dark:bg-gray-800"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={addingMember}>
                        {addingMember ? <Loader2 className="animate-spin ml-2" /> : <User className="ml-2 w-4 h-4" />}
                        إضافة الموظف
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Members List */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>الموظفين الحاليين ({teamMembers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          لا يوجد موظفين حالياً
                        </div>
                      ) : (
                        teamMembers.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">
                                {member.name[0]}
                              </div>
                              <div>
                                <h4 className="font-bold">{member.name}</h4>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-right hidden sm:block">
                                <div className="font-bold text-brand-500">AGENT</div>
                                <div className="text-xs text-muted-foreground">منذ {new Date(member.createdAt).toLocaleDateString('ar-SA')}</div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="settings" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>الملف الشخصي</CardTitle>
                  <CardDescription>تحديث بيانات حسابك الشخصي</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الاسم</label>
                    <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">البريد الإلكتروني</label>
                    <Input value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                    <Input type="password" placeholder="اتركه فارغاً إذا لم ترد التغيير" value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>بيانات النشاط التجاري</CardTitle>
                  <CardDescription>تحديث معلومات شركتك أو مطعمك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اسم النشاط</label>
                    <Input value={businessData.name} onChange={(e) => setBusinessData({...businessData, name: e.target.value})} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع النشاط</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                      value={businessData.activityType}
                      onChange={(e) => setBusinessData({...businessData, activityType: e.target.value})}
                    >
                      <option value="RESTAURANT">مطعم</option>
                      <option value="RETAIL">متجر تجزئة</option>
                      <option value="CLINIC">عيادة</option>
                      <option value="COMPANY">شركة</option>
                      <option value="OTHER">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نبرة البوت الافتراضية</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                      value={businessData.botTone}
                      onChange={(e) => setBusinessData({...businessData, botTone: e.target.value})}
                    >
                      <option value="friendly">ودود</option>
                      <option value="formal">رسمي</option>
                      <option value="funny">مرح</option>
                      <option value="empathetic">متعاطف</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleProfileUpdate} disabled={savingProfile} className="w-full">
                    {savingProfile ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 w-4 h-4" />}
                    حفظ التغييرات
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {activeTab === "subscription" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="subscription" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-brand-500/10 to-transparent border-brand-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      الخطة الحالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {subscription?.planType === 'TRIAL' && 'تجريبية'}
                      {subscription?.planType === 'BASIC' && 'الأساسية'}
                      {subscription?.planType === 'PRO' && 'الاحترافية'}
                      {subscription?.planType === 'ENTERPRISE' && 'الشركات'}
                      {subscription?.planType === 'AGENCY' && 'الوكالات'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.trialEndsAt 
                        ? `تنتهي في ${new Date(subscription.trialEndsAt).toLocaleDateString('ar-SA')}`
                        : 'اشتراك نشط'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-brand-500" />
                      استهلاك الرسائل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2" dir="ltr">
                      {subscription?.messagesUsed || 0} / {subscription?.messageQuota || 0}
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-500 h-full transition-all duration-500" 
                        style={{ width: `${Math.min(((subscription?.messagesUsed || 0) / (subscription?.messageQuota || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      المتبقي: {(subscription?.messageQuota || 0) - (subscription?.messagesUsed || 0)} رسالة
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      التجديد القادم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">
                      {subscription?.trialEndsAt 
                        ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
                        : 30} يوم
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">تجديد الآن</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold mb-6">باقات الاشتراك</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Basic Plan */}
                  <Card className="relative overflow-hidden border-brand-500/20 bg-card/50 backdrop-blur-sm hover:border-brand-500/50 transition-all">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-blue-500" />
                      </div>
                      <CardTitle>المبتدئ</CardTitle>
                      <div className="text-3xl font-bold mt-2">99 <span className="text-sm font-normal text-muted-foreground">ر.س /شهر</span></div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3 text-sm text-right">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 1000 رسالة شهرياً</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> دعم عبر البريد</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> قاعدة معرفة أساسية</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> بوت واحد</li>
                      </ul>
                      <Button className="w-full bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20">اشترك الآن</Button>
                    </CardContent>
                  </Card>

                  {/* Pro Plan */}
                  <Card className="relative overflow-hidden border-brand-500 shadow-2xl scale-105 bg-card z-10">
                    <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs px-3 py-1 rounded-bl-lg">الباقة الحالية</div>
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-lg">الأكثر شعبية</div>
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-brand-500/5">
                        <Crown className="w-8 h-8 text-brand-500" />
                      </div>
                      <CardTitle className="text-xl">المحترف</CardTitle>
                      <div className="text-4xl font-bold mt-2">199 <span className="text-sm font-normal text-muted-foreground">ر.س /شهر</span></div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3 text-right">
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> 5000 رسالة شهرياً</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> دعم ذو أولوية</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> قاعدة معرفة متقدمة</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> حتى 3 بوتات</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> تخصيص كامل</li>
                        <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> تحليلات مفصلة</li>
                      </ul>
                      <Button className="w-full bg-brand-500 hover:bg-brand-600 h-12 text-lg shadow-xl shadow-brand-500/30">الباقة الحالية</Button>
                    </CardContent>
                  </Card>

                  {/* Enterprise Plan */}
                  <Card className="relative overflow-hidden border-brand-500/20 bg-card/50 backdrop-blur-sm hover:border-brand-500/50 transition-all">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-6 h-6 text-purple-500" />
                      </div>
                      <CardTitle>المؤسسات</CardTitle>
                      <div className="text-3xl font-bold mt-2">499 <span className="text-sm font-normal text-muted-foreground">ر.س /شهر</span></div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3 text-sm text-right">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> رسائل غير محدودة</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> دعم مخصص 24/7</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> بوتات غير محدودة</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> API مخصص</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> مدير حساب</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> SLA مضمون</li>
                      </ul>
                      <Button className="w-full bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20">اشترك الآن</Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-dashed">
                  <h3 className="text-lg font-bold mb-2">الباقة التجريبية (الحالية)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    تمنحك 14 يوم تجربة مجانية مع 100 رسالة لتجربة قوة فهيم.
                    <br />
                    عند انتهاء الفترة أو الرصيد، سيتوقف البوت عن العمل حتى الترقية.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "playground" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="playground" className="h-[calc(100vh-200px)]">
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>تجربة البوت</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => { setChatHistory([]); setConversationId(null); }}>
                      <RefreshCw className="w-4 h-4 ml-2" /> محادثة جديدة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-muted-foreground mt-20">
                      <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-brand-500" />
                      </div>
                      <p>ابدأ المحادثة لتجربة ردود البوت بناءً على قاعدة المعرفة الخاصة بك.</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-500 text-brand-50' : 'bg-muted'}`}>
                        {msg.role === 'user' ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-brand-500 text-brand-50 rounded-tl-none' : 'bg-muted rounded-tr-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-muted p-3 rounded-lg rounded-tr-none text-sm">
                        جاري الكتابة...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef}></div>
                </CardContent>
                <CardFooter className="border-t p-4">
                  <form onSubmit={handleChatSubmit} className="flex w-full gap-2">
                    <Input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      placeholder="اكتب رسالتك هنا..." 
                      className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
                      إرسال
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FaheemAnimatedLogo size="small" showText={false} />
              <p>© 2025 فهيم.كوم جميع الحقوق محفوظة.</p>
            </div>
            <a href="https://ma-fo.info" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand-500 transition-colors opacity-70 hover:opacity-100">
              <img src="https://ma-fo.info/logo.png" alt="Ma-Fo Logo" className="w-4 h-4 object-contain" />
              <span className="font-bold font-mono">Developed By Ma-Fo.info</span>
            </a>
          </div>
        </footer>
        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      </main>
    </div>
  )
}

function BotIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}
