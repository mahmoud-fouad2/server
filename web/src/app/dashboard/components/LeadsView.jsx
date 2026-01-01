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
        <div>
          <Button onClick={fetchLeads} disabled={loading}>تحديث</Button>
          <Button onClick={exportLeads} className="ml-2">تصدير CSV</Button>
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

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="p-2 text-left">الاسم</th>
              <th className="p-2 text-left">البريد</th>
              <th className="p-2 text-left">الجوال</th>
              <th className="p-2 text-left">الطلب</th>
              <th className="p-2 text-left">المصدر</th>
              <th className="p-2 text-left">تاريخ</th>
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
              leads.map(l => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">{l.name}</td>
                  <td className="p-2">{l.email || '-'}</td>
                  <td className="p-2">{l.phone || '-'}</td>
                  <td className="p-2">{l.requestSummary || '-'}</td>
                  <td className="p-2">{l.source}</td>
                  <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
