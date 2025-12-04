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

# Step 4: Export static files (if needed for Bluehost)
echo "📤 Exporting static files..."
# npm run export  # Uncomment if using static export

# Step 5: Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.js deployment/

# Step 6: Compress for upload
echo "🗜️  Compressing files..."
cd deployment
tar -czf ../faheemly-frontend.tar.gz *
cd ..

echo "✅ Build completed successfully!"
echo "================================================"
echo "📁 Deployment package: faheemly-frontend.tar.gz"
echo ""
echo "📋 Next Steps for Bluehost:"
echo "1. Upload faheemly-frontend.tar.gz to your Bluehost server"
echo "2. Extract: tar -xzf faheemly-frontend.tar.gz"
echo "3. Install Node.js on Bluehost (v18+ recommended)"
echo "4. Run: npm install --production"
echo "5. Start: npm start or node server.js"
echo ""
echo "🔧 For custom domain setup:"
echo "- Point your domain to the Node.js app"
echo "- Configure reverse proxy in cPanel"
echo "- Add SSL certificate"
echo ""
echo "💡 Need help? Contact: mahmoud.a.fouad2@gmail.com"
