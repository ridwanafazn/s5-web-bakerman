# Guide — Merasakan Hasil Fase 8

Fase 8: **UI landing diperbaiki**, frontend live di **Cloudflare Pages**, API live di **Vercel**, database **MongoDB Atlas**, dan perubahan sudah di-commit/push.

---

## 🌐 Link Live

| Keperluan | URL |
|---|---|
| **Frontend production** | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | https://bakerman-balance.pages.dev |
| **API production** | **https://bakerman-api.vercel.app/api** |
| API health | https://bakerman-api.vercel.app/health |
| API readiness | https://bakerman-api.vercel.app/ready |
| Production lokal (Docker) | http://localhost:8080 |
| Dev lokal | http://localhost:5173 |

> Production tidak memakai Cloudflare Tunnel. Frontend di Cloudflare Pages, API di Vercel, database di MongoDB Atlas. Laptop tidak perlu menyala.

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
   - Budget **90 g**.
   - Recap 4 minggu tampil.
3. Buka `/menu`:
   - 10 produk.
4. Buka `/orders`:
   - Belum ada order (data Atlas baru di-seed).
5. Buka `/cart` → `/checkout`:
   - Slot pickup muncul.

Jika login/API gagal:
- Cek API hidup: `https://bakerman-api.vercel.app/api/v1/products`
- Cek readiness: `https://bakerman-api.vercel.app/ready` → `{"status":"ready","database":"connected"}`
- Cek CORS API sudah memasukkan domain Pages/custom.

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

## 4. Update API URL

Cloudflare Pages env saat ini:

```env
VITE_API_URL=https://bakerman-api.vercel.app/api
```

Jika API pindah domain:

1. Cloudflare Dashboard → Workers & Pages → `bakerman-balance` → Settings → Environment variables.
2. Ubah `VITE_API_URL` ke `https://<api-domain>/api`.
3. Trigger redeploy (push ke `main` atau retry deployment).
4. Update `CORS_ORIGIN` di Vercel project `bakerman-api`.

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

## 6. Redeploy Backend

```powershell
vercel --cwd server --prod --yes --scope ridwan-ahmad-fauzans-projects
```

- Project: `bakerman-api`
- Runtime: Node **24.x**
- Env production: Mongo Atlas, Firebase, Cloudinary, token, CORS, cron
- Dependency fix: `jwks-rsa@3.2.0` + `jose@4.15.4` override agar tidak kena `ERR_REQUIRE_ESM`

---

## 7. Batasan Penting

- **Cloudinary asli sudah aktif**; aktivitas manual production berfungsi (diuji 90 g → 100 g → 90 g).
- **MongoDB Atlas** dipakai production (`bakerman_app`, database `bakerman`).
- **Strava asli belum aktif** karena butuh langganan Strava; gunakan aktivitas manual.
- Google sign-in mungkin butuh domain ditambahkan ke Firebase Authorized Domains.
- Dependabot masih melaporkan **6 vulnerabilities**; server audit 0, client 4 high transitive Firestore (tidak dipakai runtime).
- Akun demo sebaiknya dihapus sebelum public launch.

---

## Checklist Cepat

- [ ] Landing desktop: 3 kartu sejajar.
- [ ] Landing mobile: 1 kolom.
- [ ] Login dari `bakerman.ridwanafazn.my.id`.
- [ ] Budget 90 g + recap tampil.
- [ ] `/menu` 10 produk.
- [ ] `/checkout` slot muncul.
- [ ] `https://bakerman-balance.pages.dev` 200.
- [ ] API `/api/v1/products` 200.
- [ ] `/ready` → `database: connected`.
- [ ] Tidak ada console error.
- [ ] E2E domain custom: 9 langkah, 0 console error.

---

## Langkah Berikutnya (manual)

1. Tambahkan `bakerman.ridwanafazn.my.id` dan `bakerman-balance.pages.dev` ke Firebase Authorized Domains untuk Google sign-in.
2. Evaluasi Dependabot/Firebase.
3. Hapus akun demo sebelum public launch.
4. Opsional: domain API custom (mis. `api.bakerman.ridwanafazn.my.id`) → Vercel.
5. Opsional: Strava asli jika sudah ada langganan.
