import Link from "next/link";
import type { RepairDetail } from "@/types";
import { formatDateShort, formatKm, formatRupiah } from "@/lib/utils";

/**
 * Repair history as a table (AGENTS.md section 19).
 * Columns: Tanggal | KM | Jenis Perbaikan | Pekerjaan | Part | Total Biaya.
 * Each row opens the record detail.
 */

export function RepairTable({ repairs }: { repairs: RepairDetail[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium sm:px-5">Tanggal</th>
            <th className="px-4 py-3 font-medium sm:px-5">KM</th>
            <th className="px-4 py-3 font-medium sm:px-5">Jenis Perbaikan</th>
            <th className="px-4 py-3 font-medium sm:px-5">Pekerjaan</th>
            <th className="px-4 py-3 font-medium sm:px-5">Part</th>
            <th className="px-4 py-3 text-right font-medium sm:px-5">
              Total Biaya
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="px-4 py-3 sm:px-5">
                <Link
                  href={`/kendaraan/${repair.vehicle_id}/riwayat/${repair.id}`}
                  className="font-medium text-brand hover:underline"
                >
                  {formatDateShort(repair.repair_date)}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap sm:px-5">
                {formatKm(repair.odometer)}
              </td>
              <td className="px-4 py-3 sm:px-5">{repair.repair_type}</td>
              <td className="px-4 py-3 sm:px-5">
                {repair.work.length > 0
                  ? repair.work.map((w) => w.description).join(", ")
                  : "-"}
              </td>
              <td className="px-4 py-3 sm:px-5">
                {repair.parts.length > 0
                  ? repair.parts.map((p) => p.name).join(", ")
                  : "-"}
              </td>
              <td className="px-4 py-3 text-right font-medium whitespace-nowrap sm:px-5">
                {formatRupiah(repair.total_cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
