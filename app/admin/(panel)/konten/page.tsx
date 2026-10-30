import { Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/auth/guard";
import { getContent } from "@/lib/content";
import { fieldsOfGroup, GROUPS } from "@/lib/content-fields";
import { resetLogoAction } from "../../actions";
import ContentGroupForm from "./content-form";
import LogoForm from "./logo-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Konten · Panel Security" };

export default async function ContentPage() {
  await requireAdminPage();
  const c = await getContent();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Konten situs</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Ubah teks, warna, logo, dan pengaturan video atau kuis tanpa mengubah kode. Perubahan langsung berlaku
          untuk pengunjung berikutnya. Kosongkan kolom lalu simpan untuk kembali ke teks bawaan.{" "}
          <a href="/" target="_blank" rel="noreferrer" className="underline">
            Buka halaman pengunjung
          </a>{" "}
          di tab baru untuk memeriksa hasilnya.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Logo</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Logo tampil di header berwarna, jadi paling baik berwarna putih dengan latar transparan (PNG).
          Maksimal 400 KB. Format PNG, JPEG, atau WebP.
        </p>
        <div className="mb-3 inline-block rounded-lg bg-brand-600 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logoSrc} alt="Logo saat ini" className="h-11 w-auto max-w-60 object-contain" />
        </div>
        <LogoForm />
        {c.hasCustomLogo ? (
          <form action={resetLogoAction} className="mt-2">
            <button className="text-sm underline">Kembalikan logo bawaan</button>
          </form>
        ) : null}
      </Card>

      {GROUPS.map((g, i) => (
        <details key={g.id} open={i === 0} className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <summary className="cursor-pointer select-none px-5 py-4 text-lg font-bold">{g.title}</summary>
          <div className="border-t border-[var(--border)] px-5 py-4">
            <ContentGroupForm
              group={g.id}
              fields={fieldsOfGroup(g.id).map(({ key, def }) => ({
                key,
                label: def.label,
                hint: def.hint,
                type: def.type,
                min: def.min,
                max: def.max,
                options: def.options,
                value: c.v[key],
                defaultValue: def.default(),
                changed: c.overridden.has(key),
              }))}
            />
          </div>
        </details>
      ))}
    </div>
  );
}
