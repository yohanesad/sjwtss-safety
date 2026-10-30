import { describe, expect, it } from "vitest";
import {
  brandCssVars, contrastWithWhite, F, FIELD_KEYS, fill, GROUPS, mix, parsePurposes, sniffImageType, validateField,
} from "@/lib/content-fields";
import { parseYouTubeId } from "@/lib/video";

const v = (k: string, raw: string) => validateField(k, raw, parseYouTubeId);

describe("registri kolom", () => {
  it("setiap kolom masuk grup yang ada dan punya bawaan", () => {
    const groups = new Set(GROUPS.map((g) => g.id));
    for (const k of FIELD_KEYS) {
      expect(groups.has(F[k].group)).toBe(true);
      expect(typeof F[k].default()).toBe("string");
    }
  });
  it("bawaan semua kolom lolos validasinya sendiri", () => {
    for (const k of FIELD_KEYS) {
      const def = F[k].default();
      if (def) expect(v(k, def), k).toBeNull();
    }
  });
});

describe("validasi", () => {
  it("nilai kosong = bawaan = sah", () => expect(v("homeTitle", "  ")).toBeNull());
  it("warna: format, dan terlalu terang ditolak", () => {
    expect(v("brandColor", "#0057b8")).toBeNull();
    expect(v("brandColor", "red")).toMatch(/tidak sah/);
    expect(v("brandColor", "#ffff00")).toMatch(/terlalu terang/);
    expect(v("brandColor", "#d6212a;background:url(x)")).toMatch(/tidak sah/);
  });
  it("angka: batas dan bilangan bulat", () => {
    expect(v("passPercent", "100")).toBeNull();
    expect(v("passPercent", "101")).toMatch(/bilangan bulat/);
    expect(v("videoSeconds", "232")).toBeNull();
    expect(v("videoSeconds", "3.5")).toMatch(/bilangan bulat/);
  });
  it("tautan YouTube dan alamat MP4", () => {
    expect(v("videoYoutube", "https://youtu.be/4sUxKaVpqVc?si=x")).toBeNull();
    expect(v("videoYoutube", "bukan tautan")).toMatch(/tidak dikenali/);
    expect(v("videoSrc", "/videos/a.mp4")).toBeNull();
    expect(v("videoSrc", "javascript:alert(1)")).toMatch(/harus diawali/);
  });
  it("daftar tujuan: 1–12 baris", () => {
    expect(v("purposes", "A\nB")).toBeNull();
    expect(v("purposes", Array.from({ length: 13 }, (_, i) => `P${i}`).join("\n"))).toMatch(/1–12/);
    expect(parsePurposes(" A \n\n B ")).toEqual(["A", "B"]);
  });
  it("teks terlalu panjang ditolak", () => {
    expect(v("homeTitle", "x".repeat(301))).toMatch(/maksimal/);
  });
});

describe("warna turunan", () => {
  it("mix mencampur ke arah target", () => {
    expect(mix("#000000", [255, 255, 255], 0.5)).toBe("#808080");
  });
  it("merah bawaan cukup kontras dengan putih", () => {
    expect(contrastWithWhite("#d6212a")).toBeGreaterThan(4.5);
  });
  it("menghasilkan lima variabel CSS", () => {
    expect(brandCssVars("#d6212a").split(";")).toHaveLength(5);
  });
});

describe("fill", () => {
  it("mengganti token yang dikenal, membiarkan yang lain", () => {
    expect(fill("Nilai {skor}% dari {nilai}% {x}", { skor: 80, nilai: 100 })).toBe("Nilai 80% dari 100% {x}");
  });
});

describe("sniffImageType", () => {
  it("mengenali PNG/JPEG/WebP dan menolak SVG & teks", () => {
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
  });
});
