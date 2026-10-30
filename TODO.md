# Daftar tugas (per 30 Okt 2026)

Status: aplikasi sudah ter-deploy di Vercel (https://sjwtss-safety.vercel.app) dengan database Neon.
Login, kuis, dan video YouTube sudah teruji dari sisi aplikasi.

## Perlu diputuskan
- [ ] **Video diblokir jaringan perusahaan.** Pilih salah satu (lihat opsi di bawah):
  - uji dulu memakai data seluler (bukan Wi-Fi perusahaan)
  - minta IT membuka domain YouTube
  - pindah ke MP4 sendiri di `public/videos/induksi.mp4` (satu domain dengan aplikasi)
  - pengunjung memakai Wi-Fi tamu yang tidak diblokir

## Konfigurasi Vercel / Neon
- [ ] Cek `DATABASE_URL` dan `DIRECT_URL`: `DATABASE_URL` harus alamat **pooled** (host mengandung `-pooler`), `DIRECT_URL` alamat **langsung**. Saat ini terlihat `DATABASE_URL_POOLED` (tidak dipakai aplikasi) dan `DIRECT_URL` belum terlihat.
- [ ] Hapus variabel `DATABASE_URL_POOLED` setelah itu, lalu redeploy.
- [ ] Isi `VIDEO_DURATION_SECONDS` dengan durasi video yang persis (detik); jangan lebih besar dari durasi asli.
- [ ] Lengkapi lingkungan variabel (Production sudah; Preview/Development hanya bila diperlukan).
- [ ] Pertimbangkan branch `main`: produksi sekarang berjalan dari branch `claude/eloquent-bell-40vyhu`.
- [ ] Cek paket Vercel: paket Hobby setahu saya untuk pemakaian non-komersial; aplikasi perusahaan mungkin perlu paket Pro/Team (cek syarat Vercel).

## Konten (baru)
- [ ] Coba halaman Admin > Konten di Vercel: ubah teks, warna, logo; pastikan perubahan tampil di halaman pengunjung.
- [ ] `VIDEO_DURATION_SECONDS`, nilai lulus, dan sumber video kini juga bisa diatur di halaman Konten (menimpa environment variable).

## Akun
- [ ] Buat akun admin sendiri di halaman Pengguna (peran Admin).
- [ ] Nonaktifkan `Admin Sementara` (kata sandinya pernah tampil di chat).

## Isi
- [ ] Ganti 15 soal contoh lewat menu Soal (nilai lulus 100%).
- [ ] Putuskan: pengunjung lama (induksi masih berlaku 90 hari) tetap melewati video dan kuis, atau wajib mengulang karena ambang 100%.

## Uji
- [ ] Selesaikan alur sampai tombol "Lanjut ke pertanyaan" (video sampai habis).
- [ ] Uji di HP Android dan iPhone (YouTube kadang minta ketukan langsung pada video).
- [ ] Cetak poster QR (menu Poster QR) setelah alamat final.

## Sebelum dipakai luas
- [ ] Rate limit pada form pengunjung.
- [ ] Fitur ganti kata sandi.
- [ ] Aturan retensi data pribadi (berapa lama disimpan, siapa yang menghapus).
- [ ] Opsional: `sslmode=verify-full` pada alamat database untuk menghilangkan peringatan SSL di log.
