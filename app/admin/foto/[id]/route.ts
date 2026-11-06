import { getCurrentUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

/** Foto diri pengunjung. Hanya untuk staf yang sudah masuk; tidak boleh di-cache. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const photo = await prisma.visitPhoto.findUnique({ where: { visitId: id } });
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
