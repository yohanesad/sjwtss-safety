import { describe, expect, it } from "vitest";
import {
  addDays,
  formatVisitCode,
  generateVisitCode,
  gradeQuiz,
  hasWatchedLongEnough,
  isInductionValid,
  isPlausiblePhone,
  normalizePhone,
  normalizeVisitCode,
  shuffle,
} from "@/lib/visit";

describe("kode kunjungan", () => {
  it("10 karakter dari alfabet tanpa karakter ambigu", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateVisitCode()).toMatch(/^[2-9A-HJKMNP-Z]{10}$/);
    }
  });
  it("tidak menghasilkan kode yang sama berulang", () => {
    const set = new Set(Array.from({ length: 500 }, generateVisitCode));
    expect(set.size).toBe(500);
  });
  it("format dan normalisasi saling berbalik", () => {
    expect(formatVisitCode("K7M29QXPBT")).toBe("K7M29-QXPBT");
    expect(normalizeVisitCode(" k7m29-qxpbt ")).toBe("K7M29QXPBT");
  });
});

describe("nomor HP", () => {
  it("menyeragamkan format Indonesia", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizePhone("81234567890")).toBe("6281234567890");
  });
  it("membiarkan nomor luar negeri", () => {
    expect(normalizePhone("+65 9123 4567")).toBe("6591234567");
  });
  it("menolak nomor yang tidak masuk akal", () => {
    expect(isPlausiblePhone("123")).toBe(false);
    expect(isPlausiblePhone("08123456789")).toBe(true);
  });
});

describe("masa berlaku induksi", () => {
  const now = new Date("2026-10-29T00:00:00Z");
  it("berlaku sebelum tanggal habis, tidak sesudahnya", () => {
    expect(isInductionValid(addDays(now, 1), now)).toBe(true);
    expect(isInductionValid(addDays(now, -1), now)).toBe(false);
    expect(isInductionValid(null, now)).toBe(false);
  });
});

describe("durasi video", () => {
  const start = new Date("2026-10-29T00:00:00Z");
  it("menolak bila belum dimulai atau terlalu cepat", () => {
    expect(hasWatchedLongEnough(null, start, 240, 0.9)).toBe(false);
    expect(hasWatchedLongEnough(start, addDays(start, 0), 240, 0.9)).toBe(false);
    expect(hasWatchedLongEnough(start, new Date(start.getTime() + 215_000), 240, 0.9)).toBe(false);
  });
  it("menerima setelah 90% durasi", () => {
    expect(hasWatchedLongEnough(start, new Date(start.getTime() + 216_000), 240, 0.9)).toBe(true);
  });
});

describe("penilaian kuis", () => {
  const qs = Array.from({ length: 15 }, (_, i) => ({ id: `q${i}`, correctIndex: 1 }));
  it("lulus pada 12/15 (80%)", () => {
    const answers = Object.fromEntries(qs.map((q, i) => [q.id, i < 12 ? 1 : 0]));
    expect(gradeQuiz(qs, answers, 80)).toEqual({ correct: 12, total: 15, percent: 80, passed: true });
  });
  it("gagal pada 11/15", () => {
    const answers = Object.fromEntries(qs.map((q, i) => [q.id, i < 11 ? 1 : 0]));
    expect(gradeQuiz(qs, answers, 80).passed).toBe(false);
  });
  it("ambang 100%: satu salah saja tidak lulus", () => {
    const answers = Object.fromEntries(qs.map((q, i) => [q.id, i < 14 ? 1 : 0]));
    expect(gradeQuiz(qs, answers, 100).passed).toBe(false);
    expect(gradeQuiz(qs, Object.fromEntries(qs.map((q) => [q.id, 1])), 100).passed).toBe(true);
  });
  it("jawaban kosong dihitung salah; tanpa soal tidak pernah lulus", () => {
    expect(gradeQuiz(qs, {}, 80).correct).toBe(0);
    expect(gradeQuiz([], {}, 80).passed).toBe(false);
  });
});

describe("shuffle", () => {
  it("mempertahankan isi dan tidak mengubah array asli", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect([...out].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});

import { parseYouTubeId } from "@/lib/video";

describe("parseYouTubeId", () => {
  it("mengenali tautan pendek beserta parameter si", () => {
    expect(parseYouTubeId("https://youtu.be/4sUxKaVpqVc?si=Jz3dqGAZCyTEGo27")).toBe("4sUxKaVpqVc");
  });
  it("mengenali watch, embed, shorts, dan ID polos", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=4sUxKaVpqVc&t=3")).toBe("4sUxKaVpqVc");
    expect(parseYouTubeId("https://www.youtube.com/embed/4sUxKaVpqVc")).toBe("4sUxKaVpqVc");
    expect(parseYouTubeId("https://youtube.com/shorts/4sUxKaVpqVc")).toBe("4sUxKaVpqVc");
    expect(parseYouTubeId("4sUxKaVpqVc")).toBe("4sUxKaVpqVc");
  });
  it("menolak masukan lain", () => {
    expect(parseYouTubeId("")).toBeNull();
    expect(parseYouTubeId(undefined)).toBeNull();
    expect(parseYouTubeId("https://example.com/video.mp4")).toBeNull();
  });
});
