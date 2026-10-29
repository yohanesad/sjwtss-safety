"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { induction } from "@/lib/env";
import { dateOnly, todayJakarta } from "@/lib/format";
import {
  addDays,
  COMMITMENT_MIN_LENGTH,
  generateVisitCode,
  gradeQuiz,
  hasWatchedLongEnough,
  isInductionValid,
  isPlausiblePhone,
  normalizePhone,
} from "@/lib/visit";

export interface FormState {
  error?: string;
}

const text = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} terlalu panjang.`);

const biodataSchema = z.object({
  fullName: text("Nama lengkap"),
  company: text("Perusahaan/instansi"),
  phone: z.string().trim().refine(isPlausiblePhone, "Nomor HP tidak valid."),
  purpose: text("Tujuan kunjungan"),
  hostName: text("Orang yang dituju"),
  department: z.string().trim().max(120).optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal kunjungan tidak valid."),
  durationDays: z.coerce.number().int().min(1, "Lama kunjungan minimal 1 hari.").max(30),
  vehiclePlate: z.string().trim().max(20).optional(),
  emergencyName: text("Nama kontak darurat"),
  emergencyPhone: z.string().trim().refine(isPlausiblePhone, "Nomor kontak darurat tidak valid."),
  consent: z.literal("on", "Anda harus menyetujui penggunaan data pribadi."),
});

/** Langkah 1: biodata -> buat kunjungan -> arahkan ke halaman kode kunjungan. */
export async function createVisitAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = biodataSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const d = parsed.data;

  if (d.visitDate < todayJakarta()) {
    return { error: "Tanggal kunjungan tidak boleh sudah lewat." };
  }

  const now = new Date();
  const phone = normalizePhone(d.phone);

  const visitor = await prisma.visitor.upsert({
    where: { phone },
    create: { phone, fullName: d.fullName, company: d.company },
    update: { fullName: d.fullName, company: d.company },
  });

  // Induksi masih berlaku -> video & kuis dilewati, langsung menunggu security.
  const skip = isInductionValid(visitor.inductionValidUntil, now);

  // Kode acak bisa (sangat jarang) bentrok; coba ulang beberapa kali.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateVisitCode();
    try {
      await prisma.visit.create({
        data: {
          code,
          visitorId: visitor.id,
          fullName: d.fullName,
          company: d.company,
          phone,
          purpose: d.purpose,
          hostName: d.hostName,
          department: d.department || null,
          visitDate: dateOnly(d.visitDate),
          durationDays: d.durationDays,
          vehiclePlate: d.vehiclePlate ? d.vehiclePlate.toUpperCase() : null,
          emergencyName: d.emergencyName,
          emergencyPhone: normalizePhone(d.emergencyPhone),
          consentAt: now,
          inductionSkipped: skip,
          status: skip ? "WAITING_SECURITY" : "VIDEO",
        },
      });
      redirect(`/v/${code}`);
    } catch (e) {
      // redirect() melempar error khusus; biarkan lewat.
      if (e instanceof Error && "digest" in e) throw e;
      const unique = typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
      if (!unique) throw e;
    }
  }
  return { error: "Gagal membuat kunjungan. Silakan coba lagi." };
}

/** Dipanggil saat video mulai diputar. Hanya mencatat awal pertama. */
export async function startVideoAction(code: string): Promise<void> {
  await prisma.visit.updateMany({
    where: { code, status: "VIDEO", videoStartedAt: null },
    data: { videoStartedAt: new Date() },
  });
}

/** Dipanggil saat video selesai. Server memeriksa lamanya, bukan percaya browser. */
export async function completeVideoAction(code: string): Promise<{ ok: boolean; error?: string }> {
  const visit = await prisma.visit.findUnique({ where: { code } });
  if (!visit) return { ok: false, error: "Kunjungan tidak ditemukan." };
  if (visit.status !== "VIDEO") return { ok: true };

  const now = new Date();
  if (!hasWatchedLongEnough(visit.videoStartedAt, now, induction.videoSeconds, induction.minWatchRatio)) {
    return { ok: false, error: "Video belum selesai ditonton. Silakan tonton sampai akhir." };
  }
  await prisma.visit.update({
    where: { id: visit.id },
    data: { status: "QUIZ", videoCompletedAt: now },
  });
  return { ok: true };
}

/** Langkah kuis: 15 pilihan ganda + isian komitmen. */
export async function submitQuizAction(
  code: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const visit = await prisma.visit.findUnique({ where: { code } });
  if (!visit || visit.status !== "QUIZ") redirect(`/v/${code}`);

  const questions = await prisma.question.findMany({
    where: { active: true },
    select: { id: true, correctIndex: true, options: true },
  });
  if (questions.length === 0) return { error: "Soal belum tersedia. Hubungi petugas." };

  const answers: Record<string, number | undefined> = {};
  for (const q of questions) {
    const raw = formData.get(`q_${q.id}`);
    const n = typeof raw === "string" && raw !== "" ? Number(raw) : NaN;
    if (!Number.isInteger(n) || n < 0 || n >= q.options.length) {
      return { error: "Masih ada soal yang belum dijawab. Periksa kembali semua soal." };
    }
    answers[q.id] = n;
  }

  const commitment = String(formData.get("commitment") ?? "").trim();
  if (commitment.length < COMMITMENT_MIN_LENGTH) {
    return { error: `Isian komitmen minimal ${COMMITMENT_MIN_LENGTH} karakter.` };
  }
  if (commitment.length > 1000) return { error: "Isian komitmen terlalu panjang." };

  const result = gradeQuiz(questions, answers, induction.passPercent);
  const now = new Date();

  await prisma.quizAttempt.create({
    data: {
      visitId: visit.id,
      correct: result.correct,
      total: result.total,
      percent: result.percent,
      passed: result.passed,
      answers,
    },
  });

  if (!result.passed) {
    redirect(`/v/${code}?gagal=${result.percent}`);
  }

  await prisma.$transaction([
    prisma.visit.update({
      where: { id: visit.id },
      data: {
        status: "WAITING_SECURITY",
        quizPassedAt: now,
        quizBestPercent: Math.max(result.percent, visit.quizBestPercent ?? 0),
        commitmentText: commitment,
      },
    }),
    prisma.visitor.update({
      where: { id: visit.visitorId },
      data: { inductionValidUntil: addDays(now, induction.validDays) },
    }),
  ]);
  redirect(`/v/${code}`);
}
