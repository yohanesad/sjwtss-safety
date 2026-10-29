/**
 * Membuat akun admin pertama. Aman dijalankan pada basis data sungguhan
 * (tidak membuat data contoh).
 *
 *   ADMIN_NAME="Budi" ADMIN_EMAIL="budi@perusahaan.co.id" ADMIN_PASSWORD="sandi-kuat-123" \
 *   npm run db:bootstrap
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { requireDatabaseUrl } from "../lib/env";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} belum diisi.`);
  return v;
}

async function main() {
  const name = need("ADMIN_NAME");
  const email = need("ADMIN_EMAIL").toLowerCase();
  const password = need("ADMIN_PASSWORD");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD minimal 8 karakter.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Akun ${email} sudah ada; tidak diubah.`);
    return;
  }
  await prisma.user.create({
    data: { name, email, role: "ADMIN", passwordHash: await hashPassword(password) },
  });
  console.log(`Admin ${email} dibuat. Masuk di /admin/login.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
