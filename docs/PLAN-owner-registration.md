# Owner Self-Registration + Admin Approval + Dashboard Separation

## Goal
Owner bisa register mandiri → Admin pusat review & approve/reject → Owner kelola farm sendiri. Admin punya backoffice terpisah.

## Keputusan
- **Registrasi:** Lengkap (nama, email, password, telepon, GPS, deskripsi, foto sertifikat opsional)
- **Rejection:** Akun + farm dihapus, owner harus register ulang
- **Notifikasi:** Cek manual via halaman "Status Pendaftaran"
- **Approval page:** `/admin/approvals` (Super Admin only)
- **Staff:** Owner bisa buat PETUGAS & DOKTER sendiri
- **Dashboard:** Admin punya backoffice (`/admin/*`) + akses penuh farm management (`/(dashboard)/*`)

## Arsitektur Route

```
PUBLIK (tanpa login):
  /login            → Login (existing)
  /register         → Form registrasi owner baru (NEW)

SEMI-AUTH (login tapi PENDING):
  /status           → Halaman cek status pendaftaran (NEW)

DASHBOARD (existing — Admin full + Owner + Staff):
  /(dashboard)/*    → Semua fitur farm management yang sudah ada

BACKOFFICE (Super Admin ONLY):
  /admin/approvals  → Review & approve/reject pendaftaran owner
  /admin/users      → Kelola semua user di seluruh farm
  /admin/farms      → Overview semua farm
```

## Schema Changes (Prisma)

```prisma
model User {
  // existing fields...
  phone          String?
  approvalStatus String   @default("APPROVED") // "PENDING", "APPROVED", "REJECTED"
  // existing users tetap APPROVED, hanya register baru yang PENDING
}

model Farm {
  // existing fields...
  sertifikatUrl  String?  // foto sertifikat farm (opsional)
}
```

## Tasks

### Phase 1: Database & Auth (Backend)
- [ ] **T1:** Update `schema.prisma` — tambah `phone`, `approvalStatus` di User + `sertifikatUrl` di Farm
  → Verify: `npx prisma migrate dev` sukses
- [ ] **T2:** Buat `actions/register.ts` — server action register owner (create User PENDING + Farm)
  → Verify: user + farm tersimpan di DB dengan status PENDING
- [ ] **T3:** Update `actions/auth.ts` — login gate: block PENDING/REJECTED users, redirect PENDING → `/status`
  → Verify: PENDING user login → redirect ke `/status`, bukan dashboard
- [ ] **T4:** Buat `actions/admin.ts` — approve/reject/delete registration actions
  → Verify: approve → status APPROVED, reject → user + farm dihapus
- [ ] **T5:** Buat `actions/staff.ts` — Owner buat akun PETUGAS/DOKTER untuk farm-nya
  → Verify: staff terbuat dengan farmId owner

### Phase 2: Public Pages (Frontend)
- [ ] **T6:** Buat `/register/page.tsx` — form registrasi multi-step (data diri → data farm)
  → Verify: form submit → user + farm tersimpan PENDING
- [ ] **T7:** Buat `/status/page.tsx` — halaman "Status Pendaftaran" (PENDING/REJECTED info)
  → Verify: PENDING user lihat status, APPROVED user redirect ke dashboard

### Phase 3: Admin Backoffice (Frontend)
- [ ] **T8:** Buat `/admin/layout.tsx` — layout backoffice dengan sidebar admin terpisah
  → Verify: hanya SUPER_ADMIN bisa akses, non-admin redirect
- [ ] **T9:** Buat `/admin/approvals/page.tsx` — daftar pendaftaran PENDING, detail, approve/reject buttons
  → Verify: approve → user jadi APPROVED, reject → user + farm terhapus
- [ ] **T10:** Buat `/admin/users/page.tsx` — daftar semua user di semua farm, filter by role/farm
  → Verify: tampil semua user, bisa filter
- [ ] **T11:** Buat `/admin/farms/page.tsx` — overview semua farm, status, jumlah hewan
  → Verify: tampil semua farm dengan stats

### Phase 4: Owner Staff Management (Frontend)
- [ ] **T12:** Tambah menu "Kelola Staff" di sidebar owner
  → Verify: hanya muncul untuk role OWNER
- [ ] **T13:** Buat halaman staff management di dashboard owner — list staff, tambah, hapus
  → Verify: Owner bisa CRUD PETUGAS/DOKTER untuk farm-nya

### Phase 5: Integration & Guards
- [ ] **T14:** Update `(dashboard)/layout.tsx` — tambah link backoffice di header untuk SUPER_ADMIN
  → Verify: admin lihat shortcut ke backoffice, owner tidak
- [ ] **T15:** Update `Sidebar` component — tambah menu staff management untuk OWNER
  → Verify: menu muncul conditional berdasarkan role
- [ ] **T16:** Middleware/guard check di semua admin routes — block non-SUPER_ADMIN
  → Verify: owner akses `/admin/*` → redirect

### Phase X: Verification
- [ ] **V1:** Register owner baru → status PENDING → login → lihat halaman status
- [ ] **V2:** Admin approve → owner login → masuk dashboard → bisa kelola farm
- [ ] **V3:** Admin reject → user + farm terhapus → owner register ulang
- [ ] **V4:** Owner buat PETUGAS → PETUGAS login → akses dashboard farm owner
- [ ] **V5:** PETUGAS/DOKTER coba akses `/admin/*` → blocked
- [ ] **V6:** Owner coba akses `/admin/*` → blocked

## File Impact Summary

| Action | Files |
|--------|-------|
| **CREATE** | `app/register/page.tsx`, `app/status/page.tsx`, `app/admin/layout.tsx`, `app/admin/approvals/page.tsx`, `app/admin/users/page.tsx`, `app/admin/farms/page.tsx`, `actions/register.ts`, `actions/admin.ts`, `actions/staff.ts`, `components/Admin/AdminSidebar.tsx` |
| **MODIFY** | `prisma/schema.prisma`, `actions/auth.ts`, `app/(dashboard)/layout.tsx`, `components/Layout/Sidebar.tsx` |

## Notes
- Existing users (seed data) tetap `approvalStatus: "APPROVED"` → tidak terdampak
- Registration form pakai multi-step wizard (step 1: data diri, step 2: data farm)
- Admin backoffice pakai design system yang sama (palette cream/forest/ochre) tapi layout sidebar berbeda
- Upload sertifikat farm → simpan sebagai base64 atau URL (fase awal: URL input, bisa upgrade ke file upload nanti)
