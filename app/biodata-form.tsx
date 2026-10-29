"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, Field, FormError, inputClass, primaryButton } from "@/components/ui";
import { createVisitAction, type FormState } from "./actions";

export default function BiodataForm({ today, purposes }: { today: string; purposes: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(createVisitAction, {});

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">Data diri</h2>
        <Field label="Nama lengkap">
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Perusahaan / instansi">
          <input name="company" required autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Nomor HP (WhatsApp)">
          <input name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={inputClass} placeholder="08xx xxxx xxxx" />
        </Field>
        <Field label="Nomor kendaraan" hint="Kosongkan bila tidak membawa kendaraan.">
          <input name="vehiclePlate" autoCapitalize="characters" className={inputClass} placeholder="B 1234 XYZ" />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">Kunjungan</h2>
        <Field label="Tujuan kunjungan">
          <select name="purpose" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pilih tujuan…
            </option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bertemu siapa?">
          <input name="hostName" required className={inputClass} />
        </Field>
        <Field label="Departemen yang dituju (opsional)">
          <input name="department" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal">
            <input name="visitDate" type="date" required min={today} defaultValue={today} className={inputClass} />
          </Field>
          <Field label="Perkiraan lama (jam)" hint="Opsional, hanya perkiraan.">
            <input name="estimatedHours" type="number" inputMode="numeric" min={1} max={72} className={inputClass} placeholder="mis. 3" />
          </Field>
        </div>
      </Card>


      <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
        <input name="consent" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-red-600" />
        <span>
          Saya menyatakan data di atas benar dan menyetujui data pribadi saya dipakai untuk keperluan
          keselamatan dan pencatatan kunjungan pabrik.
        </span>
      </label>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Memproses…" : "Lanjut ke video induksi"}
    </button>
  );
}
