import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const farms = await prisma.farm.findMany()
  const farmId = farms.length > 0 ? farms[0].id : null

  if (!farmId) {
    console.warn('No farm found, inserting without farmId. They might not show if session has activeFarmId.')
  }

  const dummyData = [
    {
      title: 'Jadwal Medis: Sapi A',
      message: 'Sapi A perlu perawatan medis hari ini.',
      tanggal: new Date(),
      type: 'MEDIS' as const,
      farmId,
      isRead: false,
    },
    {
      title: 'Vaksinasi Rutin: Kambing B',
      message: 'Jadwal vaksinasi PMK untuk Kambing B.',
      tanggal: new Date(),
      type: 'VAKSIN' as const,
      farmId,
      isRead: false,
    },
    {
      title: 'Kelahiran Baru',
      message: 'Indukan C telah melahirkan anak.',
      tanggal: new Date(),
      type: 'LAHIR' as const,
      farmId,
      isRead: false,
    },
    {
      title: 'Penurunan Berat Drastis',
      message: 'Sapi D mengalami penurunan berat lebih dari 10%.',
      tanggal: new Date(),
      type: 'BERAT' as const,
      farmId,
      isRead: false,
    },
  ]

  console.log('Inserting dummy data...')
  await prisma.notifikasi.createMany({
    data: dummyData,
  })

  console.log('Dummy data inserted successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
