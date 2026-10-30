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
}

export default function QuizForm({
  code,
  questions,
  t,
}: {
  code: string;
  questions: QuestionView[];
  t: Content["v"];
}) {
  const [state, action] = useActionState<FormState, FormData>(submitQuizAction.bind(null, code), {});

  return (
    <form action={action} className="space-y-4">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <fieldset>
            <legend className="mb-3 text-base font-semibold">
              <span className="mr-1 text-[var(--muted)]">{i + 1}.</span>
              {q.text}
            </legend>
            <div className="space-y-2">
              {q.options.map((o) => (
                <label
                  key={o.index}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={o.index}
                    required
                    className="mt-1 h-5 w-5 shrink-0 accent-red-600"
                  />
                  <span className="text-base">{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      ))}

      <Card>
        <label className="block">
          <span className="mb-2 block text-base font-semibold">{t.commitmentLabel}</span>
          <span className="mb-2 block text-sm text-[var(--muted)]">{t.commitmentPrompt}</span>
          <textarea name="commitment" required minLength={20} maxLength={1000} rows={4} className={inputClass} />
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
