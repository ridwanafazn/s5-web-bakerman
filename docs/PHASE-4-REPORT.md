# Fase 4 — Order, Checkout, Pickup & Staff Dashboard

**Tanggal:** 13 November 2026
**Status:** ✅ Selesai
**Tujuan:** mengubah keranjang menjadi order pickup nyata dengan stok, budget, slot, kode order, dan alur staff.

---

## 1. Yang Dibangun

### 1.1 Backend

- **Order transaksional** (`server/services/orderService.js`):
  - Validasi item, qty, produk aktif.
  - Hitung harga & gula di server.
  - Cek budget (`guide`/`strict` + `budgetOverride`).
  - Reservasi stok harian secara atomik.
  - Reservasi slot pickup (kapasitas).
  - Simpan order + potong budget dalam satu transaksi MongoDB.
  - Idempotency key unik per user.
- **Kode order** human-friendly 8 karakter (tanpa 0/O/1/I/L).
- **Cancel order** (pending payment):
  - Refund budget.
  - Kembalikan stok reserved.
  - Kembalikan slot.
- **Staff status transitions**:
  - `pending_payment → paid | canceled | expired`
  - `paid → preparing | canceled`
  - `preparing → ready`
  - `ready → picked_up | expired`
  - `picked_up` memindahkan reserved → sold.
  - `expired` dari `ready` melepas stok sebagai sold/waste; dari `pending_payment` refund.
- **Audit log** untuk perubahan status dan stok.
- **Admin stock**:
  - List stok harian.
  - Set total stok dengan validasi `total >= reserved + sold`.
- **Endpoint baru**:
  - `POST /api/v1/orders`
  - `GET /api/v1/orders`
  - `GET /api/v1/orders/:code`
  - `POST /api/v1/orders/:id/cancel`
  - `GET /api/v1/admin/orders`
  - `PATCH /api/v1/admin/orders/:id/status`
  - `GET /api/v1/admin/stock`
  - `PATCH /api/v1/admin/stock/:productId`
- **Seed**: stok harian sekarang **7 hari** (sesuai slot pickup).

### 1.2 Frontend

- **Cart**:
  - Tombol “Lanjut ke checkout” (login-aware).
  - State loading sesi diperbaiki (tidak lagi salah mengarah ke `/signin`).
- **Checkout `/checkout`**:
  - Pilih tanggal (7 hari) & slot pickup.
  - Ringkasan harga, gula, budget sebelum/sesudah.
  - Peringatan overage; checkbox konfirmasi (mode guide).
  - Mode strict memblokir tombol order.
  - Catatan untuk staff.
  - Membuat order + redirect ke halaman order.
- **Order detail `/order/:code`**:
  - Kode order besar, status, pickup, item, total, pembayaran.
  - Tombol batalkan (pending payment, owner).
  - Link ke riwayat/menu.
- **Riwayat `/orders`**:
  - Daftar order + status + pickup + total.
- **Staff dashboard `/staff`**:
  - Hanya staff/admin.
  - Filter tanggal.
  - Antrean order + tombol status berikutnya.
  - Tabel stok harian + edit total.
- **Navbar/Footer/Profile**:
  - Link “Pesanan”.
  - Link “Staff” hanya untuk staff/admin.
  - Profile: Pesanan saya + Staff dashboard.
- **Swagger** diperbarui dengan endpoint order/admin.

---

## 2. Bukti Verifikasi

### API

```text
Member budget awal: 90 g
CREATE order 1x Roti Susu (8 g) → kode NTJRVVTS
IDEMPOTENT: request kedua → kode sama
CANCEL → status canceled; budget kembali 90 g

CREATE order 2x Roti Susu (16 g) → kode TTZBYN94
Staff: paid → preparing → ready → picked_up
Stok Roti Susu: total 12, reserved 0, sold 2, available 10
Member orders: picked_up + canceled
Budget member: consumed 16 g, remaining 74 g

OVER BUDGET (guide, tanpa override) → 409
OVER BUDGET (override) → order dibuat, budgetOverride=true
CANCEL over-budget → refund
STRICT + over budget → 409 BUDGET_EXCEEDED
Kembali ke guide → OK

Admin stock: total 12 → 15 → 12 (available 9)
```

### UI (headless Chrome)

```text
Member login: budget 74 g
Cart: checkout href /checkout, sisa setelah keranjang 66 g
Checkout: 18 slot, slot 11:00–11:30 (8 tersisa)
Place order → /order/R434ZMP6
Status: Menunggu pembayaran
Pickup: Jumat, 13 November 2026

Staff login (admin):
- 4 order tampil, 10 baris stok
- Konfirmasi bayar → Siapkan → Siap diambil → Serahkan
- Stok Roti Susu: sold 3, available 9

Member:
- /orders: 4 kartu, order R434ZMP6 → Sudah diambil
- /balance: 66 g

Over-budget UI:
- 3 Chocolate Fudge Cake (105 g), budget 66 g
- Warning: "Order ini melebihi budget 39 g."
- Checkbox overage tersedia
- Tombol order disabled sebelum konfirmasi, enabled setelah dicentang
- Cart dikosongkan kembali
```

### Kualitas

```text
npm test        → 17/17 pass
npm run lint    → 0 error
npm run build   → sukses (493 KB, gzip 151 KB)
Tunnel publik   → root 200, /api/v1/products 200
```

---

## 3. Akses dari HP

- Link publik (production preview): **https://speed-podcasts-movements-moms.trycloudflare.com**
- Panduan lengkap + troubleshooting: `docs/DEV-ACCESS.md`.
- Blank page sebelumnya terjadi karena dev server Vite (banyak modul + HMR) di mobile; diperbaiki dengan menyajikan **production build** via `vite preview` dan tunnel baru.
- Login via email/password berhasil diuji di domain tunnel.

---

## 4. Catatan Data Demo

- Member `member.bakerman.qa@gmail.com` sekarang punya **4 order**:
  - 2 canceled (termasuk over-budget test)
  - 2 picked_up
- Budget member: **66 g** dari 90 g (consumed 24 g).
- Stok Roti Susu: total 12, sold 3, available 9.
- Admin `bakerman@gmail.com` tetap budget **60 g** (preset Ketat), tanpa order.
- Staff `qa.bakerman.101126@gmail.com` bisa membuka `/staff`.

> Jika ingin data bersih, jalankan `npm run seed` (produk & stok di-reset; order lama tetap ada). Untuk reset total, hapus collection `orders`, `budgetperiods`, `stravaactivities`, `auditlogs`, lalu seed ulang.

---

## 5. Batasan

- Pembayaran hanya **pay at pickup** (tunai/QRIS); tidak ada gateway.
- Tidak ada delivery/subscription/referral.
- Belum ada webhook Strava (sync manual).
- Belum ada notifikasi email/WA.
- Dashboard staff masih satu halaman sederhana (bukan POS penuh).
- Belum ada pagination order (limit 50 member / 100 admin). **Sudah ditambahkan di Fase 5.**
- Belum ada test integrasi otomatis untuk order (verifikasi manual API + UI).

---

## 6. Langkah Berikutnya (Fase 5)

> ✅ **Sudah dikerjakan di Fase 5.** Lihat `docs/PHASE-5-REPORT.md` dan `docs/GUIDE-PHASE-5.md`.

1. Balance dashboard & recap mingguan (gula, menit aktif, bonus, order).
2. Riwayat order dengan filter/pagination.
3. Polish UI/UX + a11y.
4. Performa: kompres gambar, lazy route, bundle splitting.
5. SEO/meta final.
6. Test E2E otomatis + CI.
7. Deploy (frontend + API + Atlas Cloud).
