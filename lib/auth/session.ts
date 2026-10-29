/**
 * Sesi staf (admin/security) berbasis cookie JWT bertanda tangan.
 * Pengunjung tidak punya akun; mereka diakses lewat kode kunjungan.
 */

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { requireAuthSecret } from "@/lib/env";

export const SESSION_COOKIE = "safety_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type UserRole = "ADMIN" | "SECURITY";

export interface SessionPayload {
  userId: string;
  role: UserRole;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(requireAuthSecret());
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== "ADMIN" && payload.role !== "SECURITY") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
