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
} from 'lucide-react';

export default function VisitorAnalytics() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchActiveSessions, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchData = async () => {
    await Promise.all([
      fetchActiveSessions(),
      fetchAnalytics(),
      fetchRatingStats(),
    ]);
    setLoading(false);
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/visitor/active-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setActiveSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateFrom = getDateFrom(dateRange);
      const response = await fetch(
        `/api/visitor/analytics?from=${dateFrom.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRatingStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const businessId = user.businesses?.[0]?.id;

      if (!businessId) return;

      const response = await fetch(`/api/rating/stats/${businessId}`);
      const data = await response.json();
      if (data.success) setRatingStats(data.stats);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
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
              {analytics?.totalPageViews && analytics?.totalSessions
                ? (analytics.totalPageViews / analytics.totalSessions).toFixed(
                    1
                  )
                : 0}{' '}
              لكل جلسة
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

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            width: `${(count / analytics.totalSessions) * 100}%`,
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
                            width: `${(count / analytics.totalSessions) * 100}%`,
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
          <div className="space-y-3">
            {analytics?.topPages?.map((page, index) => (
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
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle>مصادر الزيارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(analytics?.trafficSources || {}).map(
              ([source, count]) => (
                <div key={source} className="text-center">
                  <div className="text-2xl font-bold text-brand-500">
                    {count}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {source}
                  </div>
                </div>
              )
            )}
          </div>
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
                        width: `${((ratingStats.ratingDistribution[rating] || 0) / ratingStats.totalRatings) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-left">
                    {ratingStats.ratingDistribution[rating] || 0}
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
