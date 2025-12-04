import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, MessageSquare, Users, Copy, Check, FileText, Zap } from "lucide-react"
import { useState } from "react"

export default function StatsOverview({ stats, subscription, kbList, chartData, user, setActiveTab }) {
  const [copied, setCopied] = useState(false)

  const copyWidgetCode = () => {
    const businessId = user?.businessId || 'YOUR_BUSINESS_ID' 
    const code = `<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${businessId}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8" id="dashboard-overview">
      {/* Usage Bar Section */}
      <div className="glass-panel smooth-transition soft-shadow rounded-xl p-6" data-tour="stats-overview">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {kbList && kbList.slice(0, 3).map((kb) => (
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
              {(!kbList || kbList.length === 0) && (
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

        {/* Traffic Analysis Chart */}
        <Card className="lg:col-span-2 glass-panel smooth-transition">
          <CardHeader>
            <CardTitle>تحليل المحادثات (آخر 7 أيام)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 px-2">
              {chartData && chartData.length > 0 ? chartData.map((item, i) => (
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
      
      {/* Embed Code Section */}
      <div>
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
  )
}
