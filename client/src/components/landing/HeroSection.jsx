'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Components';
import { CheckCircle, ArrowRight } from 'lucide-react';

const HeroSection = ({
  regionContent,
  t,
  activeCountry,
  isDark
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-cosmic-950 dark:via-cosmic-900 dark:to-brand-950/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
            {regionContent.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {regionContent.heroSubtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Button className="group px-8 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 border-0 shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/50 transition-all hover:-translate-y-1 hover:scale-105">
            {t.startTrial}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" className="px-8 py-4 text-lg font-bold rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-brand-500 hover:text-brand-500 transition-all">
            {t.watchDemo}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { icon: CheckCircle, text: t.feature1 },
            { icon: CheckCircle, text: t.feature2 },
            { icon: CheckCircle, text: t.feature3 }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-3 p-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-white/10">
              <item.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;