"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateVehicleAction,
  type VehicleInput,
} from "@/app/actions/vehicles";
import { Button, Card, CardBody, Field, Input, Textarea } from "@/components/ui";
import { parseNumberInput, toNonNegativeNumber } from "@/lib/utils";
import type { Vehicle } from "@/types";

type VehicleFormProps = {
  vehicle: Vehicle;
};

type FormErrors = Partial<Record<keyof VehicleInput, string>>;

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleInput>(() => {
    return {
      id: vehicle.id,
      name: vehicle.name,
      brand: vehicle.brand ?? "",
      model: vehicle.model ?? "",
      year: vehicle.year,
      police_number: vehicle.police_number ?? "",
      current_km: vehicle.current_km,
      notes: vehicle.notes ?? "",
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    const name = (form.name ?? "").trim();
    if (!name) next.name = "Nama kendaraan wajib diisi.";

    const year = form.year;
    if (year !== null && year !== undefined && year < 1900) {
      next.year = "Tahun tidak valid.";
    }

    const km = toNonNegativeNumber(form.current_km ?? 0);
    if (km < 0) next.current_km = "Kilometer tidak boleh negatif.";
    if (!Number.isInteger(km)) next.current_km = "Kilometer harus berupa angka.";

    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    const payload: VehicleInput = {
      ...form,
      name: (form.name ?? "").trim(),
      brand: (form.brand ?? "").trim() || null,
      model: (form.model ?? "").trim() || null,
      year: form.year || null,
      police_number: form.police_number ?? "",
      current_km: toNonNegativeNumber(form.current_km ?? 0),
      notes: (form.notes ?? "").trim() || null,
    };

    const result = await updateVehicleAction(payload);

    setSubmitting(false);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    // Kembali ke detail kendaraan setelah simpan.
    router.push(`/kendaraan/${vehicle.id}`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardBody className="flex flex-col gap-5">
          {serverError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"
            >
              {serverError}
            </p>
          ) : null}

          <Field
            label="Nama Kendaraan"
            required
            error={errors.name}
            hint="Contoh: Motor Harian"
          >
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Motor Harian"
              disabled={submitting}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Merek" hint="Contoh: Honda">
              <Input
                value={form.brand ?? ""}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="Honda"
                disabled={submitting}
              />
            </Field>
            <Field label="Model" hint="Contoh: Vario 160">
              <Input
                value={form.model ?? ""}
                onChange={(e) => update("model", e.target.value)}
                placeholder="Vario 160"
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Tahun" error={errors.year} hint="Contoh: 2024">
              <Input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={form.year ?? ""}
                onChange={(e) =>
                  update("year", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="2024"
                disabled={submitting}
              />
            </Field>
            <Field
              label="Nomor Polisi"
              hint="Unik. Tidak semua kendaraan punya nomor polisi. Huruf besar/kecil dan spasi diabaikan."
            >
              <Input
                value={form.police_number ?? ""}
                onChange={(e) => update("police_number", e.target.value)}
                placeholder="B 1234 XYZ"
                disabled={submitting}
              />
            </Field>
          </div>

          <Field
            label="Kilometer Saat Ini"
            error={errors.current_km}
            hint="Angka. Tidak boleh negatif."
          >
            <Input
              type="text"
              inputMode="numeric"
              value={
                form.current_km === 0
                  ? "0"
                  : new Intl.NumberFormat("id-ID").format(form.current_km ?? 0)
              }
              onChange={(e) =>
                update("current_km", parseNumberInput(e.target.value))
              }
              placeholder="0"
              disabled={submitting}
            />
          </Field>

          <Field label="Catatan" hint="Opsional">
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Motor untuk ke kantor sehari-hari."
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
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
