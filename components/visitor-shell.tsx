import type { ReactNode } from "react";
import { getContent } from "@/lib/content";

/**
 * Kerangka halaman pengunjung: pita merah di atas, banner judul putih,
 * isi dalam bingkai putus-putus, footer abu-abu. Semua teksnya dari halaman Konten.
 */
export async function VisitorShell({
  title,
  step,
  children,
}: {
  title: string;
  step?: { current: number; total: number; label: string };
  children: ReactNode;
}) {
  const c = await getContent();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <header className="bg-brand-600 px-4 pb-10 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logoSrc} alt="Logo" className="h-11 w-auto max-w-[55%] object-contain object-left" />
          <span className="text-right text-lg font-bold italic leading-tight">{c.v.headerTagline}</span>
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
              <div className="mb-1 flex justify-between gap-2 text-sm font-bold text-brand-600">
                <span>
                  Langkah {step.current} dari {step.total}
                </span>
                <span className="text-right">{step.label}</span>
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
        <p className="mx-auto mt-4 w-fit max-w-full bg-brand-600 px-4 py-2 text-center text-sm font-bold italic text-white">
          {c.v.bottomBanner}
        </p>
      </main>

      <footer className="bg-neutral-400 px-4 py-4 text-center text-xs font-bold text-white">{c.v.footerText}</footer>
    </div>
  );
}
