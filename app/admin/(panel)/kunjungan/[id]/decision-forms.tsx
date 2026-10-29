"use client";

import { useActionState } from "react";
import { Card, Field, FormError, inputClass, primaryButton } from "@/components/ui";
import { approveVisitAction, rejectVisitAction, type FormState } from "../../../actions";

export default function DecisionForms({ visitId, canApprove }: { visitId: string; canApprove: boolean }) {
  const [approve, approveAction, approving] = useActionState<FormState, FormData>(
    approveVisitAction.bind(null, visitId),
    {},
  );
  const [reject, rejectAction, rejecting] = useActionState<FormState, FormData>(
    rejectVisitAction.bind(null, visitId),
    {},
  );

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-bold">Setujui &amp; beri stiker</h2>
        {canApprove ? (
          <form action={approveAction} className="space-y-3">
            <FormError message={approve.error} />
            <Field label="Nomor stiker (opsional)" hint="Catat nomor pada stiker yang diberikan.">
              <input name="stickerNumber" className={inputClass} />
            </Field>
            <p className="text-sm text-[var(--muted)]">
              Pastikan identitas sesuai dengan data di atas sebelum menyetujui.
            </p>
            <button disabled={approving} className={primaryButton}>
              {approving ? "Menyimpan…" : "Setujui"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--muted)]">Pengunjung belum menyelesaikan video &amp; kuis.</p>
        )}
      </Card>
      <Card>
        <h2 className="mb-3 font-bold">Tolak</h2>
        <form action={rejectAction} className="space-y-3">
          <FormError message={reject.error} />
          <Field label="Alasan">
            <textarea name="reason" rows={3} required className={inputClass} />
          </Field>
          <button disabled={rejecting} className="w-full rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-base font-semibold text-red-900 disabled:opacity-50">
            Tolak kunjungan
          </button>
        </form>
      </Card>
    </div>
  );
}
