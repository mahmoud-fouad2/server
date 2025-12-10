'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaCode,
  FaBook,
  FaRocket,
  FaKey,
  FaCheckCircle,
  FaCopy,
  FaPlay,
  FaRobot,
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

export default function APIPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FaRobot className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                فهيملي
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 space-x-reverse">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 transition">
                الرئيسية
              </Link>
              <Link href="/examples" className="text-gray-700 hover:text-indigo-600 transition">
                أمثلة حية
              </Link>
              <Link href="/docs" className="text-gray-700 hover:text-indigo-600 transition">
                الوثائق
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-indigo-600 transition">
                الأسعار
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
              >
                ابدأ مجاناً
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <FaCode className="text-2xl" />
              <span className="font-bold">API Documentation</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              وثائق API الشاملة
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
              تكامل قوي وسهل مع API فهيملي. ابنِ تطبيقات ذكية باستخدام واجهة برمجية بسيطة وقوية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition inline-flex items-center gap-2"
              >
                <FaRocket />
                احصل على API Key
              </Link>
              <a
                href="#playground"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition border-2 border-white/30 inline-flex items-center gap-2"
              >
                <FaPlay />
                جرّب الآن
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <FaKey className="text-indigo-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. احصل على API Key</h3>
              <p className="text-gray-600 mb-4">
                سجل مجاناً واحصل على مفتاح API الخاص بك من لوحة التحكم
              </p>
              <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <FaCode className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. قم بالطلب الأول</h3>
              <p className="text-gray-600 mb-4">
                استخدم أي لغة برمجة لإرسال طلبات HTTP إلى API
              </p>
              <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                POST https://api.faheemly.com/v1/
              </code>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <FaCheckCircle className="text-pink-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. استقبل الاستجابة</h3>
              <p className="text-gray-600 mb-4">
                جميع الاستجابات بصيغة JSON واضحة وسهلة الفهم
              </p>
              <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                {`{ "success": true, ... }`}
              </code>
            </motion.div>
          </div>
        </div>
      </section>

      {/* API Explorer */}
      <section id="playground" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">استكشف API</h2>
            <p className="text-xl text-gray-600">
              جرّب endpoints مباشرة من المتصفح
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Endpoints List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-20">
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
                          ? 'bg-indigo-50 border-2 border-indigo-500'
                          : 'bg-gray-50 hover:bg-gray-100'
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
                        <span className="text-sm font-mono text-gray-600 truncate">
                          {endpoint.path}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
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
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
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
                      <h4 className="font-bold text-lg">Request Body</h4>
                      <button
                        onClick={() => copyToClipboard(selectedEndpoint.request)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition text-sm"
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg">Response</h4>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        200 OK
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                      <pre className="text-sm text-gray-100">
                        <code>{selectedEndpoint.response}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Try It Button */}
                  <div className="flex gap-4">
                    <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2">
                      <FaPlay />
                      جرّب هذا Endpoint
                    </button>
                    <Link
                      href="/register"
                      className="bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      احصل على API Key
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">أمثلة برمجية</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                lang: 'JavaScript',
                code: `const response = await fetch('https://api.faheemly.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
              },
              {
                lang: 'Python',
                code: `import requests

response = requests.post(
    'https://api.faheemly.com/v1/auth/login',
    json={
        'email': 'user@example.com',
        'password': 'password123'
    }
)

data = response.json()
print(data['token'])`,
              },
              {
                lang: 'PHP',
                code: `$ch = curl_init('https://api.faheemly.com/v1/auth/login');

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'user@example.com',
    'password' => 'password123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response);
echo $data->token;`,
              },
              {
                lang: 'cURL',
                code: `curl -X POST https://api.faheemly.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'`,
              },
            ].map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-3 flex items-center justify-between">
                  <span className="font-bold">{example.lang}</span>
                  <button
                    onClick={() => copyToClipboard(example.code)}
                    className="text-gray-300 hover:text-white transition"
                  >
                    <FaCopy />
                  </button>
                </div>
                <div className="bg-gray-900 p-6 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">جاهز للبدء؟</h2>
          <p className="text-xl mb-8 opacity-90">
            ابدأ البناء مع API فهيملي القوي والمرن
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition"
            >
              احصل على API Key مجاناً
            </Link>
            <Link
              href="/docs"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition border-2 border-white/30"
            >
              اقرأ الوثائق الكاملة
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">المنتج</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    الأسعار
                  </Link>
                </li>
                <li>
                  <Link href="/examples" className="hover:text-white transition">
                    أمثلة حية
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition">
                    الوثائق
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">API</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/api" className="hover:text-white transition">
                    نظرة عامة
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-white transition">
                    Authentication
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-white transition">
                    Endpoints
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">الشركة</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    من نحن
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    تواصل معنا
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">قانوني</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    الخصوصية
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    الشروط
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2024 فهيملي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
