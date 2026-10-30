import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { getContent } from "@/lib/content";
import { logoutAction } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const c = await getContent();
  return (
    <div className="min-h-screen">
      <header className="no-print bg-brand-600 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.logoSrc} alt="Logo" className="h-8 w-auto max-w-40 object-contain" />
            Panel Security
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin" className="hover:underline">Kunjungan</Link>
            <Link href="/admin/poster" className="hover:underline">Poster QR</Link>
            {user.role === "ADMIN" ? (
              <>
                <Link href="/admin/soal" className="hover:underline">Soal</Link>
                <Link href="/admin/konten" className="hover:underline">Konten</Link>
                <Link href="/admin/pengguna" className="hover:underline">Pengguna</Link>
              </>
            ) : null}
          </nav>
          <form action={logoutAction} className="ml-auto flex items-center gap-3 text-sm">
            <span className="opacity-80">{user.name}</span>
            <button className="underline">Keluar</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
