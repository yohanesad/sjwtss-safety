import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const primaryButton =
  "inline-flex w-full items-center justify-center rounded-xl bg-brand-500 px-5 py-3.5 text-base font-semibold text-ink shadow-sm transition-colors hover:bg-brand-600 active:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50 disabled:opacity-50";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  );
}

/** Kerangka halaman pengunjung: lebar ponsel, header jelas. */
export function VisitorShell({
  step,
  children,
}: {
  step?: { current: number; total: number; label: string };
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-12 pt-6">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold">
            !
          </span>
          <div>
            <p className="text-base font-bold leading-tight">Induksi Keselamatan</p>
            <p className="text-xs text-[var(--muted)]">Wajib diselesaikan sebelum masuk area pabrik</p>
          </div>
        </div>
        {step ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-medium text-[var(--muted)]">
              <span>
                Langkah {step.current} dari {step.total}
              </span>
              <span>{step.label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${(step.current / step.total) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </header>
      {children}
    </main>
  );
}
