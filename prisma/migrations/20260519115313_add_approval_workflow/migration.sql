-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "farmId" TEXT,
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
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hewan" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "nama" TEXT,
    "kelamin" TEXT NOT NULL,
    "ras" TEXT NOT NULL DEFAULT 'Kosta',
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "berat" DOUBLE PRECISION,
    "kategori" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
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
    "diagnosis" TEXT NOT NULL,
    "obat" TEXT,
    "dokter" TEXT,
    "notes" TEXT,
    "fotoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SEMBUH',
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
    "status" TEXT NOT NULL DEFAULT 'HAMIL',
    "anakTag" TEXT,
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
    "type" TEXT NOT NULL,
    "farmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Hewan_tag_key" ON "Hewan"("tag");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_bapakId_fkey" FOREIGN KEY ("bapakId") REFERENCES "Hewan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hewan" ADD CONSTRAINT "Hewan_indukId_fkey" FOREIGN KEY ("indukId") REFERENCES "Hewan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekamMedis" ADD CONSTRAINT "RekamMedis_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reproduksi" ADD CONSTRAINT "Reproduksi_indukId_fkey" FOREIGN KEY ("indukId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reproduksi" ADD CONSTRAINT "Reproduksi_pejantanId_fkey" FOREIGN KEY ("pejantanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_fromFarmId_fkey" FOREIGN KEY ("fromFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferHewan" ADD CONSTRAINT "TransferHewan_toFarmId_fkey" FOREIGN KEY ("toFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeratBadan" ADD CONSTRAINT "BeratBadan_hewanId_fkey" FOREIGN KEY ("hewanId") REFERENCES "Hewan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
