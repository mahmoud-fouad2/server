#!/bin/sh
# This script runs after deployment on Render

echo "🚀 Running post-deployment tasks..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push database schema changes
echo "🗄️ Pushing database schema..."
npx prisma db push || echo "⚠️ Schema push failed or no changes needed"

# Seed the database with initial data
echo "🌱 Seeding database..."
npm run db:seed || echo "⚠️ Seeding failed or already seeded"

echo "✅ Post-deployment tasks completed!"
