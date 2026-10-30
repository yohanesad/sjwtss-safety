import { prisma } from "@/lib/db";

/** Logo unggahan admin. URL memuat ?v=<waktu ubah>, jadi aman di-cache lama. */
export async function GET() {
  const asset = await prisma.siteAsset.findUnique({ where: { key: "logo" } });
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
