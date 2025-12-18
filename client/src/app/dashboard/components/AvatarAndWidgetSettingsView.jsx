import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Save, Loader2, Copy, Check } from 'lucide-react';
import { API_CONFIG } from '@/lib/config';

const AVATAR_PRESETS = [
  { id: 'avatar1', name: 'أحمد - موظف', emoji: '👨‍💼', color: '#3B82F6' },
  { id: 'avatar2', name: 'فاطمة - خدمة عملاء', emoji: '👩‍💼', color: '#EC4899' },
  { id: 'avatar3', name: 'محمد - تقني', emoji: '👨‍💻', color: '#10B981' },
  { id: 'avatar4', name: 'روبوت', emoji: '🤖', color: '#8B5CF6' },
];

const WIDGET_ICONS = [
  { id: 'icon-chat', label: 'دردشة الآن', emoji: '💬', color: '#3B82F6' },
  { id: 'icon-help', label: 'اطلب المساعدة', emoji: '🆘', color: '#EF4444' },
  { id: 'icon-support', label: 'خدمة العملاء', emoji: '👋', color: '#F59E0B' },
  { id: 'icon-bell', label: 'إشعار', emoji: '🔔', color: '#10B981' },
];

export default function AvatarAndWidgetSettingsView({
  user,
  addNotification,
}) {
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [selectedIcon, setSelectedIcon] = useState('icon-chat');
  const [customAvatar, setCustomAvatar] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);
  const [previewCustomAvatar, setPreviewCustomAvatar] = useState(null);
  const [previewCustomIcon, setPreviewCustomIcon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('standard');
  const [latestConfigVersion, setLatestConfigVersion] = useState(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      setPreviewCustomAvatar(result);
      setCustomAvatar(file);
      setSelectedAvatar('custom');
    };
    reader.readAsDataURL(file);
  };

  // Load current business settings (including widgetVariant) when component mounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/business/settings');
        if (!res.ok) return;
        const biz = await res.json();
        if (!mounted) return;
        if (biz.widgetConfig) {
          try {
            const cfg = typeof biz.widgetConfig === 'string' ? JSON.parse(biz.widgetConfig) : biz.widgetConfig;
            if (cfg.avatar) setSelectedAvatar(cfg.avatar);
            if (cfg.customIconUrl) setPreviewCustomIcon(cfg.customIconUrl);
            if (cfg.customAvatarUrl) setPreviewCustomAvatar(cfg.customAvatarUrl);
          } catch (e) {}
        }
        if (biz.widgetVariant) setSelectedVariant(biz.widgetVariant.toLowerCase());
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      setPreviewCustomIcon(result);
      setCustomIcon(file);
      setSelectedIcon('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to backend
      const formData = new FormData();
      formData.append('selectedAvatar', selectedAvatar);
      formData.append('selectedIcon', selectedIcon);
      formData.append('widgetVariant', selectedVariant);
      if (customAvatar) formData.append('customAvatar', customAvatar);
      if (customIcon) formData.append('customIcon', customIcon);

      const response = await fetch('/api/business/avatar-settings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        addNotification(`تم حفظ إعدادات الأفاتار والأيقونة (config v:${data.configVersion})`, 'success');
        // update previews and variant
        if (data.widgetConfig) {
          try {
            const cfg = data.widgetConfig;
            if (cfg.customIconUrl) setPreviewCustomIcon(cfg.customIconUrl);
            if (cfg.customAvatarUrl) setPreviewCustomAvatar(cfg.customAvatarUrl);
            if (cfg.avatar) setSelectedAvatar(cfg.avatar);
          } catch (e) {}
        }
        if (data.widgetVariant) setSelectedVariant(String(data.widgetVariant).toLowerCase());
        // expose latest configVersion for embed code (so user can copy with ?v=...)
        if (data.configVersion) {
          setLatestConfigVersion(data.configVersion);
          setTimeout(() => addNotification(`Embed tip: append ?v=${data.configVersion} to script URL to force a cache-bust`, 'info'), 500);
        }
      } else {
        addNotification('فشل حفظ الإعدادات', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const businessId = user?.businessId;
    // Use API_CONFIG.WIDGET_SCRIPT (includes build-time version) and respect latest config version if present
    const baseWidget = API_CONFIG.WIDGET_SCRIPT || `https://fahimo-api.onrender.com/${selectedVariant === 'enhanced' ? 'fahimo-widget-enhanced.js' : 'fahimo-widget.js'}`;
    const qu = latestConfigVersion ? `&v=${latestConfigVersion}` : '';
    const embedCode = `<script src="${baseWidget}${qu}" data-business-id="${businessId}" data-api-url="https://fahimo-api.onrender.com"></script>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              إدارة الأفاتار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                اختر أفاتار مدمج
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AVATAR_PRESETS.map((avatar) => (
                  <motion.button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAvatar === avatar.id
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">{avatar.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {avatar.name}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Avatar Upload */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                أو رفع أفاتار مخصص
              </h3>
              <div className="flex gap-4">
                <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-brand-500 transition-colors">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      انقر لرفع صورة
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {previewCustomAvatar && (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <img
                      src={previewCustomAvatar}
                      alt="Custom Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">معاين</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Widget Icon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              إدارة أيقونة الويدجت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                اختر أيقونة مدمجة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {WIDGET_ICONS.map((icon) => (
                  <motion.button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedIcon === icon.id
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">{icon.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {icon.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Icon Upload */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                أو رفع أيقونة مخصصة
              </h3>
              <div className="flex gap-4">
                <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 cursor-pointer hover:border-brand-500 transition-colors">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      انقر لرفع أيقونة
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                </label>
                {previewCustomIcon && (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <img
                      src={previewCustomIcon}
                      alt="Custom Icon"
                      className="w-16 h-16 object-cover"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">معاين</span>
                  </div>
                )}
              </div>
            </div>

            {/* Icon Size and Color Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  حجم الأيقونة
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm">
                  <option>صغير (40px)</option>
                  <option selected>متوسط (56px)</option>
                  <option>كبير (72px)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  لون الخلفية
                </label>
                <div className="flex gap-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Embed Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💻</span>
              كود التضمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                انسخ هذا الكود والصقه في موقعك الإلكتروني:
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{`<script src="https://fahimo-api.onrender.com/${selectedVariant === 'enhanced' ? 'fahimo-widget-enhanced.js' : 'fahimo-widget.js'}" data-business-id="${user?.businessId}" data-api-url="https://fahimo-api.onrender.com"></script>`}</code>
                </pre>
                <p className="text-xs text-gray-400 mt-2">⚠️ If you host the widget on your own site or staging, set <code>data-api-url</code> to your API host (or set <code>window.__FAHIMO_WIDGET_API_URL</code> before the script).</p>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-2 left-2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors"
                  title="نسخ"
                >
                  {copied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Widget Variant Selection (Superadmin only) */}
      {user?.role === 'SUPERADMIN' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Widget Variant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose which widget variant should be used by default for this business. This affects the embed code and allows switching remotely (basic script will auto-load the enhanced script when configured).</p>
                <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="standard">Standard (Fast)</option>
                  <option value="enhanced">Enhanced (Feature-rich)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 justify-end"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save size={16} />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
