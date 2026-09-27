import { notFound } from "next/navigation";
import { getRepairDetail, getVehicle, listRepairsByVehicle } from "@/lib/queries";
import { RepairForm } from "@/components/repair-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditRepairPage({
  params,
}: {
  params: Promise<{ id: string; repairId: string }>;
}) {
  const { id, repairId } = await params;
  const [vehicle, repair] = await Promise.all([
    getVehicle(id),
    getRepairDetail(repairId),
  ]);

  if (!vehicle || !repair || repair.vehicle_id !== id) {
    notFound();
  }

  // Highest odometer among the vehicle's other records, excluding the one
  // being edited, so editing does not warn against itself.
  const others = await listRepairsByVehicle(id, "newest");
  const previousMaxKm = others
    .filter((r) => r.id !== repairId)
    .map((r) => r.odometer);
  const maxKm = previousMaxKm.length > 0 ? Math.max(...previousMaxKm) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Riwayat Perbaikan"
        description={`${vehicle.name} • ${repair.repair_type}`}
      />
      <RepairForm
        mode="edit"
        vehicle={vehicle}
        repair={repair}
        previousMaxKm={maxKm}
      />
    </div>
  );
}
