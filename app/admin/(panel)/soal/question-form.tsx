"use client";

import { useActionState } from "react";
import { Field, FormError, inputClass, secondaryButton } from "@/components/ui";
import { createQuestionAction, updateQuestionAction, type FormState } from "../../actions";

interface Q {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  position: number;
}

export default function QuestionForm({ question }: { question?: Q }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    question ? updateQuestionAction.bind(null, question.id) : createQuestionAction,
    {},
  );
  return (
    <form action={action} className="space-y-3" key={question ? undefined : state.ok}>
      <FormError message={state.error} />
      {state.ok ? <p className="text-sm text-green-700">{state.ok}</p> : null}
      <Field label="Pertanyaan">
        <textarea name="text" rows={2} required defaultValue={question?.text} className={inputClass} />
      </Field>
      <Field label="Pilihan jawaban (satu per baris, 2–6)">
        <textarea name="options" rows={4} required defaultValue={question?.options.join("\n")} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nomor jawaban benar" hint="Urutan baris di atas, mulai dari 1.">
          <input name="correct" type="number" min={1} max={6} required defaultValue={question ? question.correctIndex + 1 : 1} className={inputClass} />
        </Field>
        <Field label="Urutan tampil" hint="Soal diacak saat ditampilkan.">
          <input name="position" type="number" min={0} defaultValue={question?.position ?? 0} className={inputClass} />
        </Field>
      </div>
      <button disabled={pending} className={secondaryButton}>
        {pending ? "Menyimpan…" : question ? "Simpan perubahan" : "Tambah soal"}
      </button>
    </form>
  );
}
