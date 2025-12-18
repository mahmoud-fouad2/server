# 🚀 Render Deployment Guide

**Status**: ✅ Ready for Production Deployment  
**Version**: 2.0 (ESM Migration Complete)  
**Last Updated**: 2025-01-16  

---

## 📋 Pre-Deployment Checklist

### ✅ Completed
- [x] ESM migration: All ~80+ files converted from CommonJS to ESM
- [x] Server starts successfully on port 3001 (degraded mode tested)
- [x] API endpoints responding (/api/health verified)
- [x] All AI providers available and healthy
- [x] Client build successful (all 47 pages generated)
- [x] Database-tolerant startup: reconnection loop implemented
- [x] SSL configuration for development environment
- [x] Git repository updated with all changes

### ⏳ Required for Deployment
- [ ] Generate strong JWT_SECRET
- [ ] Update ADMIN_INITIAL_PASSWORD
- [ ] Verify AI provider API keys (Groq, Deepseek, Cerebras, Gemini)
- [ ] Configure Render PostgreSQL database URL
- [ ] (Optional) Set up Redis for caching
- [ ] Set environment variables in Render Dashboard
- [ ] Trigger Render deployment

---

## 🔐 Environment Variables Required

### Critical (Must Set in Render Dashboard)

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Security
JWT_SECRET=<generate-strong-64-char-hex-string>
ADMIN_INITIAL_PASSWORD=<strong-16+-char-password>

# AI Providers (at least one required; recommend all for redundancy)
DEEPSEEK_API_KEY=sk-...
GROQ_API_KEY=gsk-...
CEREBRAS_API_KEY=csk-...
GEMINI_API_KEY=...

# Server Config
NODE_ENV=production
PORT=3001
FORCE_PGVECTOR=true
FRONTEND_URL=https://faheemly.com
CORS_ORIGINS=https://faheemly.com
```

### Optional (Recommended)

```env
# Redis (for caching and rate limiting)
REDIS_URL=redis://default:password@host:port

# Email notifications
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Vector search threshold
VECTOR_SIMILARITY_THRESHOLD=0.7

# Database SSL (for cloud PostgreSQL)
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## 🔑 Generate Strong Secrets

### JWT_SECRET
```bash
# On your local machine, run:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output**:
```
a3f2c5d8e1b4a7c0d9e2f5a8b1c4d7e0a3f6c9d2e5a8b1c4d7e0a3f6c9d2e5a8b1c4d7e0a3f6c9d2e5a8b1c4d7e0
```

Copy this and paste into Render Dashboard.

---

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Create Render Account & PostgreSQL Database
1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Create a **PostgreSQL database**:
   - Click "New +" → "PostgreSQL"
   - Name: `fahimo-db`
   - Region: Choose closest to target users (e.g., `us-east`)
   - Plan: Free or Starter (PostgreSQL requires paid plan)
4. Copy the connection string from dashboard (format: `postgresql://...`)

### Step 2: Connect GitHub Repository
1. In Render, click "New +" → "Web Service"
2. Select "Build and deploy from a Git repository"
3. Connect your GitHub account (if not already connected)
4. Select `server` repository
5. Configuration:
   - **Name**: `fahimo-api`
   - **Region**: Same as database (e.g., `us-east`)
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run prisma:generate`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Starter ($12/month) or Standard ($19/month) for production

### Step 3: Set Environment Variables
1. In Render Web Service dashboard, go to **Environment** tab
2. Add all variables from the "Critical" section above:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `DATABASE_URL=postgresql://...` (from Step 1)
   - `JWT_SECRET=<generated-strong-secret>`
   - `ADMIN_INITIAL_PASSWORD=<strong-password>`
   - `GROQ_API_KEY=...`
   - `DEEPSEEK_API_KEY=...`
   - `CEREBRAS_API_KEY=...`
   - `GEMINI_API_KEY=...`
   - `FRONTEND_URL=https://faheemly.com`
   - `CORS_ORIGINS=https://faheemly.com`
   - (Optional) `REDIS_URL=...`

3. Click **Save Changes**

### Step 4: Trigger Deployment
1. After environment variables are set, Render will automatically rebuild and deploy
2. OR manually trigger:
   - Go to **Deployments** tab → **Create Deployment**
   - OR push a new commit to `main` branch

### Step 5: Verify Deployment
1. Wait for build to complete (usually 3-5 minutes)
2. Once deployed, test the API:
   ```bash
   curl https://your-render-url/api/health
   ```
3. Expected response:
   ```json
   {
     "status": "healthy",
     "database": { "connected": true },
     "aiProviders": { "available": 4, "healthy": true },
     "timestamp": "2025-01-16T10:30:00Z"
   }
   ```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Render Web Service (fahimo-api)                        │
│  - Node.js 24+                                          │
│  - Express + Socket.IO + Prisma                         │
│  - Port: 3001                                           │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌─────────┐
   │ PostgreSQL│ Redis │ AI APIs │
   │ (Render) │(Cloud)│(Groq...)│
   └────────┘ └────────┘ └─────────┘
```

---

## 🔄 Database Migrations

Render will automatically run database migrations during deployment:

```bash
# In build command:
npm ci && npm run prisma:generate

# In start command:
npm run start:prod  # runs: production:setup && node src/index.js
```

The `production:setup` script handles:
1. Running pending Prisma migrations
2. Creating initial admin user (if not exists)
3. Seeding required configuration

---

## 🐛 Troubleshooting

### Build Fails
1. Check **Build Logs** in Render Dashboard
2. Verify `build` script in `package.json`
3. Ensure all Node modules are compatible with Node v24+

### App Crashes on Startup
1. Check **Runtime Logs** in Render Dashboard
2. Common issues:
   - `DATABASE_URL` not set or invalid
   - Missing AI provider API keys
   - JWT_SECRET too short or invalid characters

### Database Connection Fails
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db?sslmode=require`
2. Check PostgreSQL instance is running on Render
3. Verify password doesn't contain special characters that need URL encoding

### API Returns 503 (Service Unavailable)
- Server is in degraded mode (waiting for database)
- Check database is accessible from Render
- Verify pgvector extension is installed (automatic on Render PostgreSQL)

---

## 📈 Scaling Recommendations

### For Free/Hobby Plan
- **Pros**: No cost, suitable for testing
- **Cons**: Slower response times, limited resources, auto-spins down after 15 mins inactivity

### For Production ($12-19/month)
- **Recommended**: Starter plan (1GB RAM, 0.5 vCPU)
- **Upgrade to Standard**: If >100 concurrent users expected

### Redis Cache
- Highly recommended for production
- Reduces database load for repeated queries
- Use Redis Cloud free tier (500MB) for testing

---

## ✅ Post-Deployment Validation

### 1. Health Check
```bash
curl https://your-render-url/api/health
```

### 2. Chat Widget API
```bash
curl -X POST https://your-render-url/api/widget/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "test"}'
```

### 3. Database Connectivity
```bash
# From Render dashboard, check database connection logs
# Should show: "Database connected successfully"
```

### 4. Socket.IO (Real-time)
```bash
# Test WebSocket connection from client
# Should establish connection without errors
```

### 5. Monitor Logs
```bash
# In Render dashboard, monitor:
# - Application logs (stdout/stderr)
# - Error tracking (Sentry if configured)
# - Database logs
```

---

## 🔐 Security Recommendations

1. **Enable auto-deploy only from main branch**
   - Render Dashboard → Settings → Branch → `main`

2. **Rotate secrets regularly**
   - Update JWT_SECRET every 90 days
   - Rotate API keys quarterly

3. **Monitor for suspicious activity**
   - Enable Sentry for error tracking
   - Monitor API logs for 429 (rate limit) errors

4. **HTTPS only**
   - All traffic to/from Render uses HTTPS by default
   - Enable HSTS headers in production

5. **Database backups**
   - Render PostgreSQL includes automatic backups
   - Test restore procedures quarterly

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Node.js Docs**: https://nodejs.org/docs/

---

## 🎉 Deployment Complete!

Once deployed, your Faheemly AI Chat Platform is live on:
```
🌐 https://your-render-url
📱 API Base: https://your-render-url/api
⚡ WebSocket: wss://your-render-url/socket.io
```

**Next Steps**:
- Configure custom domain (if needed)
- Set up monitoring/alerting
- Load test and monitor performance
- Gather user feedback

---

**Last Deployment**: 2025-01-16  
**ESM Migration Status**: ✅ Complete  
**Ready for Production**: ✅ Yes
