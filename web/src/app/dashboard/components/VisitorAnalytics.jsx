'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  Clock,
  Eye,
  MousePointer,
  Star,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { visitorApi, analyticsApi } from '@/lib/api';

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function VisitorAnalytics() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    let mounted = true;

    const fetchActiveSessions = async () => {
      try {
        const response = await visitorApi.getActiveSessions();
        const sessions = Array.isArray(response?.sessions)
          ? response.sessions
          : Array.isArray(response)
            ? response
            : [];
        if (mounted) {
          setActiveSessions(sessions);
        }
      } catch (error) {
        console.error('[VisitorAnalytics] Error fetching active sessions:', error);
        // Don't block the whole page for this
        if (mounted) setActiveSessions([]);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const dateFrom = getDateFrom(dateRange).toISOString();
        const response = await visitorApi.getAnalytics({ from: dateFrom });
        const analyticsData = response?.analytics || response?.data || response;
        if (mounted) {
          setAnalytics(analyticsData || {});
        }
      } catch (error) {
        console.error('[VisitorAnalytics] Error fetching analytics:', error);
        if (mounted) {
          setAnalytics({});
          // Only set main error if we really can't show anything useful
          // setError('فشل تحميل بيانات التحليلات'); 
        }
      }
    };

    const fetchRatingStats = async () => {
      try {
        const statsResponse = await analyticsApi.getRatingStats();
        if (!mounted) return;
        const payload = statsResponse?.stats || statsResponse || {};
        setRatingStats({
          avgRating: payload?.average ?? payload?.avgRating ?? 0,
          totalRatings: payload?.count ?? payload?.totalRatings ?? 0,
          ratingDistribution: payload?.distribution || payload?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      } catch (error) {
        console.error('[VisitorAnalytics] Error fetching rating stats:', error);
        if (mounted) {
          setRatingStats({ avgRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        }
      }
    };

    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        await Promise.all([
          fetchActiveSessions(),
          fetchAnalytics(),
          fetchRatingStats(),
        ]);
      } catch (err) {
        console.error('Error in fetchData Promise.all:', err);
        // Even if something fails catastrophically, we stop loading
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchActiveSessions, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [dateRange]);

  const getDateFrom = range => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const formatDuration = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}د ${remainingSeconds}ث`;
  };

  const totalSessions = analytics?.totalSessions ?? 0;
  const safeSessionDivisor = totalSessions > 0 ? totalSessions : 1;
  const avgPagesPerSession =
    totalSessions > 0 && analytics?.totalPageViews
      ? (analytics.totalPageViews / safeSessionDivisor).toFixed(1)
      : '0';
  const trafficSourceEntries = Object.entries(analytics?.trafficSources || {});
  const hasTrafficSources = trafficSourceEntries.length > 0;
  const totalRatings = ratingStats?.totalRatings ?? 0;
  const ratingDistribution = ratingStats?.ratingDistribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Show helpful message if no data yet
  const hasAnyData = (totalSessions > 0) || 
                     (activeSessions.length > 0) || 
                     (analytics && Object.keys(analytics).length > 0 && 
                      (analytics.totalPageViews > 0 || analytics.avgDuration > 0));
  
  if (!hasAnyData && !loading) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">لا توجد بيانات زيارات حتى الآن</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                لم يتم تسجيل أي زيارات أو جلسات محادثة بعد. تأكد من تثبيت الويدجت على موقعك بشكل صحيح.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-right">
                <h4 className="font-bold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  كيف تبدأ؟
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                  <li>تأكد من نسخ كود الويدجت وإضافته لموقعك</li>
                  <li>قم بزيارة موقعك وتفاعل مع الويدجت</li>
                  <li>انتظر بضع ثوانٍ ثم قم بتحديث هذه الصفحة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d'].map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === range
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {range === '7d'
              ? 'آخر 7 أيام'
              : range === '30d'
                ? 'آخر 30 يوم'
                : 'آخر 90 يوم'}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الجلسات
            </CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeSessions.length} نشط الآن
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              مشاهدات الصفحات
            </CardTitle>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalPageViews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {avgPagesPerSession} لكل جلسة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط المدة</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(Math.floor(analytics?.avgDuration || 0))}
            </div>
            <p className="text-xs text-muted-foreground">لكل جلسة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التقييم</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {ratingStats?.avgRating?.toFixed(1) || 0}
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              من {ratingStats?.totalRatings || 0} تقييم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>الزوار النشطون ({activeSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا يوجد زوار نشطون حالياً
            </p>
          ) : (
            <div className="space-y-4">
              {activeSessions.map(session => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-brand-500/10 rounded-full">
                      {session.isMobile ? (
                        <Smartphone className="w-5 h-5 text-brand-500" />
                      ) : (
                        <Monitor className="w-5 h-5 text-brand-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {session.city || 'Unknown'},{' '}
                          {session.country || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.browser} • {session.os}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{session.pageViews} صفحة</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.pageVisits?.[0]?.path || '/'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country, Device & Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>حسب البلد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.byCountry || {}).length > 0 ? (
                Object.entries(analytics.byCountry).map(
                  ([country, count]) => (
                    <div
                      key={country}
                      className="flex items-center justify-between"
                    >
                      <span className="capitalize">{country}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500"
                            style={{
                              width: `${Math.min(100, (count / safeSessionDivisor) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  لا توجد بيانات بعد
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حسب الجهاز</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.byDevice || {}).map(
                ([device, count]) => (
                  <div
                    key={device}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{device}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500"
                          style={{
                            width: `${Math.min(100, (count / safeSessionDivisor) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حسب المتصفح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.byBrowser || {}).map(
                ([browser, count]) => (
                  <div
                    key={browser}
                    className="flex items-center justify-between"
                  >
                    <span>{browser}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500"
                          style={{
                            width: `${Math.min(100, (count / safeSessionDivisor) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>الصفحات الأكثر زيارة</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topPages?.length ? (
            <div className="space-y-3">
              {analytics.topPages.map((page, index) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-brand-500/10 rounded text-xs font-bold text-brand-500">
                      {index + 1}
                    </div>
                    <span className="font-mono text-sm">{page.path}</span>
                  </div>
                  <span className="text-sm font-medium">{page.count} زيارة</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              لا توجد بيانات تصفح كافية بعد
            </p>
          )}
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>مصادر الزيارات</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrafficSources ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {trafficSourceEntries.map(([source, count]) => (
                <div key={source} className="text-center">
                  <div className="text-2xl font-bold text-brand-500">
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {source}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              لم يتم جمع مصادر الزيارات بعد
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rating Distribution */}
      {ratingStats && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${totalRatings > 0 ? ((ratingDistribution[rating] || 0) / totalRatings) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-left">
                    {ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
