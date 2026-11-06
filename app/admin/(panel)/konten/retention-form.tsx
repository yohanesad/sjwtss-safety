"use client";

import { useActionState } from "react";
import { FormError, inputClass, secondaryButton } from "@/components/ui";
import { deleteOldPhotosAction, type ContentState } from "../../actions";

export default function RetentionForm({ photoCount, oldestDays }: { photoCount: number; oldestDays: number | null }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(deleteOldPhotosAction, {});
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Tersimpan {photoCount} foto pengunjung
        {oldestDays !== null ? `, yang tertua berumur ${oldestDays} hari` : ""}. Penghapusan tidak bisa dibatalkan.
      </p>
      <label htmlFor="days" className="block text-sm font-semibold">
        Hapus foto yang lebih tua dari (hari)
      </label>
      <input id="days" name="days" type="number" min={0} max={3650} defaultValue={90} className={`${inputClass} max-w-40`} />
      {state.group === "retensi" ? <FormError message={state.error} /> : null}
      {state.group === "retensi" && state.ok ? <p className="text-sm font-medium text-green-700">{state.ok}</p> : null}
      <button disabled={pending} className={secondaryButton}>
        {pending ? "Menghapus…" : "Hapus foto lama"}
      </button>
    </form>
  );
}
