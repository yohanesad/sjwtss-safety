import { Intro, VisitorShell } from "@/components/ui";
import { todayJakarta } from "@/lib/format";
import { PURPOSES } from "@/lib/visit";
import BiodataForm from "./biodata-form";

// Tanggal "hari ini" harus dihitung per request, bukan dibekukan saat build.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <VisitorShell title="Induksi Keselamatan" step={{ current: 1, total: 4, label: "Data diri" }}>
      <Intro>
        Keselamatan seluruh pengunjung adalah hal terpenting di pabrik kami. Isi data diri singkat, tonton
        video induksi, jawab pertanyaan, lalu temui security untuk mendapatkan stiker pass.
      </Intro>
      <BiodataForm today={todayJakarta()} purposes={[...PURPOSES]} />
    </VisitorShell>
  );
}
