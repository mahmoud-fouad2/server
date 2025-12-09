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
import { apiCall } from '@/lib/api';
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

// Small helper component for safely revealing API Key
function APIKeyBox({ user, copyToClipboard }) {
  const [revealed, setRevealed] = useState(false);

  const key = user?.businessId ? `sk_live_${user.businessId}` : 'Generating...';

  const handleReveal = () => {
    const ok = window.confirm('هل أنت متأكد من أنك تريد إظهار API Key؟ هذه المسؤولية على عاتقك.');
    if (ok) setRevealed(true);
  };

  return (
    <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all border border-border flex items-center justify-between">
      <span>{revealed ? key : '••••••••••••••••••'}</span>
      <div className="flex items-center gap-2">
        {!revealed ? (
          <button className="px-3 py-1 rounded-lg border" onClick={handleReveal}>عرض</button>
        ) : (
          <>
            <button className="px-2 py-1 rounded-md" onClick={() => copyToClipboard(key)} title="نسخ المفتاح">نسخ</button>
            <button className="px-2 py-1 rounded-md bg-red-50 text-red-600" onClick={() => setRevealed(false)}>إخفاء</button>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [kbExpanded, setKbExpanded] = useState(false);
  const [topConversations, setTopConversations] = useState([]);
  const [handoverCount, setHandoverCount] = useState(0);

  // Real-time updates from API
  useEffect(() => {
    const fetchRealTimeStats = async () => {
      try {
        const response = await apiCall('api/analytics/realtime');
        const data = response.data || response;
        setRealTimeStats({
          activeUsers: data.activeUsers || 0,
          responseTime: data.avgResponseTime || 0,
          satisfaction: data.satisfactionScore || 0,
        });
      } catch (e) {
        // Silent fail for realtime updates
      }
    };

    fetchRealTimeStats();
    const interval = setInterval(fetchRealTimeStats, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  // Fetch analytics for charts
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        // Use authenticated dashboard endpoint
        let endpoint = `api/analytics/dashboard/${timeRangeDays}`;
        if (startDate && endDate) {
           endpoint = `api/analytics/dashboard?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
        }
        
        const response = await apiCall(endpoint);
        if (!mounted) return;

        const data = response.data || response;

        // Map to chart-friendly formats with fallbacks
        if (data.trends?.daily) {
          setConversationDataState(data.trends.daily.map(d => ({
            name: d.date,
            conversations: d.count
          })));
        }

        if (data.performance?.responseTimes) {
          setResponseTimeState(data.performance.responseTimes.map(d => ({
            name: d.range,
            time: d.count // Using 'time' as the value key based on chart config
          })));
        }

        if (data.performance?.satisfactionDistribution) {
          const colors = ['#EF4444', '#F59E0B', '#EAB308', '#84CC16', '#22C55E'];
          setSatisfactionState(data.performance.satisfactionDistribution.map(d => ({
            name: `${d.rating} Stars`,
            value: d.count,
            color: colors[d.rating - 1] || '#8884d8'
          })));
        }
      } catch (e) {
        console.warn('Failed to fetch analytics:', e.message || e);
      }
    };

    fetchData();
    
    // fetch vector stats as well
    (async () => {
      try {
        const response = await apiCall('api/analytics/vector-stats');
        const stats = response.data || response;
        if (mounted && stats) setVectorStats(stats);
      } catch (e) {
        console.warn('Vector stats unavailable:', e.message);
      }
    })();
    
    return () => { mounted = false; };
  }, [timeRangeDays, startDate, endDate]);


  // Fetch alerts from API
  useEffect(() => {
    // Fetch a small conversations summary for compact overview (use apiCall so Authorization header is included)
    (async () => {
      try {
        const response = await apiCall('api/chat/conversations');
        const list = Array.isArray(response) ? response : (response.data || response || []);
        setTopConversations(list.slice(0, 3));
      } catch (e) {
        // If unauthorized, clear token and optionally redirect to login
        if (e.message && e.message.toLowerCase().includes('unauthorized')) {
          try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (err) {}
        }
      }
    })();

    // Fetch handover request count for Live Support summary (use apiCall to include auth)
    (async () => {
      try {
        const response = await apiCall('api/chat/handover-requests');
        const list = Array.isArray(response) ? response : (response.data || response || []);
        setHandoverCount(list.length || 0);
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('unauthorized')) {
          try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (err) {}
        }
      }
    })();

    const fetchAlerts = async () => {
      try {
        const response = await apiCall('api/analytics/alerts');
        const data = response.data || response;
        if (Array.isArray(data)) {
          setAlerts(data);
        }
      } catch (e) {
        // Silent fail
      }
    };
    
    fetchAlerts();
  }, []);





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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWidgetCode = () => {
    const code = `<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${user?.businessId}"></script>`;
    copyToClipboard(code);
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

  // Default empty state for charts
  const conversationData = [];
  const responseTimeData = [];
  const satisfactionData = [
    { name: 'راضي جداً', value: 1, color: '#10B981' },
    { name: 'راضي', value: 1, color: '#3B82F6' },
    { name: 'محايد', value: 1, color: '#F59E0B' },
    { name: 'غير راضي', value: 1, color: '#EF4444' },
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

        <Button size="sm" onClick={() => window.open(getApiUrl(`api/analytics/export?format=csv&days=${timeRangeDays}`))}>
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
                (kbExpanded ? kbList : kbList.slice(0, 1)).map(kb => (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">
                          {kb.metadata?.filename || kb.metadata?.title ||
                            (kb.content ? (kb.content.replace(/\s+/g, ' ').slice(0, 60) + (kb.content.length > 60 ? '...' : '')) : null) ||
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
              {kbList && kbList.length > 1 && (
                <div className="pt-2">
                  <button
                    className="text-sm text-brand-500 hover:underline"
                    onClick={() => setKbExpanded(!kbExpanded)}
                  >
                    {kbExpanded ? 'إخفاء' : `عرض الكل (${kbList.length})`}
                  </button>
                </div>
              )}
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

          {/* Compact Conversations Summary */}
          <Card className="lg:col-span-1 h-full glass-panel smooth-transition">
            <CardHeader>
              <CardTitle>محادثات حديثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topConversations && topConversations.length > 0 ? (
                  topConversations.map(conv => (
                    <div key={conv.id} className="p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">زائر #{conv.id.slice(-4)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{conv.messages?.[0]?.content || 'لا توجد رسائل'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-6">لا توجد محادثات حديثة</div>
                )}
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveTab('conversations')}>عرض المحادثات</Button>
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">{(topConversations || []).length} أحدث</div>
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
              اختر المنصة التي تستخدمها للحصول على كود التضمين المناسب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6" dir="ltr">
              
              {/* HTML / General */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-right" dir="rtl">HTML / عام</h4>
                <div className="relative group">
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all border border-border">
                    &lt;script
                    src=&quot;https://fahimo-api.onrender.com/widget/fahimo-widget.js&quot;
                    data-business-id=&quot;{user?.businessId}&quot;&gt;&lt;/script&gt;
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${user?.businessId}"></script>`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportVisibleDataCSV()}>
                      تصدير Excel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      طباعة PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* WordPress */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-right" dir="rtl">WordPress</h4>
                <div className="relative group">
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs break-all border border-border">
                    {`function add_fahimo_widget() {
    echo '<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${user?.businessId}"></script>';
}
add_action('wp_footer', 'add_fahimo_widget');`}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`function add_fahimo_widget() { echo '<script src="https://fahimo-api.onrender.com/widget/fahimo-widget.js" data-business-id="${user?.businessId}"></script>'; } add_action('wp_footer', 'add_fahimo_widget');`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right" dir="rtl">أضف هذا الكود في ملف functions.php الخاص بالقالب.</p>
              </div>

              {/* API Key */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-right" dir="rtl">API Key (للمطورين)</h4>
                <div className="relative group">
                  {/* Hidden by default, reveal on explicit action with confirmation */}
                  <APIKeyBox user={user} copyToClipboard={copyToClipboard} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right" dir="rtl">اضغط &quot;عرض&quot; لإظهار المفتاح تحت مسؤوليتك. لا تشارك المفتاح مع أي شخص.</p>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
