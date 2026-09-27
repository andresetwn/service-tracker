"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "@/components/ui";
import { REPAIR_SORT_LABELS, type RepairSort } from "@/lib/repair-sort";
import { REPAIR_TYPES } from "@/types";
import { parseNumberInput } from "@/lib/utils";

const SORTS = Object.keys(REPAIR_SORT_LABELS) as RepairSort[];

/**
 * Search + filter + sort toolbar for repair history.
 * State lives in the URL (searchParams) so it is shareable and refresh-safe.
 */
export function RepairFiltersBar({
  repairTypesInUse,
  vehicles,
}: {
  repairTypesInUse: string[];
  vehicles: { id: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const inputClass =
    "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-foreground placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
  const labelClass =
    "text-xs font-medium text-muted";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="repair-search">
          Cari
        </label>
        <Input
          id="repair-search"
          type="search"
          placeholder="Nama kendaraan, no. polisi, part, keluhan..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-type">
          Jenis Perbaikan
        </label>
        <Select
          id="filter-type"
          defaultValue={searchParams.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
          className="h-9"
        >
          <option value="">Semua</option>
          {REPAIR_TYPES.filter((t) => repairTypesInUse.includes(t)).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {repairTypesInUse
            .filter((t) => !REPAIR_TYPES.includes(t as never))
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-date">
          Rentang Tanggal
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="filter-date"
            type="date"
            aria-label="Dari tanggal"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => update("from", e.target.value)}
            className={inputClass}
          />
          <span className="text-zinc-400">–</span>
          <input
            type="date"
            aria-label="Sampai tanggal"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => update("to", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-vehicle">
          Kendaraan
        </label>
        <Select
          id="filter-vehicle"
          defaultValue={searchParams.get("vehicle") ?? ""}
          onChange={(e) => update("vehicle", e.target.value)}
          className="h-9"
        >
          <option value="">Semua</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-part">
          Part
        </label>
        <Input
          id="filter-part"
          type="search"
          placeholder="Nama part, mis. Kampas rem"
          defaultValue={searchParams.get("part") ?? ""}
          onChange={(e) => update("part", e.target.value)}
          className="h-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-km">
          Rentang Kilometer
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="filter-km"
            type="text"
            inputMode="numeric"
            aria-label="KM dari"
            placeholder="0"
            defaultValue={searchParams.get("kmFrom") ?? ""}
            onChange={(e) =>
              update("kmFrom", String(parseNumberInput(e.target.value)))
            }
            className={inputClass}
          />
          <span className="text-zinc-400">–</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="KM sampai"
            placeholder="100000"
            defaultValue={searchParams.get("kmTo") ?? ""}
            onChange={(e) =>
              update("kmTo", String(parseNumberInput(e.target.value)))
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="filter-sort">
          Urutkan
        </label>
        <Select
          id="filter-sort"
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={(e) => update("sort", e.target.value)}
          className="h-9"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {REPAIR_SORT_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
