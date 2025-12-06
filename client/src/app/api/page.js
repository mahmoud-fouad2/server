'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code,
  Database,
  Key,
  Send,
  MessageCircle,
  Settings,
  ChevronRight,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

export default function API() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedEndpoint, setCopiedEndpoint] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  const sections = [
    {
      id: 'overview',
      title: 'نظرة عامة',
      icon: <Info size={20} />,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  فهملي API
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  API شامل ومرن يتيح لك التكامل مع فهملي في أنظمتك الحالية. يدعم جميع العمليات الأساسية لإدارة الشات بوت والمحادثات.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="text-green-600" size={24} />
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  المصادقة
                </h4>
              </div>
              <p className="text-green-800 dark:text-green-200 text-sm">
                استخدم JWT tokens للمصادقة على جميع الطلبات
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-purple-600" size={24} />
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  RESTful API
                </h4>
              </div>
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                تصميم RESTful مع JSON responses موحد
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'authentication',
      title: 'المصادقة',
      icon: <Key size={20} />,
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <h4 className="font-semibold mb-4">الحصول على Token</h4>
            <div className="bg-black rounded-lg p-4 mb-4">
              <code className="text-green-400 text-sm">
{`POST /api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}`}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(`POST /api/auth/login\nContent-Type: application/json\n\n{\n  "email": "your-email@example.com",\n  "password": "your-password"\n}`)}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              {copiedEndpoint === `POST /api/auth/login\nContent-Type: application/json\n\n{\n  "email": "your-email@example.com",\n  "password": "your-password"\n}` ? (
                <CheckCircle size={16} />
              ) : (
                <Copy size={16} />
              )}
              نسخ
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <h4 className="font-semibold mb-4">استخدام Token</h4>
            <div className="bg-black rounded-lg p-4 mb-4">
              <code className="text-green-400 text-sm">
{`Authorization: Bearer YOUR_JWT_TOKEN`}
              </code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              أضف هذا الهيدر لجميع الطلبات المحمية
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'messages',
      title: 'إرسال الرسائل',
      icon: <Send size={20} />,
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <h4 className="font-semibold mb-4">إرسال رسالة</h4>
            <div className="bg-black rounded-lg p-4 mb-4">
              <code className="text-green-400 text-sm">
{`POST /api/messages/send
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "businessId": "your-business-id",
  "message": "مرحباً بك في متجرنا!",
  "recipient": "+966501234567"
}`}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(`POST /api/messages/send\nAuthorization: Bearer YOUR_TOKEN\nContent-Type: application/json\n\n{\n  "businessId": "your-business-id",\n  "message": "مرحباً بك في متجرنا!",\n  "recipient": "+966501234567"\n}`)}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              {copiedEndpoint === `POST /api/messages/send\nAuthorization: Bearer YOUR_TOKEN\nContent-Type: application/json\n\n{\n  "businessId": "your-business-id",\n  "message": "مرحباً بك في متجرنا!",\n  "recipient": "+966501234567"\n}` ? (
                <CheckCircle size={16} />
              ) : (
                <Copy size={16} />
              )}
              نسخ
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'conversations',
      title: 'المحادثات',
      icon: <MessageCircle size={20} />,
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <h4 className="font-semibold mb-4">الحصول على المحادثات</h4>
            <div className="bg-black rounded-lg p-4 mb-4">
              <code className="text-green-400 text-sm">
{`GET /api/conversations
Authorization: Bearer YOUR_TOKEN`}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(`GET /api/conversations\nAuthorization: Bearer YOUR_TOKEN`)}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              {copiedEndpoint === `GET /api/conversations\nAuthorization: Bearer YOUR_TOKEN` ? (
                <CheckCircle size={16} />
              ) : (
                <Copy size={16} />
              )}
              نسخ
            </button>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(s => s.id === activeSection)?.content;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'مرجع API' }]} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                فهملي API
              </h2>
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
                <ChevronRight size={16} />
                العودة للرئيسية
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {sections.find(s => s.id === activeSection)?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                دليل شامل لواجهة برمجة التطبيقات لفهملي
              </p>

              {activeContent}
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Development By{' '}
                  <a
                    href="https://ma-fo.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <img
                      src="https://ma-fo.info/logo2.png"
                      alt="Ma-Fo Logo"
                      className="w-4 h-4"
                    />
                    Ma-Fo
                  </a>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  © 2025 جميع الحقوق محفوظة لشركة فهملي
                </p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}