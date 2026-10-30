import { cache } from "react";
import { prisma } from "@/lib/db";
import { induction as envDefaults } from "@/lib/env";
import { parseYouTubeId } from "@/lib/video";
import {
  brandCssVars, DEFAULT_PURPOSES, F, FIELD_KEYS, parsePurposes, validateField, type FieldKey,
} from "@/lib/content-fields";

export interface Content {
  /** Nilai akhir tiap kolom: perubahan admin, atau bawaan. */
  v: Record<FieldKey, string>;
  /** Kolom yang sedang diubah dari bawaan. */
  overridden: Set<FieldKey>;
  purposes: string[];
  /** Isi tag <style> untuk warna utama. */
  brandStyle: string;
  /** Alamat logo yang dipakai halaman. */
  logoSrc: string;
  hasCustomLogo: boolean;
}

const DEFAULT_LOGO = "/logo-putih.png";

function defaults(): Record<FieldKey, string> {
  return Object.fromEntries(FIELD_KEYS.map((k) => [k, F[k].default()])) as Record<FieldKey, string>;
}

/**
 * Konten situs untuk satu request. Bila database bermasalah, halaman tetap
 * tampil dengan nilai bawaan daripada ikut gagal.
 */
export const getContent = cache(async (): Promise<Content> => {
  const v = defaults();
  const overridden = new Set<FieldKey>();
  let logoVersion: string | null = null;

  try {
    const [rows, logo] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.siteAsset.findUnique({ where: { key: "logo" }, select: { updatedAt: true } }),
    ]);
    for (const row of rows) {
      if (!(row.key in F)) continue;
      // Nilai tersimpan diperiksa lagi saat dibaca: baris yang rusak diabaikan.
      if (validateField(row.key, row.value, parseYouTubeId) !== null) continue;
      v[row.key as FieldKey] = row.value;
      overridden.add(row.key as FieldKey);
    }
    if (logo) logoVersion = String(logo.updatedAt.getTime());
  } catch (e) {
    console.error("Gagal membaca konten situs, memakai bawaan:", e);
  }

  const purposes = parsePurposes(v.purposes);
  return {
    v,
    overridden,
    purposes: purposes.length ? purposes : DEFAULT_PURPOSES,
    brandStyle: `:root{${brandCssVars(v.brandColor)}}`,
    logoSrc: logoVersion ? `/logo?v=${logoVersion}` : DEFAULT_LOGO,
    hasCustomLogo: logoVersion !== null,
  };
});

/** Aturan induksi yang berlaku: pengaturan dari halaman Konten, lalu environment, lalu bawaan. */
export async function getInduction() {
  const { v } = await getContent();
  const youtubeId =
    v.videoMode === "youtube" ? (parseYouTubeId(v.videoYoutube) ?? envDefaults.youtube) : null;
  return {
    youtubeId,
    videoSrc: v.videoSrc,
    videoSeconds: Number(v.videoSeconds),
    minWatchRatio: Number(v.videoMinPercent) / 100,
    passPercent: Number(v.passPercent),
    validDays: Number(v.validDays),
  };
}
