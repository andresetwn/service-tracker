/**
 * Small, dependency-free formatting + validation helpers (AGENTS.md section 15).
 *
 * Currency is stored as a plain number and formatted as Rupiah only in the UI.
 */

/** Format a number as Rupiah: 350000 -> "Rp350.000". */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Rp0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a kilometre value: 12100 -> "12.100 km". */
export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0 km";
  }
  return `${new Intl.NumberFormat("id-ID").format(value)} km`;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Format an ISO date (YYYY-MM-DD) in Indonesian long form: "20 September 2026".
 * Returns "-" for null/invalid input.
 */
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Short Indonesian date format: "20 Sep 2026". */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/**
 * Today's date as YYYY-MM-DD, using the Asia/Jakarta timezone.
 * Used as the default value for the repair-date field.
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Clamp a number to a non-negative finite value. */
export function toNonNegativeNumber(value: number | string): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

/**
 * Parse user input that may contain thousand separators ("12.500") into a
 * number. Accepts both "12.500" (id-ID) and "12,500" (en-US) styles, and
 * plain digits.
 */
export function parseNumberInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const hasCommaDecimal = /,\d{1,2}$/.test(trimmed);
  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // drop thousand separators "."
    .replace(/,(?=\d{3}(\D|$))/g, ""); // drop thousand separators ","
  return hasCommaDecimal
    ? Number(normalized.replace(",", "."))
    : Number(normalized);
}

/** Join non-empty strings with ", ". */
export function joinPresent(...parts: (string | null | undefined)[]): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(", ");
}

/**
 * Normalise a license plate for storage/comparison (AGENTS.md
 * "Vehicle Identification"): uppercase and strip all whitespace, so
 * "B 1234 XYZ", "b1234xyz" and "B1234 XYZ" are treated as the same plate.
 */
export function normalizePoliceNumber(value: string | null | undefined): string | null {
  const normalized = (value ?? "").toUpperCase().replace(/\s+/g, "");
  return normalized || null;
}

/** Build a vehicle's display label: "Honda Vario 160 (2024)" or fallback. */
export function vehicleLabel(v: {
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
}): string {
  const brandModel = joinPresent(v.brand, v.model);
  const year = v.year ? String(v.year) : null;
  const detail = joinPresent(brandModel, year);
  return detail ? `${v.name} • ${detail}` : v.name;
}
