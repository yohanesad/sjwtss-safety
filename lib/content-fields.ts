/**
 * Daftar semua teks dan pengaturan yang bisa diubah admin lewat halaman Konten,
 * beserta nilai bawaannya dan aturan validasinya. Logika murni (tanpa database).
 *
 * Nilai kosong berarti "pakai bawaan": baris di tabel SiteSetting dihapus.
 */

import { induction as envDefaults } from "./env";

export type FieldType = "text" | "textarea" | "number" | "color" | "select";

export interface FieldDef {
  group: GroupId;
  label: string;
  hint?: string;
  type: FieldType;
  /** Fungsi, karena sebagian bawaan dibaca dari environment saat dipanggil. */
  default: () => string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

export const GROUPS = [
  { id: "tampilan", title: "Tampilan, header, dan footer" },
  { id: "depan", title: "Halaman depan dan formulir" },
  { id: "video", title: "Video induksi" },
  { id: "kuis", title: "Pertanyaan (kuis)" },
  { id: "selesai", title: "Layar akhir (menunggu, disetujui, ditolak)" },
  { id: "poster", title: "Poster QR" },
] as const;

export type GroupId = (typeof GROUPS)[number]["id"];

const d = (value: string) => () => value;
const t = (group: GroupId, label: string, def: string, hint?: string): FieldDef => ({
  group, label, hint, type: "text", default: d(def),
});
const ta = (group: GroupId, label: string, def: string, hint?: string): FieldDef => ({
  group, label, hint, type: "textarea", default: d(def),
});
const n = (group: GroupId, label: string, def: () => string, min: number, max: number, hint?: string): FieldDef => ({
  group, label, hint, type: "number", default: def, min, max,
});

export const DEFAULT_PURPOSES = [
  "Meeting / tamu perusahaan",
  "Kontraktor / pekerjaan",
  "Audit / inspeksi",
  "Pengiriman barang",
  "Training / magang",
  "Lainnya",
];

const ARRIVAL = "Tunjukkan layar ini kepada security untuk konfirmasi dan mengambil stiker pass.";

export const F = {
  // ---------------------------------------------------------------- tampilan
  brandColor: {
    group: "tampilan", label: "Warna utama", type: "color", default: d("#d6212a"),
    hint: "Dipakai di header, tombol, dan bingkai. Pilih warna yang cukup gelap agar tulisan putih tetap terbaca.",
  },
  headerTagline: t("tampilan", "Tulisan di kanan header", "Keselamatan Utama"),
  bottomBanner: t("tampilan", "Tulisan pita di bawah halaman", "Wajib diselesaikan sebelum masuk area pabrik"),
  footerText: t("tampilan", "Teks footer abu-abu", "Ada kendala? Hubungi security di pos jaga."),

  // ---------------------------------------------------------------- depan
  homeTitle: t("depan", "Judul halaman depan", "Induksi Keselamatan"),
  homeIntro: ta("depan", "Kalimat pengantar (panel merah)",
    "Keselamatan seluruh pengunjung adalah hal terpenting di pabrik kami. Isi data diri singkat, tonton video induksi, jawab pertanyaan, lalu temui security untuk mendapatkan stiker pass."),
  stepLabel1: t("depan", "Nama langkah 1", "Data diri"),
  stepLabel2: t("depan", "Nama langkah 2", "Video"),
  stepLabel3: t("depan", "Nama langkah 3", "Pertanyaan"),
  stepLabel4: t("depan", "Nama langkah 4", "Konfirmasi security"),
  sectionPerson: t("depan", "Judul bagian data diri", "Data diri"),
  sectionVisit: t("depan", "Judul bagian kunjungan", "Kunjungan"),
  labelFullName: t("depan", "Label: nama", "Nama lengkap"),
  labelCompany: t("depan", "Label: perusahaan", "Perusahaan / instansi"),
  labelPhone: t("depan", "Label: nomor HP", "Nomor HP (WhatsApp)"),
  labelVehicle: t("depan", "Label: kendaraan", "Nomor kendaraan"),
  hintVehicle: t("depan", "Petunjuk: kendaraan", "Kosongkan bila tidak membawa kendaraan."),
  labelPurpose: t("depan", "Label: tujuan kunjungan", "Tujuan kunjungan"),
  placeholderPurpose: t("depan", "Teks awal pilihan tujuan", "Pilih tujuan…"),
  purposes: ta("depan", "Daftar pilihan tujuan kunjungan", DEFAULT_PURPOSES.join("\n"), "Satu pilihan per baris (maksimal 12)."),
  labelHost: t("depan", "Label: bertemu siapa", "Bertemu siapa?"),
  labelDepartment: t("depan", "Label: departemen", "Departemen yang dituju (opsional)"),
  labelDate: t("depan", "Label: tanggal", "Tanggal"),
  labelHours: t("depan", "Label: perkiraan lama", "Perkiraan lama (jam)"),
  hintHours: t("depan", "Petunjuk: perkiraan lama", "Opsional, hanya perkiraan."),
  consentText: ta("depan", "Teks persetujuan data pribadi",
    "Saya menyatakan data di atas benar dan menyetujui data pribadi saya dipakai untuk keperluan keselamatan dan pencatatan kunjungan pabrik."),
  buttonStart: t("depan", "Tombol kirim biodata", "Lanjut ke video induksi"),

  // ---------------------------------------------------------------- video
  videoTitle: t("video", "Judul halaman video", "Video Induksi"),
  videoIntro: ta("video", "Kalimat pengantar video", "Putar video sampai selesai. Video tidak bisa dipercepat atau dilompati. Nyalakan suara."),
  videoMode: {
    group: "video", label: "Sumber video", type: "select",
    default: () => (envDefaults.youtube ? "youtube" : "mp4"),
    options: [
      { value: "youtube", label: "YouTube (tautan di bawah)" },
      { value: "mp4", label: "Berkas MP4 sendiri (alamat di bawah)" },
    ],
    hint: "Pakai MP4 bila jaringan memblokir YouTube.",
  },
  videoYoutube: t("video", "Tautan atau ID YouTube", "", "Contoh: https://youtu.be/4sUxKaVpqVc. Video harus Unlisted dan penyematan (Allow embedding) diaktifkan."),
  videoSrc: {
    group: "video", label: "Alamat berkas MP4", type: "text", default: () => envDefaults.videoSrc,
    hint: "Berkas harus sudah ada di aplikasi (folder public/videos), atau alamat https lengkap.",
  },
  videoSeconds: n("video", "Durasi video (detik)", () => String(envDefaults.videoSeconds), 1, 7200,
    "Isi persis dengan durasi video. 3:52 = 232. Jangan lebih besar dari durasi asli."),
  videoMinPercent: n("video", "Minimal bagian video yang harus berjalan (%)", () => String(Math.round(envDefaults.minWatchRatio * 100)), 50, 100,
    "Server menolak 'selesai' jika waktu sejak mulai kurang dari persentase ini dari durasi."),
  buttonPlay: t("video", "Tombol putar", "▶ Putar"),
  buttonPause: t("video", "Tombol jeda", "⏸ Jeda"),
  buttonWait: t("video", "Tombol lanjut (sebelum selesai)", "Tonton sampai selesai untuk lanjut"),
  buttonSaving: t("video", "Tombol lanjut (menyimpan)", "Menyimpan…"),
  buttonReady: t("video", "Tombol lanjut (siap)", "Lanjut ke pertanyaan"),
  tapHint: t("video", "Petunjuk ketuk video", "Ketuk langsung pada video untuk memulai."),
  videoError: t("video", "Pesan video gagal dimuat", "Video tidak dapat dimuat. Periksa sinyal Anda, muat ulang halaman, atau hubungi security."),

  // ---------------------------------------------------------------- kuis
  quizTitle: t("kuis", "Judul halaman kuis", "Pertanyaan"),
  quizIntro: ta("kuis", "Kalimat pengantar kuis", "Semua jawaban harus benar ({nilai}%) untuk lulus. Anda boleh mengulang bila belum lulus.", "{nilai} diganti nilai lulus."),
  quizFail: ta("kuis", "Pesan bila belum lulus", "Nilai Anda {skor}%. Untuk lulus semua jawaban harus benar ({nilai}%). Silakan coba lagi.", "{skor} diganti nilai pengunjung, {nilai} nilai lulus."),
  commitmentLabel: t("kuis", "Judul isian komitmen", "Komitmen keselamatan"),
  commitmentPrompt: ta("kuis", "Petunjuk isian komitmen", "Tuliskan komitmen Anda untuk menjaga keselamatan diri sendiri dan orang lain selama berada di area pabrik."),
  buttonSubmitQuiz: t("kuis", "Tombol kirim jawaban", "Kirim jawaban"),
  buttonChecking: t("kuis", "Tombol saat memeriksa", "Memeriksa jawaban…"),
  passPercent: n("kuis", "Nilai lulus (%)", () => String(envDefaults.passPercent), 1, 100, "100 = semua soal harus benar."),
  validDays: n("kuis", "Masa berlaku induksi (hari)", () => String(envDefaults.validDays), 1, 3650,
    "Pengunjung dengan nomor HP sama melewati video dan kuis selama masa ini."),

  // ---------------------------------------------------------------- selesai
  waitTitle: t("selesai", "Judul: menunggu security", "Hampir Selesai"),
  waitIntro: ta("selesai", "Pengantar: induksi baru selesai", `Induksi Anda sudah selesai. ${ARRIVAL}`),
  waitIntroSkipped: ta("selesai", "Pengantar: induksi lama masih berlaku", `Induksi Anda masih berlaku sampai {tanggal}. ${ARRIVAL}`, "{tanggal} diganti tanggal berakhirnya induksi."),
  codeLabel: t("selesai", "Tulisan di atas kode kunjungan", "Kode kunjungan"),
  waitNote: t("selesai", "Catatan di bawah kode", "Halaman ini diperbarui otomatis setelah security menyetujui."),
  approvedTitle: t("selesai", "Judul: disetujui", "Disetujui"),
  approvedText: ta("selesai", "Teks: disetujui", "Ambil stiker pass pengunjung dari security dan tempelkan di pakaian Anda."),
  stickerLabel: t("selesai", "Tulisan nomor stiker", "Nomor stiker:"),
  rejectedTitle: t("selesai", "Judul: ditolak", "Belum Dapat Masuk"),
  rejectedDefault: ta("selesai", "Teks ditolak bila security tidak menulis alasan", "Silakan hubungi security untuk penjelasan."),
  doneTitle: t("selesai", "Judul: kunjungan selesai", "Terima Kasih"),
  doneText: ta("selesai", "Teks: kunjungan selesai", "Kunjungan Anda telah selesai. Hati-hati di jalan."),

  // ---------------------------------------------------------------- poster
  posterTitle: t("poster", "Judul poster", "Selamat datang"),
  posterSubtitle: t("poster", "Subjudul poster", "Scan untuk induksi keselamatan"),
  posterNote: t("poster", "Catatan poster", "Wajib diselesaikan sebelum masuk area pabrik"),
} satisfies Record<string, FieldDef>;

export type FieldKey = keyof typeof F;
export const FIELD_KEYS = Object.keys(F) as FieldKey[];

export function fieldDef(key: string): FieldDef | undefined {
  return (F as Record<string, FieldDef>)[key];
}

export function fieldsOfGroup(group: GroupId): { key: FieldKey; def: FieldDef }[] {
  return FIELD_KEYS.filter((k) => F[k].group === group).map((key) => ({ key, def: F[key] }));
}

// ------------------------------------------------------------------ warna

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Campur `hex` dengan `target` sebesar `ratio` (0..1). */
export function mix(hex: string, target: [number, number, number], ratio: number): string {
  const c = rgb(hex);
  return toHex(c.map((v, i) => v + (target[i] - v) * ratio) as [number, number, number]);
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rasio kontras WCAG antara warna ini dan putih. */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/** Variabel CSS untuk skala warna utama (menimpa tema Tailwind). */
export function brandCssVars(hex: string): string {
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  return [
    `--color-brand-50:${mix(hex, white, 0.92)}`,
    `--color-brand-100:${mix(hex, white, 0.8)}`,
    `--color-brand-500:${mix(hex, white, 0.08)}`,
    `--color-brand-600:${hex}`,
    `--color-brand-700:${mix(hex, black, 0.2)}`,
  ].join(";");
}

// ------------------------------------------------------------------ validasi

export const MAX_TEXT = 300;
export const MAX_TEXTAREA = 1500;

/** Mengembalikan pesan galat, atau null bila nilai sah. Nilai kosong selalu sah (= bawaan). */
export function validateField(key: string, raw: string, parseYouTube: (v: string) => string | null): string | null {
  const def = fieldDef(key);
  if (!def) return "Kolom tidak dikenal.";
  const value = raw.trim();
  if (value === "") return null;
  const name = def.label;

  switch (def.type) {
    case "text":
      if (value.length > MAX_TEXT) return `${name}: maksimal ${MAX_TEXT} karakter.`;
      if (key === "videoYoutube" && !parseYouTube(value)) return `${name}: tautan atau ID YouTube tidak dikenali.`;
      if (key === "videoSrc" && !(value.startsWith("/") || value.startsWith("https://"))) {
        return `${name}: harus diawali / (berkas di aplikasi) atau https://.`;
      }
      return null;
    case "textarea": {
      if (value.length > MAX_TEXTAREA) return `${name}: maksimal ${MAX_TEXTAREA} karakter.`;
      if (key === "purposes") {
        const lines = parsePurposes(value);
        if (lines.length < 1 || lines.length > 12) return `${name}: isi 1–12 pilihan, satu per baris.`;
        if (lines.some((l) => l.length > 80)) return `${name}: tiap pilihan maksimal 80 karakter.`;
      }
      return null;
    }
    case "number": {
      const num = Number(value);
      if (!Number.isInteger(num) || num < (def.min ?? 0) || num > (def.max ?? Infinity)) {
        return `${name}: isi bilangan bulat ${def.min}–${def.max}.`;
      }
      return null;
    }
    case "color":
      if (!isHexColor(value)) return `${name}: format warna tidak sah.`;
      if (contrastWithWhite(value) < 3) return `${name}: terlalu terang, tulisan putih tidak akan terbaca. Pilih warna lebih gelap.`;
      return null;
    case "select":
      return def.options?.some((o) => o.value === value) ? null : `${name}: pilihan tidak dikenal.`;
  }
}

export function parsePurposes(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Mengganti {nama} pada teks dengan nilai dari `vars`; yang tidak dikenal dibiarkan. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

// ------------------------------------------------------------------ logo

export const MAX_LOGO_BYTES = 400 * 1024;

/** Jenis gambar dari byte awal berkas (bukan dari nama/tipe yang diklaim pengunggah). SVG sengaja ditolak. */
export function sniffImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
