"use client";

import { useActionState } from "react";
import { FormError, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { saveContentAction, type ContentState } from "../../actions";
import type { GroupId } from "@/lib/content-fields";

interface FieldView {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "textarea" | "number" | "color" | "select";
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  value: string;
  defaultValue: string;
  changed: boolean;
}

export default function ContentGroupForm({ group, fields }: { group: GroupId; fields: FieldView[] }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveContentAction.bind(null, group), {});

  return (
    <form action={action} className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={`${group}-${f.key}`} className="mb-1 flex items-center gap-2 text-sm font-semibold">
            {f.label}
            {f.changed ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">diubah</span>
            ) : null}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={`${group}-${f.key}`}
              name={f.key}
              rows={f.key === "purposes" ? 6 : 3}
              defaultValue={f.value}
              placeholder={f.defaultValue}
              className={inputClass}
            />
          ) : f.type === "select" ? (
            <select id={`${group}-${f.key}`} name={f.key} defaultValue={f.value} className={inputClass}>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "color" ? (
            <input
              id={`${group}-${f.key}`}
              name={f.key}
              type="color"
              defaultValue={f.value}
              className="h-12 w-24 cursor-pointer rounded-lg border border-[var(--border)] bg-white p-1"
            />
          ) : (
            <input
              id={`${group}-${f.key}`}
              name={f.key}
              type={f.type === "number" ? "number" : "text"}
              inputMode={f.type === "number" ? "numeric" : undefined}
              min={f.min}
              max={f.max}
              defaultValue={f.value}
              placeholder={f.defaultValue}
              className={inputClass}
            />
          )}
          {f.hint ? <p className="mt-1 text-xs text-[var(--muted)]">{f.hint}</p> : null}
        </div>
      ))}

      {state.group === group ? <FormError message={state.error} /> : null}
      {state.group === group && state.ok ? (
        <p role="status" className="text-sm font-medium text-green-700">
          {state.ok}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className={`${primaryButton} !w-auto`}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <button name="intent" value="reset" disabled={pending} className={secondaryButton}>
          Kembalikan semua ke bawaan
        </button>
      </div>
    </form>
  );
}
