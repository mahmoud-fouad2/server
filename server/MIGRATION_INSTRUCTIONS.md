# Database Migration Instructions

The Knowledge Base feature requires a database schema update. The migration command failed because the database server was not reachable at `localhost:5432`.

## Steps to Fix

1.  **Ensure PostgreSQL is Running**
    *   If using Docker: Run `docker compose up -d db` in the root directory.
    *   If using Local Postgres: Ensure the service is started.

2.  **Run the Migration**
    Open a terminal in the `server` directory and run:
    ```bash
    npx prisma migrate dev --name add_knowledge_fields
    ```

3.  **Restart the Server**
    After the migration is successful, restart your backend server to apply the changes.

## Troubleshooting
If you see `P1001: Can't reach database server`, check your `.env` file in the `server` directory and ensure `DATABASE_URL` points to the correct host and port.
