-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "contributorNumber" INTEGER,
ADD COLUMN     "hideAmountPublicly" BOOLEAN NOT NULL DEFAULT false;
