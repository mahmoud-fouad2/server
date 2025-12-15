import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

export default function LeadsView() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    try {
      const data = await apiCall('/api/crm/leads');
      setLeads(data.data || []);
    } catch (e) {
      console.error('Failed to fetch leads', e);
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

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
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
            {leads.length === 0 ? (
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
