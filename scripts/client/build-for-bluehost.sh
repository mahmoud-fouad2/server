#!/bin/bash

# Faheemly Frontend Build Script for Bluehost
# This script builds and prepares the Next.js app for production deployment

echo "🚀 Starting Faheemly Frontend Build Process..."
echo "================================================"

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf build

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Step 3: Build Next.js app
echo "🏗️  Building Next.js application..."
npm run build

# Step 4: Create deployment directory with static files
echo "📦 Creating static deployment package..."
mkdir -p deployment

# Copy static export files (out directory)
if [ -d "out" ]; then
    cp -r out/* deployment/
else
    echo "❌ 'out' directory not found! Build may have failed."
    exit 1
fi

# Create .htaccess for static hosting
cat > deployment/.htaccess << 'EOF'
# Faheemly Static Site Configuration

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType font/woff2 "access plus 1 month"
</IfModule>
EOF

# Create README for static deployment
cat > deployment/README-DEPLOYMENT.md << 'EOF'
# Faheemly Frontend - Static Hosting Deployment Guide

## 📋 Prerequisites
- Web hosting with Apache/Nginx support
- FTP or File Manager access
- Domain configured

## 🚀 Deployment Steps

### 1. Upload Files
Upload the entire 'deployment' folder contents to your web root:
```
public_html/ or www/ or htdocs/
```

### 2. File Structure After Upload
```
public_html/
├── index.html
├── _next/
├── docs/
├── solutions/
├── .htaccess
└── ... (other static files)
```

### 3. Configure Domain
- Point domain A record to your hosting IP
- Enable SSL certificate (Let's Encrypt recommended)

### 4. Test Deployment
Visit your domain to ensure everything works correctly.

## 🔧 Troubleshooting

### 404 Errors on Refresh
- Ensure .htaccess is uploaded and working
- Check Apache mod_rewrite is enabled

### Images not loading
- Verify all _next/ files are uploaded
- Check file permissions (644 for files, 755 for directories)

### Slow Loading
- Enable gzip compression in hosting control panel
- Consider using CDN for assets

## 📞 Support
Email: mahmoud.a.fouad2@gmail.com
Phone: +966 530047640

## 🔗 Important URLs
- Frontend: https://faheemly.com
- API: https://fahimo-api.onrender.com
EOF

# Step 5: Create deployment folder (no compression needed for static hosting)
echo "📁 Static files ready in 'deployment' folder"

echo "✅ Build completed successfully!"
echo "================================================"
echo "📁 Static deployment folder: deployment/"
echo ""
echo "📋 Next Steps for Static Hosting:"
echo "1. Upload the entire 'deployment' folder to your hosting"
echo "2. Point your domain to the hosting server"
echo "3. Enable SSL certificate"
echo "4. Test your website"
echo ""
echo "🔧 File Structure:"
echo "- index.html (main page)"
echo "- _next/ (Next.js assets)"
echo "- .htaccess (Apache configuration)"
echo ""
echo "💡 Need help? Contact: mahmoud.a.fouad2@gmail.com"
echo "📱 Phone: +966 530047640"
echo "5. Start: npm start or node server.js"
echo ""
echo "🔧 For custom domain setup:"
echo "- Point your domain to the Node.js app"
echo "- Configure reverse proxy in cPanel"
echo "- Add SSL certificate"
echo ""
echo "💡 Need help? Contact: mahmoud.a.fouad2@gmail.com"
