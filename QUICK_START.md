# 🚀 QUICK START - Faheemly v2.0

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET (generate: openssl rand -base64 32)
# - DATABASE_URL (PostgreSQL connection string)
# - GROQ_API_KEY (from groq.com)
```

### Step 3: Setup Database
```bash
# Install pgvector (for vector search)
sudo apt-get install postgresql-14-pgvector  # Ubuntu
# OR
brew install pgvector  # macOS

# Run migrations
npx prisma migrate deploy

# Seed admin account (optional)
node create-admin.js
```

### Step 4: Start Redis (Optional but Recommended)
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu
# OR
brew install redis  # macOS

# Start Redis
redis-server

# Test connection
redis-cli ping  # Should return: PONG
```

### Step 5: Start Server
```bash
npm run dev
# Server running at: http://localhost:3001
```

### Step 6: Test Everything
```bash
# Check API health
curl http://localhost:3001

# Test admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@faheemly.com","password":"admin@123"}'

# Check Redis cache
redis-cli KEYS "chat:*"
```

---

## 🔧 Production Deployment

### Render.com (Recommended)
1. Create PostgreSQL database → Copy `DATABASE_URL`
2. Create Redis instance → Copy `REDIS_URL`
3. Create Web Service:
   - Build: `cd server && npm install`
   - Start: `node src/index.js`
   - Env vars: Paste from `.env`

### Railway.app
```bash
railway login
railway init
railway add postgres redis
railway up
```

### DigitalOcean App Platform
- Connect GitHub repo
- Set root directory: `/server`
- Add PostgreSQL + Redis addons
- Deploy

---

## 🎯 Quick Tests

### Test Vector Search
```bash
# Add knowledge
curl -X POST http://localhost:3001/api/knowledge/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"المطعم يفتح من 9 صباحاً حتى 11 مساءً"}'

# Query (should use vector search)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"متى يفتح المطعم؟","businessId":"YOUR_BUSINESS_ID"}'
```

### Test Redis Cache
```bash
# Send same query twice
# First call: Cache MISS (hits Groq API)
# Second call: Cache HIT (instant response)

# View cache keys
redis-cli KEYS "chat:*"
```

### Test Multi-Provider Failover
```bash
# Add OpenAI as fallback (via Admin Panel or direct SQL)
INSERT INTO "AIModel" (name, apiKey, endpoint, maxTokens, priority, isActive)
VALUES ('gpt-4o-mini', 'sk-...', 'https://api.openai.com/v1/chat/completions', 1024, 2, true);

# Disable Groq temporarily
UPDATE "AIModel" SET "isActive" = false WHERE name LIKE 'llama%';

# Test chat → should use OpenAI automatically
```

---

## 📱 Admin Panel Access

**URL**: http://localhost:3000/admin

**Default Credentials**:
- Email: `admin@faheemly.com`
- Password: `admin@123`

⚠️ **IMPORTANT**: Change password immediately in production!

---

## 🐛 Common Issues

### "pgvector extension not found"
```sql
-- Connect to DB and run:
CREATE EXTENSION vector;
```

### "Redis connection refused"
```bash
# Start Redis:
sudo systemctl start redis
# OR
redis-server
```

### "JWT_SECRET too weak"
```bash
# Generate strong secret:
openssl rand -base64 32
# Copy output to .env
```

### "Rate limit exceeded"
- Wait 15 minutes OR
- Edit `server/src/index.js` line 51: increase `max: 100` to `max: 200`

---

## 📚 Documentation

- Full docs: `server/SECURITY_UPDATES.md`
- API reference: `server/FAHEEMLY_ANALYSIS.txt`
- Arabic summary: `SUMMARY_AR.md`

---

## ✅ Checklist

Before going live:
- [ ] Change admin password
- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Enable HTTPS
- [ ] Configure Redis (optional)
- [ ] Install pgvector (optional)
- [ ] Add backup AI provider (OpenAI/Anthropic)
- [ ] Set up monitoring (Sentry)
- [ ] Configure automated backups

---

**Status**: 🟢 Production Ready
**Version**: 2.0.0
**Last Updated**: 2025-12-03
