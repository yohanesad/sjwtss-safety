import Link from "next/link";
import { Card, inputClass, secondaryButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, todayJakarta } from "@/lib/format";
import { formatVisitCode, normalizeVisitCode } from "@/lib/visit";
import type { VisitStatus } from "@/lib/generated/prisma/client";
import AutoRefresh from "@/app/v/[code]/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kunjungan · Panel Security" };

const STATUS_LABEL: Record<VisitStatus, string> = {
  VIDEO: "Menonton video",
  QUIZ: "Mengerjakan soal",
  WAITING_SECURITY: "Menunggu security",
  APPROVED: "Di lokasi",
  REJECTED: "Ditolak",
  CHECKED_OUT: "Sudah keluar",
};

const STATUS_STYLE: Record<VisitStatus, string> = {
  VIDEO: "bg-neutral-100 text-neutral-700",
  QUIZ: "bg-neutral-100 text-neutral-700",
  WAITING_SECURITY: "bg-amber-100 text-amber-900",
  APPROVED: "bg-green-100 text-green-900",
  REJECTED: "bg-red-100 text-red-900",
  CHECKED_OUT: "bg-neutral-100 text-neutral-600",
};

interface Row {
  id: string;
  code: string;
  fullName: string;
  company: string;
  hostName: string;
  status: VisitStatus;
  createdAt: Date;
  stickerNumber: string | null;
}

function VisitList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
        {title} <span className="font-normal">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--muted)]">{empty}</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/kunjungan/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-neutral-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.fullName}</span>
                  <span className="block truncate text-sm text-[var(--muted)]">
                    {r.company} → {r.hostName}
                  </span>
                </span>
                <span className="font-mono text-sm">{formatVisitCode(r.code)}</span>
                <span className="text-xs text-[var(--muted)]">{formatDateTime(r.createdAt)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                  {r.stickerNumber ? ` · ${r.stickerNumber}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600_000);
}

const select = {
  id: true, code: true, fullName: true, company: true, hostName: true,
  status: true, createdAt: true, stickerNumber: true,
} as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (query) {
    const rows = await prisma.visit.findMany({
      where: {
        OR: [
          { code: normalizeVisitCode(query) },
          { fullName: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { phone: { contains: query.replace(/\D/g, "") || "__" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select,
    });
    return (
      <div className="space-y-6">
        <SearchBar q={query} />
        <VisitList title={`Hasil pencarian "${query}"`} rows={rows} empty="Tidak ada kunjungan yang cocok." />
      </div>
    );
  }

  const today = todayJakarta();
  const [waiting, inProgress, onSite, recent] = await Promise.all([
    prisma.visit.findMany({ where: { status: "WAITING_SECURITY" }, orderBy: { createdAt: "asc" }, select }),
    prisma.visit.findMany({
      where: { status: { in: ["VIDEO", "QUIZ"] }, createdAt: { gt: hoursAgo(24) } },
      orderBy: { createdAt: "desc" },
      select,
    }),
    prisma.visit.findMany({ where: { status: "APPROVED" }, orderBy: { decidedAt: "desc" }, select }),
    prisma.visit.findMany({
      where: { status: { in: ["REJECTED", "CHECKED_OUT"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select,
    }),
  ]);

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={10} />
      <SearchBar q="" />
      <div className="flex flex-wrap items-center gap-3">
        <Card className="flex-1 !p-4">
          <p className="text-xs text-[var(--muted)]">Menunggu verifikasi</p>
          <p className="text-3xl font-extrabold">{waiting.length}</p>
        </Card>
        <Card className="flex-1 !p-4">
          <p className="text-xs text-[var(--muted)]">Sedang di lokasi</p>
          <p className="text-3xl font-extrabold">{onSite.length}</p>
        </Card>
        <Card className="flex-1 !p-4">
          <p className="text-xs text-[var(--muted)]">Proses induksi</p>
          <p className="text-3xl font-extrabold">{inProgress.length}</p>
        </Card>
        <a href={`/admin/export?from=${today}&to=${today}`} className={secondaryButton}>
          Unduh CSV hari ini
        </a>
      </div>
      <VisitList title="Menunggu verifikasi security" rows={waiting} empty="Tidak ada yang menunggu." />
      <VisitList title="Sedang di lokasi" rows={onSite} empty="Belum ada pengunjung di lokasi." />
      <VisitList title="Sedang menjalani induksi (24 jam)" rows={inProgress} empty="Tidak ada." />
      <VisitList title="Terakhir selesai / ditolak" rows={recent} empty="Belum ada." />
      <p className="text-xs text-[var(--muted)]">Halaman diperbarui otomatis tiap 10 detik. Tanggal: {formatDate(new Date(`${today}T00:00:00Z`))}.</p>
    </div>
  );
}

function SearchBar({ q }: { q: string }) {
  return (
    <form className="flex gap-2" action="/admin">
      <input name="q" defaultValue={q} placeholder="Cari kode, nama, perusahaan, atau nomor HP…" className={inputClass} />
      <button className={secondaryButton}>Cari</button>
    </form>
  );
}
