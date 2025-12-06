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
import { Save, Loader2 } from 'lucide-react';
import { authApi, businessApi } from '@/lib/api';

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

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name, email: user.email, password: '' });
      fetchBusinessSettings();
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
              <option value="RESTAURANT">مطعم</option>
              <option value="RETAIL">متجر تجزئة</option>
              <option value="CLINIC">عيادة</option>
              <option value="COMPANY">شركة</option>
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
    </motion.div>
  );
}
