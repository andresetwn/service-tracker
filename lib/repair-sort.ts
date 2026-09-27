/**
 * Sort + filter definitions for repair history.
 *
 * Kept free of server-only imports so it can be shared between server queries
 * (`lib/queries.ts`) and client components (`repair-filters-bar.tsx`).
 * (AGENTS.md sections 21-22.)
 */

/** Sort options for repair history (AGENTS.md section 22). */
export type RepairSort =
  | "newest"
  | "oldest"
  | "km_asc"
  | "km_desc"
  | "cost_asc"
  | "cost_desc";

export const REPAIR_SORT_LABELS: Record<RepairSort, string> = {
  newest: "Terbaru",
  oldest: "Terlama",
  km_asc: "KM terkecil",
  km_desc: "KM terbesar",
  cost_asc: "Biaya terendah",
  cost_desc: "Biaya tertinggi",
};

/** Filters for repair history (AGENTS.md section 21). */
export type RepairFilters = {
  vehicleId?: string;
  repairType?: string;
  dateFrom?: string;
  dateTo?: string;
  kmFrom?: number;
  kmTo?: number;
  partName?: string;
};
