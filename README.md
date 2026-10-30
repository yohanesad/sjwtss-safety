# Safety Induction System

Induksi keselamatan online untuk pengunjung pabrik, dirancang untuk ponsel (Android/iPhone).

## Alur pengunjung
1. Scan QR (poster di `/admin/poster`) atau buka link
2. Isi biodata singkat + persetujuan data pribadi
3. Tonton video induksi (tanpa seek/percepatan; server memeriksa lamanya)
4. 15 soal pilihan ganda (lulus bila semua benar, 100%) + 1 isian komitmen
5. Layar menampilkan kode & QR → tunjukkan ke security
6. Security membuka panel, memeriksa, menekan **Setujui**, memberi stiker pass
7. Pengunjung yang sama (nomor HP sama) dalam 90 hari melewati video & kuis

## Menjalankan
```bash
npm install
cp .env.example .env        # isi DATABASE_URL dan AUTH_SECRET
npx prisma migrate dev      # buat tabel
npx prisma db seed          # 15 soal CONTOH (ganti lewat Admin > Soal)
ADMIN_NAME="Nama" ADMIN_EMAIL="email@x.com" ADMIN_PASSWORD="min-8-karakter" npm run db:bootstrap
# isi VIDEO_YOUTUBE di .env (tautan YouTube unlisted) atau taruh public/videos/induksi.mp4
npm run dev
```
Panel security: `/admin` · Tes: `npm test`

## Mengubah konten tanpa kode
Admin membuka **Konten** di panel: semua teks halaman pengunjung, warna utama, logo, sumber video (YouTube atau MP4), durasi video, nilai lulus, masa berlaku induksi, dan teks poster. Kosongkan kolom lalu simpan untuk kembali ke bawaan. Nilai di `.env` hanya menjadi bawaan; halaman Konten menimpanya.

## Yang perlu diketahui
- Video YouTube: kontrol disembunyikan, lompatan maju dikembalikan, kecepatan dikunci. Pemutar belum diuji dengan YouTube asli (hanya tiruan API), jadi uji di HP Android dan iPhone sebelum dipakai. Jaringan pabrik harus bisa membuka youtube.com.
- Anti-skip video di browser bukan jaminan mutlak (HP bisa dibiarkan memutar). Lapis lainnya: kuis, isian komitmen, dan konfirmasi tatap muka security.
- Pengunjung berulang dikenali dari nomor HP; security tetap memeriksa identitas langsung.
- Belum ada pembatasan laju (rate limit) pada pembuatan kunjungan.
- Soal bawaan hanya contoh dan harus diganti.
