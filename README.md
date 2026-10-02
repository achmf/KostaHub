# KostaHub

> **Skripsi:** Rancang Bangun Sistem Informasi Manajemen Peternakan Kambing Kosta Berbasis Web (Studi Kasus: Koni Farm)

Platform manajemen peternakan kambing Kosta berbasis web. Dibangun dengan Next.js 16, Prisma, dan PostgreSQL (Neon).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Neon (Prisma ORM)
- **Auth**: Custom JWT session (jose + bcryptjs)
- **UI**: Tailwind CSS v4, Framer Motion, Recharts
- **Storage**: Neon Object Storage
- **Notifikasi**: Web Push (web-push)

## Setup

```bash
npm install
```

Buat file `.env` (dibaca Next.js dan Prisma CLI) dengan variabel berikut:

```
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
JWT_SECRET=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@contoh.com
CRON_SECRET=...                    # string acak; dikirim Vercel Cron sebagai "Bearer <CRON_SECRET>"
AWS_ACCESS_KEY_ID=...              # object storage Neon (bucket "uploads" di neon.ts)
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT_URL_S3=...
AWS_REGION=...
```

Push notification butuh ketiga variabel VAPID di Vercel (Production & Preview) **sebelum build**, karena
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` ditanam ke bundle browser. Pengingat otomatis dikirim harian lewat
Vercel Cron (`vercel.json`, 06:00 WIB) dan langsung setelah input rekam medis/reproduksi.

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Roles

| Role | Akses |
|------|-------|
| `SUPER_ADMIN` | Seluruh sistem, approval farm |
| `OWNER` | Dashboard farm miliknya |
| `PETUGAS` | Operasional harian farm |
| `DINAS` | Read-only monitoring regional |
