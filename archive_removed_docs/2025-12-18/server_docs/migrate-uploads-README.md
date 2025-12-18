migrate-uploads-to-s3.js

Purpose:
- Scan existing local uploads (widget icons under `public/uploads/icons` and files under `public/uploads`) and optionally upload them to S3 or persist locally to a stable public path.

Usage:
- Dry run (default): show what would be done
  node scripts/migrate-uploads-to-s3.js --dry-run

- Execute S3 migration (requires AWS env vars):
  AWS_S3_BUCKET=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=... node scripts/migrate-uploads-to-s3.js --execute

- Local persist mode (no AWS keys required):
  node scripts/migrate-uploads-to-s3.js --execute --local

Flags:
- --dry-run  : Show findings without making changes (default)
- --execute  : Perform uploads/copies and update DB when possible
- --local    : Copy files into `public/uploads/persistent` and update DB URLs to point to `FRONTEND_URL` + new path (useful when S3 is not configured)
- --only=widgets|knowledge|all

Notes:
- The script is defensive: if it cannot connect to the database it will still scan the filesystem and report files.
- When running with `--execute` and S3 env vars, the script will upload files to S3 and update DB fields (widget `customIconUrl` or KB `metadata.originalFileUrl`).
- Always run with `--dry-run` first and review the output before calling `--execute`.
