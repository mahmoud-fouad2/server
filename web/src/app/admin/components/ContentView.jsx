import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api-client';

export default function ContentView() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getKnowledgeList({ limit: 50 });
      setEntries(res.data || []);
    } catch (e) {
      console.error('Failed to fetch content entries', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    try {
      await adminApi.deleteKnowledge(id);
      fetchEntries();
      alert('تم الحذف');
    } catch (e) {
      console.error('Failed to delete', e);
      alert('فشل الحذف');
    }
  };

  if (loading) return <div>جارِ التحميل...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">النصوص والمحتوى</h3>
      {entries.length === 0 ? (
        <div className="text-muted">لا توجد مقالات أو نصوص</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-right">العنوان</th>
                <th className="text-right">النوع</th>
                <th className="text-right">الشركة</th>
                <th className="text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t">
                  <td className="p-2 text-right">{e.title || '(بدون عنوان)'}</td>
                  <td className="p-2 text-right">{e.type}</td>
                  <td className="p-2 text-right">{e.business?.name || 'عام'}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => handleDelete(e.id)} className="px-3 py-1 rounded bg-red-500 text-white">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
