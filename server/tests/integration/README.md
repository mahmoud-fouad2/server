# Integration / E2E Guidance ✅

This folder contains integration-style tests that exercise the chat logic (KB enforcement, formatting retries, structured JSON handling) via direct service calls using Jest mocks. They are safe to run locally (no remote requests needed).

If you want to run a simple external E2E against a deployed server (to verify real DB KB, business config, and full stack), use the PowerShell helper in `scripts/run-chat-e2e.ps1`.

Example (PowerShell):

```powershell
# Set the target API base URL (e.g., staging or production)
$env:BASE_URL = 'https://staging.example.com'
# Run the script with your Business ID and an example message
.
\scripts\run-chat-e2e.ps1 -BusinessId 'cmir2oyaz00013ltwis4xc4tp' -Message 'فين فرعكم؟'
```

Notes & Security:
- Do NOT commit sensitive credentials into the repo. If you choose to use login credentials, pass them at runtime or via secure env vars on the host where you run the script.
- The `POST /api/chat/message` endpoint is public and only requires `businessId` and `message` in the body. No token is required.
- For full admin flows (creating KB entries via API), you'll need to log in using `/api/auth/login` and attach the returned token to requests. The repo has auth routes under `/api/auth`.

Want me to run the remote E2E for you? Provide:
- The BASE_URL to test against (e.g., `https://fahemo-prod.example.com`)
- Confirmation that you want me to use the provided credentials to create or validate KB entries (I will NOT store credentials in the repo). 

I'll proceed only after your confirmation.