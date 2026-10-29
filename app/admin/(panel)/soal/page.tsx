import { Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { induction } from "@/lib/env";
import { deleteQuestionAction, toggleQuestionAction } from "../../actions";
import QuestionForm from "./question-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Soal · Panel Security" };

export default async function QuestionsPage() {
  await requireAdminPage();
  const questions = await prisma.question.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const activeCount = questions.filter((q) => q.active).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Soal pilihan ganda</h1>
        <p className="text-sm text-[var(--muted)]">
          {activeCount} soal aktif dari {questions.length}. Lulus bila ≥ {induction.passPercent}%.
          Rencana awal: 15 soal. Soal bawaan hanyalah contoh — ganti dengan soal sesuai aturan pabrik Anda.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Tambah soal</h2>
        <QuestionForm />
      </Card>

      {questions.map((q, i) => (
        <Card key={q.id} className={q.active ? "" : "opacity-60"}>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Soal #{i + 1} {q.active ? "" : "· NONAKTIF"}
          </p>
          <QuestionForm question={q} />
          <div className="mt-3 flex gap-3 text-sm">
            <form action={toggleQuestionAction.bind(null, q.id)}>
              <button className="underline">{q.active ? "Nonaktifkan" : "Aktifkan"}</button>
            </form>
            <form action={deleteQuestionAction.bind(null, q.id)}>
              <button className="text-red-700 underline">Hapus</button>
            </form>
          </div>
        </Card>
      ))}
    </div>
  );
}
