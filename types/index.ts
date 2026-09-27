/**
 * Types shared across the app.
 *
 * `Vehicle`, `Repair`, `RepairPart`, `RepairWork` mirror the database tables
 * (see sql/schema.sql). `VehicleWithStats` and `RepairDetail` mirror the views.
 */

/** A single vehicle (table: vehicles). */
export type Vehicle = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  police_number: string | null;
  current_km: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** A vehicle with aggregated repair statistics (view: vehicle_stats_view). */
export type VehicleWithStats = Vehicle & {
  repair_count: number;
  total_spend: number;
  last_repair_date: string | null;
  last_odometer: number;
};

/** A single repair record (view: repairs_view). */
export type Repair = {
  id: string;
  vehicle_id: string;
  repair_date: string;
  odometer: number;
  repair_type: string;
  complaint: string | null;
  labor_cost: number;
  additional_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  parts_cost: number;
  parts_count: number;
  work_count: number;
  total_cost: number;
};

/** A single part replaced (table: repair_parts). */
export type RepairPart = {
  id: string;
  repair_id: string;
  name: string;
  brand: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
};

/** A single work item (table: repair_work). */
export type RepairWork = {
  id: string;
  repair_id: string;
  description: string;
  created_at: string;
};

/** A repair record with its parts and work (view + related tables). */
export type RepairDetail = Repair & {
  parts: RepairPart[];
  work: RepairWork[];
};

/** Payload accepted by the save_repair() database function. */
export type SaveRepairPayload = {
  id?: string;
  vehicle_id: string;
  repair_date: string;
  odometer: number;
  repair_type: string;
  complaint?: string | null;
  labor_cost: number;
  additional_cost: number;
  notes?: string | null;
  parts: {
    id?: string;
    name: string;
    brand?: string | null;
    quantity: number;
    unit_price: number;
    notes?: string | null;
  }[];
  work: {
    id?: string;
    description: string;
  }[];
};

/**
 * Repair types (AGENTS.md section 9).
 * Lainnya is handled as free-form text via `other_type`.
 */
export const REPAIR_TYPES = [
  "Servis rutin",
  "Ganti oli",
  "Ganti filter",
  "Perbaikan rem",
  "Perbaikan mesin",
  "Perbaikan kelistrikan",
  "Perbaikan ban",
  "Perbaikan CVT",
  "Perbaikan transmisi",
  "Penggantian part",
  "Lainnya",
] as const;

export type RepairType = (typeof REPAIR_TYPES)[number];
