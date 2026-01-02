import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { apiCall } from '@/lib/api';

export default function LeadsView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/crm/leads');
      setLeads(data.data || []);
    } catch (e) {
      console.error('Failed to fetch leads', e);
      setError('فشل تحميل البيانات - حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  async function exportLeads() {
    try {
      const res = await apiCall('/api/crm/leads/export');
      // res is CSV string or object; open in new tab
      const csv = typeof res === 'string' ? res : (res.data ? res.data : '');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crm-leads.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">بيانات العملاء</h3>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLeads} disabled={loading} variant="outline">تحديث</Button>
          <Button onClick={exportLeads}>تصدير CSV</Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button 
            onClick={() => { setError(null); fetchLeads(); }} 
            variant="outline"
            size="sm"
            className="border-red-300 dark:border-red-700"
          >
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="overflow-auto border border-border rounded-lg bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-right font-semibold">الاسم</th>
              <th className="p-3 text-right font-semibold">البريد</th>
              <th className="p-3 text-right font-semibold">الجوال</th>
              <th className="p-3 text-right font-semibold">الطلب</th>
              <th className="p-3 text-right font-semibold">المصدر</th>
              <th className="p-3 text-right font-semibold">تاريخ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                  <p className="text-sm text-muted-foreground mt-2">جاري التحميل...</p>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center">لا توجد بيانات</td></tr>
            ) : (
              leads.map((l, idx) => (
                <tr key={l.id} className={`border-t ${idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3">{l.email || '-'}</td>
                  <td className="p-3">{l.phone || '-'}</td>
                  <td className="p-3 max-w-[360px] truncate" title={l.requestSummary || ''}>{l.requestSummary || '-'}</td>
                  <td className="p-3">{l.source}</td>
                  <td className="p-3">{new Date(l.createdAt).toLocaleString('ar-SA')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
