Embedding configuration (Gemini only)

This project defaults to using Gemini for text embeddings to reduce runtime errors and simplify configuration.

Required env vars:

- GEMINI_API_KEY — your Google Generative API key (required)
- GEMINI_EMBED_MODEL — recommended default: `text-embedding-004`

Example (PowerShell):

```powershell
$env:GEMINI_API_KEY = 'YOUR_GOOGLE_API_KEY'
$env:GEMINI_EMBED_MODEL = 'text-embedding-004'
```

Notes:
- Other embedding providers (DeepSeek, Voyage, Cerebras, Groq) are not used by default.
- If you explicitly need to probe other providers for diagnostics, set `EMBEDDING_PROVIDER_ORDER` (comma-separated). This is not recommended for production.

Chat providers and models:

- For chat responses the system prioritizes **Groq** and **Gemini** (Groq as primary, Gemini as primary/secondary depending on availability).
- Gemini is configured to use the `gemini-2.0-flash` model for chat generation to improve response quality and speed.
- Embeddings still use the `GEMINI_EMBED_MODEL` (recommended `text-embedding-004`) unless you explicitly change `EMBEDDING_PROVIDER_ORDER`.

Example (set chat & embed models):

```powershell
$env:GEMINI_API_KEY = 'YOUR_GOOGLE_API_KEY'
$env:GEMINI_EMBED_MODEL = 'text-embedding-004'
# Chat uses gemini-2.0-flash automatically (no env var required)
```
