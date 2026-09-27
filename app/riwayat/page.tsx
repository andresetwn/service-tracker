import Link from "next/link";
import { Suspense } from "react";
import {
  REPAIR_SORT_LABELS,
  listRepairTypes,
  listRepairs,
  listVehicles,
  type RepairSort,
} from "@/lib/queries";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  SECONDARY_ACTION_CLASS,
} from "@/components/ui";
import { RepairTable } from "@/components/repair-table";
import { RepairTimeline } from "@/components/repair-timeline";
import { RepairFiltersBar } from "@/components/repair-filters-bar";
import { vehicleLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VALID_SORTS = new Set(Object.keys(REPAIR_SORT_LABELS));

const LINK_CLASS = SECONDARY_ACTION_CLASS;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RepairHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const get = (key: string): string =>
    typeof params[key] === "string" ? (params[key] as string) : "";

  const rawSort = get("sort");
  const sort: RepairSort = VALID_SORTS.has(rawSort)
    ? (rawSort as RepairSort)
    : "newest";

  const filters = {
    search: get("q"),
    repairType: get("type"),
    dateFrom: get("from"),
    dateTo: get("to"),
    vehicleId: get("vehicle"),
    partName: get("part"),
    kmFrom: get("kmFrom") ? Number(get("kmFrom")) : undefined,
    kmTo: get("kmTo") ? Number(get("kmTo")) : undefined,
  };

  const [repairs, repairTypes, vehicles] = await Promise.all([
    listRepairs({
      sort,
      filters: {
        vehicleId: filters.vehicleId || undefined,
        repairType: filters.repairType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        partName: filters.partName || undefined,
        kmFrom:
          typeof filters.kmFrom === "number" && Number.isFinite(filters.kmFrom)
            ? filters.kmFrom
            : undefined,
        kmTo:
          typeof filters.kmTo === "number" && Number.isFinite(filters.kmTo)
            ? filters.kmTo
            : undefined,
      },
      search: filters.search || undefined,
    }),
    listRepairTypes(),
    listVehicles(),
  ]);

  const hasFilters = Boolean(
    filters.search ||
      filters.repairType ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.vehicleId ||
      filters.partName ||
      typeof filters.kmFrom === "number" ||
      typeof filters.kmTo === "number"
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat Perbaikan"
        description="Semua catatan perbaikan dan perawatan kendaraan Anda."
        actions={
          vehicles.length > 0 ? (
            <Link
              href={`/kendaraan/${vehicles[0].id}/riwayat/baru`}
              className={LINK_CLASS}
            >
              Tambah Riwayat
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={null}>
        <RepairFiltersBar
          repairTypesInUse={repairTypes}
          vehicles={vehicles.map((v) => ({ id: v.id, label: vehicleLabel(v) }))}
        />
      </Suspense>

      {repairs.length === 0 ? (
        <Card>
          <EmptyState
            title={hasFilters ? "Tidak ada hasil." : "Belum ada riwayat perbaikan."}
            description={
              hasFilters
                ? "Coba ubah kata kunci pencarian atau filter yang digunakan."
                : "Tambahkan riwayat perbaikan pertama untuk kendaraan Anda."
            }
            action={
              hasFilters ? (
                <Link href="/riwayat" className={LINK_CLASS}>
                  Reset Filter
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${repairs.length} riwayat perbaikan`}
            subtitle={`Urutkan: ${REPAIR_SORT_LABELS[sort]}`}
          />
          <RepairTimeline repairs={repairs} />
        </Card>
      )}

      {repairs.length > 0 ? (
        <Card>
          <CardHeader title="Tabel Riwayat" />
          <RepairTable repairs={repairs} />
        </Card>
      ) : null}
    </div>
  );
}
