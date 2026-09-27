import { notFound } from "next/navigation";
import { getVehicle, listRepairsByVehicle } from "@/lib/queries";
import { RepairForm } from "@/components/repair-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewRepairPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const repairs = await listRepairsByVehicle(id, "newest");
  const previousMaxKm =
    repairs.length > 0
      ? Math.max(...repairs.map((r) => r.odometer))
      : vehicle.current_km;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat Perbaikan Baru"
        description={`${vehicle.name} • ${vehicle.police_number ?? "Tanpa nomor polisi"}`}
      />
      <RepairForm
        mode="create"
        vehicle={vehicle}
        previousMaxKm={previousMaxKm}
      />
    </div>
  );
}
