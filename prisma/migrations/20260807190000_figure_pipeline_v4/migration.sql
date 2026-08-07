-- Figure Pipeline V4 metadata on images
ALTER TABLE "images" ADD COLUMN "master_storage_key" TEXT;
ALTER TABLE "images" ADD COLUMN "source_page_image_id" UUID;
ALTER TABLE "images" ADD COLUMN "bbox_normalized" JSONB;
ALTER TABLE "images" ADD COLUMN "detection_confidence" DOUBLE PRECISION;
ALTER TABLE "images" ADD COLUMN "pipeline_version" TEXT;
ALTER TABLE "images" ADD COLUMN "fallback_to_full_page" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "images" ADD COLUMN "region_type" TEXT;
ALTER TABLE "images" ADD COLUMN "contains_text" BOOLEAN;

CREATE INDEX "images_source_page_image_id_idx" ON "images"("source_page_image_id");
