# 🔒 Security Policy

## Environment Variables Protection

### ✅ Security Measures Implemented:

1. **API Keys Protection**
   - All API keys are stored in `.env` file (NOT committed to Git)
   - Code uses `process.env.*` only
   - No hardcoded credentials in source code

2. **Git Protection**
   - `.env` is in `.gitignore`
   - `.env.example` provided as template (no real keys)
   - API keys removed from Git history

3. **Production Deployment**
   - Environment variables configured in Render Dashboard
   - Keys never exposed in frontend code
   - Secure server-side only API calls

### 🔑 Required Environment Variables:

```env
DATABASE_URL=postgresql://...
PORT=3001
JWT_SECRET=your_secret_key

# AI Providers
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
CEREBRAS_API_KEY=your_cerebras_key
DEEPSEEK_API_KEY=your_deepseek_key

# URLs (optional - hardcoded as fallback)
GROQ_EMBED_URL=https://api.groq.com/openai/v1/embeddings
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
```

### 🛡️ Best Practices:

1. **Never commit `.env` file**
2. **Rotate API keys regularly**
3. **Use environment-specific configurations**
4. **Keep `.env.example` updated (without real values)**
5. **Review code before pushing to GitHub**

### ⚠️ If API Keys Are Exposed:

1. **Immediately revoke** the exposed keys
2. **Generate new keys** from provider dashboards
3. **Update environment variables** in production
4. **Force push** to remove from Git history (if needed)

### 📞 Security Contact:

For security issues, please contact: [Your Contact Info]

---

**Last Security Audit:** December 3, 2025
**Status:** ✅ All API keys secured
