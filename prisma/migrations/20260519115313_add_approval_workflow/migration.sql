-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'PETUGAS', 'DOKTER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('AKTIF', 'NONAKTIF', 'DELETED');

-- CreateEnum
CREATE TYPE "Kelamin" AS ENUM ('JANTAN', 'BETINA');

-- CreateEnum
CREATE TYPE "KategoriHewan" AS ENUM ('INDUKAN', 'PEJANTAN', 'ANAKAN', 'DARA', 'JANTAN_MUDA');

-- CreateEnum
CREATE TYPE "StatusHewan" AS ENUM ('AKTIF', 'MATI', 'TERJUAL');

-- CreateEnum
CREATE TYPE "KategoriMedis" AS ENUM ('VAKSINASI', 'PENGOBATAN', 'PENGOBATAN_INFEKSI', 'PENGOBATAN_PARASIT', 'PEMERIKSAAN', 'PEMERIKSAAN_RUTIN', 'PERAWATAN_LUKA', 'VITAMIN', 'PARTUS', 'POTONG_KUKU', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusMedis" AS ENUM ('SEMBUH', 'RAWAT', 'PANTAU');

-- CreateEnum
CREATE TYPE "StatusReproduksi" AS ENUM ('HAMIL', 'LAHIR', 'GAGAL');

-- CreateEnum
CREATE TYPE "TipeNotifikasi" AS ENUM ('VAKSIN', 'LAHIR', 'BERAT', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "geojson" TEXT,
    "deskripsi" TEXT,
    "sertifikatUrl" TEXT,
    "status" "FarmStatus" NOT NULL DEFAULT 'AKTIF',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFarm" (
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFarm_pkey" PRIMARY KEY ("userId","farmId")
);

-- CreateTable
CREATE TABLE "Hewan" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "nama" TEXT,
    "kelamin" "Kelamin" NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "berat" DOUBLE PRECISION,
    "kategori" "KategoriHewan" NOT NULL,
    "status" "StatusHewan" NOT NULL DEFAULT 'AKTIF',
    "fotoUrl" TEXT,
    "farmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bapakId" TEXT,
    "indukId" TEXT,

    CONSTRAINT "Hewan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RekamMedis" (
    "id" TEXT NOT NULL,
    "hewanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "kategori" "KategoriMedis" NOT NULL DEFAULT 'LAINNYA',
    "diagnosis" TEXT NOT NULL,
    "obat" TEXT,
    "dokterId" TEXT,
    "namaDokter" TEXT,
    "notes" TEXT,
    "fotoUrl" TEXT,
    "status" "StatusMedis" NOT NULL DEFAULT 'SEMBUH',
    "tanggalLanjut" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RekamMedis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reproduksi" (
    "id" TEXT NOT NULL,
    "indukId" TEXT NOT NULL,
    "pejantanId" TEXT NOT NULL,
    "tanggalKawin" TIMESTAMP(3) NOT NULL,
    "estimasiLahir" TIMESTAMP(3) NOT NULL,
    "status" "StatusReproduksi" NOT NULL DEFAULT 'HAMIL',
    "anakTag" TEXT,
    "anakId" TEXT,
    "inbreedingWarning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reproduksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferHewan" (
    "id" TEXT NOT NULL,
    "hewanId" TEXT NOT NULL,
    "fromFarmId" TEXT NOT NULL,
    "toFarmId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alasan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferHewan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeratBadan" (
    "id" TEXT NOT NULL,
    "hewanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "berat" DOUBLE PRECISION NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeratBadan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" "TipeNotifikasi" NOT NULL,
    "farmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");

-- CreateIndex
CREATE INDEX "Farm_status_idx" ON "Farm"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Hewan_tag_farmId_key" ON "Hewan"("tag", "farmId");

-- CreateIndex
CREATE INDEX "Hewan_tanggalLahir_idx" ON "Hewan"("tanggalLahir");

-- CreateIndex
CREATE INDEX "RekamMedis_tanggal_idx" ON "RekamMedis"("tanggal");

-- CreateIndex
CREATE INDEX "Reproduksi_tanggalKawin_idx" ON "Reproduksi"("tanggalKawin");

-- CreateIndex
CREATE INDEX "TransferHewan_tanggal_idx" ON "TransferHewan"("tanggal");

-- CreateIndex
CREATE INDEX "BeratBadan_tanggal_idx" ON "BeratBadan"("tanggal");

-- CreateIndex
CREATE INDEX "Notifikasi_tanggal_idx" ON "Notifikasi"("tanggal");

-- CreateIndex
CREATE INDEX "Notifikasi_isRead_idx" ON "Notifikasi"("isRead");

-- AddForeignKey
ALTER TABLE "UserFarm" ADD CONSTRAINT "UserFarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFarm" ADD CONSTRAINT "UserFarm_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_bapakId_fkey" FOREIGN KEY ("bapakId") REFERENCES "Hewan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_indukId_fkey" FOREIGN KEY ("indukId") REFERENCES "Hewan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekamMedis" ADD CONSTRAINT "RekamMedis_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekamMedis" ADD CONSTRAINT "RekamMedis_dokterId_fkey" FOREIGN KEY ("dokterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reproduksi" ADD CONSTRAINT "Reproduksi_indukId_fkey" FOREIGN KEY ("indukId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reproduksi" ADD CONSTRAINT "Reproduksi_pejantanId_fkey" FOREIGN KEY ("pejantanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reproduksi" ADD CONSTRAINT "Reproduksi_anakId_fkey" FOREIGN KEY ("anakId") REFERENCES "Hewan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_fromFarmId_fkey" FOREIGN KEY ("fromFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_toFarmId_fkey" FOREIGN KEY ("toFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeratBadan" ADD CONSTRAINT "BeratBadan_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
