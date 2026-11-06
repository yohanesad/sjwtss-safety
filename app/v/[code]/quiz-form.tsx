"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, FormError, inputClass, primaryButton } from "@/components/ui";
import { submitQuizAction, type FormState } from "@/app/actions";
import type { Content } from "@/lib/content";

interface QuestionView {
  id: string;
  text: string;
  options: { label: string; index: number }[];
  /** null = percobaan pertama. "correct" dikunci; "wrong" harus dijawab ulang. */
  state: "correct" | "wrong" | null;
  /** Pilihan pengunjung pada percobaan sebelumnya. */
  chosen: number | null;
}

export default function QuizForm({
  code,
  questions,
  t,
  draft,
}: {
  code: string;
  questions: QuestionView[];
  t: Content["v"];
  draft: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitQuizAction.bind(null, code), {});

  return (
    <form action={action} className="space-y-4">
      {questions.map((q, i) => {
        const locked = q.state === "correct";
        const wrong = q.state === "wrong";
        return (
          <Card
            key={q.id}
            className={locked ? "!border-green-400 !bg-green-50" : wrong ? "!border-red-400 !bg-red-50" : ""}
          >
            <fieldset>
              <legend className="mb-3 text-base font-semibold">
                <span className="mr-1 text-[var(--muted)]">{i + 1}.</span>
                {q.text}
              </legend>
              {locked ? (
                <p className="mb-2 text-sm font-bold text-green-700">✓ {t.quizCorrectLabel}</p>
              ) : wrong ? (
                <p className="mb-2 text-sm font-bold text-red-700">✗ {t.quizWrongLabel}</p>
              ) : null}
              <div className="space-y-2">
                {q.options.map((o) => {
                  const wasWrongChoice = wrong && q.chosen === o.index;
                  return (
                    <label
                      key={o.index}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${
                        locked
                          ? "cursor-default border-green-300 bg-white has-[:checked]:border-green-600 has-[:checked]:bg-green-100"
                          : wasWrongChoice
                            ? "cursor-pointer border-red-400 bg-red-100 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                            : "cursor-pointer border-[var(--border)] has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={o.index}
                        required
                        // Soal yang sudah benar: jawabannya tetap terpilih dan terkirim, pilihan lain dikunci.
                        defaultChecked={locked && q.chosen === o.index}
                        disabled={locked && q.chosen !== o.index}
                        className={`mt-1 h-5 w-5 shrink-0 ${locked ? "accent-green-600" : "accent-red-600"}`}
                      />
                      <span className="text-base">
                        {o.label}
                        {wasWrongChoice ? <span className="ml-2 text-xs font-bold text-red-700">(jawaban sebelumnya)</span> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>
        );
      })}

      <Card>
        <label className="block">
          <span className="mb-2 block text-base font-semibold">{t.commitmentLabel}</span>
          <span className="mb-2 block text-sm text-[var(--muted)]">{t.commitmentPrompt}</span>
          <textarea name="commitment" required minLength={20} maxLength={1000} rows={4} defaultValue={draft} className={inputClass} />
        </label>
      </Card>

      <FormError message={state.error} />
      <SubmitButton t={t} />
    </form>
  );
}

function SubmitButton({ t }: { t: Content["v"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? t.buttonChecking : t.buttonSubmitQuiz}
    </button>
  );
}
