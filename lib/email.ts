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

export async function sendRejectionEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Pendaftaran KostaHub Ditolak',
    body: `Halo ${name},\n\nMohon maaf, pendaftaran farm Anda di KostaHub tidak dapat kami setujui saat ini karena data tidak memenuhi kriteria verifikasi kami.\nJika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami.\n\nSalam,\nTim KostaHub`,
  })
}
