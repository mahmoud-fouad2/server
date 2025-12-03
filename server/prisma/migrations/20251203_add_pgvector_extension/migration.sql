-- Enable pgvector extension for vector similarity search
-- This migration adds vector support to PostgreSQL

-- Step 1: Enable the pgvector extension (requires superuser or rds_superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: The embedding column already exists in KnowledgeChunk as Float[]
-- We just need to convert it to proper vector type for better performance

-- Note: This is a manual migration. If the extension fails to install,
-- you may need to:
-- 1. Install pgvector on your PostgreSQL server first
-- 2. Or run: CREATE EXTENSION vector; manually as superuser

-- Step 3: Create an index for faster cosine similarity search
-- Using ivfflat index for approximate nearest neighbor search
-- This significantly improves query performance on large datasets

CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_idx 
ON "KnowledgeChunk" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Add a GiST index as alternative (exact search, slower but more accurate)
-- Uncomment if you prefer accuracy over speed:
-- CREATE INDEX knowledge_chunk_embedding_gist_idx 
-- ON "KnowledgeChunk" 
-- USING gist (embedding vector_cosine_ops);

