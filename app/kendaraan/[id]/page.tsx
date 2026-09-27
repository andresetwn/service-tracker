import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle, listRepairsByVehicle } from "@/lib/queries";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { formatKm, formatRupiah, vehicleLabel } from "@/lib/utils";
import { VehicleActions } from "@/components/vehicle-actions";
import { RepairTimeline } from "@/components/repair-timeline";

export const dynamic = "force-dynamic";

const LINK_CLASS =
  "inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-100";

export default async function VehicleDetailPage({
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={vehicleLabel(vehicle)}
        description={vehicle.police_number ?? "Tanpa nomor polisi"}
        actions={<VehicleActions vehicleId={vehicle.id} />}
      />

      <Card>
        <CardHeader title="Informasi Kendaraan" />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Merek</dt>
              <dd className="font-medium">{vehicle.brand ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Model</dt>
              <dd className="font-medium">{vehicle.model ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tahun</dt>
              <dd className="font-medium">{vehicle.year ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Kilometer</dt>
              <dd className="font-medium">{formatKm(vehicle.last_odometer)}</dd>
            </div>
          </dl>
          {vehicle.notes ? (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              {vehicle.notes}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              Total Riwayat Perbaikan
            </p>
            <p className="text-xl font-semibold">
              {vehicle.repair_count} perbaikan
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              Total Pengeluaran Perawatan
            </p>
            <p className="text-xl font-semibold">
              {formatRupiah(vehicle.total_spend)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              Kilometer Terakhir Tercatat
            </p>
            <p className="text-xl font-semibold">
              {formatKm(vehicle.last_odometer)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Riwayat Perbaikan"
          subtitle="Terbaru → Terlama"
          actions={
            <Link
              href={`/kendaraan/${id}/riwayat/baru`}
              className={LINK_CLASS}
            >
              Tambah Riwayat
            </Link>
          }
        />
        {repairs.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat perbaikan."
            description="Tambahkan riwayat perbaikan pertama untuk kendaraan ini."
            action={
              <Link
                href={`/kendaraan/${id}/riwayat/baru`}
                className={LINK_CLASS}
              >
                Tambah Riwayat
              </Link>
            }
          />
        ) : (
          <RepairTimeline repairs={repairs} />
        )}
      </Card>
    </div>
  );
}
