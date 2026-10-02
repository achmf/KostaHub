# KostaHub

Platform manajemen peternakan kambing berbasis web. Dibangun dengan Next.js 16, Prisma, dan PostgreSQL (Neon).

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

Buat file `.env.local` dengan variabel berikut:

```
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
JWT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

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
