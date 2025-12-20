"use client";

import React from 'react';
import ApiSection from '../components/ApiSection';
import { TRANSLATIONS } from '@/constants';
import PageLayout from '@/components/layout/PageLayout';

export default function DocsApiPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-900 text-gray-900 dark:text-gray-100 font-sans" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h1 className="text-2xl font-bold mb-4">مرجع API</h1>
            <p className="text-sm text-muted-foreground mb-6">توثيق كامل لواجهات برمجة التطبيقات المتاحة.</p>
            <ApiSection />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
