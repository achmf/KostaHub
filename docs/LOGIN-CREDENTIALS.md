# KostaHub Login Credentials

Dokumen ini berisi daftar credentials (email dan password) yang dapat digunakan untuk login dan testing aplikasi. Data ini digenerate secara otomatis melalui script `prisma/seed.ts`.

## 1. Akun Super Admin

Akun ini memiliki akses penuh ke seluruh fitur aplikasi, termasuk manajemen seluruh Farm dan User.

- **Email:** `admin@kostahub.com`
- **Password:** `password123`
- **Role:** `SUPER_ADMIN`

## 2. Akun Owner Farm

Akun ini memiliki akses terbatas hanya pada Farm yang dimilikinya. Terdapat 5 akun Owner yang terhubung dengan 5 Farm yang berbeda.

| No | Nama Farm | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Farm Alpha | `owner1@kostahub.com` | `password123` | `OWNER` |
| 2 | Farm Beta | `owner2@kostahub.com` | `password123` | `OWNER` |
| 3 | Farm Gamma | `owner3@kostahub.com` | `password123` | `OWNER` |
| 4 | Farm Delta | `owner4@kostahub.com` | `password123` | `OWNER` |
| 5 | Farm Epsilon | `owner5@kostahub.com` | `password123` | `OWNER` |

> **Catatan:** Semua akun dummy menggunakan password yang sama yaitu `password123`.

## Cara Reset/Update Credentials

Jika Anda membutuhkan kondisi database yang kembali fresh seperti daftar di atas, Anda dapat menjalankan ulang proses seeding dengan menggunakan command berikut di terminal:

```bash
npm run db:seed
# atau
npx prisma db seed
```
