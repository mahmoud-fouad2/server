/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // basePath: process.env.NODE_ENV === 'production' ? '/chat1' : '',
  trailingSlash: true,
  images: {
    domains: ['ma-fo.info'],
    unoptimized: true,
  },
  // Fahimo Insight: Enable i18n for Arabic-first approach
  // Note: i18n is not compatible with 'output: export', so we disable it for static export
  // and handle localization via client-side logic if needed, or remove this block.
  // i18n: {
  //   locales: ['ar', 'en'],
  //   defaultLocale: 'ar',
  //   localeDetection: true,
  // },
}

module.exports = nextConfig
