-- AlterTable
ALTER TABLE "credential_collections" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "credential_collections" ADD COLUMN IF NOT EXISTS "metadata_uri" TEXT;
