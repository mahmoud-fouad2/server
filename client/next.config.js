/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com',
  },
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
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
              priority: 20
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
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
}

module.exports = nextConfig
