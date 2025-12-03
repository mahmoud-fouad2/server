"use client"

import PageLayout from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

const jobs = [
  {
    title: 'مطور Full Stack',
    department: 'التطوير',
    location: 'الرياض',
    type: 'دوام كامل',
    description: 'نبحث عن مطور متمرس في React و Node.js'
  },
  {
    title: 'مهندس AI/ML',
    department: 'الذكاء الاصطناعي',
    location: 'عن بعد',
    type: 'دوام كامل',
    description: 'خبرة في NLP والنماذج اللغوية'
  }
]

export default function CareersPage() {
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
              <h1 className="text-5xl font-bold mb-6">انضم لفريق فهملي</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                كن جزءاً من ثورة الذكاء الاصطناعي في خدمة العملاء
              </p>
            </motion.div>

            <div className="grid gap-6">
              {jobs.map((job, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-cosmic-900 p-8 rounded-2xl border border-gray-200 dark:border-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Briefcase size={16} /> {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={16} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} /> {job.type}
                        </span>
                      </div>
                    </div>
                    <Button>تقدم الآن</Button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{job.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
