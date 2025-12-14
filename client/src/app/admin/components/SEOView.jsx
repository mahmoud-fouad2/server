import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

export default function SEOView() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSystemSettings();
      setSettings(res.settings || {});
    } catch (e) {
      console.error('Failed to load system settings', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const seoKeys = Object.keys(settings).filter(k => k.startsWith('seo:'));

  const handleChange = (key, value) => {
    setEditing(prev => ({ ...prev, [key]: value }));
  };

  const save = async (key) => {
    try {
      const value = editing[key] !== undefined ? editing[key] : settings[key].value;
      await adminApi.updateSystemSetting(key, value, settings[key].description || 'SEO setting');
      alert('تم الحفظ');
      load();
    } catch (e) {
      console.error('Failed to save', e);
      alert('فشل الحفظ');
    }
  };

  if (loading) return <div>جارِ التحميل...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">SEO وإعدادات الموقع</h3>
      {seoKeys.length === 0 ? (
        <div className="text-muted">لا توجد إعدادات SEO</div>
      ) : (
        <div className="space-y-3">
          {seoKeys.map(key => (
            <div key={key} className="p-3 border rounded flex flex-col">
              <div className="text-right font-medium">{key}</div>
              <textarea
                className="mt-2 p-2 border rounded w-full"
                rows={3}
                value={editing[key] !== undefined ? editing[key] : settings[key].value}
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => save(key)} className="px-3 py-1 bg-green-500 text-white rounded">حفظ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

export default function SEOView() {
  const [settings, setSettings] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    try {
      const res = await adminApi.getSystemSettings();
      const s = res.settings || {};
      setSettings(s);
      setTitle(s['site:title']?.value || '');
      setDescription(s['site:metaDescription']?.value || '');
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await adminApi.updateSystemSetting('site:title', title);
      await adminApi.updateSystemSetting('site:metaDescription', description);
      alert('تم حفظ إعدادات SEO');
      load();
    } catch (e) {
      console.error('Failed to save', e);
      alert('حدث خطأ');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">SEO وإعدادات الموقع</h3>
      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        <div>
          <label className="block text-sm">عنوان الموقع</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm">وصف الميتا</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border p-2" rows={4} />
        </div>
        <div>
          <button onClick={save} className="px-4 py-2 bg-brand-600 text-white rounded">حفظ</button>
        </div>
      </div>
    </div>
  );
}
