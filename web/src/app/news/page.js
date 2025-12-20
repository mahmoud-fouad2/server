'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const news = [
  {
    title: 'إطلاق تحديث فهملي 2.0',
    date: '2025-12-01',
    excerpt: 'تحسينات كبيرة في الأداء ودعم لهجات جديدة',
    image: '/assets/images/news-1.jpg',
  },
  {
    title: 'فهملي يحصل على جائزة أفضل منصة AI',
    date: '2025-11-15',
    excerpt: 'تكريم من مؤتمر التقنية السعودي 2025',
    image: '/assets/images/news-2.jpg',
  },
];

export default function NewsPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl font-bold mb-6">آخر الأخبار</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                تابع أحدث التطورات والإعلانات
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {news.map((item, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-cosmic-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10"
                >
                  <div className="h-64 bg-gradient-to-br from-brand-500 to-purple-600"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <Calendar size={16} />
                      <span>{item.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.excerpt}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
