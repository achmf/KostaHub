export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  // In a real application, you would use Resend, SendGrid, NodeMailer, etc.
  console.log('\n=============================')
  console.log(`📧 EMAIL SENT TO: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body:\n${body}`)
  console.log('=============================\n')
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return { success: true }
}

export async function sendApprovalEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Pendaftaran KostaHub Disetujui',
    body: `Halo ${name},\n\nSelamat! Pendaftaran farm Anda di KostaHub telah disetujui oleh admin.\nAnda sekarang dapat login ke sistem dan mulai mengelola farm Anda.\n\nSalam,\nTim KostaHub`,
  })
}

export async function sendRejectionEmail(to: string, name: string, reason?: string) {
  const reasonText = reason
    ? `\n\nAlasan penolakan:\n"${reason}"`
    : ''

  return sendEmail({
    to,
    subject: 'Pendaftaran KostaHub Ditolak',
    body: `Halo ${name},\n\nMohon maaf, pendaftaran farm Anda di KostaHub belum dapat kami setujui saat ini.${reasonText}\n\nAnda masih dapat login dan mengajukan ulang pendaftaran setelah merevisi data farm Anda.\n\nJika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami.\n\nSalam,\nTim KostaHub`,
  })
}

export async function sendReapplyNotificationEmail(ownerName: string, farmName: string) {
  // In production, send to admin email address
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@kostahub.com'
  return sendEmail({
    to: adminEmail,
    subject: `[KostaHub] Owner "${ownerName}" mengajukan ulang pendaftaran`,
    body: `Halo Admin,\n\nOwner ${ownerName} (Farm: ${farmName}) telah merevisi data dan mengajukan ulang permohonan pendaftaran di KostaHub.\n\nSilakan tinjau kembali permohonan ini di halaman Persetujuan Pendaftaran.\n\nSalam,\nSistem KostaHub`,
  })
}
