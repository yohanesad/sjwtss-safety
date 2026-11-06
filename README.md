# Safety Induction System

Induksi keselamatan online untuk pengunjung pabrik, dirancang untuk ponsel (Android/iPhone).

## Alur pengunjung
1. Scan QR (poster di `/admin/poster`) atau buka link
2. Data diri: NIK, nama lengkap, PT, jenis kelamin, no HP, ditambah data kunjungan, dan persetujuan data pribadi
3. **Foto diri** lewat kamera HP (cadangan: input kamera bila akses kamera ditolak)
4. Tonton video induksi (tanpa seek/percepatan; server memeriksa lamanya). Video baru terbuka setelah foto tersimpan
5. 15 soal pilihan ganda (lulus bila semua benar) + 1 isian komitmen
6. Layar menampilkan kode & QR, lalu tunjukkan ke security
7. Security mencocokkan foto dan NIK dengan KTP, menekan **Setujui**, dan memberi stiker pass
8. Pengunjung dengan NIK yang sama dalam 90 hari melewati video dan kuis (foto tetap diambil setiap kunjungan)

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
- Pengunjung berulang dikenali dari NIK; security tetap mencocokkan foto dan KTP secara langsung.
- Foto dan NIK adalah data pribadi. Foto hanya bisa dibuka staf yang sudah masuk, NIK disamarkan di ekspor CSV untuk peran Security, dan Admin dapat menghapus foto lama dari menu Konten. Aturan retensi dan dasar hukum perlu dikonfirmasi dengan bagian legal (UU PDP).
- Belum ada pembatasan laju (rate limit) pada pembuatan kunjungan.
- Soal bawaan hanya contoh dan harus diganti.
