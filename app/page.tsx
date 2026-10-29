import { VisitorShell } from "@/components/ui";
import { todayJakarta } from "@/lib/format";
import { PURPOSES } from "@/lib/visit";
import BiodataForm from "./biodata-form";

// Tanggal "hari ini" harus dihitung per request, bukan dibekukan saat build.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <VisitorShell step={{ current: 1, total: 4, label: "Data diri" }}>
      <h1 className="text-xl font-bold">Selamat datang</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--muted)]">
        Isi data diri singkat di bawah ini. Setelah itu Anda akan menonton video
        induksi keselamatan, menjawab pertanyaan, lalu menemui security.
      </p>
      <BiodataForm today={todayJakarta()} purposes={[...PURPOSES]} />
    </VisitorShell>
  );
}
