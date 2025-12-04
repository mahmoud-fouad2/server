# Faheemly Frontend Build Script for Bluehost (Windows PowerShell)
# Run this script before deploying to Bluehost

Write-Host "🚀 Starting Faheemly Frontend Build Process..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

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

# Step 4: Create deployment directory
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "deployment" -Force | Out-Null

# Copy necessary files
Copy-Item -Path ".next" -Destination "deployment\.next" -Recurse -Force
Copy-Item -Path "public" -Destination "deployment\public" -Recurse -Force
Copy-Item -Path "package.json" -Destination "deployment\" -Force
Copy-Item -Path "package-lock.json" -Destination "deployment\" -Force
Copy-Item -Path "next.config.js" -Destination "deployment\" -Force

# Create .htaccess for Bluehost
$htaccess = @"
# Faheemly Next.js Bluehost Configuration

# Enable Node.js application
PassengerEnabled on
PassengerAppRoot /home/username/faheemly
PassengerAppType node
PassengerStartupFile server.js

# Node.js version
PassengerNodejs /home/username/nodevenv/faheemly/18/bin/node

# Environment
SetEnv NODE_ENV production

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
"@

Set-Content -Path "deployment\.htaccess" -Value $htaccess

# Create server.js for Bluehost
$serverJs = @"
// Faheemly Production Server for Bluehost
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log('> Ready on http://' + hostname + ':' + port)
    })
})
"@

Set-Content -Path "deployment\server.js" -Value $serverJs

# Create README for deployment
$readme = @"
# Faheemly Frontend - Bluehost Deployment Guide

## 📋 Prerequisites
- Node.js 18+ installed on Bluehost
- SSH access to your Bluehost account
- Domain configured in cPanel

## 🚀 Deployment Steps

### 1. Upload Files
Upload the entire 'deployment' folder to your Bluehost account:
\`\`\`bash
/home/username/public_html/faheemly/
\`\`\`

### 2. SSH into Bluehost
\`\`\`bash
ssh username@your-domain.com
cd public_html/faheemly
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install --production
\`\`\`

### 4. Setup Node.js Application in cPanel
1. Go to cPanel > Setup Node.js App
2. Click "Create Application"
3. Node.js Version: 18.x
4. Application Mode: Production
5. Application Root: /home/username/public_html/faheemly
6. Application URL: your-domain.com
7. Application Startup File: server.js

### 5. Configure Environment Variables
In cPanel Node.js App, add:
\`\`\`
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
\`\`\`

### 6. Start Application
Click "Start" button in cPanel Node.js App interface

## 🔧 Troubleshooting

### Application won't start
- Check Node.js version (must be 18+)
- Verify all files are uploaded
- Check error logs in cPanel

### 404 Errors
- Ensure .htaccess is properly configured
- Check Application Root path
- Verify domain DNS settings

### Slow Performance
- Enable caching in next.config.js
- Use CDN for static assets
- Consider upgrading hosting plan

## 📞 Support
Email: mahmoud.a.fouad2@gmail.com
Phone: +966 530047640

## 🔗 Important URLs
- Frontend: https://faheemly.com
- API: https://fahimo-api.onrender.com
- Admin: https://faheemly.com/admin
"@

Set-Content -Path "deployment\README-DEPLOYMENT.md" -Value $readme

# Step 5: Create ZIP file
Write-Host "🗜️  Compressing files..." -ForegroundColor Yellow
Compress-Archive -Path "deployment\*" -DestinationPath "faheemly-frontend-bluehost.zip" -Force

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📁 Deployment package: faheemly-frontend-bluehost.zip" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps for Bluehost:" -ForegroundColor Yellow
Write-Host "1. Upload faheemly-frontend-bluehost.zip to your Bluehost cPanel" -ForegroundColor White
Write-Host "2. Extract the ZIP file in File Manager" -ForegroundColor White
Write-Host "3. Go to cPanel > Setup Node.js App" -ForegroundColor White
Write-Host "4. Create new application pointing to the extracted folder" -ForegroundColor White
Write-Host "5. Set Node.js version to 18+" -ForegroundColor White
Write-Host "6. Click 'Start Application'" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Domain Configuration:" -ForegroundColor Yellow
Write-Host "- Point domain A record to Bluehost server IP" -ForegroundColor White
Write-Host "- Enable SSL in cPanel (Let's Encrypt)" -ForegroundColor White
Write-Host "- Configure reverse proxy if needed" -ForegroundColor White
Write-Host ""
Write-Host "💡 Need help? Contact: mahmoud.a.fouad2@gmail.com" -ForegroundColor Cyan
Write-Host "📱 Phone: +966 530047640" -ForegroundColor Cyan
