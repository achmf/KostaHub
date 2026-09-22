import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'admin@kostahub.com' }, 
    select: { email: true, password: true, role: true, approvalStatus: true, deletedAt: true } 
  })
  console.log(JSON.stringify(user, null, 2))
  if (user) {
    const ok = await bcrypt.compare('password123', user.password)
    console.log('password valid:', ok)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
