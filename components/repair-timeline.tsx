import Link from "next/link";
import type { RepairDetail } from "@/types";
import { formatDateLong, formatKm, formatRupiah } from "@/lib/utils";

/**
 * Chronological repair history (AGENTS.md section 18).
 * Default order is newest first; the caller decides the sort.
 */

export function RepairTimeline({
  repairs,
}: {
  repairs: RepairDetail[];
}) {
  return (
    <ol className="divide-y divide-line">
      {repairs.map((repair) => (
        <li key={repair.id}>
          <Link
            href={`/kendaraan/${repair.vehicle_id}/riwayat/${repair.id}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
          >
            <div className="min-w-0">
              <p className="font-medium">{repair.repair_type}</p>
              <p className="text-sm text-muted">
                {formatDateLong(repair.repair_date)} • {formatKm(repair.odometer)}
              </p>
              {repair.work.length > 0 ? (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted">
                  {repair.work.slice(0, 3).map((w) => (
                    <li key={w.id}>{w.description}</li>
                  ))}
                  {repair.work.length > 3 ? (
                    <li>+{repair.work.length - 3} pekerjaan lainnya</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
            <span className="shrink-0 font-medium">
              {formatRupiah(repair.total_cost)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
