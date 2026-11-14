# Guide — Merasakan Hasil Fase 8

Fase 8: **UI landing diperbaiki**, frontend di-deploy ke **Cloudflare Pages**, domain custom aktif, dan perubahan sudah di-commit/push.

---

## 🌐 Link Live

| Keperluan | URL |
|---|---|
| **Frontend production** | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | https://bakerman-balance.pages.dev |
| API (Cloudflare Tunnel) | https://manuals-strip-vacancies-practical.trycloudflare.com/api |
| Dev preview | https://bean-martial-old-thy.trycloudflare.com |
| Production lokal | http://localhost:8080 |
| Dev lokal | http://localhost:5173 |

> API masih berjalan di Docker lokal dan diekspos lewat Cloudflare Quick Tunnel. Laptop harus menyala. Frontend sudah benar-benar di-hosting di Cloudflare Pages.

---

## Akun Demo

| Email | Password | Role |
|---|---|---|
| `member.bakerman.qa@gmail.com` | `Bakerman123!` | member |
| `bakerman@gmail.com` | `bakermanAdmin` | admin |
| `qa.bakerman.101126@gmail.com` | `Bakerman123!` | staff |

---

## 1. Cek Landing Page (UI Fix)

1. Buka **https://bakerman.ridwanafazn.my.id** di desktop.
2. Scroll ke section **“MENU PILIHAN”**.
3. Pastikan:
   - 3 kartu produk sejajar (grid 3 kolom).
   - Gambar tidak membesar penuh.
   - Tombol **Tambah** ada di tiap kartu.
4. Buka di HP:
   - Grid menjadi 1 kolom.
   - Navbar mobile berfungsi.

---

## 2. Cek Login & API dari Pages

1. Login member.
2. Buka `/balance`:
   - Budget **66 g**.
   - Recap 4 minggu tampil.
3. Buka `/menu`:
   - 10 produk.
4. Buka `/orders`:
   - 4 order.
   - Filter Selesai → 2 order.
5. Buka `/cart` → `/checkout`:
   - Slot pickup muncul.

Jika login/API gagal:
- Cek API tunnel hidup: `https://manuals-strip-vacancies-practical.trycloudflare.com/api/v1/products`
- Cek CORS API sudah memasukkan domain Pages/custom.
- Cek laptop & Docker stack menyala.

---

## 3. Cek Custom Domain

```text
https://bakerman.ridwanafazn.my.id/      → 200
https://bakerman-balance.pages.dev/      → 200
```

DNS:

```text
CNAME bakerman → bakerman-balance.pages.dev (proxied)
```

Status domain di Cloudflare Pages: **active**.

---

## 4. Update API URL (Jika Tunnel Berubah)

Cloudflare Pages env saat ini:

```env
VITE_API_URL=https://manuals-strip-vacancies-practical.trycloudflare.com/api
```

Jika API pindah domain:

1. Cloudflare Dashboard → Workers & Pages → `bakerman-balance` → Settings → Environment variables.
2. Ubah `VITE_API_URL` ke `https://<api-domain>/api`.
3. Trigger redeploy (push ke `main` atau retry deployment).
4. Update `CORS_ORIGIN` API agar memasukkan domain Pages/custom.

---

## 5. Redeploy Frontend

Pages terhubung ke GitHub `ridwanafazn/s5-web-bakerman`:

- Push ke `main` → build otomatis.
- Build config:
  - Root: `client`
  - Command: `npm run build`
  - Output: `dist`
- Atau trigger manual dari dashboard Pages → Deployments → Retry/Deploy.

---

## 6. Batasan Penting

- **API bukan hosted di Cloudflare compute.** Express + MongoDB tidak jalan di Workers free plan; Cloudflare Containers butuh Workers Paid.
- API Quick Tunnel bersifat sementara; URL berubah jika tunnel restart.
- Cloudinary asli belum diisi; aktivitas manual di production masih disabled.
- Google sign-in mungkin butuh domain ditambahkan ke Firebase Authorized Domains.
- Strava asli opsional dan butuh langganan Strava.
- Dependabot masih melaporkan 155 vulnerabilities; server audit 0, client 4 high transitive Firestore (tidak dipakai runtime).

---

## Checklist Cepat

- [ ] Landing desktop: 3 kartu sejajar.
- [ ] Landing mobile: 1 kolom.
- [ ] Login dari `bakerman.ridwanafazn.my.id`.
- [ ] Budget 66 g + recap tampil.
- [ ] `/menu` 10 produk.
- [ ] `/orders` filter Selesai 2 order.
- [ ] `/checkout` slot muncul.
- [ ] `https://bakerman-balance.pages.dev` 200.
- [ ] API tunnel `/api/v1/products` 200.
- [ ] Tidak ada console error.

---

## Langkah Berikutnya (manual)

1. Isi Cloudinary + `CRON_SECRET`.
2. Pindahkan API ke hosting permanen (Vercel/Render/VPS/Cloudflare Containers).
3. Update `VITE_API_URL` + CORS.
4. Tambahkan domain ke Firebase Authorized Domains.
5. Evaluasi Dependabot/Firebase.
