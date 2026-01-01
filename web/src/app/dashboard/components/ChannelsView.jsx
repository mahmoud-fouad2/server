import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Share2,
  Link as LinkIcon,
  Check,
  Loader2,
} from 'lucide-react';
import { businessApi, telegramApi } from '@/lib/api';

export default function ChannelsView({ addNotification }) {
  const [telegramToken, setTelegramToken] = useState('');
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
  const [telegramIntegration, setTelegramIntegration] = useState(null);
  const [showTelegramInput, setShowTelegramInput] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const data = await businessApi.integrations();
      const integrations = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.integrations)
            ? data.integrations
            : [];
      const telegram = integrations.find(i => i.type === 'TELEGRAM');
      setTelegramIntegration(telegram || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTelegramConnect = async () => {
    if (!telegramToken) return;
    setIsConnectingTelegram(true);
    try {
      const data = await telegramApi.updateTelegram(telegramToken);
      addNotification('تم ربط بوت تيليجرام بنجاح');
      setTelegramIntegration({ isActive: true, config: { botInfo: data.bot } });
      setShowTelegramInput(false);
      setTelegramToken('');
    } catch (err) {
      addNotification(err.message || 'فشل الربط', 'error');
    } finally {
      setIsConnectingTelegram(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">قنوات الاتصال</h2>
        <p className="text-muted-foreground">ربط البوت بتطبيقات المحادثة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>WhatsApp Business</CardTitle>
                  <CardDescription>الرد الآلي على واتساب</CardDescription>
                </div>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                غير متصل
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              اربط حساب واتساب للأعمال الخاص بك لتمكين الرد الآلي على استفسارات
              العملاء 24/7.
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => addNotification('سيتم تفعيل الربط عبر QR Code قريباً', 'info')}
            >
              <LinkIcon className="w-4 h-4 ml-2" />
              ربط الحساب (QR Code)
            </Button>
          </CardContent>
        </Card>

        {/* Telegram Card */}
        <Card
          className={`border-l-4 ${telegramIntegration?.isActive ? 'border-l-green-500' : 'border-l-blue-500'}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${telegramIntegration?.isActive ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}
                >
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Telegram Bot</CardTitle>
                  <CardDescription>الرد الآلي على تيليجرام</CardDescription>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${telegramIntegration?.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
              >
                {telegramIntegration?.isActive ? 'متصل' : 'غير متصل'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {telegramIntegration?.isActive ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700 dark:text-green-400">
                      البوت متصل بنجاح
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    اسم البوت:{' '}
                    <span className="font-mono font-bold">
                      {telegramIntegration.config?.botInfo?.username ||
                        'Unknown'}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    if (!confirm('هل أنت متأكد من إلغاء الربط؟')) return;
                    try {
                      await telegramApi.remove('TELEGRAM');
                      addNotification('تم إلغاء الربط بنجاح');
                      setTelegramIntegration(null);
                    } catch (err) {
                      addNotification('فشل إلغاء الربط', 'error');
                    }
                  }}
                >
                  إلغاء الربط
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  أنشئ بوت على تيليجرام واربطه هنا للرد على المشتركين في قناتك
                  أو مجموعتك.
                </p>
                {!showTelegramInput ? (
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    onClick={() => setShowTelegramInput(true)}
                  >
                    <LinkIcon className="w-4 h-4 ml-2" />
                    إضافة توكن البوت
                  </Button>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Bot Token</label>
                      <Input
                        value={telegramToken}
                        onChange={e => setTelegramToken(e.target.value)}
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="font-mono text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        احصل عليه من @BotFather
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                        onClick={handleTelegramConnect}
                        disabled={isConnectingTelegram || !telegramToken}
                      >
                        {isConnectingTelegram ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          'ربط الآن'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowTelegramInput(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
