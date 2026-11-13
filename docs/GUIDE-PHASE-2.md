# Guide — Merasakan Hasil Fase 2

Panduan ini untuk mencoba langsung semua yang sudah dibangun di Fase 2.

---

## 1. Pastikan dev server hidup

Buka:

- Frontend: <http://localhost:5173>
- API health: <http://localhost:5050/health>
- Swagger: <http://localhost:5050/api-docs>

Kalau mati:

```bash
docker compose up -d mongo
cd server && npm run dev
cd client && npm run dev
```

---

## 2. Alur yang bisa dicoba (5–10 menit)

### Langkah 1 — Landing page
Buka <http://localhost:5173/>

Yang harus terlihat:
- Hero **“Nikmati manisnya. Jaga progresnya.”**
- Tiga produk dengan label gula: **Ringan / Seimbang**.
- Budget bar guest: “Masuk untuk melihat sisa budget gula mingguanmu.”
- Section **Cara kerja** (atur budget → pilih treat → pickup).

### Langkah 2 — Lihat menu
Klik **Lihat menu minggu ini** atau buka <http://localhost:5173/menu>

Yang harus terlihat:
- 10 produk.
- Stok hari ini.
- Label gula di setiap kartu.
- Filter kategori: Breads, Cakes, Icebox Desserts, Cookies, Donuts.

Coba filter **Cakes**:
<http://localhost:5173/category/cakes> → 3 produk.

### Langkah 3 — Detail produk
Klik produk **Roti Susu Pandan** atau buka:
<http://localhost:5173/product/roti-susu-pandan>

Yang harus terlihat:
- Gula 8 g, stok 12 tersedia, allergen, bahan.
- Quantity stepper.
- Tombol “Tambah ke keranjang”.
- Catatan dampak budget (masih guest).

### Langkah 4 — Tambah ke keranjang
Klik **Tambah ke keranjang**, lalu buka:
<http://localhost:5173/cart>

Yang harus terlihat:
- Item, qty, subtotal Rp 18.000.
- Total gula 8 g.
- Checkout masih disabled (Fase 4).
- Hint login untuk melihat dampak budget.

### Langkah 5 — Login
Buka <http://localhost:5173/signin>

Gunakan salah satu akun:

| Email | Password | Role |
|---|---|---|
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |

Setelah login, kamu diarahkan ke **/balance**.

### Langkah 6 — Atur budget
Di <http://localhost:5173/balance>:

- Lihat budget 90 g, terpakai 0 g, sisa 90 g.
- Klik **Ketat** → budget berubah menjadi **60 g**.
- Klik **Seimbang** → kembali **90 g**.
- Coba toggle **Guide** ↔ **Strict**.
- Kartu **Bonus aktivitas** masih placeholder Fase 3.

### Langkah 7 — Rasakan budget bar
Buka <http://localhost:5173/menu> setelah login.

Yang harus terlihat:
- Budget bar: “Sisa budget: 90 g · 0 g terpakai dari 90 g · mode Guide”.
- Tombol **Atur budget**.

### Langkah 8 — Dampak budget di detail & cart
1. Buka <http://localhost:5173/product/roti-susu-pandan>.
2. Lihat: “Order ini memakai 8 g. Sisa budget setelahnya: 82 g.”
3. Tambah ke keranjang.
4. Buka <http://localhost:5173/cart>.
5. Lihat: “Sisa budget sekarang 90 g” → “Setelah keranjang ini 82 g”.

### Langkah 9 — Coba mode Strict
Di <http://localhost:5173/balance>, aktifkan **Strict**.

Saat ini order belum diimplementasikan (Fase 4), jadi efek penolakan server belum bisa dicoba. Yang bisa dilihat: mode aktif tersimpan dan budget tetap konsisten.

### Langkah 10 — Cek halaman lama (opsional)
- Rewards legacy: <http://localhost:5173/chance> → “Hello, Bakerman Demo”, 3 chances, 2 riwayat.
- Akun: <http://localhost:5173/account>
- Mission: <http://localhost:5173/mission>

---

## 3. Link Penting

| Halaman | URL |
|---|---|
| Landing | <http://localhost:5173/> |
| Menu | <http://localhost:5173/menu> |
| Kategori Cakes | <http://localhost:5173/category/cakes> |
| Detail produk | <http://localhost:5173/product/roti-susu-pandan> |
| Keranjang | <http://localhost:5173/cart> |
| Balance | <http://localhost:5173/balance> |
| Login | <http://localhost:5173/signin> |
| Daftar | <http://localhost:5173/signup> |
| Rewards legacy | <http://localhost:5173/chance> |
| Swagger API | <http://localhost:5050/api-docs> |

---

## 4. Yang Belum Bisa Dicoba (memang belum dibangun)

- Checkout, slot pickup, pembayaran di tempat, kode order → **Fase 4**.
- Strava OAuth & bonus menit aktif → **Fase 3**.
- Dashboard staff → **Fase 5**.
- Recap mingguan lengkap → **Fase 5–6**.

Kalau semua langkah di atas berjalan sesuai deskripsi, berarti Fase 2 sudah berhasil.
