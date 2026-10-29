/**
 * Mengambil ID video YouTube dari tautan (youtu.be, watch?v=, embed/, shorts/)
 * atau dari ID polos 11 karakter. Mengembalikan null bila tidak dikenali.
 */
export function parseYouTubeId(input: string | undefined | null): string | null {
  const value = input?.trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const m = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
  return m ? m[1] : null;
}
