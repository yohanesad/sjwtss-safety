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
  return <div className="mb-4 whitespace-pre-line bg-brand-600 px-4 py-4 text-base leading-snug text-white">{children}</div>;
}
