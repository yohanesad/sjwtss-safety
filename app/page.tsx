import { Intro } from "@/components/ui";
import { VisitorShell } from "@/components/visitor-shell";
import { getContent } from "@/lib/content";
import { todayJakarta } from "@/lib/format";
import BiodataForm from "./biodata-form";

// Tanggal "hari ini" dan konten situs harus dibaca per request, bukan dibekukan saat build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const c = await getContent();
  return (
    <VisitorShell title={c.v.homeTitle} step={{ current: 1, total: 4, label: c.v.stepLabel1 }}>
      <Intro>{c.v.homeIntro}</Intro>
      <BiodataForm today={todayJakarta()} purposes={c.purposes} t={c.v} />
    </VisitorShell>
  );
}
