/**
 * Logika murni (tanpa database) untuk alur induksi, supaya mudah diuji.
 */

import { randomInt } from "node:crypto";

// Tanpa 0/O/1/I/L agar kode mudah dibaca & dibacakan ke security.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 10;

/** Kode kunjungan acak 10 karakter (~49 bit), mis. "K7M29QXPBT". */
export function generateVisitCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/** Tampilan berkelompok: "K7M29-QXPBT". */
export function formatVisitCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Menerima input manual ("k7m29-qxpbt", spasi, dll) dan mengembalikan bentuk baku. */
export function normalizeVisitCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Nomor HP -> hanya digit, awalan 0 diganti 62 (Indonesia).
 * Nomor luar negeri (diawali kode negara lain) dibiarkan.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function isPlausiblePhone(input: string): boolean {
  const n = normalizePhone(input);
  return n.length >= 9 && n.length <= 15;
}

/** Apakah induksi yang lalu masih berlaku pada saat `now`? */
export function isInductionValid(validUntil: Date | null, now: Date): boolean {
  return validUntil !== null && validUntil.getTime() > now.getTime();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Server hanya menerima "video selesai" bila sudah cukup lama sejak video
 * dimulai. Ini menutup jalan pintas berupa memanggil tombol "lanjut" langsung.
 */
export function hasWatchedLongEnough(
  startedAt: Date | null,
  now: Date,
  videoSeconds: number,
  minRatio: number,
): boolean {
  if (!startedAt) return false;
  const elapsed = (now.getTime() - startedAt.getTime()) / 1000;
  return elapsed >= videoSeconds * minRatio;
}

export interface GradeResult {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export function gradeQuiz(
  questions: { id: string; correctIndex: number }[],
  answers: Record<string, number | undefined>,
  passPercent: number,
): GradeResult {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: total > 0 && percent >= passPercent };
}

/** Mengacak salinan array (Fisher–Yates). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const COMMITMENT_PROMPT =
  "Tuliskan komitmen Anda untuk menjaga keselamatan diri sendiri dan orang lain selama berada di area pabrik.";
export const COMMITMENT_MIN_LENGTH = 20;

export const PURPOSES = [
  "Meeting / tamu perusahaan",
  "Kontraktor / pekerjaan",
  "Audit / inspeksi",
  "Pengiriman barang",
  "Training / magang",
  "Lainnya",
] as const;
