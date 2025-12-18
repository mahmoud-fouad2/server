# S3 / Supabase Storage Setup

This document explains how to configure S3-compatible storage (e.g., Supabase Storage) for Faheemly.

Required environment variables (set these in Render / Supabase / GitHub Secrets):

- S3_ENDPOINT - e.g. https://<project>.storage.supabase.co/storage/v1/s3
- S3_REGION - e.g. eu-west-3 (can be any string for Supabase)
- S3_BUCKET - bucket name (e.g. faheemly)
- S3_ACCESS_KEY_ID - access key
- S3_SECRET_ACCESS_KEY - secret key
- (optional) S3_PUBLIC_URL - public base URL for files (if you proxy/cdn)

After setting env vars:
1. Restart the server / redeploy so env vars are picked up.
2. Test connectivity locally or on the server:
   - From the project root: `cd server && npm run test:s3`
   - The script will list up to 10 objects and confirm connectivity.
3. Upload a test icon from the admin UI (Dashboard > Avatar & Widget). The server will upload to S3 and return a public URL which should point to your S3 endpoint or S3_PUBLIC_URL.

Notes:
- Do not commit credentials to git. Use your hosting provider's secret manager.
- If keys have been exposed, rotate them in Supabase and update the env vars here.
- If using CloudFront or another CDN in front of the bucket, add steps to invalidate/refresh after uploads if needed.

Troubleshooting:
- If `npm run test:s3` fails, check that `S3_BUCKET` is correct and keys have correct permissions (list/read).
- For Supabase, ensure the Service Key has the required storage permissions.
