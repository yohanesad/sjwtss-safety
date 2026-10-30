import { getContent } from "@/lib/content";
import { getOrigin } from "@/lib/origin";
import { qrSvg } from "@/lib/qr";

export const metadata = { title: "Poster QR · Panel Security" };
export const dynamic = "force-dynamic";

export default async function PosterPage() {
  const c = await getContent();
  const origin = await getOrigin();
  const svg = await qrSvg(origin);
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="no-print mb-4 text-sm text-[var(--muted)]">
        Cetak halaman ini (Ctrl/Cmd+P) dan tempel di pos security.
      </p>
      <div className="rounded-3xl border-4 border-dashed border-brand-600 bg-white p-8">
        <h1 className="text-3xl font-extrabold text-brand-600">{c.v.posterTitle}</h1>
        <p className="mt-2 text-lg">{c.v.posterSubtitle}</p>
        <div
          className="mx-auto my-6 w-72 max-w-full [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="text-base font-semibold">{c.v.posterNote}</p>
        <p className="mt-1 break-all text-sm text-[var(--muted)]">{origin}</p>
      </div>
      <p className="no-print mt-4 text-xs text-[var(--muted)]">
        Alamat di QR: {origin}. Untuk domain tetap, isi APP_URL di .env.
      </p>
    </div>
  );
}
