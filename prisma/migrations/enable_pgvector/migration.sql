-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON "KnowledgeBase" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
