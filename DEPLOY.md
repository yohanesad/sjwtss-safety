# Deploy ke Vercel + database PostgreSQL

Butuh dua akun gratis: **Vercel** (hosting) dan penyedia PostgreSQL (mis. **Supabase** atau **Neon**).
Nama menu di dashboard mereka bisa berubah; intinya sama.

## 1. Database
Buat proyek baru, lalu salin dua alamat koneksi:
- **DATABASE_URL**: alamat "pooled" / transaction pooler (Supabase: port 6543). Dipakai aplikasi.
- **DIRECT_URL**: alamat langsung / session pooler (Supabase: port 5432). Dipakai migrasi.

## 2. Vercel
1. *Add New → Project* → impor repo `yohanesad/sjwtss-safety`.
2. Branch produksi: `main` (belum ada) atau, sementara, `claude/eloquent-bell-40vyhu`
   (*Settings → Git → Production Branch*).
3. Environment Variables:

| Nama | Isi |
|---|---|
| `DATABASE_URL` | alamat pooled |
| `DIRECT_URL` | alamat langsung |
| `AUTH_SECRET` | acak ≥32 karakter: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `VIDEO_YOUTUBE` | tautan YouTube unlisted |
| `VIDEO_DURATION_SECONDS` | durasi video dalam detik (isi persis) |
| `APP_URL` | alamat situs, mis. `https://nama-proyek.vercel.app` (isi setelah deploy pertama, lalu redeploy) |

4. Deploy. Vercel menjalankan `npm run vercel-build` (migrasi database lalu build).

## 3. Akun admin pertama (sekali, dari komputer Anda)
```bash
DATABASE_URL="<alamat langsung>" ADMIN_NAME="Nama Anda" ADMIN_EMAIL="email@perusahaan.com" ADMIN_PASSWORD="sandi-min-8-karakter" npm run db:bootstrap
```
Soal contoh (opsional, bisa diganti di Admin > Soal):
```bash
DATABASE_URL="<alamat langsung>" npx prisma db seed
```

## 4. Dipakai
- Pengunjung: buka alamat situs. Cetak poster QR di `/admin/poster`.
- Security/Admin: `/admin`.
