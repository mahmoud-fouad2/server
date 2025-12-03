# 🚀 Activating High-Performance Infrastructure (Redis & pgvector)

To enable the advanced AI features (Vector Search) and high-speed caching (Redis) you requested, you need to install the following software. The code is already updated to use them!

## 1. PostgreSQL & pgvector (For Smart Search)
The "Smart Search" feature requires a special database extension called `pgvector`. This **does not work with MySQL/XAMPP**.

### Installation Steps (Windows):
1.  **Download PostgreSQL:** [Download here](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). Choose version 15 or 16.
2.  **Install:** During installation, set the password to `postgres` (or update the `.env` file with your chosen password).
3.  **Install pgvector:**
    *   If you used the installer above, you can use Stack Builder (included) to install extensions, or:
    *   Run this SQL command in pgAdmin or psql:
        ```sql
        CREATE EXTENSION vector;
        ```
4.  **Update Database:**
    Run the migration command to create the tables:
    ```bash
    cd server
    npx prisma migrate dev --name init_pgvector
    ```

## 2. Redis (For Speed & Caching)
Redis caches AI responses so you don't pay for the same answer twice.

### Installation Steps (Windows):
1.  **Option A (Easiest):** Install [Memurai](https://www.memurai.com/get-memurai) (Developer Edition is free). It's a native Windows Redis compatible server.
2.  **Option B (Docker):** If you use Docker: `docker run -p 6379:6379 -d redis`
3.  **Option C (WSL):** If you use WSL: `sudo apt-get install redis-server`

## 3. Verification
Once installed, run the diagnostic script to confirm everything is active:
```bash
node server/scripts/check-infrastructure.js
```

## 4. Troubleshooting
*   **Error: "P1001: Can't reach database server"**: Make sure PostgreSQL service is running in Services.msc.
*   **Error: "Redis Client Error"**: Make sure Memurai or Redis service is running.
