import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  Headphones,
  MessageSquare,
  Sparkles,
  Briefcase,
  User,
  Upload,
  Save,
  Loader2,
  Bell,
  Timer,
  Layout,
  Ruler,
  AlertCircle,
} from 'lucide-react';
import { widgetApi, businessApi } from '@/lib/api-client';
import { BRAND } from '@/constants';

const INITIAL_WIDGET_CONFIG = {
  welcomeMessage: '',
  primaryColor: '#000000',
  personality: 'friendly',
  showBranding: true,
  preChatFormEnabled: false,
  preChatEnabled: true,
  preChatDescription: '',
  avatar: 'robot',
  notificationSoundEnabled: true,
  autoOpenDelay: 0,
  position: 'right',
  borderRadius: '18px',
};

const POSITION_OPTIONS = [
  { id: 'right', label: 'يمين الشاشة' },
  { id: 'left', label: 'يسار الشاشة' },
];

const BORDER_RADIUS_RANGE = { min: 0, max: 32 };

// Helper to ensure controlled values
const ensureControlledValue = (value, defaultValue = '') => {
  return value ?? defaultValue;
};

import { Skeleton } from '@/components/ui/Skeleton';

function WidgetSettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="grid grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="h-[500px] bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}

export default function WidgetSettingsView({
  user,
  addNotification,
  setShowProAlert,
}) {
  const [widgetConfig, setWidgetConfig] = useState(INITIAL_WIDGET_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const borderRadiusValue = useMemo(() => {
    const raw = String(widgetConfig.borderRadius || '').replace('px', '');
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 18 : parsed;
  }, [widgetConfig.borderRadius]);
  const autoOpenDelaySeconds = useMemo(() => {
    if (typeof widgetConfig.autoOpenDelay === 'number') {
      return Math.max(0, Math.round(widgetConfig.autoOpenDelay / 1000));
    }
    return 0;
  }, [widgetConfig.autoOpenDelay]);
  const soundEnabled = widgetConfig.notificationSoundEnabled !== false;

  const updateWidgetField = (field, value) => {
    setWidgetConfig(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const buildConfigPayload = (overrides = {}) => {
    const next = { ...widgetConfig, ...overrides };
    const { preChatFormEnabled, ...rest } = next;
    return rest;
  };

  const broadcastConfigUpdate = () => {
    if (typeof window === 'undefined') return;
    const businessId = user?.businessId;
    if (!businessId) return;
    const channel = `fahimo-config-update-${businessId}`;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(channel);
        bc.postMessage({ type: 'CONFIG_UPDATED', timestamp: Date.now() });
        bc.close();
      } else {
        localStorage.setItem(`${channel}-notify`, String(Date.now()));
      }
    } catch (error) {
      try {
        localStorage.setItem(`${channel}-notify`, String(Date.now()));
      } catch (err) {
        // ignore storage errors
      }
    }
  };

  const handlePreChatToggle = async checked => {
    setWidgetConfig(prev => ({
      ...prev,
      preChatFormEnabled: checked,
      preChatEnabled: checked,
    }));
    try {
      await businessApi.updatePreChatSettings({ preChatFormEnabled: checked });
      addNotification('تم تحديث حالة نموذج ما قبل المحادثة');
      broadcastConfigUpdate();
    } catch (err) {
      addNotification('فشل تحديث حالة نموذج ما قبل المحادثة', 'error');
      setWidgetConfig(prev => ({
        ...prev,
        preChatFormEnabled: !checked,
        preChatEnabled: !checked,
      }));
    }
  };

  useEffect(() => {
    if (user?.businessId) {
      fetchConfig(user.businessId);
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const fetchConfig = async businessId => {
    try {
      const data = await widgetApi.getConfig(businessId);
      // Include business-level settings like preChatFormEnabled from widget config response
      const incoming = data?.widgetConfig || {};
      setWidgetConfig(prev => ({
        ...prev,
        ...incoming,
        autoOpenDelay:
          typeof incoming.autoOpenDelay === 'number'
            ? incoming.autoOpenDelay
            : prev.autoOpenDelay,
        notificationSoundEnabled:
          typeof incoming.notificationSoundEnabled === 'boolean'
            ? incoming.notificationSoundEnabled
            : prev.notificationSoundEnabled,
        preChatEnabled:
          typeof incoming.preChatEnabled === 'boolean'
            ? incoming.preChatEnabled
            : prev.preChatEnabled,
        borderRadius: incoming.borderRadius || prev.borderRadius,
        preChatFormEnabled: data?.preChatFormEnabled ?? prev.preChatFormEnabled,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveWidgetConfig = async () => {
    setSavingConfig(true);
    try {
      await widgetApi.updateConfig(buildConfigPayload());
      broadcastConfigUpdate();

      // Update business pre-chat form setting separately if present
      if (typeof widgetConfig.preChatFormEnabled === 'boolean') {
        try {
          await businessApi.updatePreChatSettings({ preChatFormEnabled: widgetConfig.preChatFormEnabled });
          broadcastConfigUpdate();
        } catch (err) {
          // ignore here - widget API update was the main payload; show a notification
          addNotification('فشل تحديث حالة نموذج ما قبل المحادثة', 'error');
        }
      }
      addNotification('تم حفظ الإعدادات');
      setHasUnsavedChanges(false);
    } catch (err) {
      addNotification('فشل الحفظ', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleIconUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addNotification('حجم الملف كبير جداً (الحد الأقصى 2MB)', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification('الملف يجب أن يكون صورة', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('icon', file);

    try {
      const data = await widgetApi.uploadIcon(formData);
      // Fix: Use iconUrl instead of url
      const iconUrl = data.iconUrl || data.url || data.customIconUrl;
      
      if (!iconUrl) {
        throw new Error('لم يتم إرجاع رابط الأيقونة');
      }

      setWidgetConfig(prev => ({
        ...prev,
        customIconUrl: iconUrl,
        avatar: 'custom',
      }));
      
      // Auto-save after upload
      await widgetApi.updateConfig(
        buildConfigPayload({ customIconUrl: iconUrl, avatar: 'custom' })
      );
      broadcastConfigUpdate();
      
      addNotification('تم رفع الأيقونة بنجاح وحفظها');
    } catch (err) {
      console.error('Icon upload error:', err);
      addNotification(err.message || 'فشل رفع الأيقونة', 'error');
    }
  };

  if (loading) {
    return <WidgetSettingsSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">
            يوجد تغييرات غير محفوظة - لا تنسى الحفظ
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
        <CardHeader>
          <CardTitle>إعدادات المظهر والسلوك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">رسالة الترحيب</label>
            <Input
              value={widgetConfig.welcomeMessage}
              onChange={e =>
                setWidgetConfig({
                  ...widgetConfig,
                  welcomeMessage: e.target.value,
                })
              }
              placeholder="أهلاً بك! كيف يمكنني مساعدتك؟"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اللون الرئيسي</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={widgetConfig.primaryColor}
                onChange={e =>
                  setWidgetConfig({
                    ...widgetConfig,
                    primaryColor: e.target.value,
                  })
                }
                className="w-12 h-10 p-1 cursor-pointer bg-white dark:bg-gray-800"
              />
              <Input
                value={widgetConfig.primaryColor}
                onChange={e =>
                  setWidgetConfig({
                    ...widgetConfig,
                    primaryColor: e.target.value,
                  })
                }
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">أيقونة البوت</label>
            <div className="grid grid-cols-6 gap-3">
              {[
                { id: 'robot', icon: Bot, label: 'Robot' },
                { id: 'support', icon: Headphones, label: 'Support' },
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'sparkles', icon: Sparkles, label: 'AI' },
                { id: 'business', icon: Briefcase, label: 'Business' },
                { id: 'user', icon: User, label: 'Agent' },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() =>
                    setWidgetConfig({ ...widgetConfig, avatar: item.id })
                  }
                  className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer border-2 transition-all hover:scale-105 ${widgetConfig.avatar === item.id ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20 text-brand-500' : 'border-border hover:bg-muted dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white'}`}
                  title={item.label}
                >
                  <item.icon className="w-6 h-6" />
                </div>
              ))}

              {/* Custom Upload */}
              <div className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-brand-500 hover:bg-muted flex items-center justify-center cursor-pointer transition-all group overflow-hidden relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleIconUpload}
                    accept="image/*"
                    aria-label="Upload widget icon"
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground md:hidden">
                    اضغط لرفع أيقونة
                  </div>
                {widgetConfig.avatar === 'custom' &&
                widgetConfig.customIconUrl ? (
                  <Image
                    src={widgetConfig.customIconUrl}
                    alt="Custom"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-brand-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">شخصية البوت</label>
            <div className="grid grid-cols-3 gap-2">
              {['formal', 'friendly', 'fun'].map(p => (
                <div
                  key={p}
                  onClick={() =>
                    setWidgetConfig({ ...widgetConfig, personality: p })
                  }
                  className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${widgetConfig.personality === p ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20 text-brand-500' : 'border-border hover:bg-muted dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white'}`}
                >
                  <div className="text-2xl mb-1">
                    {p === 'formal' && '👔'}
                    {p === 'friendly' && '😊'}
                    {p === 'fun' && '🤪'}
                  </div>
                  <div className="text-xs font-medium">
                    {p === 'formal' && 'رسمي'}
                    {p === 'friendly' && 'ودود'}
                    {p === 'fun' && 'مرح'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">تفعيل نموذج ما قبل المحادثة</label>
                <p className="text-xs text-muted-foreground">تفعيل مباشر لعرض نموذج ما قبل المحادثة في الويدجت</p>
              </div>
              <input
                type="checkbox"
                checked={widgetConfig.preChatFormEnabled}
                onChange={e => handlePreChatToggle(e.target.checked)}
                className="toggle"
              />
            </div>
          </div>

          {widgetConfig.preChatFormEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium">نص توضيحي لنموذج ما قبل المحادثة</label>
              <Textarea
                value={widgetConfig.preChatDescription || ''}
                onChange={e => updateWidgetField('preChatDescription', e.target.value)}
                placeholder="شاركنا بيانات بسيطة لنستطيع خدمتك بشكل أفضل."
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-muted-foreground">
                يظهر النص تحت عنوان النموذج داخل الويدجت ويوضح سبب طلب البيانات.
              </p>
            </div>
          )}

          <div className="p-3 border rounded-lg bg-white/60 dark:bg-gray-900/40">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" />إظهار شعار Faheemly</label>
                <p className="text-xs text-muted-foreground">ساعدنا على النمو عبر إبقاء عبارة "Powered by Faheemly".</p>
              </div>
              <input
                type="checkbox"
                checked={widgetConfig.showBranding}
                onChange={e => updateWidgetField('showBranding', e.target.checked)}
                className="toggle"
              />
            </div>
          </div>

          <div className="space-y-3 p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4 text-brand-500" /> إشعار صوتي للرسائل
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={e => updateWidgetField('notificationSoundEnabled', e.target.checked)}
                className="toggle"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-brand-500" /> تأخير الفتح التلقائي (ثواني)
              </label>
              <Input
                type="number"
                min={0}
                max={3600}
                value={autoOpenDelaySeconds}
                onChange={e => {
                  const seconds = Math.max(0, Math.min(3600, parseInt(e.target.value, 10) || 0));
                  updateWidgetField('autoOpenDelay', seconds > 0 ? seconds * 1000 : 0);
                }}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-muted-foreground">ضع 0 لتعطيل الفتح التلقائي؛ القيمة تحتسب بالثواني.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Layout className="w-4 h-4 text-brand-500" /> موضع زر الويدجت
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITION_OPTIONS.map(option => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => updateWidgetField('position', option.id)}
                    className={`rounded-xl border px-4 py-3 text-sm text-right transition ${
                      widgetConfig.position === option.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-dashed border-gray-300 text-gray-600 hover:border-brand-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4 text-brand-500" /> استدارة الزوايا ({borderRadiusValue}px)
              </label>
              <input
                type="range"
                min={BORDER_RADIUS_RANGE.min}
                max={BORDER_RADIUS_RANGE.max}
                value={borderRadiusValue}
                onChange={e => updateWidgetField('borderRadius', `${e.target.value}px`)}
                className="w-full accent-brand-500"
              />
              <p className="text-xs text-muted-foreground">تؤثر القيمة على نافذة الدردشة وزر الإطلاق في آنٍ واحد.</p>
            </div>
          </div>

          <Button
            onClick={saveWidgetConfig}
            disabled={savingConfig}
            className="w-full"
          >
            {savingConfig ? (
              <Loader2 className="animate-spin ml-2" />
            ) : (
              <Save className="ml-2 w-4 h-4" />
            )}
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="overflow-hidden border-2 border-dashed">
        <CardHeader className="bg-muted/50 pb-4">
          <CardTitle className="text-sm text-center text-muted-foreground">
            معاينة حية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 h-auto md:h-[500px] relative bg-white dark:bg-gray-900 flex items-end justify-center">
          {/* Mock Widget */}
          <div className="w-full md:w-[350px] h-auto md:h-[450px] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
            {/* Header */}
            <div
              className="p-4 text-white flex items-center gap-3"
              style={{
                backgroundColor: widgetConfig.primaryColor || BRAND.brand500,
              }}
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden text-lg">
                {widgetConfig.avatar === 'custom' &&
                widgetConfig.customIconUrl ? (
                  <Image
                    src={widgetConfig.customIconUrl}
                    alt="Bot"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (() => {
                    const Icon =
                      {
                        robot: Bot,
                        support: Headphones,
                        chat: MessageSquare,
                        sparkles: Sparkles,
                        business: Briefcase,
                        user: User,
                      }[widgetConfig.avatar] || Bot;
                    return <Icon className="w-5 h-5 text-white" />;
                  })()
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm">مساعدك الذكي</h3>
                <p className="text-xs opacity-80">متصل الآن</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 bg-muted/30 space-y-4 overflow-y-auto">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg rounded-tr-none shadow-sm text-sm max-w-[80%]">
                  {widgetConfig.welcomeMessage ||
                    'مرحباً! كيف يمكنني مساعدتك اليوم؟'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-background">
              <div className="h-10 bg-muted rounded-full w-full"></div>
              {widgetConfig.showBranding && (
                <div className="text-center mt-2">
                  <span className="text-[10px] text-gray-400">
                    Powered by <span className="font-bold">فهملي.كوم</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </motion.div>
  );
}
