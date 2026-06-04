import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const hewans = await prisma.hewan.findMany({
    include: {
      anakSebagaiBapak: true,
      anakSebagaiInduk: true,
      bapak: true,
      induk: true,
      farm: true
    }
  })

  const stats = hewans.map(h => {
    return {
      tag: h.tag,
      nama: h.nama || '-',
      farm: h.farm.nama,
      jumlahAnak: h.anakSebagaiBapak.length + h.anakSebagaiInduk.length,
      punyaBapak: !!h.bapakId,
      punyaInduk: !!h.indukId
    }
  }).sort((a, b) => b.jumlahAnak - a.jumlahAnak)

  console.log("=== Top Kambing dengan Keturunan Terbanyak ===")
  console.table(stats.slice(0, 10))
  
  const lengkap = stats.filter(h => h.punyaBapak && h.punyaInduk)
  console.log("\n=== Kambing dengan Data Induk & Bapak Lengkap ===")
  console.table(lengkap.slice(0, 10))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
