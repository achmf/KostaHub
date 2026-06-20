import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'owner1@kostahub.com' },
    select: { email: true, password: true, role: true, approvalStatus: true, deletedAt: true }
  })
  
  if (!user) {
    console.log('❌ User TIDAK DITEMUKAN di database!')
    return
  }

  console.log('✅ User ditemukan:', user.email)
  console.log('   role:', user.role)
  console.log('   approvalStatus:', user.approvalStatus)
  console.log('   deletedAt:', user.deletedAt)
  console.log('   password hash:', user.password.substring(0, 20) + '...')
  
  const isValid = await bcrypt.compare('password123', user.password)
  console.log('\n🔑 bcrypt.compare("password123", hash):', isValid ? '✅ VALID' : '❌ INVALID')
  
  if (!isValid) {
    console.log('\n⚠️  Password hash tidak cocok. Kemungkinan seed belum dijalankan ulang setelah schema berubah.')
  } else {
    console.log('\n✅ Password cocok. Masalah bukan di password.')
    
    if (user.deletedAt) {
      console.log('❌ MASALAH: deletedAt bukan null — akun dianggap dihapus!')
    } else if (user.approvalStatus === 'PENDING') {
      console.log('❌ MASALAH: approvalStatus = PENDING — akan redirect ke /status, bukan ke dashboard!')
    } else {
      console.log('✅ Semua kondisi normal. Mungkin masalah di sisi cookie/session browser.')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
