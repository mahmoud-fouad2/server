# 🌍 Environment Configuration Guide

This guide explains how to properly configure environment variables for different deployment scenarios.

## 📁 Environment Files Overview

### Backend (Server)
- **`server/.env`** - Active configuration (DO NOT COMMIT)
- **`server/.env.example`** - Template with all available variables
- **`server/.env.production.example`** - Production-specific template

### Frontend (Client)
- **`client/.env.local`** - Development configuration (DO NOT COMMIT)
- **`client/.env.production`** - Production configuration for Bluehost (DO NOT COMMIT)
- **`client/.env.example`** - Template with all available variables

---

## 🔧 Quick Setup

### For Local Development

1. **Backend Setup**:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/faheemly
JWT_SECRET=your-super-secret-key-minimum-32-characters
GROQ_API_KEY=gsk_your_groq_key
```

2. **Frontend Setup**:
```bash
cd client
cp .env.example .env.local
```

Edit `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

---

### For Production (Render.com + Bluehost)

1. **Backend (Render.com) Environment Variables**:
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://faheemly.com
FRONTEND_URL=https://faheemly.com
CORS_ORIGINS=https://faheemly.com

# Database (Render PostgreSQL)
DATABASE_URL=postgresql://faheemly:password@dpg-xxxxx.oregon-postgres.render.com/faheemly_db

# Security
JWT_SECRET=your-super-secret-key-minimum-32-characters

# Redis Cache (Redis Cloud Labs)
REDIS_URL=redis://default:password@redis-12651.c253.us-central1-1.gce.cloud.redislabs.com:12651

# AI Providers
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=sk-your-deepseek-key
CEREBRAS_API_KEY=your_cerebras_key
```

2. **Frontend (Bluehost) `.env.production`**:
```env
# Backend API URL (Render.com)
NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://fahimo-api.onrender.com

# Business Configuration
NEXT_PUBLIC_BUSINESS_ID=cmivd3c0z0003ulrrn7m1jtjf

# Environment
NODE_ENV=production

# Frontend Base URL
NEXT_PUBLIC_BASE_URL=https://faheemly.com
```

---

## 🎯 Current Production Setup

### Backend
- **Platform**: Render.com
- **URL**: https://fahimo-api.onrender.com
- **Database**: Render PostgreSQL with pgvector extension
- **Cache**: Redis Cloud Labs
- **AI**: Groq (primary), Gemini, DeepSeek, Cerebras (fallbacks)

### Frontend
- **Platform**: Bluehost Shared Hosting
- **URL**: https://faheemly.com
- **Framework**: Next.js (Static Export)
- **Deployment Method**: FTP upload to `public_html/`

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to Git
   - `.env`, `.env.local`, `.env.production` are in `.gitignore`
   - Only commit `.env.example` files

2. **Use different JWT secrets** for development and production

3. **Restrict CORS** in production:
   ```env
   CORS_ORIGINS=https://faheemly.com
   ```

4. **Use HTTPS** in production URLs (never `http://`)

5. **Rotate API keys** regularly

---

## 🧪 Testing Configuration

For running tests, create `server/.env.test`:
```env
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/faheemly_test
JWT_SECRET=test-secret-key
API_URL=http://localhost:3001
```

Then run tests:
```bash
cd server
npm test
```

---

## 🚨 Troubleshooting

### Problem: "CORS Error" in Production
**Solution**: Ensure `FRONTEND_URL` in backend matches your frontend domain exactly
```env
FRONTEND_URL=https://faheemly.com
```

### Problem: "API URL not found"
**Solution**: Check frontend `.env.production` has correct API URL
```env
NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
```

### Problem: Widget not loading
**Solution**: Verify `client/src/lib/config.js` is using environment variables:
```javascript
export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL || 
         'https://fahimo-api.onrender.com';
};
```

### Problem: "localhost" URLs in production
**Solution**: 
1. Delete browser cache
2. Rebuild frontend: `npm run build`
3. Check `.env.production` has no localhost URLs
4. Restart backend service

---

## 📋 Environment Variables Checklist

### Required for All Environments
- [x] `NODE_ENV`
- [x] `DATABASE_URL`
- [x] `JWT_SECRET`
- [x] `GROQ_API_KEY` (or other AI provider)

### Required for Production
- [x] `CLIENT_URL` / `FRONTEND_URL`
- [x] `CORS_ORIGINS`
- [x] `REDIS_URL` (recommended for performance)
- [x] `NEXT_PUBLIC_API_URL` (frontend)

### Optional but Recommended
- [ ] `GEMINI_API_KEY` (AI fallback)
- [ ] `DEEPSEEK_API_KEY` (AI fallback)
- [ ] `CEREBRAS_API_KEY` (AI fallback)
- [ ] `WHATSAPP_TOKEN` (for WhatsApp integration)
- [ ] `TWILIO_*` (for Twilio integration)

---

## 🔄 Migration from Old Setup

If you have existing environment files with hardcoded URLs:

1. **Search for hardcoded URLs**:
```bash
grep -r "localhost:300" server/
grep -r "http://localhost" client/src/
```

2. **Replace with environment variables**:
- Backend: Use `process.env.CLIENT_URL` or `process.env.FRONTEND_URL`
- Frontend: Use `process.env.NEXT_PUBLIC_API_URL`

3. **Update all `.env` files** according to this guide

4. **Restart services**:
```bash
# Backend
cd server && npm run dev  # or pm2 restart

# Frontend
cd client && npm run build
```

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review `DEPLOYMENT_GUIDE_AR.md` for deployment steps
3. Check logs: `server/logs/` and browser console
4. Verify all environment variables are set correctly

---

**Last Updated**: 2025
**Version**: 2.0
