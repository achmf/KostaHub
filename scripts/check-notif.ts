import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const farms = await prisma.farm.findMany()
  console.log('Farms in DB:', farms.map(f => f.id))
  
  const notifs = await prisma.notifikasi.findMany()
  console.log('Notifs in DB:', notifs.length)
  console.log(notifs)
}

main().finally(() => prisma.$disconnect())
