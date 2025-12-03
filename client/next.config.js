/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ['ma-fo.info'],
    unoptimized: true,
  },
  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com',
  },
  // Performance optimizations
  swcMinify: true,
  compress: true,
  // Note: headers are not applied in static export mode
  // They need to be configured on your hosting platform (Vercel, Netlify, etc.)
}

module.exports = nextConfig
