import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession, type UserRole } from "./session";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Data dimuat ulang tiap request, jadi akun yang dinonaktifkan langsung kehilangan akses. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findFirst({
    where: { id: session.userId, active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  return user ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Untuk server action: gagal tegas, bukan redirect. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sesi berakhir. Silakan masuk kembali.");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") throw new Error("Aksi ini hanya untuk admin.");
  return user;
}

export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}
