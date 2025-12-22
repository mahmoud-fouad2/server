import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headphones, User } from 'lucide-react';
import { chatApi } from '@/lib/api';

export default function LiveSupportView({ addNotification }) {
  const [handoverRequests, setHandoverRequests] = useState([]);
  const audioRef = useRef(null);

  const formatVisitorId = id => {
    try {
      if (!id) return '—';
      const s = String(id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return s.length <= 6 ? s : s.slice(0, 6);
    } catch (e) {
      return String(id).slice(-4);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchHandoverRequests = async () => {
      try {
        const payload = await chatApi.getHandoverRequests();
        const requests = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.requests)
              ? payload.requests
              : [];

        if (!mounted) return;
        if (requests.length > handoverRequests.length) {
          playNotificationSound();
          addNotification('طلب دعم جديد!', 'success');
        }
        setHandoverRequests(requests);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHandoverRequests();
    const interval = setInterval(fetchHandoverRequests, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [addNotification, handoverRequests.length]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الدعم المباشر (Live Agent)</h2>
          <p className="text-muted-foreground">إدارة طلبات التحويل للموظفين</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            النظام نشط
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الانتظار</CardTitle>
          <CardDescription>العملاء الذين يطلبون التحدث مع موظف</CardDescription>
        </CardHeader>
        <CardContent>
          {handoverRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 opacity-50" />
              </div>
              <p>لا توجد طلبات انتظار حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {handoverRequests.map((req, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">
                        {req.country || req.countryCode || '—'} • {formatVisitorId(req.conversationId)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        منذ {new Date(req.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      تجاهل
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      قبول المحادثة
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <audio ref={audioRef} src="/notification.mp3" preload="none" />
    </motion.div>
  );
}
