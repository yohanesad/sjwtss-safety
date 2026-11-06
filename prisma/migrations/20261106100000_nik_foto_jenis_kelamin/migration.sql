-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- AlterEnum
ALTER TYPE "VisitStatus" ADD VALUE 'PHOTO';

-- DropIndex
DROP INDEX "Visitor_phone_key";

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "nik" TEXT;

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "nik" TEXT;

-- CreateTable
CREATE TABLE "VisitPhoto" (
    "visitId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitPhoto_pkey" PRIMARY KEY ("visitId")
);

-- CreateIndex
CREATE INDEX "VisitPhoto_createdAt_idx" ON "VisitPhoto"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_nik_idx" ON "Visit"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_nik_key" ON "Visitor"("nik");

-- AddForeignKey
ALTER TABLE "VisitPhoto" ADD CONSTRAINT "VisitPhoto_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

