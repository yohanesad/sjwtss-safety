/**
 * Mengisi soal CONTOH bila tabel soal masih kosong. Soal ini hanya kerangka
 * untuk uji coba — ganti lewat halaman Admin > Soal dengan aturan pabrik Anda.
 * Tidak menimpa soal yang sudah ada.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { requireDatabaseUrl } from "../lib/env";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

async function main() {
  if ((await prisma.question.count()) > 0) {
    console.log("Soal sudah ada; seed dilewati.");
    return;
  }
  const raw = JSON.parse(
    readFileSync(path.join(__dirname, "..", "data", "questions.sample.json"), "utf8"),
  ) as { text: string; options: string[]; correct: number }[];

  await prisma.question.createMany({
    data: raw.map((q, i) => ({
      text: q.text,
      options: q.options,
      correctIndex: q.correct - 1,
      position: i + 1,
    })),
  });
  console.log(`${raw.length} soal contoh ditambahkan.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
