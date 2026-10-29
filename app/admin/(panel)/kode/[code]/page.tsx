import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizeVisitCode } from "@/lib/visit";

/** Tujuan QR di layar pengunjung: security scan -> langsung ke detail kunjungan. */
export default async function KodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const visit = await prisma.visit.findUnique({
    where: { code: normalizeVisitCode(code) },
    select: { id: true },
  });
  if (!visit) notFound();
  redirect(`/admin/kunjungan/${visit.id}`);
}
