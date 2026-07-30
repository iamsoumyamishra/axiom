-- AlterColumn
ALTER TABLE "Embedding" ALTER COLUMN "vector" TYPE vector(768);

-- RecreateIndex
CREATE INDEX IF NOT EXISTS idx_embedding_hnsw ON "Embedding" USING hnsw ("vector" vector_cosine_ops) WITH (m = 16, ef_construction = 200);
