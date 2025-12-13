# Mobile Setup Checklist

Before proceeding to build the APK and implement deeper features, please provide/fill the following:

- Backend
  - Ensure backend `server` runs and accessible on a public address / local IP.
  - Expose `API_URL` (e.g. http://localhost:3002 or http://192.168.1.20:3002)

- Environment variables (server-side) [Keep secrets server-side]
  - `JWT_SECRET` (server)
  - `GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY` (server only)
  - `REDIS_URL` if used, `DATABASE_URL`, `SMTP_*` (server only)
  - `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` (for demo mode) - optional

- Mobile app configuration
  - Set `API_URL` in `app.json` `extra` or `.env` in `mobile` for local test.
  - Copy assets (logo2.png) from `client/public` to `mobile/assets` by running:

```powershell
cd mobile
npm run copy:assets
```

- Build / Release
  - Create an Expo account and setup `eas` for build:

```bash
npm install -g eas-cli
eas login
# then run:
eas build -p android
```

- Play store
  - Package name is `com.faheemly.app` in `app.json`. Provide a Keystore if you want to use your own signing key or let Expo handle the signing.

- Assets
  - Provide high-resolution `logo2.png` (SVG recommended), and app icon 1024x1024 if you want optimized assets.

- Optional extras
  - Provide a Firebase project config if you want Push Notifications (FCM). 
  - Payment provider credentials if integrating subscriptions/payments within app (Stripe/Google Billing).

---

Once the above are provided, I will: 
- Integrate the mobile UI flows with the backend endpoints (Auth, Chat, Widget, Tickets, Business/Plan) 
- Implement session persistence, push notifications, and release-ready build steps

