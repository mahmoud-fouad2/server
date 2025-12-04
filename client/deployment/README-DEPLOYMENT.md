# Faheemly Frontend - Bluehost Deployment Guide

## 📋 Prerequisites
- Node.js 18+ installed on Bluehost
- SSH access to your Bluehost account
- Domain configured in cPanel

## 🚀 Deployment Steps

### 1. Upload Files
Upload the entire 'deployment' folder to your Bluehost account:
\\\ash
/home/username/public_html/faheemly/
\\\

### 2. SSH into Bluehost
\\\ash
ssh username@your-domain.com
cd public_html/faheemly
\\\

### 3. Install Dependencies
\\\ash
npm install --production
\\\

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
\\\
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
\\\

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
