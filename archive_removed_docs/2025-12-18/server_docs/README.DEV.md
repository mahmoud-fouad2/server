# Development & Testing Guide (Server)

This file explains how to run the server worker and tests locally, and how CI runs tests with Postgres and Redis.

## Prerequisites
- Node.js (20+ recommended)
- Docker (for running Postgres and Redis locally)

## Run tests locally

Unit tests do not require local Postgres or Redis and are fast:

```powershell
cd server
npm ci
npm run test:unit
```

Some integration tests require Postgres and Redis. The repository contains a GitHub Actions workflow that runs Postgres + Redis services in CI. To run integration tests locally using Docker:

```powershell
# Start Postgres and Redis using Docker
docker run -d --name fahimo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fahimo_test -p 5432:5432 postgres:15
docker run -d --name fahimo-redis -p 6379:6379 redis:6

# Set environment variables for PowerShell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/fahimo_test'
$env:REDIS_URL='redis://127.0.0.1:6379'
$env:NODE_ENV='test'

cd server
npm ci
npm run test:integration -- --runInBand

# When done, stop containers
docker stop fahimo-postgres fahimo-redis; docker rm fahimo-postgres fahimo-redis
```

## Worker

The worker is a dedicated process that processes knowledge chunk embeddings. You can start it locally for development:

```powershell
cd server
npm run worker
```

Note: In test environment the worker will not auto-start (to avoid leaking handles). Use `startWorker()` and `stopWorker()` programmatically when needed.

## CI

We added `.github/workflows/ci.yml` which spins up Postgres and Redis services and runs unit/integration tests. The CI job is configured to run on pushes and pull requests targeting `main`.
