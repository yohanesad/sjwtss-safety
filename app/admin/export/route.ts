import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { dateOnly, formatDateTime, todayJakarta } from "@/lib/format";
import { GENDER_LABEL, maskNik } from "@/lib/visit";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Cegah "CSV injection": sel yang diawali = + - @ dianggap rumus oleh Excel. */
function cell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Angka panjang (NIK 16 digit, nomor HP) dipaksa menjadi teks di Excel; tanpa ini
 * Excel menampilkannya sebagai 3,2E+15 dan memotong digit terakhirnya.
 * Hanya nilai yang seluruhnya digit yang diperlakukan begini, jadi aman dari injeksi rumus.
 */
function textCell(value: string | null | undefined): string {
  const v = value ?? "";
  return /^\d{6,}$/.test(v) ? `="${v}"` : cell(v);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  // NIK lengkap hanya untuk Admin; peran Security melihat versi tersamar.
  const nik = (v: string | null) => (user.role === "ADMIN" ? (v ?? "") : maskNik(v));

  const url = new URL(request.url);
  const today = todayJakarta();
  const from = ISO.test(url.searchParams.get("from") ?? "") ? url.searchParams.get("from")! : today;
  const to = ISO.test(url.searchParams.get("to") ?? "") ? url.searchParams.get("to")! : from;

  const visits = await prisma.visit.findMany({
    where: { visitDate: { gte: dateOnly(from), lte: dateOnly(to) } },
    orderBy: [{ visitDate: "asc" }, { createdAt: "asc" }],
    include: { decidedBy: { select: { name: true } } },
  });

  const header = [
    "Kode", "Tanggal", "NIK", "Nama", "Jenis kelamin", "Perusahaan", "HP", "Tujuan", "Bertemu", "Departemen", "Perkiraan lama (jam)",
    "Kendaraan", "Status", "Induksi dilewati", "Video selesai",
    "Nilai kuis (%)", "Komitmen", "Stiker", "Diputuskan oleh", "Waktu keputusan", "Keluar",
  ];
  const lines = visits.map((v) =>
    [
      cell(v.code),
      cell(v.visitDate.toISOString().slice(0, 10)),
      textCell(nik(v.nik)),
      cell(v.fullName),
      cell(v.gender ? GENDER_LABEL[v.gender] : ""),
      cell(v.company),
      textCell(v.phone),
      cell(v.purpose),
      cell(v.hostName),
      cell(v.department),
      cell(v.estimatedHours),
      cell(v.vehiclePlate),
      cell(v.status),
      cell(v.inductionSkipped ? "Ya" : "Tidak"),
      cell(v.videoCompletedAt ? formatDateTime(v.videoCompletedAt) : ""),
      cell(v.quizBestPercent),
      cell(v.commitmentText),
      cell(v.stickerNumber),
      cell(v.decidedBy?.name),
      cell(v.decidedAt ? formatDateTime(v.decidedAt) : ""),
      cell(v.checkedOutAt ? formatDateTime(v.checkedOutAt) : ""),
    ].join(","),
  );

  // BOM agar Excel membaca UTF-8 dengan benar.
  const body = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pengunjung_${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
