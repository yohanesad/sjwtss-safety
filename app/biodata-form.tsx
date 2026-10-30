"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, Field, FormError, inputClass, primaryButton } from "@/components/ui";
import type { Content } from "@/lib/content";
import { createVisitAction, type FormState } from "./actions";

export default function BiodataForm({
  today,
  purposes,
  t,
}: {
  today: string;
  purposes: string[];
  t: Content["v"];
}) {
  const [state, action] = useActionState<FormState, FormData>(createVisitAction, {});

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">{t.sectionPerson}</h2>
        <Field label={t.labelFullName}>
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label={t.labelCompany}>
          <input name="company" required autoComplete="organization" className={inputClass} />
        </Field>
        <Field label={t.labelPhone}>
          <input name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={inputClass} placeholder="08xx xxxx xxxx" />
        </Field>
        <Field label={t.labelVehicle} hint={t.hintVehicle}>
          <input name="vehiclePlate" autoCapitalize="characters" className={inputClass} placeholder="B 1234 XYZ" />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">{t.sectionVisit}</h2>
        <Field label={t.labelPurpose}>
          <select name="purpose" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              {t.placeholderPurpose}
            </option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.labelHost}>
          <input name="hostName" required className={inputClass} />
        </Field>
        <Field label={t.labelDepartment}>
          <input name="department" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.labelDate}>
            <input name="visitDate" type="date" required min={today} defaultValue={today} className={inputClass} />
          </Field>
          <Field label={t.labelHours} hint={t.hintHours}>
            <input name="estimatedHours" type="number" inputMode="numeric" min={1} max={72} className={inputClass} placeholder="mis. 3" />
          </Field>
        </div>
      </Card>


      <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
        <input name="consent" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-red-600" />
        <span>{t.consentText}</span>
      </label>

      <FormError message={state.error} />
      <SubmitButton t={t} />
    </form>
  );
}

function SubmitButton({ t }: { t: Content["v"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Memproses…" : t.buttonStart}
    </button>
  );
}
