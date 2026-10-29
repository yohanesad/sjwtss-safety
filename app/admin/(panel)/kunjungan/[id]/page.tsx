import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatVisitCode } from "@/lib/visit";
import { checkoutVisitAction } from "../../../actions";
import DecisionForms from "./decision-forms";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 text-sm last:border-0">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="text-right font-medium">{children || "—"}</dd>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={ok ? "text-green-600" : "text-red-600"}>{ok ? "✔" : "✘"}</span>
      {children}
    </li>
  );
}

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.visit.findUnique({
    where: { id },
    include: { attempts: { orderBy: { createdAt: "asc" } }, decidedBy: { select: { name: true } }, visitor: true },
  });
  if (!v) notFound();

  const videoOk = v.inductionSkipped || v.videoCompletedAt !== null;
  const quizOk = v.inductionSkipped || v.quizPassedAt !== null;

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm underline">← Kembali</Link>
      <div>
        <h1 className="text-2xl font-bold">{v.fullName}</h1>
        <p className="text-[var(--muted)]">
          {v.company} · kode <span className="font-mono">{formatVisitCode(v.code)}</span>
        </p>
      </div>

      <Card>
        <h2 className="mb-2 font-bold">Status induksi</h2>
        <ul className="space-y-1">
          <Check ok>Biodata terisi &amp; persetujuan data pribadi ({formatDateTime(v.consentAt)})</Check>
          <Check ok={videoOk}>
            {v.inductionSkipped
              ? "Video dilewati — induksi sebelumnya masih berlaku"
              : v.videoCompletedAt
                ? `Video selesai ditonton (${formatDateTime(v.videoCompletedAt)})`
                : "Video belum selesai"}
          </Check>
          <Check ok={quizOk}>
            {v.inductionSkipped
              ? `Kuis dilewati — berlaku sampai ${v.visitor.inductionValidUntil ? formatDate(v.visitor.inductionValidUntil) : "—"}`
              : v.quizPassedAt
                ? `Kuis lulus, nilai ${v.quizBestPercent}% (${v.attempts.length}× percobaan)`
                : "Kuis belum lulus"}
          </Check>
        </ul>
        {v.commitmentText ? (
          <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Komitmen pengunjung</p>
            <p className="whitespace-pre-wrap">{v.commitmentText}</p>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-1 font-bold">Data kunjungan</h2>
          <dl>
            <Row label="Tujuan">{v.purpose}</Row>
            <Row label="Bertemu">{v.hostName}</Row>
            <Row label="Departemen">{v.department}</Row>
            <Row label="Tanggal">{formatDate(v.visitDate)}</Row>
            <Row label="Lama">{v.durationDays} hari</Row>
            <Row label="Kendaraan">{v.vehiclePlate}</Row>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-1 font-bold">Kontak</h2>
          <dl>
            <Row label="HP">{v.phone}</Row>
            <Row label="Kontak darurat">{v.emergencyName}</Row>
            <Row label="HP darurat">{v.emergencyPhone}</Row>
          </dl>
        </Card>
      </div>

      {v.status === "WAITING_SECURITY" || v.status === "VIDEO" || v.status === "QUIZ" ? (
        <DecisionForms visitId={v.id} canApprove={v.status === "WAITING_SECURITY"} />
      ) : null}

      {v.status === "APPROVED" ? (
        <Card className="border-green-300 bg-green-50">
          <p className="font-bold text-green-900">
            Disetujui oleh {v.decidedBy?.name ?? "—"} · {v.decidedAt ? formatDateTime(v.decidedAt) : ""}
            {v.stickerNumber ? ` · stiker ${v.stickerNumber}` : ""}
          </p>
          <form action={checkoutVisitAction.bind(null, v.id)} className="mt-3">
            <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-green-700">
              Catat pengunjung keluar
            </button>
          </form>
        </Card>
      ) : null}

      {v.status === "REJECTED" ? (
        <Card className="border-red-300 bg-red-50">
          <p className="font-bold text-red-900">Ditolak oleh {v.decidedBy?.name ?? "—"}</p>
          <p className="text-sm text-red-900">{v.rejectedReason}</p>
        </Card>
      ) : null}

      {v.status === "CHECKED_OUT" ? (
        <Card>
          <p className="font-medium">Keluar {v.checkedOutAt ? formatDateTime(v.checkedOutAt) : ""}</p>
          <p className="text-sm text-[var(--muted)]">
            Disetujui oleh {v.decidedBy?.name ?? "—"}{v.stickerNumber ? ` · stiker ${v.stickerNumber}` : ""}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
