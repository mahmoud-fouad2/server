"use client";

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [filters, setFilters] = useState({ action: '', userId: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters };
      // remove empty filters
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await adminApi.getAuditLogs(params);
      setLogs(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetch();
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>سجل التدقيق</CardTitle>
          <CardDescription>عرض سجل الإجراءات على النظام مع الفلاتر والتصفح</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Input
              placeholder="Action"
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
              aria-label="action-filter"
            />
            <Input
              placeholder="User ID"
              value={filters.userId}
              onChange={e => setFilters({ ...filters, userId: e.target.value })}
              aria-label="user-filter"
            />
            <Input
              placeholder="Start Date (YYYY-MM-DD)"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              aria-label="start-date"
            />
            <Input
              placeholder="End Date (YYYY-MM-DD)"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              aria-label="end-date"
            />
            <Button onClick={applyFilters} className="ml-2">تطبيق</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right table-auto text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-2">الوقت</th>
                  <th className="p-2">الإجراء</th>
                  <th className="p-2">المستخدم</th>
                  <th className="p-2">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      تحميل...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">لا توجد سجلات</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="border-t">
                      <td className="p-2 align-top">{new Date(log.createdAt).toLocaleString('ar-SA')}</td>
                      <td className="p-2 align-top">{log.action}</td>
                      <td className="p-2 align-top">{log.user ? `${log.user.name} (${log.user.email})` : 'نظام'}</td>
                      <td className="p-2 align-top break-words max-w-xl">{log.meta ? JSON.stringify(log.meta) : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">إجمالي السجلات: {pagination.total || 0}</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>السابق</Button>
              <div className="text-sm">صفحة {page} من {pagination.totalPages || 1}</div>
              <Button onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.totalPages || 1)}>التالي</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
