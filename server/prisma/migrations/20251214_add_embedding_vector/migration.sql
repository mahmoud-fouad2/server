-- Migration: add pgvector extension and embedding_vector column

-- Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding_vector column to KnowledgeChunk with 768 dimensions if not exists
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS embedding_vector vector(768);
