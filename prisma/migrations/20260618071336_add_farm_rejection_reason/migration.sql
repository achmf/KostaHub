-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "rejectionReason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'NONAKTIF';
