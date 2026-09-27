"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteVehicleAction } from "@/app/actions/vehicles";
import { Button } from "@/components/ui";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

/**
 * Edit + delete buttons for a vehicle.
 *
 * Delete asks for confirmation first (AGENTS.md section 23) and warns that all
 * repair history for the vehicle will be removed (on delete cascade).
 */
export function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => router.push(`/kendaraan/${vehicleId}/edit`)}
      >
        Edit
      </Button>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Hapus
      </Button>
      <ConfirmDeleteDialog
        open={open}
        title="Hapus kendaraan ini?"
        description="Seluruh riwayat perbaikan, part, dan pekerjaan yang tercatat untuk kendaraan ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Kendaraan"
        loadingLabel="Menghapus kendaraan..."
        onDelete={async () => {
          const result = await deleteVehicleAction(vehicleId);
          return "error" in result ? result.error : undefined;
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
