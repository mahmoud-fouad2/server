import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function MediaView() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMedia();
      setFiles(res.files || []);
    } catch (e) {
      console.error('Failed to fetch media', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (file) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      await adminApi.deleteMedia(file.url);
      alert('تم الحذف');
      load();
    } catch (e) {
      console.error('Delete failed', e);
      alert('فشل الحذف');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">الصور والوسائط</h3>
      {files.length === 0 ? (
        <div className="text-muted">لا توجد وسائط</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map(f => (
            <div key={(f.url || f.filename)} className="p-3 border rounded flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                {f.url && (f.url.match(/\.(png|jpg|jpeg|gif)$/i) ? (
                  <img src={f.url} alt={f.filename} className="max-w-full max-h-full" />
                ) : (
                  <span className="text-xs px-2">{f.filename}</span>
                ))}
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium">{f.filename}</div>
                <div className="text-xs text-muted">{f.source} {f.businessId ? `- ${f.businessId}` : ''}</div>
              </div>
              <div>
                <button onClick={() => handleDelete(f)} className="px-3 py-1 rounded bg-red-500 text-white">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
