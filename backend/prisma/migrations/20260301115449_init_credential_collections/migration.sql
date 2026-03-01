-- CreateTable
CREATE TABLE "credential_collections" (
    "id" SERIAL NOT NULL,
    "trackId" INTEGER NOT NULL,
    "collection_address" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credential_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credential_collections_track_id_key" ON "credential_collections"("trackId");
