'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Save,
  Loader2,
  Copy,
  Check,
  Palette,
  Layout,
  MessageSquare,
  Bell,
  Eye,
  Settings,
  Sparkles,
  Zap,
  Users,
  Globe,
  Info
} from 'lucide-react';
import { API_CONFIG } from '@/lib/config';

// ===============================================
// تعريفات البيانات
// ===============================================

const AVATAR_PRESETS = [
  { id: 'avatar1', name: 'أحمد', emoji: '👨‍💼', color: '#3B82F6' },
  { id: 'avatar2', name: 'سارة', emoji: '👩‍💼', color: '#EC4899' },
  { id: 'avatar3', name: 'خالد', emoji: '👨‍💻', color: '#10B981' },
  { id: 'avatar4', name: 'نور', emoji: '👩‍💻', color: '#8B5CF6' },
  { id: 'avatar5', name: 'روبوت', emoji: '🤖', color: '#6366F1' },
  { id: 'avatar6', name: 'مساعد', emoji: '🤝', color: '#F59E0B' },
];

const WIDGET_ICONS = [
  { id: 'icon-chat', label: 'دردشة', emoji: '💬', color: '#3B82F6' },
  { id: 'icon-help', label: 'مساعدة', emoji: '🆘', color: '#EF4444' },
  { id: 'icon-support', label: 'دعم', emoji: '👋', color: '#F59E0B' },
  { id: 'icon-bell', label: 'إشعار', emoji: '🔔', color: '#10B981' },
  { id: 'icon-message', label: 'رسالة', emoji: '💭', color: '#8B5CF6' },
  { id: 'icon-robot', label: 'ذكاء', emoji: '🤖', color: '#6366F1' },
];

const PERSONALITY_OPTIONS = [
  { id: 'friendly', label: 'ودود', emoji: '😊', description: 'أسلوب دافئ ومرحب' },
  { id: 'formal', label: 'رسمي', emoji: '🎩', description: 'أسلوب احترافي ومهني' },
  { id: 'fun', label: 'مرح', emoji: '🎉', description: 'أسلوب حيوي وممتع' },
];

const POSITION_OPTIONS = [
  { id: 'right', label: 'يمين', icon: '👈' },
  { id: 'left', label: 'يسار', icon: '👉' },
];

const BORDER_RADIUS_OPTIONS = [
  { id: '8px', label: 'حاد', value: '8px' },
  { id: '18px', label: 'عادي', value: '18px' },
  { id: '28px', label: 'دائري', value: '28px' },
];

// ===============================================
// المكون الرئيسي
// ===============================================

export default function AvatarAndWidgetSettingsView({ user, addNotification }) {
  console.log('AvatarAndWidgetSettingsView Loaded - Version 2.0');
  const [activeTab, setActiveTab] = useState('appearance');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // حالة الإعدادات
  const [settings, setSettings] = useState({
    // المظهر
    selectedAvatar: 'avatar1',
    selectedIcon: 'icon-chat',
    customAvatar: null,
    customIcon: null,
    previewCustomAvatar: null,
    previewCustomIcon: null,
    
    // الألوان
    primaryColor: '#0066FF',
    secondaryColor: '#F8F9FA',
    accentColor: '#00D4FF',
    
    // السلوك
    personality: 'friendly',
    position: 'right',
    borderRadius: '18px',
    welcomeMessage: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    widgetName: 'مساعد ذكي',
    
    // الميزات
    preChatEnabled: true,
    notificationSoundEnabled: true,
    ratingEnabled: true,
    autoOpenDelay: 0,
    showBranding: true,
    
    // نوع الويدجت
    selectedVariant: 'standard',
    latestConfigVersion: null,
  });

  // ===============================================
  // تحميل الإعدادات الحالية
  // ===============================================
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
            const cfg = typeof biz.widgetConfig === 'string' 
              ? JSON.parse(biz.widgetConfig) 
              : biz.widgetConfig;

            setSettings(prev => ({
              ...prev,
              selectedAvatar: cfg.avatar || prev.selectedAvatar,
              primaryColor: cfg.primaryColor || prev.primaryColor,
              secondaryColor: cfg.secondaryColor || prev.secondaryColor,
              accentColor: cfg.accentColor || prev.accentColor,
              personality: cfg.personality || prev.personality,
              position: cfg.position || prev.position,
              borderRadius: cfg.borderRadius || prev.borderRadius,
              welcomeMessage: cfg.welcomeMessage || prev.welcomeMessage,
              widgetName: cfg.widgetName || prev.widgetName,
              preChatEnabled: cfg.preChatEnabled ?? prev.preChatEnabled,
              notificationSoundEnabled: cfg.notificationSoundEnabled ?? prev.notificationSoundEnabled,
              ratingEnabled: cfg.ratingEnabled ?? prev.ratingEnabled,
              autoOpenDelay: cfg.autoOpenDelay || prev.autoOpenDelay,
              showBranding: cfg.showBranding ?? prev.showBranding,
              previewCustomIcon: cfg.customIconUrl || prev.previewCustomIcon,
              previewCustomAvatar: cfg.customAvatarUrl || prev.previewCustomAvatar,
            }));
          } catch (e) {
            console.error('Failed to parse widget config:', e);
          }
        }

        if (biz.widgetVariant) {
          setSettings(prev => ({
            ...prev,
            selectedVariant: biz.widgetVariant.toLowerCase()
          }));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ===============================================
  // معالجات الأحداث
  // ===============================================

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({
        ...prev,
        previewCustomAvatar: event.target.result,
        customAvatar: file,
        selectedAvatar: 'custom',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({
        ...prev,
        previewCustomIcon: event.target.result,
        customIcon: file,
        selectedIcon: 'custom',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // إضافة جميع الإعدادات
      formData.append('selectedAvatar', settings.selectedAvatar);
      formData.append('selectedIcon', settings.selectedIcon);
      formData.append('widgetVariant', settings.selectedVariant);
      formData.append('primaryColor', settings.primaryColor);
      formData.append('secondaryColor', settings.secondaryColor);
      formData.append('accentColor', settings.accentColor);
      formData.append('personality', settings.personality);
      formData.append('position', settings.position);
      formData.append('borderRadius', settings.borderRadius);
      formData.append('welcomeMessage', settings.welcomeMessage);
      formData.append('widgetName', settings.widgetName);
      formData.append('preChatEnabled', settings.preChatEnabled);
      formData.append('notificationSoundEnabled', settings.notificationSoundEnabled);
      formData.append('ratingEnabled', settings.ratingEnabled);
      formData.append('autoOpenDelay', settings.autoOpenDelay);
      formData.append('showBranding', settings.showBranding);
      
      if (settings.customAvatar) formData.append('customAvatar', settings.customAvatar);
      if (settings.customIcon) formData.append('customIcon', settings.customIcon);

      const response = await fetch('/api/business/avatar-settings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        addNotification('✅ تم حفظ الإعدادات بنجاح!', 'success');

        // تحديث الويدجت فوراً
        const businessId = user?.businessId;
        if (businessId) {
          try {
            const bc = new BroadcastChannel(`fahimo-config-update-${businessId}`);
            bc.postMessage({ type: 'CONFIG_UPDATED', timestamp: Date.now() });
            bc.close();
          } catch (e) {
            localStorage.setItem(`fahimo-config-update-${businessId}-notify`, Date.now());
          }
        }

        // تحديث المعاينات
        if (data.widgetConfig) {
          setSettings(prev => ({
            ...prev,
            previewCustomIcon: data.widgetConfig.customIconUrl || prev.previewCustomIcon,
            previewCustomAvatar: data.widgetConfig.customAvatarUrl || prev.previewCustomAvatar,
          }));
        }

        if (data.configVersion) {
          setSettings(prev => ({
            ...prev,
            latestConfigVersion: data.configVersion
          }));
        }
      } else {
        addNotification('❌ فشل حفظ الإعدادات', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('❌ حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const businessId = user?.businessId;
    const baseWidget = API_CONFIG.WIDGET_SCRIPT || 
      `https://fahimo-api.onrender.com/${settings.selectedVariant === 'enhanced' ? 'fahimo-widget-enhanced.js' : 'fahimo-widget.js'}`;
    const versionParam = settings.latestConfigVersion ? `?v=${settings.latestConfigVersion}` : '';
    const embedCode = `<script src="${baseWidget}${versionParam}" data-business-id="${businessId}"></script>`;

    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      addNotification('📋 تم نسخ الكود!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ===============================================
  // التبويبات
  // ===============================================

  const tabs = [
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'behavior', label: 'السلوك', icon: Settings },
    { id: 'features', label: 'الميزات', icon: Zap },
    { id: 'embed', label: 'التضمين', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* التبويبات */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* تبويب المظهر */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* الأفاتار */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-brand-500" size={24} />
                  اختيار الأفاتار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {AVATAR_PRESETS.map((avatar) => (
                    <motion.button
                      key={avatar.id}
                      onClick={() => setSettings(prev => ({ ...prev, selectedAvatar: avatar.id }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.selectedAvatar === avatar.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">{avatar.emoji}</span>
                        <span className="text-xs font-medium">{avatar.name}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* رفع أفاتار مخصص */}
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:border-brand-500 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-brand-500" />
                      <span className="text-sm font-medium">رفع أفاتار مخصص</span>
                      <span className="text-xs text-gray-500">PNG, JPG (أقصى 2MB)</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>

                  {settings.previewCustomAvatar && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <img
                        src={settings.previewCustomAvatar}
                        alt="معاينة الأفاتار"
                        className="w-24 h-24 rounded-full object-cover border-4 border-brand-500"
                      />
                      <span className="text-sm text-brand-600 mt-2 font-medium">✓ تم التحميل</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* الأيقونة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-brand-500" size={24} />
                  أيقونة الويدجت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {WIDGET_ICONS.map((icon) => (
                    <motion.button
                      key={icon.id}
                      onClick={() => setSettings(prev => ({ ...prev, selectedIcon: icon.id }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.selectedIcon === icon.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">{icon.emoji}</span>
                        <span className="text-xs font-medium">{icon.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* رفع أيقونة مخصصة */}
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:border-brand-500 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-brand-500" />
                      <span className="text-sm font-medium">رفع أيقونة مخصصة</span>
                      <span className="text-xs text-gray-500">PNG, SVG (أقصى 1MB)</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                  </label>

                  {settings.previewCustomIcon && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <img
                        src={settings.previewCustomIcon}
                        alt="معاينة الأيقونة"
                        className="w-20 h-20 object-contain"
                      />
                      <span className="text-sm text-brand-600 mt-2 font-medium">✓ تم التحميل</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* الألوان */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="text-brand-500" size={24} />
                  نظام الألوان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">اللون الأساسي</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">اللون الثانوي</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">لون التأكيد</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* تبويب السلوك */}
        {activeTab === 'behavior' && (
          <motion.div
            key="behavior"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* الشخصية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="text-brand-500" size={24} />
                  شخصية المساعد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {PERSONALITY_OPTIONS.map((personality) => (
                    <motion.button
                      key={personality.id}
                      onClick={() => setSettings(prev => ({ ...prev, personality: personality.id }))}
                      className={`p-6 rounded-xl border-2 transition-all text-right ${
                        settings.personality === personality.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-4xl mb-2">{personality.emoji}</div>
                      <div className="font-bold text-lg mb-1">{personality.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {personality.description}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الموضع والتصميم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="text-brand-500" size={24} />
                  الموضع والتصميم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* الموضع */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">موضع الويدجت</label>
                    <div className="grid grid-cols-2 gap-3">
                      {POSITION_OPTIONS.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setSettings(prev => ({ ...prev, position: pos.id }))}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.position === pos.id
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-2xl mb-1">{pos.icon}</div>
                          <div className="text-sm font-medium">{pos.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* الحواف */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">استدارة الحواف</label>
                    <div className="grid grid-cols-3 gap-3">
                      {BORDER_RADIUS_OPTIONS.map((radius) => (
                        <button
                          key={radius.id}
                          onClick={() => setSettings(prev => ({ ...prev, borderRadius: radius.value }))}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.borderRadius === radius.value
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          style={{ borderRadius: radius.value }}
                        >
                          <div className="text-xs font-medium">{radius.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* رسالة الترحيب */}
                <div>
                  <label className="text-sm font-medium mb-2 block">رسالة الترحيب</label>
                  <textarea
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
                    rows={3}
                    placeholder="مرحباً! كيف يمكنني مساعدتك اليوم؟"
                  />
                </div>

                {/* اسم الويدجت */}
                <div>
                  <label className="text-sm font-medium mb-2 block">اسم المساعد</label>
                  <input
                    type="text"
                    value={settings.widgetName}
                    onChange={(e) => setSettings(prev => ({ ...prev, widgetName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="مساعد ذكي"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* تبويب الميزات */}
        {activeTab === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-brand-500" size={24} />
                  إعدادات الميزات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* تبديل الميزات */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="text-brand-500" size={20} />
                      <div>
                        <div className="font-medium">نموذج ما قبل الدردشة</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          جمع معلومات الزائر قبل بدء المحادثة
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.preChatEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, preChatEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-gray-300 rounded-full peer-checked:bg-brand-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="text-brand-500" size={20} />
                      <div>
                        <div className="font-medium">أصوات الإشعارات</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          تشغيل صوت عند وصول رسالة جديدة
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.notificationSoundEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, notificationSoundEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-gray-300 rounded-full peer-checked:bg-brand-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="text-brand-500" size={20} />
                      <div>
                        <div className="font-medium">نظام التقييم</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          السماح للزوار بتقييم المحادثة
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.ratingEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, ratingEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-gray-300 rounded-full peer-checked:bg-brand-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-brand-500" size={20} />
                      <div>
                        <div className="font-medium">عرض العلامة التجارية</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          إظهار "مدعوم من فهملي" في الويدجت
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.showBranding}
                        onChange={(e) => setSettings(prev => ({ ...prev, showBranding: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <span className="absolute inset-0 bg-gray-300 rounded-full peer-checked:bg-brand-500 transition-colors"></span>
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </label>
                  </div>
                </div>

                {/* تأخير الفتح التلقائي */}
                <div>
                  <label className="text-sm font-medium mb-2 block">تأخير الفتح التلقائي (ثانية)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.autoOpenDelay}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoOpenDelay: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Info size={12} className="inline" /> صفر = بدون فتح تلقائي
                  </p>
                </div>

                {/* نوع الويدجت (للسوبر أدمن فقط) */}
                {user?.role === 'SUPERADMIN' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">نوع الويدجت</label>
                    <select
                      value={settings.selectedVariant}
                      onChange={(e) => setSettings(prev => ({ ...prev, selectedVariant: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="standard">Standard (سريع)</option>
                      <option value="enhanced">Enhanced (مميزات إضافية)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      يتحكم في الإصدار المستخدم من الويدجت
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* تبويب التضمين */}
        {activeTab === 'embed' && (
          <motion.div
            key="embed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="text-brand-500" size={24} />
                  كود التضمين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4">
                  <p className="text-sm text-brand-900 dark:text-brand-100 font-medium mb-2">
                    📝 كيفية التثبيت:
                  </p>
                  <ol className="text-sm text-brand-800 dark:text-brand-200 space-y-1 mr-4">
                    <li>1. انسخ الكود أدناه</li>
                    <li>2. الصقه قبل علامة <code className="bg-brand-100 dark:bg-brand-900 px-1 rounded">&lt;/body&gt;</code> في موقعك</li>
                    <li>3. سيظهر الويدجت تلقائياً لجميع الزوار</li>
                  </ol>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`<script 
  src="${API_CONFIG.WIDGET_SCRIPT || `https://fahimo-api.onrender.com/${settings.selectedVariant === 'enhanced' ? 'fahimo-widget-enhanced.js' : 'fahimo-widget.js'}`}${settings.latestConfigVersion ? `?v=${settings.latestConfigVersion}` : ''}" 
  data-business-id="${user?.businessId}"
></script>`}</code>
                  </pre>
                  <button
                    onClick={copyEmbedCode}
                    className="absolute top-3 left-3 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        تم النسخ!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        نسخ الكود
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    💡 <strong>نصيحة:</strong> بعد كل تعديل على الإعدادات، سيتم تحديث الويدجت تلقائياً في موقعك خلال دقائق.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* زر الحفظ الثابت */}
      <div className="sticky bottom-6 left-0 right-0 flex justify-center z-10">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-full shadow-2xl p-2"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="gap-2 px-8 py-6 text-lg rounded-full"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={20} />
                حفظ جميع الإعدادات
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
