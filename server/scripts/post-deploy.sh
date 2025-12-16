#!/bin/sh
# This script runs after deployment on Render

echo "🚀 Running post-deployment tasks..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Apply migrations (preferred) to ensure safe, ordered schema changes
echo "🗄️ Applying Prisma migrations (preferred)..."
if npx prisma migrate deploy; then
  echo "✅ Migrations applied"
else
  echo "⚠️ Migrations failed. Do NOT run prisma db push --force-reset in production. Investigate and apply migrations or run the safe data-fix script."
  echo "ℹ️ To fix NULL name issue manually: run \`node scripts/apply-user-name-migration.js\` with DATABASE_URL set, or add and apply the safe migration and re-run migrate deploy."
fi

# Seed the database with initial data
echo "🌱 Seeding database..."
npm run db:seed || echo "⚠️ Seeding failed or already seeded"

echo "✅ Post-deployment tasks completed!"
