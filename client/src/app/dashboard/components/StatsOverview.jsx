import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Crown,
  MessageSquare,
  Users,
  Copy,
  Check,
  FileText,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Brush,
} from 'recharts';

export default function StatsOverview({
  stats,
  subscription,
  kbList,
  chartData,
  user,
  setActiveTab,
}) {
  const [copied, setCopied] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({ activeUsers: 0, responseTime: 0, satisfaction: 0 });
  const [timeRangeDays, setTimeRangeDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [conversationDataState, setConversationDataState] = useState([]);
  const [responseTimeState, setResponseTimeState] = useState([]);
  const [satisfactionState, setSatisfactionState] = useState([]);
  const [chartType, setChartType] = useState('area'); // 'area' | 'line' | 'bar'
  const [vectorStats, setVectorStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const syncId = 'dashboardSync';

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.floor(Math.random() * 2000) + 500,
        satisfaction: Math.floor(Math.random() * 20) + 80,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch analytics for charts
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        // If start/end provided, use range query, otherwise use days
        const url = startDate && endDate
          ? `/api/analytics/dashboard?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
          : `/api/analytics/dashboard-public/${timeRangeDays}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        if (!mounted) return;

        const data = payload.data || payload;

        // Map to chart-friendly formats with fallbacks
        setConversationDataState((data.trends && data.trends.daily) || conversationData);
        setResponseTimeState(
          (data.performance && data.performance.responseTimes) || responseTimeData
        );
        setSatisfactionState(
          (data.performance && data.performance.satisfactionDistribution) || satisfactionData
        );
      } catch (e) {
        console.warn('Failed to fetch analytics:', e.message || e);
        // keep mock data as fallback
      }
    };

    fetchData();
    // fetch vector stats as well
    (async () => {
      try {
        const res = await fetch(`/api/analytics/vector-stats`);
        if (!res.ok) throw new Error('vector stats fetch failed');
        const payload = await res.json();
        if (mounted) setVectorStats(payload.data || payload);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [timeRangeDays, startDate, endDate]);


  // Mock alerts
  useEffect(() => {
    setAlerts([
      { id: 1, type: 'warning', message: 'High response time detected', time: '2 min ago' },
      { id: 2, type: 'info', message: 'New user registered', time: '5 min ago' },
    ]);
  }, []);

  // Fetch real analytics from server
  useEffect(() => {
    let mounted = true;

    async function fetchAnalytics(days) {
      try {
        const res = await fetch(`/api/analytics/dashboard/${days}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const payload = await res.json();

        if (!mounted) return;

        // server returns structured dashboard - map to chart shapes
        const dashboard = payload.data || payload;

        // Conversations trend
        if (dashboard.trends && dashboard.trends.daily) {
          setConversationDataState(
            dashboard.trends.daily.map(d => ({ name: d.dateLabel || d.date, conversations: d.count }))
          );
        }

        // Response times
        if (dashboard.performance && dashboard.performance.responseTimeSeries) {
          setResponseTimeState(
            dashboard.performance.responseTimeSeries.map(p => ({ name: p.timeLabel || p.time, time: p.avg }))
          );
        }

        // Satisfaction
        if (dashboard.performance && dashboard.performance.satisfactionDistribution) {
          setSatisfactionState(
            dashboard.performance.satisfactionDistribution.map(s => ({ name: s.label, value: s.value, color: s.color || '#8884d8' }))
          );
        }

      } catch (e) {
        console.warn('Failed to load analytics:', e);
      }
    }

    fetchAnalytics(timeRangeDays);

    return () => {
      mounted = false;
    };
  }, [timeRangeDays]);

  const copyWidgetCode = () => {
    const businessId = user?.businessId || 'YOUR_BUSINESS_ID';
    const code = `<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${businessId}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = date => {
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
    return 'منذ لحظات';
  };

  // Client-side CSV export of visible chart data
  const exportVisibleDataCSV = () => {
    try {
      const rows = [];

      // Conversations
      const conv = conversationDataState && conversationDataState.length ? conversationDataState : conversationData;
      rows.push(['Exported At', new Date().toISOString()]);
      rows.push(['Business', user?.businessId || 'unknown']);
      rows.push(['Time Range Days', timeRangeDays]);
      rows.push([]);
      rows.push(['Conversations (date)', 'count']);
      conv.forEach(r => rows.push([r.name, r.conversations]));
      rows.push([]);

      // Response times
      const resp = responseTimeState && responseTimeState.length ? responseTimeState : responseTimeData;
      rows.push(['Response Time (time)', 'ms']);
      resp.forEach(r => rows.push([r.name, r.time]));
      rows.push([]);

      // Satisfaction
      const sat = satisfactionState && satisfactionState.length ? satisfactionState : satisfactionData;
      rows.push(['Satisfaction Level', 'value']);
      sat.forEach(r => rows.push([r.name, r.value]));

      const csv = rows.map(r => r.map(c => `"${String(c || '')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${timeRangeDays}d_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export CSV failed', e);
      alert('فشل تصدير البيانات');
    }
  };

  // Mock chart data
  const conversationData = [
    { name: 'Mon', conversations: 120 },
    { name: 'Tue', conversations: 150 },
    { name: 'Wed', conversations: 180 },
    { name: 'Thu', conversations: 200 },
    { name: 'Fri', conversations: 220 },
    { name: 'Sat', conversations: 190 },
    { name: 'Sun', conversations: 160 },
  ];

  const responseTimeData = [
    { name: '00:00', time: 1200 },
    { name: '04:00', time: 1100 },
    { name: '08:00', time: 1300 },
    { name: '12:00', time: 1400 },
    { name: '16:00', time: 1250 },
    { name: '20:00', time: 1150 },
  ];

  const satisfactionData = [
    { name: 'Very Satisfied', value: 45, color: '#10B981' },
    { name: 'Satisfied', value: 35, color: '#3B82F6' },
    { name: 'Neutral', value: 15, color: '#F59E0B' },
    { name: 'Dissatisfied', value: 5, color: '#EF4444' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
      id="dashboard-overview"
    >
      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{alert.message}</span>
                <span className="text-xs text-muted-foreground ml-auto">{alert.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-green-500" /> -5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.satisfaction}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +2% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">نطاق التاريخ:</label>
          <select
            value={timeRangeDays}
            onChange={(e) => { setTimeRangeDays(parseInt(e.target.value, 10)); setStartDate(''); setEndDate(''); }}
            className="text-sm p-1 border rounded"
          >
            <option value={7}>7 أيام</option>
            <option value={30}>30 يوم</option>
            <option value={90}>90 يوم</option>
          </select>
          <span className="text-xs text-muted-foreground">أو</span>
          <input type="date" className="text-sm p-1 border rounded" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="text-sm p-1 border rounded" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button size="sm" onClick={() => { if (startDate && endDate) { /* trigger fetch by updating timeRangeDays? */ setTimeRangeDays(0); } }}>
            Apply
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground mr-1">نوع المخطط:</label>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={chartType === 'area' ? 'default' : 'outline'} onClick={() => setChartType('area')}>Area</Button>
            <Button size="sm" variant={chartType === 'line' ? 'default' : 'outline'} onClick={() => setChartType('line')}>Line</Button>
            <Button size="sm" variant={chartType === 'bar' ? 'default' : 'outline'} onClick={() => setChartType('bar')}>Bar</Button>
          </div>
        </div>

        <Button size="sm" onClick={() => window.open(`/api/analytics/export?format=csv&days=${timeRangeDays}`)}>
          تصدير CSV
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation Trends */}
        <Card className="glass-panel smooth-transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-500" />
              اتجاهات المحادثات
            </CardTitle>
            <CardDescription>المحادثات اليومية خلال الأسبوع الماضي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart syncId={syncId} data={conversationDataState && conversationDataState.length ? conversationDataState : conversationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trends */}
        <Card className="glass-panel smooth-transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              أوقات الاستجابة
            </CardTitle>
            <CardDescription>متوسط أوقات الاستجابة بالميلي ثانية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart syncId={syncId} data={responseTimeState && responseTimeState.length ? responseTimeState : responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Distribution */}
      <Card className="glass-panel smooth-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            توزيع الرضا
          </CardTitle>
          <CardDescription>توزيع مستويات رضا العملاء</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                data={satisfactionState && satisfactionState.length ? satisfactionState : satisfactionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
          <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={satisfactionState && satisfactionState.length ? satisfactionState : satisfactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(satisfactionState && satisfactionState.length ? satisfactionState : satisfactionData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || entry.fill || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar + Area combined section with brush */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' && (
                  <AreaChart syncId={syncId} data={conversationDataState && conversationDataState.length ? conversationDataState : conversationData}>
                    <defs>
                      <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area type="monotone" dataKey="conversations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorConv)" />
                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                  </AreaChart>
                )}

                {chartType === 'line' && (
                  <LineChart syncId={syncId} data={conversationDataState && conversationDataState.length ? conversationDataState : conversationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversations" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    <Brush dataKey="name" height={30} stroke="#3B82F6" />
                  </LineChart>
                )}

                {chartType === 'bar' && (
                  <BarChart syncId={syncId} data={conversationDataState && conversationDataState.length ? conversationDataState : conversationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversations" fill="#3B82F6" />
                    <Brush dataKey="name" height={30} stroke="#3B82F6" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="glass-panel smooth-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            استخدام الرسائل
          </CardTitle>
          <CardDescription>رصيد الرسائل المستخدم والمتبقي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الاستخدام الحالي</span>
              <span className="text-muted-foreground">
                {subscription?.messagesUsed || 0} / {subscription?.messageQuota || 2000}
              </span>
            </div>
            <div className="w-full bg-muted h-4 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((subscription?.messagesUsed || 0) / (subscription?.messageQuota || 2000)) * 100, 100)}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full"
              ></motion.div>
            </div>
            <div className="text-right mt-1 text-xs text-muted-foreground">
              تم استخدام{' '}
              {Math.round(
                ((subscription?.messagesUsed || 0) /
                  (subscription?.messageQuota || 2000)) *
                  100
              )}
              %
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel glass-panel-hover smooth-transition">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              الباقة الحالية
              <div className="p-2 bg-brand-500/10 rounded-lg">
                <Crown className="h-4 w-4 text-brand-500" />
              </div>
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
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-green-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(subscription?.messageQuota || 0) -
                (subscription?.messagesUsed || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">رسالة متاحة</p>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-panel-hover smooth-transition">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
              إجمالي المحادثات
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalConversations || 0}
            </div>
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
              {kbList &&
                kbList.slice(0, 3).map(kb => (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">
                          {kb.metadata?.filename ||
                            kb.metadata?.title ||
                            kb.metadata?.url ||
                            'بدون عنوان'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {kb.type === 'PDF'
                            ? `تمت المعالجة · ${kb.metadata?.pageCount || '?'} صفحة`
                            : `نشط · ${timeAgo(kb.updatedAt)}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 bg-muted rounded uppercase">
                      {kb.type}
                    </span>
                  </div>
                ))}
              {(!kbList || kbList.length === 0) && (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                  لا يوجد مصادر نشطة
                </div>
              )}
              <div className="pt-4 border-t border-dashed">
                <p className="text-xs text-muted-foreground mb-3">
                  أضف المزيد من المصادر لتحسين الدقة
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab('knowledge')}
                >
                  رفع جديد
                </Button>
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
              {chartData && chartData.length > 0 ? (
                chartData.map((item, i) => (
                  <div
                    key={i}
                    className="w-full bg-brand-500/10 rounded-t-lg relative group hover:bg-brand-500/20 transition-colors flex flex-col justify-end items-center"
                    style={{ height: '100%' }}
                  >
                    <div className="mb-2 font-bold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${Math.max((item.count / Math.max(...chartData.map(d => d.count), 1)) * 100, 5)}%`,
                      }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="w-full bg-brand-500 rounded-t-lg opacity-80 group-hover:opacity-100"
                    ></motion.div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {item.date}
                    </div>
                  </div>
                ))
              ) : (
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
            <CardDescription>
              انسخ هذا الكود وضعه في وسم body في موقعك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative group" dir="ltr">
              <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all border border-border">
                &lt;script
                src=&quot;https://fahimo-api.onrender.com/widget/fahimo-widget.js&quot;
                data-business-id=&quot;{user?.businessId}&quot;&gt;&lt;/script&gt;
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button size="sm" onClick={copyWidgetCode}>
                  {copied ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportVisibleDataCSV()}>
                  تصدير بيانات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
