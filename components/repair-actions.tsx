"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRepairAction } from "@/app/actions/repairs";
import { Button } from "@/components/ui";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import type { RepairDetail } from "@/types";

/**
 * Edit + delete buttons for a repair record.
 * Delete requires confirmation (AGENTS.md section 23).
 */
export function RepairActions({ repair }: { repair: RepairDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          router.push(
            `/kendaraan/${repair.vehicle_id}/riwayat/${repair.id}/edit`
          )
        }
      >
        Edit
      </Button>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Hapus
      </Button>
      <ConfirmDeleteDialog
        open={open}
        title="Hapus riwayat perbaikan ini?"
        description="Data perbaikan, part, dan pekerjaan yang tercatat akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Riwayat"
        loadingLabel="Menghapus riwayat..."
        onDelete={async () => {
          const result = await deleteRepairAction(repair.id, repair.vehicle_id);
          return result.error;
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
