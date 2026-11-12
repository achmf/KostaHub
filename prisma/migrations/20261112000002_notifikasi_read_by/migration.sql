-- Status baca lama (isRead) sengaja dibuang: tidak bisa dipetakan ke user.
-- DropIndex
DROP INDEX IF EXISTS "Notifikasi_isRead_idx";

-- AlterTable
ALTER TABLE "Notifikasi" DROP COLUMN "isRead",
ADD COLUMN     "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[];

