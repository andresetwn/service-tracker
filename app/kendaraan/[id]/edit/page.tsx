import { notFound } from "next/navigation";
import { getVehicle } from "@/lib/queries";
import { VehicleForm } from "@/components/vehicle-form";
import { PageHeader } from "@/components/ui";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Kendaraan"
        description="Ubah data kendaraan Anda."
      />
      <VehicleForm vehicle={vehicle} />
    </div>
  );
}
