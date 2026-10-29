import { parseYouTubeId } from "./video";

/**
 * Pemeriksaan variabel lingkungan dengan pesan yang bisa ditindaklanjuti.
 *
 * Tanpa ini, `.env` yang belum dibuat hanya menghasilkan pesan bawaan
 * "Connection url is empty" yang tidak menjelaskan apa yang harus dilakukan.
 */

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error(
      [
        "DATABASE_URL belum diset.",
        "",
        "Buat berkas .env terlebih dahulu:",
        "  cp .env.example .env",
        "",
        "Lalu isi DATABASE_URL dengan alamat PostgreSQL Anda, contoh:",
        '  DATABASE_URL="postgresql://pengguna:sandi@localhost:5432/attendance?schema=public"',
      ].join("\n"),
    );
  }

  if (url.includes("user:password@")) {
    throw new Error(
      [
        "DATABASE_URL masih berisi contoh bawaan dari .env.example.",
        "Ganti bagian pengguna, sandi, dan nama basis data dengan milik Anda sendiri.",
      ].join("\n"),
    );
  }

  return url;
}

/**
 * Alamat basis data untuk MIGRASI dan perintah Prisma CLI lainnya.
 *
 * Penyedia basis data serverless (Supabase, Neon) memberi dua alamat:
 *   - "pooled"/transaction pooler — untuk aplikasi, banyak koneksi pendek
 *   - "direct"/session pooler     — untuk migrasi, yang butuh sesi utuh
 *
 * Migrasi lewat pooler transaksi bisa gagal atau menggantung karena
 * perubahan skema memerlukan kunci dan sesi yang tidak terputus. Karena itu
 * DIRECT_URL dipakai lebih dulu bila tersedia.
 */
export function requireMigrationUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  return requireDatabaseUrl();
}

export function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      [
        "AUTH_SECRET belum diset atau kurang dari 32 karakter.",
        "",
        "Buat nilai acak dengan:",
        `  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`,
        "",
        "lalu simpan hasilnya pada .env sebagai AUTH_SECRET.",
      ].join("\n"),
    );
  }

  return secret;
}

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    console.warn(`${name}="${raw}" tidak valid (harus ${min}–${max}); memakai nilai bawaan ${fallback}.`);
    return fallback;
  }
  return value;
}

/** Aturan induksi. Semua bisa diubah lewat .env tanpa menyentuh kode. */
export const induction = {
  /** Lama video induksi dalam detik. Dipakai server untuk menolak "selesai" yang terlalu cepat. */
  get videoSeconds() {
    return intFromEnv("VIDEO_DURATION_SECONDS", 240, 1, 7200);
  },
  /** Berapa bagian video yang minimal harus sudah berjalan menurut jam server (0.5–1). */
  get minWatchRatio() {
    return intFromEnv("VIDEO_MIN_WATCH_PERCENT", 90, 50, 100) / 100;
  },
  /** Tautan/ID YouTube. Bila diisi, dipakai menggantikan berkas video sendiri. */
  get youtube() {
    return parseYouTubeId(process.env.VIDEO_YOUTUBE);
  },
  /** Berkas video relatif terhadap folder public/ (dipakai bila VIDEO_YOUTUBE kosong). */
  get videoSrc() {
    return process.env.VIDEO_SRC?.trim() || "/videos/induksi.mp4";
  },
  /** Masa berlaku induksi untuk kunjungan berikutnya. */
  get validDays() {
    return intFromEnv("INDUCTION_VALID_DAYS", 90, 1, 3650);
  },
  get passPercent() {
    return intFromEnv("QUIZ_PASS_PERCENT", 100, 1, 100);
  },
};
