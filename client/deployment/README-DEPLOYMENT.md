# Faheemly Frontend - Static Hosting Deployment Guide

## 📋 Prerequisites
- Web hosting with Apache/Nginx support
- FTP or File Manager access
- Domain configured

## 🚀 Deployment Steps

### 1. Upload Files
Upload the entire 'deployment' folder contents to your web root:
\\\
public_html/ or www/ or htdocs/
\\\

### 2. File Structure After Upload
\\\
public_html/
├── index.html
├── _next/
├── docs/
├── solutions/
├── .htaccess
└── ... (other static files)
\\\

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
