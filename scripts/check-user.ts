import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'kostahub' } },
    select: {
      email: true,
      role: true,
      approvalStatus: true,
      deletedAt: true,
    }
  })
  
  if (users.length === 0) {
    console.log('❌ TIDAK ADA USER di database! Seed belum dijalankan.')
  } else {
    console.log('✅ Users ditemukan:')
    console.log(JSON.stringify(users, null, 2))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
