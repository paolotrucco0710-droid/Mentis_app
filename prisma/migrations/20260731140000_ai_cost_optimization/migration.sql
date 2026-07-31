-- CreateEnum
CREATE TYPE "AIResultCacheKind" AS ENUM ('ocr_image', 'ocr_document', 'extraction');

-- AlterTable
ALTER TABLE "ai_jobs" ADD COLUMN "input_tokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_jobs" ADD COLUMN "output_tokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_jobs" ADD COLUMN "estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0;
ALTER TABLE "ai_jobs" ADD COLUMN "cache_hits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_jobs" ADD COLUMN "cache_misses" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_result_cache" (
    "id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "kind" "AIResultCacheKind" NOT NULL,
    "content_hash" TEXT NOT NULL,
    "model" TEXT,
    "prompt_version" TEXT,
    "parser_version" TEXT,
    "result" JSONB NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_result_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_result_cache_cache_key_key" ON "ai_result_cache"("cache_key");
CREATE INDEX "ai_result_cache_content_hash_idx" ON "ai_result_cache"("content_hash");
CREATE INDEX "ai_result_cache_kind_content_hash_idx" ON "ai_result_cache"("kind", "content_hash");
