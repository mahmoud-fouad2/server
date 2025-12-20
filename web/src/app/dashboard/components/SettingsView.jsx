import { useState, useEffect } from 'react';
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
import { Save, Loader2, Key, Trash2, Copy } from 'lucide-react';
import { authApi, businessApi, apiKeyApi } from '@/lib/api';

export default function SettingsView({ user, addNotification }) {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [businessData, setBusinessData] = useState({
    name: '',
    activityType: '',
    botTone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email, password: '' });
      fetchBusinessSettings();
      fetchApiKeys();
    }
  }, [user]);

  const fetchBusinessSettings = async () => {
    try {
      const business = await businessApi.getSettings();
      if (business) {
        setBusinessData({
          name: business.name,
          activityType: business.activityType,
          botTone: business.botTone,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const keys = await apiKeyApi.list();
      setApiKeys(keys);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const key = await apiKeyApi.create({ name: newKeyName });
      setApiKeys([key, ...apiKeys]);
      setNewKeyName('');
      addNotification('تم إنشاء مفتاح API بنجاح');
    } catch (err) {
      addNotification('فشل إنشاء مفتاح API', 'error');
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المفتاح؟ سيتوقف أي تطبيق يستخدمه عن العمل.')) return;
    try {
      await apiKeyApi.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      addNotification('تم حذف مفتاح API بنجاح');
    } catch (err) {
      addNotification('فشل حذف مفتاح API', 'error');
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // Update User
      const updatedUser = await authApi.updateProfile(profileData);

      // Update Business
      await businessApi.updateSettings(businessData);

      addNotification('تم تحديث البيانات بنجاح');

      // Update local storage user
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem(
        'user',
        JSON.stringify({ ...currentUser, ...updatedUser.user })
      );
    } catch (err) {
      addNotification('حدث خطأ أثناء التحديث: ' + err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>تحديث بيانات حسابك الشخصي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">الاسم</label>
            <Input
              value={profileData.name}
              onChange={e =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">البريد الإلكتروني</label>
            <Input
              value={profileData.email}
              onChange={e =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">كلمة المرور الجديدة</label>
            <Input
              type="password"
              placeholder="اتركه فارغاً إذا لم ترد التغيير"
              value={profileData.password}
              onChange={e =>
                setProfileData({ ...profileData, password: e.target.value })
              }
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات النشاط التجاري</CardTitle>
          <CardDescription>تحديث معلومات شركتك أو مطعمك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم النشاط</label>
            <Input
              value={businessData.name}
              onChange={e =>
                setBusinessData({ ...businessData, name: e.target.value })
              }
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع النشاط</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={businessData.activityType}
              onChange={e =>
                setBusinessData({
                  ...businessData,
                  activityType: e.target.value,
                })
              }
            >
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
          <div className="space-y-2">
            <label className="text-sm font-medium">نبرة البوت الافتراضية</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={businessData.botTone}
              onChange={e =>
                setBusinessData({ ...businessData, botTone: e.target.value })
              }
            >
              <option value="friendly">ودود</option>
              <option value="formal">رسمي</option>
              <option value="funny">مرح</option>
              <option value="empathetic">متعاطف</option>
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleProfileUpdate}
            disabled={savingProfile}
            className="w-full"
          >
            {savingProfile ? (
              <Loader2 className="animate-spin ml-2" />
            ) : (
              <Save className="ml-2 w-4 h-4" />
            )}
            حفظ التغييرات
          </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>مفاتيح API</CardTitle>
          <CardDescription>إدارة مفاتيح الوصول للواجهة البرمجية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="اسم المفتاح (مثلاً: تطبيق الجوال)"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Button onClick={handleCreateKey}>
                <Key className="ml-2 w-4 h-4" />
                إنشاء مفتاح
            </Button>
          </div>
          
          <div className="space-y-2">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{key.name}</div>
                  <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                    {key.key}
                    <button onClick={() => navigator.clipboard.writeText(key.key)} className="hover:text-brand-500" title="نسخ">
                        <Copy size={12} />
                    </button>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteKey(key.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {apiKeys.length === 0 && <div className="text-center text-gray-500 py-4">لا توجد مفاتيح API</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
