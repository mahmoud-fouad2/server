# Faheemly Mobile (Expo)

This is an Expo React Native skeleton for Faheemly mobile app. It includes basic login, chat screen and instructions to connect to the existing backend.

## Quick start

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Copy logo and assets from the web client into mobile assets:

```powershell
# from project root
Copy-Item -Path "..\client\public\logo2.png" -Destination ".\mobile\assets\logo2.png"
```

3. Set environment variables for the mobile app (create `.env` file in `mobile` folder) or set via `app.json` extras for Expo's `Constants.manifest.extra`.

For dev/testing, add the API URL (point to the server running locally):

```
API_URL=http://localhost:3002
DEMO_USER_EMAIL=hello@faheemly.com
DEMO_USER_PASSWORD=demo
```

4. Start Expo:

```bash
npm run start
```

5. To build APK:

- Use EAS (Expo Application Services) build for production APK

```bash
# You will need to log in to Expo and setup EAS
npm run build:apk
```

---

Notes:
- This skeleton uses the server's API endpoints (Auth, Chat, Widget) from `server` using `API_URL`.
- The backend must be running and accessible from the phone / emulator for testing.
	- If running the server locally and testing from a device or Genymotion/Android emulator:
		- Android emulator (official AVD): use `http://10.0.2.2:3002` for local backend
		- Android emulator (Genymotion): use `http://10.0.3.2:3002`
		- Physical device: make sure your PC's IP is accessible and set `API_URL=http://<your-host-ip>:3002`
- Do not store API secrets in the mobile app. The server holds the generative AI keys and secrets.
 - For local testing, consider copying the server's `.env.example` to `.env` in `server` and filling the non-sensitive fields. DO NOT copy any API secrets to the mobile app. 
 - Configure `app.json` extra or EAS secrets for `API_URL` and demo user credentials as needed.

Quick preview: If you want to preview the original web Login UI inside the mobile app:

1. Start the web client (the original site) in `client`:

```pwsh
cd "C:\xampp\htdocs\chat1\github\client"
npm install
npm run dev
# Now the web login will be available at http://localhost:3000/login
```

2. Start the mock API (or your real backend) and Expo web mobile preview:

```pwsh
cd "C:\xampp\htdocs\chat1\github\mobile"
node mock/mock-server.js  # or start the real server
npm run web
```

3. In the Expo UI (http://localhost:19006), open the app in the browser and from the Login screen press "عرض واجهة الويب" to load the real web Login UI.


