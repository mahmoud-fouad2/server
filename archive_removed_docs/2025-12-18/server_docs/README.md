# Local pgBouncer scaffold

This folder contains a simple `docker-compose` scaffold that runs `pgbouncer` locally to test connection pooling.

How it works
- The container expects an upstream `DATABASE_URL` environment variable (pointing to your Postgres instance).
- It exposes port `6432` on the host; point your app's `DATABASE_URL` to `postgresql://user:pass@localhost:6432/dbname` to route connections through pgbouncer.

Quick start (PowerShell)

1. From the `server/pgbouncer` folder, export your existing `DATABASE_URL` and ensure it includes host, user, password and dbname.

```powershell
# example: replace with your values if not already set
$env:DATABASE_URL = $env:DATABASE_URL
docker compose up -d
```

2. Update your app's `DATABASE_URL` to use the pgbouncer endpoint (local):

```powershell
# example:
# $env:DATABASE_URL = 'postgresql://fahimo_user:yourpassword@localhost:6432/fahimo?sslmode=require'
```

Notes & caveats
- This scaffold is primarily for local testing. When proxying to a managed remote Postgres instance that requires TLS or special host verification, include `?sslmode=require` in the connection string.
- `userlist.txt` contains a placeholder. For production you should configure secure authentication (or use a `.pgpass` file / environment-secured password injection).
- If you are using a managed DB provider, consult their docs before proxying through pgbouncer.
