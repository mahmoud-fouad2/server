# Embeddings & Summarization — Server

This document explains the new knowledge chunk summarization and embedding flow (Groq-only) and how to use the endpoints added to the server.

## Environment variables (required)
- GROQ_API_KEY — Your Groq API key
- GROQ_API_URL — Optional; defaults to `https://api.groq.com/openai/v1/chat/completions` for summarization
- GROQ_EMBED_URL — Embedding endpoint for Groq providers (required for `generateEmbedding` to work)

## New services
- `src/services/summarizer.service.js` — Uses Groq chat completions to summarize/condense text.
- `src/services/embedding.service.js` — Uses Groq embedding endpoint to generate vector arrays (Groq-only; no OpenAI).

## Key follow-up / endpoints
- `POST /api/knowledge/upload` — Upload PDF/text file. The server will:
  1. Save content to `KnowledgeBase`.
  2. Create `KnowledgeChunk` chunks (word-based ~400 words, overlap 50 words).
  3. After creating chunks, the server now summarizes each chunk using Groq and attempts to embed it (if GROQ_EMBED_URL is configured). The chunk `metadata` will contain `summary` and `type`.

- `POST /api/knowledge/text` — Add text. Same behavior as /upload.

- `POST /api/knowledge/url` — Scrape a URL and create `KnowledgeBase` (now with stronger boilerplate removal and `pageType` metadata), then chunk + summarize + embed.

- `POST /api/knowledge/chunks/embed` — Process unembedded chunks and write `KnowledgeChunk.embedding`. Body parameters: `knowledgeBaseId` (optional), `limit` (defaults 50).

## Note: Prisma generate (Windows) issue
During development a `prisma generate` run failed due to `EPERM` while Prisma tried to rename the `query_engine-windows.dll.node.tmp*` file into place. This is usually caused by an OS file lock (antivirus/Windows Defender) or VS Code holding the file. If you see this error locally, try one of these steps:

1. Run PowerShell/Terminal as Administrator and re-run:

```powershell
cd server
npx prisma generate
```

2. Temporarily disable Windows Defender / antivirus real-time protection and re-run `npx prisma generate` then re-enable protection.

3. Ensure no other Node process is holding the file (use Task Manager/Process Explorer) and retry.

## Next recommended improvements
- Offload embedding & summarization to a background worker queue for reliability and rate-limit handling (recommended: BullMQ + Redis or an external job runner).
  - Worker is now included at `src/queue/worker.js` (BullMQ). To use it:
    1. Ensure Redis is available and set `REDIS_URL` in your `.env` (e.g. `redis://127.0.0.1:6379`).
    2. Start the worker in a separate terminal:

```powershell
cd server
npm run worker
```
    3. When `REDIS_URL` is set, chunk creation enqueues jobs and the worker will summarize/embed them asynchronously. If Redis is not configured the server falls back to synchronous processing.
- Add a vector DB (pgvector, Pinecone, Milvus) for fast similarity search rather than JSON arrays in Prisma long-term.
- Add token-aware chunking and an additional step: Groq condense/normalize before embedding to improve cost-efficiency.

If you want, I can implement a background job worker next and wire it up to the queue so chunk creation is fast and embedding/summarization is robust and retryable.
