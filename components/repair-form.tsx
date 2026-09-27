"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRepairAction } from "@/app/actions/repairs";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import {
  formatRupiah,
  parseNumberInput,
  todayISO,
} from "@/lib/utils";
import { REPAIR_TYPES } from "@/types";
import type { RepairDetail, SaveRepairPayload, Vehicle } from "@/types";

type PartRow = {
  key: string;
  id?: string;
  name: string;
  brand: string;
  quantity: string;
  unit_price: string;
  notes: string;
};

type WorkRow = {
  key: string;
  id?: string;
  description: string;
};

type RepairFormProps = {
  mode: "create" | "edit";
  vehicle: Vehicle;
  repair?: RepairDetail;
  /** Highest odometer among existing records, for the decrease warning. */
  previousMaxKm?: number;
};

let rowKeyCounter = 0;
function nextKey(): string {
  rowKeyCounter += 1;
  return `row-${Date.now()}-${rowKeyCounter}`;
}

/**
 * Repair form (AGENTS.md section 24).
 *
 * Fields: Tanggal *, Kilometer *, Jenis Perbaikan *, Keluhan, Pekerjaan,
 * Part yang Diganti, Biaya Part (auto), Biaya Jasa, Biaya Tambahan, Catatan.
 *
 * Deliberately NOT present: next-service date/km or any reminder field
 * (section 24, section 36, Rule 9).
 */
export function RepairForm({
  mode,
  vehicle,
  repair,
  previousMaxKm,
}: RepairFormProps) {
  const router = useRouter();

  const [repairDate, setRepairDate] = useState(repair?.repair_date ?? todayISO());
  const [odometer, setOdometer] = useState<string>(
    repair ? String(repair.odometer) : String(vehicle.current_km ?? 0)
  );
  const [repairType, setRepairType] = useState(repair?.repair_type ?? "");
  const [complaint, setComplaint] = useState(repair?.complaint ?? "");
  const [laborCost, setLaborCost] = useState(
    repair ? String(repair.labor_cost) : ""
  );
  const [additionalCost, setAdditionalCost] = useState(
    repair ? String(repair.additional_cost) : ""
  );
  const [notes, setNotes] = useState(repair?.notes ?? "");

  const [parts, setParts] = useState<PartRow[]>(() =>
    (repair?.parts ?? []).map((p) => ({
      key: nextKey(),
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      quantity: String(p.quantity),
      unit_price: String(p.unit_price),
      notes: p.notes ?? "",
    }))
  );
  const [works, setWorks] = useState<WorkRow[]>(() =>
    (repair?.work ?? []).map((w) => ({
      key: nextKey(),
      id: w.id,
      description: w.description,
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedKm, setConfirmedKm] = useState(false);

  const odometerValue = parseNumberInput(odometer);
  const laborValue = parseNumberInput(laborCost);
  const additionalValue = parseNumberInput(additionalCost);
  const partsValue = parts.reduce(
    (sum, p) => sum + parseNumberInput(p.unit_price) * Number(p.quantity || 0),
    0
  );
  const total = partsValue + laborValue + additionalValue;

  const kmDecreased =
    typeof previousMaxKm === "number" &&
    previousMaxKm > 0 &&
    odometerValue < previousMaxKm;

  function addPart() {
    setParts((prev) => [
      ...prev,
      { key: nextKey(), name: "", brand: "", quantity: "1", unit_price: "", notes: "" },
    ]);
  }

  function updatePart(key: string, field: keyof PartRow, value: string) {
    setParts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  }

  function removePart(key: string) {
    setParts((prev) => prev.filter((p) => p.key !== key));
  }

  function addWork() {
    setWorks((prev) => [...prev, { key: nextKey(), description: "" }]);
  }

  function updateWork(key: string, value: string) {
    setWorks((prev) =>
      prev.map((w) => (w.key === key ? { ...w, description: value } : w))
    );
  }

  function removeWork(key: string) {
    setWorks((prev) => prev.filter((w) => w.key !== key));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!repairDate) next.repairDate = "Tanggal perbaikan wajib diisi.";
    if (Number.isNaN(new Date(repairDate).getTime())) {
      next.repairDate = "Tanggal tidak valid.";
    }
    if (!Number.isInteger(odometerValue) || odometerValue < 0) {
      next.odometer = "Kilometer harus berupa angka dan tidak boleh negatif.";
    }
    if (!repairType.trim()) next.repairType = "Jenis perbaikan wajib diisi.";
    if (laborValue < 0) next.laborCost = "Biaya jasa tidak boleh negatif.";
    if (additionalValue < 0) {
      next.additionalCost = "Biaya tambahan tidak boleh negatif.";
    }

    parts.forEach((p) => {
      if (!p.name.trim()) next[`part-${p.key}`] = "Nama part wajib diisi.";
      if (!Number.isInteger(Number(p.quantity)) || Number(p.quantity) <= 0) {
        next[`part-qty-${p.key}`] = "Jumlah harus lebih besar dari 0.";
      }
      if (parseNumberInput(p.unit_price) < 0) {
        next[`part-price-${p.key}`] = "Harga tidak boleh negatif.";
      }
    });

    works.forEach((w) => {
      if (!w.description.trim()) {
        next[`work-${w.key}`] = "Deskripsi pekerjaan wajib diisi.";
      }
    });

    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    // Section 8: warn on decreasing odometer, but never block or auto-change.
    if (kmDecreased && !confirmedKm) {
      setErrors((prev) => ({
        ...prev,
        odometer:
          "Kilometer lebih kecil dari record sebelumnya. Periksa kembali atau konfirmasi bahwa nilainya benar.",
      }));
      setConfirmedKm(true);
      return;
    }

    setSubmitting(true);

    const payload: SaveRepairPayload = {
      id: mode === "edit" ? repair?.id : undefined,
      vehicle_id: vehicle.id,
      repair_date: repairDate,
      odometer: odometerValue,
      repair_type: repairType.trim(),
      complaint: complaint.trim() || null,
      labor_cost: laborValue,
      additional_cost: additionalValue,
      notes: notes.trim() || null,
      parts: parts
        .filter((p) => p.name.trim() !== "")
        .map((p) => ({
          id: p.id,
          name: p.name.trim(),
          brand: p.brand.trim() || null,
          quantity: Number(p.quantity),
          unit_price: parseNumberInput(p.unit_price),
          notes: p.notes.trim() || null,
        })),
      work: works
        .filter((w) => w.description.trim() !== "")
        .map((w) => ({
          id: w.id,
          description: w.description.trim(),
        })),
    };

    const result = await saveRepairAction(payload);
    setSubmitting(false);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    router.push(`/kendaraan/${vehicle.id}`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <CardHeader
          title={mode === "edit" ? "Edit Riwayat Perbaikan" : "Riwayat Perbaikan Baru"}
          subtitle={vehicle.name}
        />
        <CardBody className="flex flex-col gap-6">
          {serverError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"
            >
              {serverError}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Tanggal Perbaikan"
              required
              error={errors.repairDate}
            >
              <Input
                type="date"
                value={repairDate}
                onChange={(e) => setRepairDate(e.target.value)}
                disabled={submitting}
              />
            </Field>

            <Field
              label="Kilometer"
              required
              error={errors.odometer}
              hint={
                kmDecreased
                  ? "Kilometer lebih kecil dari record sebelumnya."
                  : "Angka. Tidak boleh negatif."
              }
            >
              <Input
                type="text"
                inputMode="numeric"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="12000"
                disabled={submitting}
                aria-invalid={kmDecreased || Boolean(errors.odometer)}
              />
            </Field>
          </div>

          <Field label="Jenis Perbaikan" required error={errors.repairType}>
            <Select
              value={repairType}
              onChange={(e) => setRepairType(e.target.value)}
              disabled={submitting}
            >
              <option value="">Pilih jenis perbaikan</option>
              {REPAIR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Keluhan" hint="Opsional. Masalah kendaraan sebelum diperbaiki.">
            <Textarea
              rows={2}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Motor terasa bergetar ketika melakukan pengereman."
              disabled={submitting}
            />
          </Field>

          {/* Pekerjaan yang dilakukan */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Pekerjaan yang Dilakukan
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addWork}
                disabled={submitting}
              >
                Tambah Pekerjaan
              </Button>
            </div>
            {works.length === 0 ? (
              <p className="text-sm text-muted">
                Belum ada pekerjaan yang dicatat.
              </p>
            ) : null}
            {works.map((w) => (
              <div key={w.key} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={w.description}
                    onChange={(e) => updateWork(w.key, e.target.value)}
                    placeholder="Pemeriksaan sistem pengereman"
                    disabled={submitting}
                    aria-invalid={Boolean(errors[`work-${w.key}`])}
                  />
                  {errors[`work-${w.key}`] ? (
                    <p className="mt-1 text-sm text-danger">
                      {errors[`work-${w.key}`]}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWork(w.key)}
                  disabled={submitting}
                  aria-label="Hapus pekerjaan"
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>

          {/* Part yang diganti */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Part yang Diganti
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addPart}
                disabled={submitting}
              >
                Tambah Part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="text-sm text-muted">
                Belum ada part yang dicatat. Tidak semua perbaikan memiliki part.
              </p>
            ) : null}
            {parts.map((p) => {
              const qty = Number(p.quantity || 0);
              const price = parseNumberInput(p.unit_price);
              const subtotal = Number.isFinite(qty * price) ? qty * price : 0;
              return (
                <div
                  key={p.key}
                  className="flex flex-col gap-3 rounded-lg border border-line p-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Nama Part" required error={errors[`part-${p.key}`]}>
                      <Input
                        value={p.name}
                        onChange={(e) => updatePart(p.key, "name", e.target.value)}
                        placeholder="Kampas rem depan"
                        disabled={submitting}
                      />
                    </Field>
                    <Field label="Merek">
                      <Input
                        value={p.brand}
                        onChange={(e) => updatePart(p.key, "brand", e.target.value)}
                        placeholder="Bosch"
                        disabled={submitting}
                      />
                    </Field>
                    <Field label="Catatan">
                      <Input
                        value={p.notes}
                        onChange={(e) => updatePart(p.key, "notes", e.target.value)}
                        placeholder=""
                        disabled={submitting}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <Field
                      label="Jumlah"
                      error={errors[`part-qty-${p.key}`]}
                    >
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={p.quantity}
                        onChange={(e) => updatePart(p.key, "quantity", e.target.value)}
                        disabled={submitting}
                      />
                    </Field>
                    <Field
                      label="Harga Satuan"
                      error={errors[`part-price-${p.key}`]}
                    >
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={p.unit_price}
                        onChange={(e) => updatePart(p.key, "unit_price", e.target.value)}
                        placeholder="120000"
                        disabled={submitting}
                      />
                    </Field>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        Subtotal
                      </span>
                      <div className="flex h-10 items-center text-sm font-medium">
                        {formatRupiah(subtotal)}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(p.key)}
                        disabled={submitting}
                      >
                        Hapus Part
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biaya */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Biaya Jasa"
              error={errors.laborCost}
              hint="Angka. Tidak boleh negatif. Opsional"
            >
              <Input
                type="text"
                inputMode="numeric"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="100000"
                disabled={submitting}
              />
            </Field>
            <Field
              label="Biaya Tambahan"
              error={errors.additionalCost}
              hint="Angka. Tidak boleh negatif. Opsional"
            >
              <Input
                type="text"
                inputMode="numeric"
                value={additionalCost}
                onChange={(e) => setAdditionalCost(e.target.value)}
                placeholder="25000"
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-line bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Biaya Part</span>
                <span className="font-medium">{formatRupiah(partsValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Biaya Jasa</span>
                <span className="font-medium">{formatRupiah(laborValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Biaya Tambahan</span>
                <span className="font-medium">{formatRupiah(additionalValue)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-2">
                <span className="font-semibold">Total Biaya</span>
                <span className="font-semibold">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          <Field label="Catatan" hint="Opsional">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi kendaraan setelah perbaikan normal."
              disabled={submitting}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Menyimpan..."
                : mode === "edit"
                ? "Simpan Perubahan"
                : "Simpan Riwayat"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
