/**
 * Reusable read queries.
 *
 * Sorting, filtering and search live here so pages stay thin and the same
 * rules apply everywhere a list is rendered (AGENTS.md sections 18-22, 35).
 */

import "server-only";
import { getSupabaseServer } from "@/lib/supabase";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import type { RepairDetail, VehicleWithStats } from "@/types";
import {
  REPAIR_SORT_LABELS,
  type RepairFilters,
  type RepairSort,
} from "@/lib/repair-sort";

export type { RepairFilters, RepairSort };
export { REPAIR_SORT_LABELS };

/**
 * ID user yang sedang login. Diletakkan di sini (bukan di setiap pemanggil)
 * supaya semua query otomatis di-scope per user (multi-tenant).
 * @throws bila belum login.
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = await getSupabaseAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Anda harus masuk untuk melihat data ini.");
  return user.id;
}

export type RepairQuery = {
  sort?: RepairSort;
  filters?: RepairFilters;
  search?: string;
};

const SORT_COLUMNS: Record<RepairSort, { column: string; ascending: boolean }> =
  {
    newest: { column: "repair_date", ascending: false },
    oldest: { column: "repair_date", ascending: true },
    km_asc: { column: "odometer", ascending: true },
    km_desc: { column: "odometer", ascending: false },
    cost_asc: { column: "total_cost", ascending: true },
    cost_desc: { column: "total_cost", ascending: false },
  };

const REPAIR_DETAIL_SELECT = `
  id,
  vehicle_id,
  repair_date,
  odometer,
  repair_type,
  complaint,
  labor_cost,
  additional_cost,
  notes,
  created_at,
  updated_at,
  parts_cost,
  parts_count,
  work_count,
  total_cost,
  parts:repair_parts (
    id,
    repair_id,
    name,
    brand,
    quantity,
    unit_price,
    subtotal,
    notes
  ),
  work:repair_work (
    id,
    repair_id,
    description,
    created_at
  )
`;

/**
 * All repairs, optionally filtered/sorted/searched.
 *
 * Search and the part-name filter use `repairs_search_view`, which
 * denormalises vehicle name, police number and part names into searchable
 * columns. Other filters use plain `.eq/.gte/.lte`.
 */
export async function listRepairs(
  query: RepairQuery = {}
): Promise<RepairDetail[]> {
  const userId = await getCurrentUserId();
  const supabase = getSupabaseServer();
  const sort = query.sort ?? "newest";
  const { column, ascending } = SORT_COLUMNS[sort];
  const filters = query.filters ?? {};
  const search = (query.search ?? "").trim();

  let dbQuery = supabase
    .from("repairs_search_view")
    .select(
      `
      id,
      vehicle_id,
      repair_date,
      odometer,
      repair_type,
      complaint,
      labor_cost,
      additional_cost,
      notes,
      created_at,
      updated_at,
      parts_cost,
      parts_count,
      work_count,
      total_cost,
      vehicle_name,
      police_number,
      part_names,
      parts:repair_parts (
        id,
        repair_id,
        name,
        brand,
        quantity,
        unit_price,
        subtotal,
        notes
      ),
      work:repair_work (
        id,
        repair_id,
        description,
        created_at
      )
    `
    )
    .order(column, { ascending })
    .order("updated_at", { ascending: false });

  if (filters.vehicleId) dbQuery = dbQuery.eq("vehicle_id", filters.vehicleId);
  if (filters.repairType)
    dbQuery = dbQuery.eq("repair_type", filters.repairType);
  if (filters.dateFrom) dbQuery = dbQuery.gte("repair_date", filters.dateFrom);
  if (filters.dateTo) dbQuery = dbQuery.lte("repair_date", filters.dateTo);
  if (typeof filters.kmFrom === "number")
    dbQuery = dbQuery.gte("odometer", filters.kmFrom);
  if (typeof filters.kmTo === "number")
    dbQuery = dbQuery.lte("odometer", filters.kmTo);
  if (filters.partName)
    dbQuery = dbQuery.ilike("part_names", `%${filters.partName.trim()}%`);
  // Scope ke user yang login (multi-tenant).
  dbQuery = dbQuery.eq("user_id", userId);

  if (search) {
    dbQuery = dbQuery.or(
      `vehicle_name.ilike.%${search}%,police_number.ilike.%${search}%,repair_type.ilike.%${search}%,complaint.ilike.%${search}%,notes.ilike.%${search}%,part_names.ilike.%${search}%`
    );
  }

  const { data, error } = await dbQuery;
  if (error) throw error;
  return (data ?? []) as unknown as RepairDetail[];
}

/** Vehicles with aggregated stats (current user only). */
export async function listVehicles(): Promise<VehicleWithStats[]> {
  const userId = await getCurrentUserId();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("vehicle_stats_view")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as VehicleWithStats[];
}

/** A single vehicle with stats, or null when not found (current user only). */
export async function getVehicle(
  id: string
): Promise<VehicleWithStats | null> {
  const userId = await getCurrentUserId();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("vehicle_stats_view")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as VehicleWithStats | null;
}

/** Repairs for one vehicle. */
export async function listRepairsByVehicle(
  vehicleId: string,
  sort: RepairSort = "newest"
): Promise<RepairDetail[]> {
  return listRepairs({ sort, filters: { vehicleId } });
}

/** One repair with its parts and work, or null when not found. */
export async function getRepairDetail(
  id: string
): Promise<RepairDetail | null> {
  const userId = await getCurrentUserId();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("repairs_view")
    .select(REPAIR_DETAIL_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as RepairDetail | null;
}

/** All distinct repair types currently in use. */
export async function listRepairTypes(): Promise<string[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("repair_records")
    .select("repair_type")
    .order("repair_type", { ascending: true });

  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.repair_type))];
}
