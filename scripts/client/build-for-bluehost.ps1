# Faheemly Frontend Build Script for Bluehost (Windows PowerShell)
# Run this script before deploying to Bluehost

Write-Host "🚀 Starting Faheemly Frontend Build Process..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Get script directory and navigate to client folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientDir = Join-Path (Split-Path (Split-Path $scriptDir -Parent) -Parent) "client"
Set-Location $clientDir

Write-Host "📁 Working directory: $clientDir" -ForegroundColor Cyan

# Step 1: Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "deployment" -Recurse -Force -ErrorAction SilentlyContinue

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 3: Build Next.js app
Write-Host "🏗️  Building Next.js application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please check errors above." -ForegroundColor Red
    exit 1
}

# Step 4: Create deployment directory with static files
Write-Host "📦 Creating static deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "deployment" -Force | Out-Null

# Copy static export files (out directory)
if (Test-Path "out") {
    Copy-Item -Path "out\*" -Destination "deployment\" -Recurse -Force
} else {
    Write-Host "❌ 'out' directory not found! Build may have failed." -ForegroundColor Red
    exit 1
}

# Create .htaccess for static hosting
$htaccess = @"
# Faheemly Static Site Configuration for Bluehost

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
"@

Set-Content -Path "deployment\.htaccess" -Value $htaccess

# Create README for static deployment
$readme = @"
# Faheemly Frontend - Static Hosting Deployment Guide

## 📋 Prerequisites
- Web hosting with Apache/Nginx support
- FTP or File Manager access
- Domain configured

## 🚀 Deployment Steps

### 1. Upload Files
Upload the entire 'deployment' folder contents to your web root:
\`\`\`
public_html/ or www/ or htdocs/
\`\`\`

### 2. File Structure After Upload
\`\`\`
public_html/
├── index.html
├── _next/
├── docs/
├── solutions/
├── .htaccess
└── ... (other static files)
\`\`\`

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
"@

Set-Content -Path "deployment\README-DEPLOYMENT.md" -Value $readme

# Step 5: Create deployment folder (no ZIP needed for static hosting)
Write-Host "📁 Static files ready in 'deployment' folder" -ForegroundColor Yellow

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📁 Static deployment folder: deployment/" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps for Static Hosting:" -ForegroundColor Yellow
Write-Host "1. Upload the entire 'deployment' folder to your hosting" -ForegroundColor White
Write-Host "2. Point your domain to the hosting server" -ForegroundColor White
Write-Host "3. Enable SSL certificate" -ForegroundColor White
Write-Host "4. Test your website" -ForegroundColor White
Write-Host ""
Write-Host "🔧 File Structure:" -ForegroundColor Yellow
Write-Host "- index.html (main page)" -ForegroundColor White
Write-Host "- _next/ (Next.js assets)" -ForegroundColor White
Write-Host "- .htaccess (Apache configuration)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Need help? Contact: mahmoud.a.fouad2@gmail.com" -ForegroundColor Cyan
Write-Host "📱 Phone: +966 530047640" -ForegroundColor Cyan
