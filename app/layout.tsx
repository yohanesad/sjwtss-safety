import type { Metadata, Viewport } from "next";
import { getContent } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: "Induksi Keselamatan Pengunjung",
  description: "Induksi keselamatan online untuk pengunjung pabrik",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const c = await getContent();
  return (
    <html lang="id">
      <head>
        {/* Warna utama dari halaman Konten (sudah divalidasi sebagai #rrggbb). */}
        <style dangerouslySetInnerHTML={{ __html: c.brandStyle }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router: head di root layout berlaku untuk semua halaman, aturan lint ini khusus pages/ */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
