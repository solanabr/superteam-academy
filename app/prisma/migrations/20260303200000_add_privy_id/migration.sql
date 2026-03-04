-- AlterTable
ALTER TABLE "User" ADD COLUMN "privyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_privyId_key" ON "User"("privyId");
