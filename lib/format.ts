const TZ = "Asia/Jakarta";

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC", // kolom @db.Date disimpan sebagai tengah malam UTC
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateLocal(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Tanggal hari ini di zona WIB sebagai "YYYY-MM-DD". */
export function todayJakarta(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(now);
}

/** "YYYY-MM-DD" -> Date tengah malam UTC untuk kolom @db.Date. */
export function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
