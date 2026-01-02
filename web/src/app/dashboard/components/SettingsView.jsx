import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Loader2,
  Key,
  Trash2,
  Copy,
  ShieldCheck,
  Activity,
  RefreshCw,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { authApi, businessApi, apiKeyApi } from '@/lib/api-client';

const STATUS_STYLES = {
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border border-amber-100',
  info: 'bg-sky-50 text-sky-800 border border-sky-100',
};

const STATUS_LABELS = {
  success: 'جاهز',
  warning: 'بحاجة للانتباه',
  info: 'معلومات',
};

const DEFAULT_EXPERIENCE = {
  responseWindow: 'instant',
  notifyTeam: true,
  escalateTickets: false,
};

const tonePresets = [
  { value: 'friendly', label: 'ودود', helper: 'إجابات لطيفة وبسيطة' },
  { value: 'formal', label: 'رسمي', helper: 'لغة مهنية ومحايدة' },
  { value: 'funny', label: 'مرح', helper: 'ردود خفيفة وسريعة' },
  { value: 'empathetic', label: 'متعاطف', helper: 'يدعم العملاء في المواقف الحساسة' },
];

const responseWindowOptions = [
  { value: 'instant', label: 'فوري', description: 'تحديث الحالة لحظة بلحظة' },
  { value: '5m', label: 'خلال 5 دقائق', description: 'توازن بين السرعة والدقة' },
  { value: 'manual', label: 'يدوي', description: 'المشرف يقرر وقت الرد' },
];

const StatusBadge = ({ status = 'info', children }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.info;
  const text = children ?? STATUS_LABELS[status] ?? STATUS_LABELS.info;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
};

const PlaceholderLine = ({ width = 'w-full' }) => (
  <div className={`${width} h-3 rounded-full bg-muted/40 animate-pulse`} />
);

const InsightCard = ({ title, description, value, status, icon: Icon }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 shadow-sm transition-all hover:shadow-md group">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <StatusBadge status={status} />
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
    </div>
  </div>
);

export default function SettingsView({ user, addNotification }) {
  const [profileData, setProfileData] = useState({ name: '', email: '', password: '' });
  const [businessData, setBusinessData] = useState({ name: '', activityType: '', botTone: '' });
  const [experienceSettings, setExperienceSettings] = useState(DEFAULT_EXPERIENCE);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    if (!user) return;
    setProfileData({ name: user.name || '', email: user.email || '', password: '' });
    fetchBusinessSettings();
    fetchApiKeys();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('dashboard-experience-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setExperienceSettings(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.warn('Failed to parse experience settings', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dashboard-experience-settings', JSON.stringify(experienceSettings));
  }, [experienceSettings]);

  const fetchBusinessSettings = async () => {
    setBusinessLoading(true);
    try {
      const business = await businessApi.settings();
      if (business) {
        setBusinessData({
          name: business.name || '',
          activityType: business.activityType || '',
          botTone: business.botTone || 'friendly',
        });
      }
    } catch (err) {
      addNotification('تعذر تحميل بيانات النشاط التجاري', 'error');
    } finally {
      setBusinessLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    setKeysLoading(true);
    try {
      const keys = await apiKeyApi.list();
      setApiKeys(Array.isArray(keys) ? keys : []);
    } catch (err) {
      addNotification('فشل تحميل مفاتيح API', 'error');
    } finally {
      setKeysLoading(false);
    }
  };

  const copyKeyToClipboard = async value => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      addNotification('النسخ غير مدعوم في هذا المتصفح', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      addNotification('تم نسخ المفتاح', 'success');
    } catch (err) {
      addNotification('تعذر نسخ المفتاح', 'error');
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || creatingKey) return;
    setCreatingKey(true);
    try {
      const key = await apiKeyApi.create({ name: newKeyName });
      setApiKeys(prev => [key, ...prev]);
      setNewKeyName('');
      addNotification('تم إنشاء مفتاح API بنجاح');
    } catch (err) {
      addNotification('فشل إنشاء مفتاح API', 'error');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async id => {
    if (!confirm('هل أنت متأكد من حذف هذا المفتاح؟')) return;
    setDeletingKeyId(id);
    try {
      await apiKeyApi.delete(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      addNotification('تم حذف مفتاح API بنجاح');
    } catch (err) {
      addNotification('فشل حذف مفتاح API', 'error');
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    if (savingProfile || !hasPendingChanges) return;
    setSavingProfile(true);
    setSaveStatus('saving');
    try {
      const updatedUser = await authApi.updateProfile(profileData);
      await businessApi.updateSettings(businessData);
      addNotification('تم تحديث البيانات بنجاح');
      setHasPendingChanges(false);
      setLastSavedAt(new Date());
      setProfileData(prev => ({ ...prev, password: '' }));
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser.user }));
      }
      setSaveStatus('success');
    } catch (err) {
      addNotification('حدث خطأ أثناء التحديث: ' + err.message, 'error');
      setSaveStatus('error');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleProfileChange = (field, value) => {
    setHasPendingChanges(true);
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessChange = (field, value) => {
    setHasPendingChanges(true);
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (field, value) => {
    setExperienceSettings(prev => ({ ...prev, [field]: value }));
  };

  const insightCards = useMemo(
    () => [
      {
        id: 'account',
        title: 'ملف الحساب',
        description: user?.email || 'لم يتم تحديد البريد',
        value: user?.role === 'admin' ? 'مسؤول' : 'عضو',
        status: 'success',
        icon: ShieldCheck,
      },
      {
        id: 'business',
        title: 'النشاط التجاري',
        description: businessData.activityType ? 'نوع النشاط محدد' : 'حدد نوع نشاطك للاستفادة من التخصيص',
        value: businessData.name || 'غير مسجل',
        status: businessData.activityType ? 'success' : 'warning',
        icon: Activity,
      },
      {
        id: 'api',
        title: 'تكامل الواجهة البرمجية',
        description: 'إدارة الوصول للتطبيقات الخارجية',
        value: `${apiKeys.length} مفتاح`,
        status: apiKeys.length ? 'success' : 'warning',
        icon: Key,
      },
    ],
    [user, businessData, apiKeys]
  );

  const formatLastSaved = date => {
    if (!date) return 'لا توجد تغييرات محفوظة بعد';
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch (err) {
      return date.toLocaleString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-10"
    >
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {insightCards.map(card => (
          <div key={card.id} className="col-span-1 md:col-span-4">
            <InsightCard {...card} />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-6 space-y-8">
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>بيانات الحساب</CardTitle>
                <CardDescription>تحكم في اسمك، بريدك، وتسجيلات الدخول</CardDescription>
              </div>
              {hasPendingChanges && (
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200">تغييرات غير محفوظة</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم</label>
              {businessLoading ? (
                <PlaceholderLine />
              ) : (
                <Input
                  value={profileData.name}
                  onChange={e => handleProfileChange('name', e.target.value)}
                  className="bg-background"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                value={profileData.email}
                onChange={e => handleProfileChange('email', e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور الجديدة</label>
              <Input
                type="password"
                placeholder="اتركه فارغاً إذا لم ترد التغيير"
                value={profileData.password}
                onChange={e => handleProfileChange('password', e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">سيتم إرسال تنبيه أمني للفريق عند تغيير كلمة المرور.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-muted-foreground">
              آخر حفظ: <span className="font-medium text-foreground">{formatLastSaved(lastSavedAt)}</span>
            </div>
            <Button
              onClick={handleProfileUpdate}
              disabled={savingProfile || !hasPendingChanges}
              className="w-full md:w-auto"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              {saveStatus === 'success'
                ? 'تم الحفظ'
                : saveStatus === 'error'
                ? 'فشل الحفظ'
                : saveStatus === 'saving'
                ? 'جاري الحفظ'
                : 'حفظ التغييرات'}
            </Button>
          </CardFooter>
        </Card>
        </div>

        <div className="xl:col-span-6">
        <Card className="border border-border h-full">
          <CardHeader>
            <CardTitle>بيانات النشاط التجاري</CardTitle>
            <CardDescription>اضبط الهوية الصوتية وطريقة التفاعل الذكية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم النشاط</label>
              {businessLoading ? (
                <PlaceholderLine />
              ) : (
                <Input
                  value={businessData.name}
                  onChange={e => handleBusinessChange('name', e.target.value)}
                  className="bg-background"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع النشاط</label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={businessData.activityType}
                onChange={e => handleBusinessChange('activityType', e.target.value)}
              >
                <option value="">اختر نوع النشاط</option>
                <optgroup label="🍽️ الأطعمة والمشروبات">
                  <option value="RESTAURANT">مطعم</option>
                  <option value="CAFE">مقهى</option>
                  <option value="BAKERY">مخبز / حلويات</option>
                </optgroup>
                <optgroup label="🏥 الرعاية الصحية">
                  <option value="CLINIC">عيادة طبية</option>
                  <option value="HOSPITAL">مستشفى</option>
                  <option value="PHARMACY">صيدلية</option>
                  <option value="DENTAL">عيادة أسنان</option>
                </optgroup>
                <optgroup label="🛍️ التجارة والتجزئة">
                  <option value="RETAIL">متجر تجزئة</option>
                  <option value="FASHION">أزياء وموضة</option>
                  <option value="ELECTRONICS">إلكترونيات</option>
                  <option value="JEWELRY">مجوهرات</option>
                  <option value="FURNITURE">أثاث</option>
                </optgroup>
                <optgroup label="💼 الأعمال والخدمات">
                  <option value="COMPANY">شركة</option>
                  <option value="CONSULTING">استشارات</option>
                  <option value="LEGAL">خدمات قانونية</option>
                  <option value="ACCOUNTING">محاسبة</option>
                  <option value="REALESTATE">عقارات</option>
                  <option value="IT">تقنية معلومات</option>
                  <option value="SOFTWARE">برمجيات</option>
                  <option value="DIGITAL">خدمات رقمية</option>
                  <option value="MARKETING">تسويق</option>
                  <option value="DESIGN">تصميم</option>
                  <option value="PHOTOGRAPHY">تصوير</option>
                  <option value="EVENTS">تنظيم فعاليات</option>
                  <option value="ECOMMERCE">تجارة إلكترونية</option>
                  <option value="DROPSHIPPING">دروب شيبينج</option>
                  <option value="MAINTENANCE">صيانة</option>
                  <option value="SECURITY">أمن</option>
                  <option value="TELECOM">اتصالات</option>
                  <option value="ARCHITECTURE">عمارة</option>
                  <option value="INTERIOR">تصميم داخلي</option>
                  <option value="CONSTRUCTION">إنشاءات</option>
                </optgroup>
                <optgroup label="🎓 التعليم والتدريب">
                  <option value="EDUCATION">مركز تدريب</option>
                  <option value="SCHOOL">مدرسة</option>
                  <option value="UNIVERSITY">جامعة</option>
                </optgroup>
                <optgroup label="💰 الخدمات المالية">
                  <option value="BANK">بنك</option>
                  <option value="INSURANCE">تأمين</option>
                  <option value="INVESTMENT">استثمار</option>
                </optgroup>
                <optgroup label="🏨 السياحة والضيافة">
                  <option value="HOTEL">فندق</option>
                  <option value="TRAVEL">وكالة سفر</option>
                  <option value="TOURISM">سياحة</option>
                </optgroup>
                <optgroup label="💅 الجمال والعناية">
                  <option value="SALON">صالون تجميل</option>
                  <option value="SPA">سبا</option>
                  <option value="GYM">نادي رياضي</option>
                </optgroup>
                <optgroup label="🚗 السيارات والنقل">
                  <option value="AUTOMOTIVE">معرض سيارات</option>
                  <option value="CARMAINTENANCE">صيانة سيارات</option>
                  <option value="LOGISTICS">لوجستيات</option>
                </optgroup>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نبرة البوت الافتراضية</label>
              <div className="grid grid-cols-2 gap-3">
                {tonePresets.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleBusinessChange('botTone', preset.value)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-right ${
                      businessData.botTone === preset.value
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 ring-1 ring-brand-500'
                        : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className={`text-sm font-bold ${
                        businessData.botTone === preset.value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {preset.label}
                      </span>
                      {businessData.botTone === preset.value && (
                        <div className="w-2 h-2 rounded-full bg-brand-500 shadow-sm" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {preset.helper}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-6">
          <Card className="border border-border h-full">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>تجربة العملاء والتنبيهات</CardTitle>
            <CardDescription>تحكم في سرعة الردود والتنبيهات الداخلية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4 text-brand-500" />
                نافذة الرد التلقائي
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {responseWindowOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleExperienceChange('responseWindow', option.value)}
                    className={`rounded-2xl border px-4 py-3 text-right transition ${
                      experienceSettings.responseWindow === option.value
                        ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                        : 'border-dashed border-border hover:border-brand-200'
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                التنبيهات الداخلية
              </div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={experienceSettings.notifyTeam}
                  onChange={e => handleExperienceChange('notifyTeam', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-brand-600 focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-medium">إشعار الفريق عند وجود تذاكر عاجلة</p>
                  <p className="text-xs text-muted-foreground">يعزز سرعة معالجة التذاكر الحرجة.</p>
                </div>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={experienceSettings.escalateTickets}
                  onChange={e => handleExperienceChange('escalateTickets', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-brand-600 focus:ring-ring"
                />
                <div>
                  <p className="text-sm font-medium">تصعيد تلقائي للتذاكر غير المجابة</p>
                  <p className="text-xs text-muted-foreground">يرفع التذكرة للمسؤول إذا لم يتم الرد خلال 30 دقيقة.</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="xl:col-span-6">
        <Card className="border border-border h-full">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>مفاتيح API</CardTitle>
                <CardDescription>أدر مفاتيح التكامل مع التطبيقات الخارجية</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchApiKeys} disabled={keysLoading}>
                <RefreshCw className={`w-4 h-4 ml-1 ${keysLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="اسم المفتاح (مثلاً: تطبيق الجوال)"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="bg-background"
                />
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || creatingKey}>
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4 ml-1" />}
                  إنشاء
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {keysLoading ? (
              <div className="space-y-3">
                <PlaceholderLine width="w-3/4" />
                <PlaceholderLine width="w-2/3" />
                <PlaceholderLine width="w-4/5" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                <AlertTriangle className="w-5 h-5 text-amber-500 mb-3" />
                لا توجد مفاتيح مفعلة حالياً
                <p className="text-xs mt-2">أنشئ مفتاحاً لربط الروبوت مع موقعك، تطبيقك أو نظام الـCRM لديك.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div
                    key={key.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{key.name}</p>
                        <StatusBadge status="info">{key.environment || 'إنتاج'}</StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">{key.description || 'وصول قياسي للواجهة البرمجية'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="truncate">{key.key}</span>
                      <div className="flex gap-2 ml-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyKeyToClipboard(key.key)}
                        >
                          <Copy className="w-3.5 h-3.5 ml-1" />
                          نسخ
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          disabled={deletingKeyId === key.id}
                        >
                          {deletingKeyId === key.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </section>
    </motion.div>
  );
}
