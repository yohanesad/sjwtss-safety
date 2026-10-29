import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { requireDatabaseUrl } from "@/lib/env";

// Next.js me-reload modul saat dev; tanpa cache global koneksi akan menumpuk.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Di lingkungan serverless (mis. Vercel) setiap instans fungsi membuka
 * kolam koneksinya sendiri, sehingga kolam yang besar cepat menghabiskan
 * kuota koneksi PostgreSQL. Nilainya dibuat kecil dan tetap bisa disetel
 * lewat DATABASE_POOL_MAX bila server basis data punya kuota lebih besar.
 */
function poolSize(): number {
  const configured = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isInteger(configured) && configured > 0) return configured;
  return process.env.VERCEL ? 3 : 10;
}

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireDatabaseUrl(),
      max: poolSize(),
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
