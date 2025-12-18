Upload & Storage Guide

Goal
- Provide a secure, practical, and production-ready upload/storage setup for:
  - Widget avatars/icons
  - Knowledge base original files (PDF/TXT)

Overview
- Local disk uploads (the default) are suitable for development and ephemeral testing, but are not persistent on container-based deployments (e.g., Render, Heroku).
- The production-ready option is to configure an object store (AWS S3) and let the app upload files there and generate public URLs or signed URLs as appropriate.

Environment
- To enable S3-backed uploads set the following environment variables in production/staging:
  - AWS_S3_BUCKET (required)
  - AWS_REGION (recommended)
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - S3_PUBLIC_URL (optional) - if you front your bucket with a CDN or custom domain (e.g., https://cdn.example.com)

Server behavior (what this repo implements)
- Widget icons (/api/widget/upload-icon)
  - Saved locally by multer then uploaded to S3 (if configured). The DB stores the final public URL. If S3 is not configured, the server uses a stable `/uploads/icons/...` path served by Express static middleware.
  - On `GET /api/widget/config/:businessId` the server validates the icon URL with a short HEAD request and clears it if the asset is missing to avoid client-side 404s.
- Knowledge uploads (/api/knowledge/upload)
  - Incoming files (PDF/TXT) are validated and parsed server-side. The extracted content is persisted into the database (and chunked for embeddings).
  - Optionally (if S3 is configured) the original uploaded file is also uploaded to S3 and the public URL is stored inside `KnowledgeBase.metadata.originalFileUrl` for future access or downloads.

Security & Best Practices
- Limit accepted MIME types and file extensions (PDF/TXT only for KB; images with limited formats for avatars).
- Validate file sizes (KB: 10MB; avatars: 2MB by default).
- Uploads to S3 are done server-side and the app sets ACL to `public-read` by default for simple access via CDN. If you require more control, consider issuing short-lived signed URLs for downloads.
- When using S3 consider enabling a CDN (CloudFront or Cloudflare) and set CORS rules and cache headers.

Migration (optional)
- If you have existing uploaded files in `public/uploads/icons`, move them to S3 and update the `business.widgetConfig.customIconUrl` to point to the new S3 location.
- We can provide a migration script to enumerate DB entries, copy files to S3, and update DB records — ask and I will add it.

Notes
- The server logs a warning at startup if running in `NODE_ENV=production` without `AWS_S3_BUCKET` set.
- The code gracefully falls back to local disk when S3 is not configured so development remains simple.
