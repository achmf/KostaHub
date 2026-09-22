import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const farms = await prisma.farm.findMany()
  
  if (farms.length === 0) {
    console.log('No farms found')
    return
  }

  const allDummyData = farms.flatMap(farm => [
    {
      title: 'Jadwal Medis: Sapi A',
      message: 'Sapi A perlu perawatan medis hari ini.',
      tanggal: new Date(),
      type: 'MEDIS' as const,
      farmId: farm.id,
      isRead: false,
    },
    {
      title: 'Vaksinasi Rutin: Kambing B',
      message: 'Jadwal vaksinasi PMK untuk Kambing B.',
      tanggal: new Date(),
      type: 'VAKSIN' as const,
      farmId: farm.id,
      isRead: false,
    },
    {
      title: 'Kelahiran Baru',
      message: 'Indukan C telah melahirkan anak.',
      tanggal: new Date(),
      type: 'LAHIR' as const,
      farmId: farm.id,
      isRead: false,
    },
    {
      title: 'Penurunan Berat Drastis',
      message: 'Sapi D mengalami penurunan berat lebih dari 10%.',
      tanggal: new Date(),
      type: 'BERAT' as const,
      farmId: farm.id,
      isRead: false,
    },
  ])

  console.log(`Inserting ${allDummyData.length} dummy notifications across ${farms.length} farms...`)
  await prisma.notifikasi.createMany({
    data: allDummyData,
  })
  console.log('Done.')
}

main().finally(() => prisma.$disconnect())
