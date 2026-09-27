"use server";

/**
 * Server actions for repair records (CRUD).
 *
 * Writes go through the atomic `save_repair()` database function so a repair,
 * its parts and its work are always saved together (or not at all).
 * Cost totals are computed by the database (repairs_view).
 */

import { revalidatePath } from "next/cache";
import { getSupabaseServer, ConfigError } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/queries";
import type { SaveRepairPayload } from "@/types";

export type SaveRepairResult =
  | { error: string; id?: never }
  | { error?: never; id: string };

function mapError(err: unknown): string {
  if (err instanceof ConfigError) return err.message;
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}

/**
 * Create or update a repair record with its parts and work, atomically.
 */
export async function saveRepairAction(
  payload: SaveRepairPayload
): Promise<SaveRepairResult> {
  try {
    const supabase = getSupabaseServer();
    const userId = await getCurrentUserId();

    // Pastikan kendaraan ini milik user yang login sebelum menyimpan.
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", payload.vehicle_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (vehicleError) throw vehicleError;
    if (!vehicle) throw new Error("Kendaraan tidak ditemukan.");

    const { data, error } = await supabase.rpc("save_repair", {
      payload: payload as never,
    });

    if (error) throw error;
    if (!data) throw new Error("Riwayat perbaikan gagal disimpan.");

    const vehicleId = payload.vehicle_id;
    // The record is already committed; never let a cache-invalidation
    // failure make the UI report a failed save.
    try {
      revalidatePath("/");
      revalidatePath(`/kendaraan/${vehicleId}`);
      revalidatePath(`/kendaraan/${vehicleId}/riwayat`);
      revalidatePath(`/riwayat`);
    } catch {
      // halaman akan dimuat ulang saat navigasi
    }
    return { id: data as string };
  } catch (err) {
    return { error: `Gagal menyimpan riwayat perbaikan. ${mapError(err)}` };
  }
}

/** Delete a repair record (parts and work cascade with it). */
export async function deleteRepairAction(
  id: string,
  vehicleId: string
): Promise<{ error?: string }> {
  try {
    if (!id) return { error: "ID riwayat perbaikan tidak ditemukan." };
    const supabase = getSupabaseServer();
    const userId = await getCurrentUserId();

    // Hanya hapus jika riwayat ini milik kendaraan milik user yang login.
    const { data: owned, error: ownerError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("user_id", userId)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!owned) throw new Error("Kendaraan tidak ditemukan.");

    const { error } = await supabase
      .from("repair_records")
      .delete()
      .eq("id", id)
      .eq("vehicle_id", vehicleId);

    if (error) throw error;

    // Re-sync the vehicle's current_km to the highest remaining odometer
    // (Rule 7: kilometer tidak seharusnya menurun). The record is already
    // deleted at this point, so a sync failure must not make the UI report
    // a failed delete.
    try {
      await syncVehicleCurrentKm(vehicleId);
    } catch {
      // KM akan tersinkron lagi pada save_repair berikutnya.
    }

    revalidatePath("/");
    revalidatePath(`/kendaraan/${vehicleId}`);
    revalidatePath(`/kendaraan/${vehicleId}/riwayat`);
    revalidatePath(`/riwayat`);
    return {};
  } catch (err) {
    return { error: `Gagal menghapus riwayat perbaikan. ${mapError(err)}` };
  }
}

/**
 * Set a vehicle's current_km to the highest odometer among its repair
 * records, or 0 when it has none. Keeps "Kilometer Saat Ini" consistent
 * without ever decreasing it below the highest recorded value (Rule 7).
 */
export async function syncVehicleCurrentKm(vehicleId: string): Promise<void> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("repair_records")
    .select("odometer")
    .eq("vehicle_id", vehicleId)
    .order("odometer", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const nextKm = data?.odometer ?? 0;
  await supabase
    .from("vehicles")
    .update({ current_km: nextKm })
    .eq("id", vehicleId);
}
