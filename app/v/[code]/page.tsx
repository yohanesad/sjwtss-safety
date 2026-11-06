import { notFound } from "next/navigation";
import { Card, Intro } from "@/components/ui";
import { VisitorShell } from "@/components/visitor-shell";
import { getContent, getInduction } from "@/lib/content";
import { prisma } from "@/lib/db";
import { fill } from "@/lib/content-fields";
import { formatDate, formatDateLocal, formatDateTime } from "@/lib/format";
import { getOrigin } from "@/lib/origin";
import { qrSvg } from "@/lib/qr";
import { formatVisitCode, normalizeVisitCode, shuffle } from "@/lib/visit";
import AutoRefresh from "./auto-refresh";
import PhotoCapture from "./photo-capture";
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

  const c = await getContent();
  const t = c.v;
  const ind = await getInduction();

  if (visit.status === "PHOTO") {
    return (
      <VisitorShell title={t.photoTitle} step={{ current: 2, total: 5, label: t.stepPhoto }}>
        <Intro>{t.photoIntro}</Intro>
        <PhotoCapture code={code} t={t} />
      </VisitorShell>
    );
  }

  if (visit.status === "VIDEO") {
    return (
      <VisitorShell title={t.videoTitle} step={{ current: 3, total: 5, label: t.stepVideo }}>
        <Intro>{t.videoIntro}</Intro>
        <VideoPlayer code={code} src={ind.videoSrc} youtubeId={ind.youtubeId} t={t} />
      </VisitorShell>
    );
  }

  if (visit.status === "QUIZ") {
    const questions = await prisma.question.findMany({
      where: { active: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    // Percobaan terakhir yang gagal: tandai tiap soal benar/salah agar pengunjung hanya memperbaiki yang salah.
    const last = await prisma.quizAttempt.findFirst({
      where: { visitId: visit.id },
      orderBy: { createdAt: "desc" },
    });
    const previous = (last?.answers ?? null) as Record<string, number> | null;
    const marked = questions.map((q) => {
      const chosen = previous?.[q.id];
      const state = typeof chosen !== "number" ? null : chosen === q.correctIndex ? ("correct" as const) : ("wrong" as const);
      return { q, chosen: typeof chosen === "number" ? chosen : null, state };
    });
    const wrongCount = marked.filter((m) => m.state === "wrong").length;
    const correctCount = marked.filter((m) => m.state === "correct").length;
    const retry = last !== null && wrongCount > 0;

    // Percobaan pertama: soal & pilihan diacak. Mengulang: urutan tetap, soal salah di atas.
    // Jawaban benar tidak pernah ikut dikirim ke browser; hanya status benar/salah soal yang pernah dijawab.
    const ordered = retry ? [...marked].sort((a, b) => Number(b.state === "wrong") - Number(a.state === "wrong")) : shuffle(marked);
    const view = ordered.map(({ q, chosen, state }) => {
      const opts = q.options.map((label, index) => ({ label, index }));
      return {
        id: q.id,
        text: q.text,
        options: retry ? opts : shuffle(opts),
        state: retry ? state : null,
        chosen: retry ? chosen : null,
      };
    });
    return (
      <VisitorShell title={t.quizTitle} step={{ current: 4, total: 5, label: t.stepQuiz }}>
        <Intro>{fill(t.quizIntro, { nilai: ind.passPercent })}</Intro>
        {retry || gagal ? (
          <div role="alert" className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {fill(t.quizFail, {
              skor: last?.percent ?? (Number(gagal) || 0),
              benar: correctCount,
              salah: wrongCount,
              nilai: ind.passPercent,
            })}
          </div>
        ) : null}
        <QuizForm key={last?.id ?? "baru"} code={code} questions={view} t={t} draft={visit.commitmentText ?? ""} />
      </VisitorShell>
    );
  }

  if (visit.status === "WAITING_SECURITY") {
    const origin = await getOrigin();
    const svg = await qrSvg(`${origin}/admin/kode/${code}`);
    const intro =
      visit.inductionSkipped && visit.visitor.inductionValidUntil
        ? fill(t.waitIntroSkipped, { tanggal: formatDateLocal(visit.visitor.inductionValidUntil) })
        : t.waitIntro;
    return (
      <VisitorShell title={t.waitTitle} step={{ current: 5, total: 5, label: t.stepConfirm }}>
        <AutoRefresh seconds={5} />
        <Intro>{intro}</Intro>
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.codeLabel}</p>
          <p className="my-2 font-mono text-4xl font-extrabold tracking-wider text-brand-600">{formatVisitCode(code)}</p>
          <div
            className="mx-auto my-3 w-56 max-w-full [&>svg]:h-auto [&>svg]:w-full"
            aria-label="QR kode kunjungan"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="font-semibold">{visit.fullName}</p>
          <p className="text-sm text-[var(--muted)]">{visit.company}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">{t.waitNote}</p>
        </Card>
      </VisitorShell>
    );
  }

  if (visit.status === "APPROVED") {
    return (
      <VisitorShell title={t.approvedTitle}>
        <Card className="border-green-300 bg-green-50 text-center">
          <p className="text-5xl">✅</p>
          <p className="mt-2 whitespace-pre-line text-sm text-green-900">{t.approvedText}</p>
          {visit.stickerNumber ? (
            <p className="mt-4 text-sm">
              {t.stickerLabel} <strong className="font-mono text-lg">{visit.stickerNumber}</strong>
            </p>
          ) : null}
          <p className="mt-3 text-xs text-green-900/80">
            {formatDate(visit.visitDate)}
            {visit.estimatedHours ? ` · perkiraan ${visit.estimatedHours} jam` : ""}
          </p>
        </Card>
      </VisitorShell>
    );
  }

  if (visit.status === "REJECTED") {
    return (
      <VisitorShell title={t.rejectedTitle}>
        <Card className="border-red-300 bg-red-50 text-center">
          <p className="whitespace-pre-line text-sm text-red-900">{visit.rejectedReason || t.rejectedDefault}</p>
        </Card>
      </VisitorShell>
    );
  }

  return (
    <VisitorShell title={t.doneTitle}>
      <Card className="text-center">
        <p className="whitespace-pre-line text-sm text-[var(--muted)]">
          {t.doneText}
          {visit.checkedOutAt ? ` (keluar ${formatDateTime(visit.checkedOutAt)})` : ""}
        </p>
      </Card>
    </VisitorShell>
  );
}
