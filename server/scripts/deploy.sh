#!/bin/bash
# Production-safe deployment script for Render.com
# Handles migrations without data loss warnings

echo "🚀 Starting Fahimo production deployment..."

# Step 1: Install pgvector extension
echo "📦 Installing pgvector extension..."
node scripts/install-pgvector.js

# Step 2: Run migrations safely
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Step 3: Start the server
echo "✅ Starting server..."
node src/index.js
