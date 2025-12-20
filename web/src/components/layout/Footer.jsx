'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <footer
      className={`border-t ${isDark ? 'border-white/5 bg-black/40 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="flex items-center justify-center md:justify-start mb-3">
              <Image
                src="/logo2.png"
                alt="فهملي"
                width={80}
                height={80}
                className="w-16 h-16 object-contain"
                loading="lazy"
              />
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي. نساعدك تزيد مبيعاتك وترضي عملاءك 24/7.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
              الشركة
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="hover:text-brand-500 transition-colors"
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-brand-500 transition-colors"
                >
                  الخدمات
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-brand-500 transition-colors"
                >
                  الأسعار
                </Link>
              </li>
                <li>
                  <Link
                    href="/solutions"
                    className="hover:text-brand-500 transition-colors"
                  >
                    الحلول
                  </Link>
                </li>
                <li>
                  <Link
                    href="/examples"
                    className="hover:text-brand-500 transition-colors"
                  >
                    الأمثلة
                  </Link>
                </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-brand-500 transition-colors"
                >
                  من نحن
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
              المطورين والدعم
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/docs" className="hover:text-brand-500 transition-colors">
                  التوثيق الشامل
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-brand-500 transition-colors">
                  مرجع API
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-500 transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-500 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-500 transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>

            <h4 className="font-bold text-gray-900 dark:text-white mt-4 mb-2 text-sm">تواصل معنا</h4>
            <div className="text-xs opacity-80">
              <div>
                <a href="mailto:info@faheemly.com" className="hover:underline">info@faheemly.com</a>
              </div>
              <div className="mt-1">الرياض، المملكة العربية السعودية</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/5 mt-4 pt-3 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] opacity-60">
            © 2025 جميع الحقوق محفوظة لشركة فهملي
          </p>
          <a
            href="https://ma-fo.info"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity group text-[10px]"
          >
            <Image
              src="https://ma-fo.info/logo2.png"
              alt="Ma-Fo Logo"
              width={10}
              height={10}
              className="object-contain"
              unoptimized
            />
            <span className="font-medium tracking-wide group-hover:text-brand-500 transition-colors">
              Development By Ma-Fo
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
