-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "durationDays",
DROP COLUMN "emergencyName",
DROP COLUMN "emergencyPhone",
ADD COLUMN     "estimatedHours" INTEGER;

