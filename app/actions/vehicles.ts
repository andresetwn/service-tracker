"use server";

/**
 * Server actions for vehicles (CRUD).
 *
 * All DB access happens server-side with the service role key. Only plain
 * Indonesian messages are returned to the UI (AGENTS.md section 33).
 */

import { revalidatePath } from "next/cache";
import { getSupabaseServer, ConfigError } from "@/lib/supabase";
import { normalizePoliceNumber } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/queries";
import type { Vehicle } from "@/types";

export type VehicleInput = {
  id?: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  police_number?: string | null;
  current_km?: number;
  notes?: string | null;
};

export type ActionResult<T = void> =
  | { error: string; data?: never }
  | { error?: never; data: T };

function mapError(err: unknown): string {
  if (err instanceof ConfigError) return err.message;
  if (err instanceof Error) {
    // Duplicate police number. Normalisation (upper + no whitespace) means
    // "B 1234 XYZ" and "b1234xyz" are the same plate.
    if (err.message.includes("duplicate key") && err.message.includes("police_number")) {
      return "Nomor polisi sudah digunakan oleh kendaraan lain. Huruf besar/kecil dan spasi diabaikan, jadi coba gunakan nomor polisi yang berbeda.";
    }
    return err.message;
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export async function updateVehicleAction(
  input: VehicleInput
): Promise<ActionResult<Vehicle>> {
  try {
    if (!input.id) return { error: "ID kendaraan tidak ditemukan." };
    const userId = await getCurrentUserId();
    const supabase = getSupabaseServer();
    const name = (input.name ?? "").trim();
    if (!name) return { error: "Nama kendaraan wajib diisi." };

    const { data, error } = await supabase
      .from("vehicles")
      .update({
        name,
        brand: input.brand?.trim() || null,
        model: input.model?.trim() || null,
        year: input.year || null,
        police_number: normalizePoliceNumber(input.police_number),
        current_km: Math.max(0, input.current_km ?? 0),
        notes: input.notes?.trim() || null,
      })
      .eq("id", input.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/kendaraan");
    revalidatePath(`/kendaraan/${input.id}`);
    return { data: data as Vehicle };
  } catch (err) {
    return { error: `Gagal menyimpan kendaraan. ${mapError(err)}` };
  }
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  try {
    if (!id) return { error: "ID kendaraan tidak ditemukan." };
    const userId = await getCurrentUserId();
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/kendaraan");
    return { data: undefined };
  } catch (err) {
    return { error: `Gagal menghapus kendaraan. ${mapError(err)}` };
  }
}
