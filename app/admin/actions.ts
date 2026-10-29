"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destroySession, createSession } from "@/lib/auth/session";
import { requireAdmin, requireStaff } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

export interface FormState {
  error?: string;
  ok?: string;
}

// ---------------------------------------------------------------- login

// Hash tiruan agar waktu respons tidak membedakan "email tidak ada" dari "sandi salah".
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.v8s4X0v5lq8y8Qm1eQJ1xYQWb1Ga";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." };

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !ok) return { error: "Email atau kata sandi salah." };

  await createSession({ userId: user.id, role: user.role });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- keputusan security

export async function approveVisitAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const sticker = String(formData.get("stickerNumber") ?? "").trim().slice(0, 30);

  const res = await prisma.visit.updateMany({
    where: { id, status: "WAITING_SECURITY" },
    data: {
      status: "APPROVED",
      decidedById: user.id,
      decidedAt: new Date(),
      stickerNumber: sticker || null,
      rejectedReason: null,
    },
  });
  if (res.count === 0) return { error: "Status kunjungan sudah berubah. Muat ulang halaman." };
  revalidatePath("/admin");
  revalidatePath(`/admin/kunjungan/${id}`);
  return { ok: "Disetujui. Berikan stiker pass kepada pengunjung." };
}

export async function rejectVisitAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaff();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  if (!reason) return { error: "Alasan penolakan wajib diisi." };

  const res = await prisma.visit.updateMany({
    where: { id, status: { in: ["VIDEO", "QUIZ", "WAITING_SECURITY"] } },
    data: { status: "REJECTED", decidedById: user.id, decidedAt: new Date(), rejectedReason: reason },
  });
  if (res.count === 0) return { error: "Status kunjungan sudah berubah. Muat ulang halaman." };
  revalidatePath("/admin");
  revalidatePath(`/admin/kunjungan/${id}`);
  return { ok: "Kunjungan ditolak." };
}

export async function checkoutVisitAction(id: string): Promise<void> {
  await requireStaff();
  await prisma.visit.updateMany({
    where: { id, status: "APPROVED" },
    data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/kunjungan/${id}`);
}

// ---------------------------------------------------------------- pengguna (admin)

const userSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(80),
  email: z.email("Email tidak valid.").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(100),
  role: z.enum(["ADMIN", "SECURITY"]),
});

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const d = parsed.data;
  if (await prisma.user.findUnique({ where: { email: d.email } })) {
    return { error: "Email sudah terdaftar." };
  }
  await prisma.user.create({
    data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password) },
  });
  revalidatePath("/admin/pengguna");
  return { ok: `Akun ${d.name} dibuat.` };
}

export async function toggleUserAction(id: string): Promise<void> {
  const admin = await requireAdmin();
  if (id === admin.id) throw new Error("Anda tidak dapat menonaktifkan akun sendiri.");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/admin/pengguna");
}

// ---------------------------------------------------------------- soal (admin)

const questionSchema = z.object({
  text: z.string().trim().min(5, "Teks soal terlalu pendek.").max(500),
  options: z.string(),
  correct: z.coerce.number().int().min(1),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});

function parseQuestion(formData: FormData) {
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." } as const;
  const options = parsed.data.options
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (options.length < 2 || options.length > 6) return { error: "Isi 2–6 pilihan jawaban, satu per baris." } as const;
  if (new Set(options).size !== options.length) return { error: "Pilihan jawaban tidak boleh sama." } as const;
  if (parsed.data.correct > options.length) return { error: "Nomor jawaban benar di luar jumlah pilihan." } as const;
  return {
    data: {
      text: parsed.data.text,
      options,
      correctIndex: parsed.data.correct - 1,
      position: parsed.data.position,
    },
  } as const;
}

export async function createQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parseQuestion(formData);
  if ("error" in r) return { error: r.error };
  await prisma.question.create({ data: r.data });
  revalidatePath("/admin/soal");
  return { ok: "Soal ditambahkan." };
}

export async function updateQuestionAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parseQuestion(formData);
  if ("error" in r) return { error: r.error };
  await prisma.question.update({ where: { id }, data: r.data });
  revalidatePath("/admin/soal");
  return { ok: "Tersimpan." };
}

export async function toggleQuestionAction(id: string): Promise<void> {
  await requireAdmin();
  const q = await prisma.question.findUnique({ where: { id } });
  if (!q) return;
  await prisma.question.update({ where: { id }, data: { active: !q.active } });
  revalidatePath("/admin/soal");
}

export async function deleteQuestionAction(id: string): Promise<void> {
  await requireAdmin();
  await prisma.question.deleteMany({ where: { id } });
  revalidatePath("/admin/soal");
}
