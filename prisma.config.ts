import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";
import { requireMigrationUrl } from "./lib/env";

// `prisma generate` hanya membaca skema dan tidak menyentuh basis data.
// Perintah itu dijalankan otomatis pada `npm install` (postinstall), jadi
// tidak boleh menuntut DATABASE_URL — kalau tidak, pemasangan dependensi
// gagal sebelum pengguna sempat membuat .env.
const needsConnection = !process.argv.includes("generate");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Migrasi memakai DIRECT_URL bila ada (lihat requireMigrationUrl).
    // Diperiksa di sini agar .env yang belum dibuat menghasilkan pesan yang
    // menjelaskan langkah perbaikannya, bukan "Connection url is empty".
    url: needsConnection
      ? requireMigrationUrl()
      : (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ""),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
