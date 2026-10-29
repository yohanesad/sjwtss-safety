import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { dateOnly, formatDateTime, todayJakarta } from "@/lib/format";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Cegah "CSV injection": sel yang diawali = + - @ dianggap rumus oleh Excel. */
function cell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });

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
    "Kode", "Tanggal", "Nama", "Perusahaan", "HP", "Tujuan", "Bertemu", "Departemen", "Lama (hari)",
    "Kendaraan", "Kontak darurat", "HP darurat", "Status", "Induksi dilewati", "Video selesai",
    "Nilai kuis (%)", "Komitmen", "Stiker", "Diputuskan oleh", "Waktu keputusan", "Keluar",
  ];
  const lines = visits.map((v) =>
    [
      v.code, v.visitDate.toISOString().slice(0, 10), v.fullName, v.company, v.phone, v.purpose,
      v.hostName, v.department, v.durationDays, v.vehiclePlate, v.emergencyName, v.emergencyPhone,
      v.status, v.inductionSkipped ? "Ya" : "Tidak",
      v.videoCompletedAt ? formatDateTime(v.videoCompletedAt) : "",
      v.quizBestPercent, v.commitmentText, v.stickerNumber, v.decidedBy?.name,
      v.decidedAt ? formatDateTime(v.decidedAt) : "", v.checkedOutAt ? formatDateTime(v.checkedOutAt) : "",
    ]
      .map(cell)
      .join(","),
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
