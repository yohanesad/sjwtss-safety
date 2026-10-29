import { notFound } from "next/navigation";
import { Card, VisitorShell } from "@/components/ui";
import { prisma } from "@/lib/db";
import { induction } from "@/lib/env";
import { formatDate, formatDateLocal, formatDateTime } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { qrSvg } from "@/lib/qr";
import { COMMITMENT_PROMPT, formatVisitCode, normalizeVisitCode, shuffle } from "@/lib/visit";
import AutoRefresh from "./auto-refresh";
import QuizForm from "./quiz-form";
import VideoPlayer from "./video-player";

export const dynamic = "force-dynamic";
export const metadata = { title: "Induksi Keselamatan" };

export default async function VisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ gagal?: string }>;
}) {
  const { code: rawCode } = await params;
  const { gagal } = await searchParams;
  const code = normalizeVisitCode(rawCode);
  const visit = await prisma.visit.findUnique({ where: { code }, include: { visitor: true } });
  if (!visit) notFound();

  if (visit.status === "VIDEO") {
    return (
      <VisitorShell step={{ current: 2, total: 4, label: "Video induksi" }}>
        <h1 className="text-xl font-bold">Tonton video induksi</h1>
        <p className="mb-4 mt-1 text-sm text-[var(--muted)]">
          Putar video sampai selesai. Video tidak bisa dipercepat atau dilompati. Gunakan suara; teks
          bahasa Inggris tersedia lewat tombol CC.
        </p>
        <VideoPlayer
          code={code}
          src={induction.videoSrc}
          subtitleSrc={induction.subtitleSrc}
        />
      </VisitorShell>
    );
  }

  if (visit.status === "QUIZ") {
    const questions = await prisma.question.findMany({
      where: { active: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    // Soal & pilihan diacak; jawaban benar tidak ikut dikirim ke browser.
    const view = shuffle(questions).map((q) => ({
      id: q.id,
      text: q.text,
      options: shuffle(q.options.map((label, index) => ({ label, index }))),
    }));
    return (
      <VisitorShell step={{ current: 3, total: 4, label: "Pertanyaan" }}>
        <h1 className="text-xl font-bold">Jawab pertanyaan</h1>
        <p className="mb-4 mt-1 text-sm text-[var(--muted)]">
          Nilai minimal {induction.passPercent}% untuk lulus. Anda boleh mengulang bila belum lulus.
        </p>
        {gagal ? (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Nilai Anda {Number(gagal) || 0}%, belum mencapai {induction.passPercent}%. Silakan coba lagi.
          </div>
        ) : null}
        <QuizForm code={code} questions={view} commitmentPrompt={COMMITMENT_PROMPT} />
      </VisitorShell>
    );
  }

  if (visit.status === "WAITING_SECURITY") {
    const origin = await getOrigin();
    const svg = await qrSvg(`${origin}/admin/kode/${code}`);
    return (
      <VisitorShell step={{ current: 4, total: 4, label: "Konfirmasi security" }}>
        <AutoRefresh seconds={5} />
        <h1 className="text-xl font-bold">Hampir selesai</h1>
        <p className="mb-4 mt-1 text-sm text-[var(--muted)]">
          {visit.inductionSkipped
            ? `Induksi Anda masih berlaku sampai ${formatDateLocal(visit.visitor.inductionValidUntil!)}. `
            : "Induksi Anda sudah selesai. "}
          <strong>Tunjukkan layar ini kepada security</strong> untuk konfirmasi dan mengambil stiker pass.
        </p>
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Kode kunjungan</p>
          <p className="my-2 font-mono text-4xl font-extrabold tracking-wider">{formatVisitCode(code)}</p>
          <div
            className="mx-auto my-3 w-56 max-w-full [&>svg]:h-auto [&>svg]:w-full"
            aria-label="QR kode kunjungan"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="font-semibold">{visit.fullName}</p>
          <p className="text-sm text-[var(--muted)]">{visit.company}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">Halaman ini diperbarui otomatis setelah security menyetujui.</p>
        </Card>
      </VisitorShell>
    );
  }

  if (visit.status === "APPROVED") {
    return (
      <VisitorShell>
        <Card className="border-green-300 bg-green-50 text-center">
          <p className="text-5xl">✅</p>
          <h1 className="mt-2 text-xl font-bold text-green-900">Disetujui</h1>
          <p className="mt-1 text-sm text-green-900">
            Ambil stiker pass pengunjung dari security dan tempelkan di pakaian Anda.
          </p>
          {visit.stickerNumber ? (
            <p className="mt-4 text-sm">
              Nomor stiker: <strong className="font-mono text-lg">{visit.stickerNumber}</strong>
            </p>
          ) : null}
          <p className="mt-3 text-xs text-green-900/80">
            Berlaku {formatDate(visit.visitDate)} · {visit.durationDays} hari
          </p>
        </Card>
      </VisitorShell>
    );
  }

  if (visit.status === "REJECTED") {
    return (
      <VisitorShell>
        <Card className="border-red-300 bg-red-50 text-center">
          <h1 className="text-xl font-bold text-red-900">Belum dapat masuk</h1>
          <p className="mt-2 text-sm text-red-900">
            {visit.rejectedReason || "Silakan hubungi security untuk penjelasan."}
          </p>
        </Card>
      </VisitorShell>
    );
  }

  return (
    <VisitorShell>
      <Card className="text-center">
        <h1 className="text-xl font-bold">Terima kasih</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Kunjungan Anda telah selesai
          {visit.checkedOutAt ? ` (keluar ${formatDateTime(visit.checkedOutAt)})` : ""}. Hati-hati di jalan.
        </p>
      </Card>
    </VisitorShell>
  );
}
