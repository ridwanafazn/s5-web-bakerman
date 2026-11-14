# Fase 8 — UI Fix, Cloudflare Pages & Commit/Push

**Tanggal:** 14 November 2026
**Status:** ✅ Frontend live di Cloudflare Pages + domain custom; API via Cloudflare Tunnel
**Commit:** `126077e` (aplikasi) + `af04876`, `11bccef`, `dc34e4d` (docs deployment) — sudah di-push ke `origin/main`

---

## 1. Perbaikan UI Landing

Gejala di desktop: section produk landing page memanjang ±3.892 px, grid tidak terbentuk, gambar produk membesar penuh.

Penyebab:

- Landing page memakai `ProductCard` dan class `.catalog-grid`.
- `catalog.css` tidak di-import di landing, sehingga `.catalog-grid` menjadi `display: block` dan card tidak punya style.

Perbaikan:

- `client/src/components/ProductCard.jsx` sekarang meng-import `../styles/catalog.css`.
- Verifikasi desktop 1920×1200:
  - `display: grid`
  - 3 kolom (377 px per card)
  - section produk ±975 px
  - body height ±2.846 px
- Mobile tetap 1 kolom.

---

## 2. Cloudflare Pages (Frontend)

Project:

- Nama: `bakerman-balance`
- Account: `491877dfe9bd12e5bce536e6da18da15`
- Source: GitHub `ridwanafazn/s5-web-bakerman`
- Production branch: `main`
- Root directory: `client`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL=https://manuals-strip-vacancies-practical.trycloudflare.com/api`

Deployment:

- Production: **https://bakerman-balance.pages.dev**
- Custom domain: **https://bakerman.ridwanafazn.my.id**
- CNAME: `bakerman` → `bakerman-balance.pages.dev` (proxied)
- Deployment terakhir: `aae3863c-9c49-432b-ae89-9d3436c5a977` (build dari `af04876`; kode frontend sama dengan `126077e`)
- Build & deploy: **success**

Verifikasi:

```text
GET https://bakerman-balance.pages.dev/           → 200
GET https://bakerman.ridwanafazn.my.id/          → 200
Landing: hero + 3 kartu, grid=grid
Login member → /balance → budget 66 g
Recap: Order aktif 2, Selesai 2, on-budget 1/1
/menu → 10 produk
E2E domain custom: 9 langkah, 0 console error
Console errors: 0
```

---

## 3. API (Cloudflare Tunnel)

API Express + MongoDB **tidak bisa** dijalankan di Cloudflare Workers free plan:

- Workers tidak mendukung Express/Mongoose + koneksi MongoDB seperti Node biasa.
- Cloudflare Containers membutuhkan **Workers Paid plan** (akun saat ini Free Website).
- Rewrite ke D1/Workers akan mengubah besar arsitektur.

Karena itu, API saat ini:

- Berjalan di Docker production stack lokal (`localhost:8080` nginx → `api:5050`).
- Diekspos lewat **Cloudflare Quick Tunnel**:
  **https://manuals-strip-vacancies-practical.trycloudflare.com**
- Pages frontend memanggil `.../api`.
- CORS API mengizinkan:
  - `https://bakerman.ridwanafazn.my.id`
  - `https://bakerman-balance.pages.dev`
  - `https://aae3863c.bakerman-balance.pages.dev`
  - `http://localhost:8080`

**Keterbatasan:** API masih bergantung pada laptop/Docker yang menyala. Ini bukan API yang dihosting penuh di Cloudflare. Untuk API cloud sejati, perlu Vercel/Render/VPS atau Cloudflare Workers Paid + Containers.

---

## 4. Commit & Push

```text
commit 126077e
feat: complete Bakerman Balance app (phases 1-7)
branch main → origin/main
```

GitHub mengembalikan peringatan Dependabot:

```text
6 vulnerabilities (2 high, 3 moderate, 1 low)
```

Catatan:

- `server npm audit --omit=dev` → **0 vulnerabilities**.
- `client npm audit --omit=dev` → **4 high** di transitive Firebase Firestore (`@grpc/grpc-js`), padahal aplikasi hanya memakai Firebase Auth.
- Perbaikan `npm audit fix --force` akan menurunkan Firebase ke versi breaking; belum dilakukan.

---

## 5. Verifikasi Teknis

```text
Server tests : 34/34 pass
Client lint  : 0 error
Client build : sukses
E2E lokal    : 9 langkah, 0 console error
E2E prod     : 9 langkah, 0 console error (manual skip jika Cloudinary belum ada)
Pages login  : berhasil, budget 66 g, recap tampil
Custom domain: 200 + login berhasil
```

---

## 6. Yang Masih Manual

1. **Cloudinary**: isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_MOCK=false`, `CRON_SECRET`; redeploy API.
2. **API hosting permanen**: pindah dari Quick Tunnel ke Vercel/Render/VPS atau Cloudflare Containers (Workers Paid).
3. **Firebase Authorized Domains**: tambahkan `bakerman.ridwanafazn.my.id` dan `bakerman-balance.pages.dev` jika ingin Google sign-in.
4. **Update Pages env** jika URL API berubah:
   `VITE_API_URL=https://<api-domain>/api` → rebuild Pages.
5. **Dependabot**: evaluasi upgrade Firebase / hapus dependency Firestore jika tidak dipakai.
6. **Strava asli**: opsional, butuh langganan Strava.

---

## 7. Link

| Keperluan | URL |
|---|---|
| Frontend production | **https://bakerman.ridwanafazn.my.id** |
| Frontend Pages | https://bakerman-balance.pages.dev |
| API (tunnel) | https://manuals-strip-vacancies-practical.trycloudflare.com/api |
| Dev preview | https://bean-martial-old-thy.trycloudflare.com |
| Production lokal | http://localhost:8080 |
| Dev lokal | http://localhost:5173 |

> Tunnel dan API lokal bersifat sementara; laptop harus menyala.
