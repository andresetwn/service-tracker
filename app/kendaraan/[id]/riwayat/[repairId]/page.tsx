import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepairDetail, getVehicle } from "@/lib/queries";
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
} from "@/components/ui";
import {
  formatDateLong,
  formatKm,
  formatRupiah,
  vehicleLabel,
} from "@/lib/utils";
import { RepairActions } from "@/components/repair-actions";

export const dynamic = "force-dynamic";

const LINK_CLASS =
  "inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-100";

export default async function RepairDetailPage({
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${repair.repair_type}`}
        description={`${vehicleLabel(vehicle)} • ${formatDateLong(repair.repair_date)}`}
        actions={<RepairActions repair={repair} />}
      />

      <Card>
        <CardHeader title="Detail Perbaikan" />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Tanggal</dt>
              <dd className="font-medium">
                {formatDateLong(repair.repair_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Kilometer</dt>
              <dd className="font-medium">{formatKm(repair.odometer)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Jenis Perbaikan</dt>
              <dd className="font-medium">{repair.repair_type}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Total Biaya</dt>
              <dd className="font-medium">{formatRupiah(repair.total_cost)}</dd>
            </div>
          </dl>

          {repair.complaint ? (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground">
                Keluhan
              </h4>
              <p className="mt-1 text-sm text-muted">
                {repair.complaint}
              </p>
            </div>
          ) : null}

          {repair.notes ? (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground">Catatan</h4>
              <p className="mt-1 text-sm text-muted">{repair.notes}</p>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pekerjaan yang Dilakukan" />
          {repair.work.length === 0 ? (
            <CardBody>
              <p className="text-sm text-muted">
                Tidak ada pekerjaan yang dicatat.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {repair.work.map((w) => (
                <li
                  key={w.id}
                  className="p-4 text-sm sm:px-5"
                >
                  {w.description}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Part yang Diganti"
            actions={
              repair.parts.length > 0 ? (
                <span className="text-sm font-medium">
                  {formatRupiah(repair.parts_cost)}
                </span>
              ) : undefined
            }
          />
          {repair.parts.length === 0 ? (
            <CardBody>
              <p className="text-sm text-muted">
                Tidak ada part yang diganti.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {repair.parts.map((p) => (
                <li key={p.id} className="p-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted">
                        {p.brand ? `${p.brand} • ` : ""}
                        {p.quantity} × {formatRupiah(p.unit_price)}
                      </p>
                      {p.notes ? (
                        <p className="mt-1 text-xs text-muted">
                          {p.notes}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-medium">
                      {formatRupiah(p.subtotal)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Rincian Biaya" />
        <CardBody>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Biaya Part</span>
              <span className="font-medium">
                {formatRupiah(repair.parts_cost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Biaya Jasa</span>
              <span className="font-medium">
                {formatRupiah(repair.labor_cost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Biaya Tambahan</span>
              <span className="font-medium">
                {formatRupiah(repair.additional_cost)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2">
              <span className="font-semibold">Total Biaya</span>
              <span className="font-semibold">
                {formatRupiah(repair.total_cost)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-center">
        <Link href={`/kendaraan/${id}`} className={LINK_CLASS}>
          Kembali ke Kendaraan
        </Link>
      </div>
    </div>
  );
}
