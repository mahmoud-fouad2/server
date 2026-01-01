/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: 'export' mode disables API routes and Image Optimization.
  // If deploying to a Node.js server (like Vercel or Render Web Service), consider removing this line.
  output: 'export',
  trailingSlash: true,

  // Image optimization
  images: {
    domains: ['ma-fo.info', 'images.unsplash.com', 'faheemly.com'],
    unoptimized: true, // Required for static export
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com/api',
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fahimo-api.onrender.com/api',
  },

  async headers() {
    // PRODUCTION ONLY - NO LOCALHOST
    const connectSrc = `'self' https://fahimo-api.onrender.com https://faheemly.com https://*.faheemly.com wss://fahimo-api.onrender.com wss://*.faheemly.com`;

    const csp = [
      "default-src 'self'",
      `connect-src ${connectSrc}`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.faheemly.com https://fahimo-api.onrender.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.faheemly.com https://ma-fo.info https://images.unsplash.com https://fahimo-api.onrender.com",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // Next.js 15 deprecates `next lint`. Run ESLint via npm scripts/CI instead.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compress: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production, keep error/warn for debugging
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // When building in a monorepo or when multiple lockfiles exist, Next
  // attempts to infer the workspace root which can trigger a warning.
  // Set `outputFileTracingRoot` to the repository root to silence that
  // warning and make tracing deterministic.
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Note: headers are not applied in static export mode
  // They need to be configured on your hosting platform (Bluehost, Vercel, etc.)
  // Recommended headers for .htaccess:
  // <FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|woff|woff2)$">
  //   Header set Cache-Control "max-age=31536000, public"
  // </FilesMatch>
  // <FilesMatch "\.(css|js)$">
  //   Header set Cache-Control "max-age=31536000, public, immutable"
  // </FilesMatch>
};

module.exports = withBundleAnalyzer(nextConfig);
