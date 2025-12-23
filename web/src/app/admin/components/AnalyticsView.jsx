"use client";

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import SafeResponsiveContainer from '@/components/ui/SafeResponsiveContainer';

export default function AnalyticsView() {
  const [overview, setOverview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const o = await adminApi.getAnalyticsOverview();
        setOverview(o);
        const byCountry = await adminApi.getAnalyticsByCountry();
        setCountries(byCountry);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الجلسات (30 يوم)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.totalSessions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>زيارات الصفحات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.totalPageViews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>المحادثات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.totalConversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون (نشط)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.activeUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>الزوار حسب الدولة</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <SafeResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={countries} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </SafeResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أهم الصفحات</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overview?.topPages?.length ? (
                overview.topPages.map(p => (
                  <li key={p.path} className="flex justify-between">
                    <span className="truncate max-w-[70%]">{p.path}</span>
                    <span className="font-bold">{p.count}</span>
                  </li>
                ))
              ) : (
                <li>لا توجد بيانات</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
