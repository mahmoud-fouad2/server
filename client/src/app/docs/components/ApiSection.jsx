'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCode,
  FaRocket,
  FaKey,
  FaCheckCircle,
  FaCopy,
  FaPlay,
} from 'react-icons/fa';

const endpoints = [
  {
    method: 'POST',
    path: '/api/auth/register',
    title: 'تسجيل مستخدم جديد',
    description: 'إنشاء حساب مستخدم جديد في النظام',
    request: `{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}`,
    response: `{
  "success": true,
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    title: 'تسجيل الدخول',
    description: 'المصادقة والحصول على access token',
    request: `{
  "email": "user@example.com",
  "password": "SecurePass123!"
}`,
    response: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/businesses',
    title: 'إنشاء عمل جديد',
    description: 'إنشاء بوت/عمل جديد',
    request: `{
  "name": "My Restaurant",
  "activityType": "RESTAURANT",
  "language": "ar",
  "botTone": "friendly",
  "primaryColor": "#6366F1"
}`,
    response: `{
  "success": true,
  "business": {
    "id": "biz_456def",
    "name": "My Restaurant",
    "activityType": "RESTAURANT",
    "status": "TRIAL",
    "messagesUsed": 0
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/chat/:conversationId/message',
    title: 'إرسال رسالة',
    description: 'إرسال رسالة في محادثة',
    request: `{
  "message": "ما هي أوقات العمل؟"
}`,
    response: `{
  "success": true,
  "reply": {
    "id": "msg_xyz790",
    "role": "ASSISTANT",
    "content": "مطعمنا يفتح من 9 صباحاً...",
    "createdAt": "2024-01-15T10:30:05Z"
  },
  "tokensUsed": 45
}`,
  },
];

export default function ApiSection() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">استكشف API</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          جرّب endpoints مباشرة من المتصفح
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Endpoints List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden sticky top-20">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h3 className="font-bold text-lg">Endpoints</h3>
            </div>
            <div className="p-4 space-y-2">
              {endpoints.map((endpoint, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full text-right p-4 rounded-xl transition-all ${
                    selectedEndpoint === endpoint
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`${getMethodColor(
                        endpoint.method
                      )} text-white text-xs px-2 py-1 rounded font-bold`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                      {endpoint.path}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                    {endpoint.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Endpoint Details */}
        <div className="lg:col-span-2">
          <motion.div
            key={selectedEndpoint.path}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`${getMethodColor(
                    selectedEndpoint.method
                  )} text-white px-4 py-2 rounded-lg font-bold`}
                >
                  {selectedEndpoint.method}
                </span>
                <code className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg font-mono">
                  {selectedEndpoint.path}
                </code>
              </div>
              <h3 className="text-2xl font-bold mb-2">{selectedEndpoint.title}</h3>
              <p className="opacity-90">{selectedEndpoint.description}</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Request */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg dark:text-white">Request Body</h4>
                  <button
                    onClick={() => copyToClipboard(selectedEndpoint.request)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition text-sm"
                  >
                    {copied ? <FaCheckCircle /> : <FaCopy />}
                    {copied ? 'تم النسخ!' : 'نسخ'}
                  </button>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{selectedEndpoint.request}</code>
                  </pre>
                </div>
              </div>

              {/* Response */}
              <div>
              {/* Usage & Policies */}
              <div>
                <h4 className="font-bold text-lg dark:text-white mb-3">المصادقة (Authentication)</h4>
                <p className="text-sm">جميع endpoints المحمية تتطلب رأس HTTP: <code>Authorization: Bearer &lt;token&gt;</code>. احصل على التوكن عبر <code>POST /api/auth/login</code> ثم أرسله في كل طلب.</p>

                <h4 className="font-bold text-lg dark:text-white mt-4 mb-3">الحدود ومعدل الطلبات (Rate Limits)</h4>
                <p className="text-sm">نتبع سياسة قياسية لمعدل الطلبات لتوفير استقرار الخدمة. افتراضياً:</p>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>الخطة التجريبية: 100 طلب/دقيقة</li>
                  <li>الخطط المدفوعة: 1000 طلب/دقيقة (قابلة للتخصيص حسب الاتفاق)</li>
                </ul>
                <p className="text-sm mt-2">التخطي عن الحدود قد يؤدي إلى استجابة 429. استخدم آلية إعادة المحاولة مع تأخير متزايد (exponential backoff).</p>

                <h4 className="font-bold text-lg dark:text-white mt-4 mb-3">حصص الرسائل الشهرية (Monthly Chat Quotas)</h4>
                <p className="text-sm">بجانب حدود الطلبات قصيرة الأمد، نوفر حدوداً شهرية لعدد المحادثات/الرسائل وفق الباقة:</p>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>TRIAL: 100 رسالة/شهر</li>
                  <li>BASIC: 500 رسالة/شهر</li>
                  <li>PRO: 1,500 رسالة/شهر</li>
                  <li>AGENCY: 3,000 رسالة/شهر</li>
                </ul>
                <p className="text-sm mt-2">إذا تجاوزت الحصة الشهرية، ستتلقى رسالة توضيحية مع تعليمات الترقية ودعمنا القانوني - سيتم رفض الطلبات الجديدة حتى بداية الشهر التالي أو حتى ترقية الباقة.</p>

                <h4 className="font-bold text-lg dark:text-white mt-4 mb-3">الاستخدام الممنوع</h4>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>المحتوى غير القانوني أو التحريضي على العنف أو الكراهية.</li>
                  <li>محاولات استغلال أو تسريب بيانات المستخدمين أو تخريب الخدمات (exfiltration).</li>
                  <li>استخدامات متعلقة بالبرمجيات الخبيثة أو التعدين غير المشروع.</li>
                  <li>إرسال رسائل سبام أو إنشاء حسابات أو مراقبة المستخدمين بدون موافقة.</li>
                </ul>

                <h4 className="font-bold text-lg dark:text-white mt-4 mb-3">أفضل الممارسات</h4>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>أرسل دائمًا <code>sessionId</code> و<code>conversationId</code> لاستعادة سياق المحادثة.</li>
                  <li>عالج الأخطاء بعقلانية: افترض أن الأخطاء المؤقتة قابلة للاستدعاء (Retry) لكن الأخطاء 4xx يجب الانتباه لها فوراً.</li>
                  <li>حد من مقدار البيانات في كل طلب لتقليل التأخير واستهلاك التوكين.</li>
                </ul>

                <h4 className="font-bold text-lg dark:text-white mt-4 mb-3">مثال سريع (curl)</h4>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-auto" dir="ltr">
{`curl -X POST ${window.location.origin}/api/chat/message \
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg dark:text-white">Response</h4>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                </pre>
              </div>
                    200 OK
                  </span>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{selectedEndpoint.response}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
