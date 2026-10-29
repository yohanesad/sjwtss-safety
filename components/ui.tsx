import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

export const primaryButton =
  "inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-brand-700 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50";

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

/** Panel merah berisi teks putih, untuk pengantar tiap langkah. */
export function Intro({ children }: { children: ReactNode }) {
  return <div className="mb-4 bg-brand-600 px-4 py-4 text-base leading-snug text-white">{children}</div>;
}

/**
 * Kerangka halaman pengunjung: pita merah di atas, banner judul putih,
 * isi dalam bingkai merah putus-putus, footer abu-abu.
 */
export function VisitorShell({
  title,
  step,
  children,
}: {
  title: string;
  step?: { current: number; total: number; label: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <header className="bg-brand-600 px-4 pb-10 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-white text-2xl font-extrabold leading-none">
              !
            </span>
            <span className="text-2xl font-extrabold leading-none tracking-tight">Safety</span>
          </div>
          <span className="text-lg font-bold italic">Keselamatan Utama</span>
        </div>
      </header>

      <div className="-mt-7 px-4">
        <h1 className="mx-auto border-2 border-brand-600 bg-white px-3 py-2 text-center text-3xl font-extrabold leading-tight text-brand-600 shadow-[0_3px_0_rgba(0,0,0,0.18)]">
          {title}
        </h1>
      </div>

      <main className="flex-1 px-4 pb-6 pt-5">
        <div className="rounded-xl border-2 border-dashed border-brand-600 p-3">
          {step ? (
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm font-bold text-brand-600">
                <span>
                  Langkah {step.current} dari {step.total}
                </span>
                <span>{step.label}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: step.total }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < step.current ? "bg-brand-600" : "bg-neutral-200"}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {children}
        </div>
        <p className="mx-auto mt-4 w-fit bg-brand-600 px-4 py-2 text-center text-sm font-bold italic text-white">
          Wajib diselesaikan sebelum masuk area pabrik
        </p>
      </main>

      <footer className="bg-neutral-400 px-4 py-4 text-center text-xs font-bold text-white">
        Ada kendala? Hubungi security di pos jaga.
      </footer>
    </div>
  );
}
