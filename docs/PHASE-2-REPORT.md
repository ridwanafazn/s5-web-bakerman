# Fase 2 — UI Menu, Label Gula, Keranjang & Budget

**Tanggal:** 13 November 2026
**Status:** ✅ Selesai
**Tujuan:** memindahkan UI dari endpoint legacy ke API v1 dan membuat konsep Bakerman Balance bisa dirasakan langsung.

---

## 1. Yang Dibangun

### 1.1 Landing page baru

- Hero baru: **“Nikmati manisnya. Jaga progresnya.”**
- Value props: budget 60–120 g/minggu, label gula transparan, pickup Dago.
- CTA: **Lihat menu** dan **Atur budget**.
- Section “Menu pilihan” mengambil 3 produk terendah gulanya dari `/api/v1/products`.
- Section “Cara kerja” 3 langkah: atur budget → pilih treat → pickup.
- Tidak ada lagi fallback data statis yang menutupi error API; jika API gagal, tampil error + tombol coba lagi.

### 1.2 Menu `/menu`

- Mengambil `/api/v1/menu/today` + `/api/v1/locations`.
- 10 produk, stok harian, harga, kategori.
- Label gula: **Ringan / Seimbang / Manja / Manja banget**.
- Filter kategori: Semua, Breads, Cakes, Icebox Desserts, Cookies, Donuts.
- Budget bar di atas grid.
- Skeleton loading, error state, empty state.
- Kategori tidak valid → state “Kategori tidak ditemukan” (bukan diam-diam menampilkan semua).

### 1.3 Detail produk `/product/:slug`

- Gambar, nama, harga, label gula, kategori.
- Gula per porsi, stok hari ini, tags, allergen, bahan.
- Quantity stepper 1–10.
- Tambah ke keranjang.
- Dampak ke budget: “Order ini memakai X g; sisa budget setelahnya Y g.”
- Peringatan overage; penjelasan mode `strict`.
- Produk habis → tombol “Habis hari ini”.
- Slug tidak valid → state error + kembali ke menu.

### 1.4 Keranjang `/cart`

- Item + qty + subtotal + total gula.
- Budget sebelum/sesudah keranjang.
- Peringatan overage (guide vs strict).
- Checkout masih disabled dengan label **Fase 4** (belum ada order/pickup/payment).
- Persist di `localStorage` (`bakerman_cart_v1`).

### 1.5 Balance `/balance`

- Ringkasan budget: total, terpakai, sisa, progress bar.
- Preset **Santai 120 g / Seimbang 90 g / Ketat 60 g** — langsung PATCH ke server.
- Mode **Guide** (boleh overage dengan konfirmasi) dan **Strict** (server menolak).
- Kartu “Bonus aktivitas” sebagai placeholder Fase 3.
- Error state + tombol coba lagi.

### 1.6 Session & cart state

- `SessionProvider`: `onAuthStateChanged` → `POST /api/v1/auth/session` → profile + budget.
- `CartProvider`: item, qty, subtotal, total gula, persist localStorage.
- `client/src/lib/api.js`: Axios + Firebase ID token interceptor + timeout 15 s + error normalizer.

### 1.7 Navbar & auth

- Navbar baru: Menu, Balance, Rewards, Mission, Akun/Masuk, Keranjang dengan badge.
- Mobile menu berupa `<button>` dengan `aria-label` + `aria-expanded`.
- Login/Signup ditulis ulang tanpa class Bootstrap.
- Tidak ada kredensial demo di UI.
- `auth.css` di-scope ke `.auth-page`; tidak ada lagi global `p { color: aliceblue }`.
- `signin.css` dihapus.

### 1.8 Perbaikan bug lama

- Global `p { color: aliceblue }` hilang.
- `position: flex` di navbar dihapus.
- `object-fit` pada elemen teks hero dihapus.
- Link About yang rusak (`/near-online-reseller`, `/visit-offline-store`) diganti ke `/menu` & `/balance`.
- Footer `href="#"` diganti link internal + Instagram/email.
- HTML nesting Mission `<p><ol>` diperbaiki.
- Meta description, OG, `lang="id"`, theme-color ditambahkan.

---

## 2. Verifikasi Headless Chrome

Semua diuji dengan Chrome headless (Puppeteer) pada dev server:

```text
Landing
- hero: "Nikmati manisnya. Jaga progresnya."
- 3 produk, label gula "8 g Ringan", "10 g Ringan", "12 g Seimbang"
- warna teks hero: rgb(74,74,74) — bukan aliceblue

Menu
- 10 kartu, 6 filter, stok "Stok 12"
- filter Cakes → 3 produk (Brownie GF, Pandan Chiffon, Chocolate Fudge Cake)

Login form asli
- email/password → redirect /balance
- budget 90 g, preset Seimbang, mode Guide

Detail produk (login)
- stok 12 tersedia
- "Order ini memakai 8 g. Sisa budget setelahnya: 82 g."

Cart (login)
- subtotal Rp 18.000, total gula 8 g
- "Sisa budget sekarang 90 g" → "Setelah keranjang ini 82 g"
- checkout disabled (Fase 4)

Mode Strict
- toggle Guide → Strict berhasil (budget tetap 90 g)
- dikembalikan ke Guide

Mobile 390×844
- 10 kartu, grid 1 kolom (351px)
- menu button tampil, desktop nav tersembunyi

Legacy regression
- /chance: "Hello, Bakerman Demo", 3 chances, 2 riwayat
- /account: "Welcome back"
- /signup: form 3 input, tanpa Bootstrap
- /mission: 3 list items, tanpa warning nesting
- 0 console error tak terduga (404 invalid product memang diharapkan)

Build
- npm run lint  → 0 error
- npm run build → sukses (476 KB, gzip 149 KB)
```

---

## 3. Batasan / Belum Selesai

- **Checkout/order/pickup** belum ada (Fase 4).
- **Strava OAuth + bonus** masih placeholder (Fase 3).
- `/chance` masih memakai alur legacy; akan dimigrasikan ke Balance/Rewards di Fase 3.
- Gambar masih besar (navbar logo 963 KB, meal-plan 621 KB) — Fase 5.
- Mission masih copy lama (English, 3 chances/40g) — perlu diselaraskan dengan konsep budget gram di Fase 3/7.
- Beberapa halaman lama masih memakai istilah “Chance”; UI utama sudah “Balance”.

---

## 4. Langkah Berikutnya (Fase 3)

1. Strava OAuth: connect, callback, simpan token terenkripsi.
2. Sync aktivitas 7 hari terakhir; exclude manual upload/e-bike.
3. Bonus progresif: 30/60/90/150 menit → +10/+20/+30/+45 g.
4. Tampilkan menit aktif + bonus di halaman Balance.
5. Migrasikan `/chance` legacy ke halaman Rewards baru atau redirect ke `/balance`.
6. Selaraskan copy Mission dengan konsep budget gram.
