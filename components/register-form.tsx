"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";

/**
 * Form pendaftaran: nomor polisi + email + password (+ nomor HP opsional).
 *
 * Setelah submit berhasil, user diarahkan ke /verifikasi untuk input OTP
 * yang dikirim ke email.
 */
export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = await registerAction(formData);

    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    const email = String(formData.get("email") ?? "");
    const devCode = "devCode" in result && result.devCode ? result.devCode : null;
    const policeNumber =
      "policeNumber" in result && result.policeNumber
        ? result.policeNumber
        : "";
    router.push(
      `/verifikasi?email=${encodeURIComponent(email)}&plat=${encodeURIComponent(
        policeNumber
      )}${devCode ? `&dev=${encodeURIComponent(devCode)}` : ""}${
        searchParams.get("redirect")
          ? `&redirect=${encodeURIComponent(searchParams.get("redirect")!)}`
          : ""
      }`
    );
  }

  return (
    <Card>
      <CardHeader
        title="Buat Akun"
        subtitle="Daftar untuk mulai mencatat riwayat perbaikan kendaraan."
      />
      <form onSubmit={handleSubmit}>
        <CardBody className="flex flex-col gap-5">
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <Field
            label="Nomor Polisi"
            required
            hint="Dipakai untuk masuk. Contoh: B 1234 XYZ"
          >
            <Input
              name="police_number"
              placeholder="B 1234 XYZ"
              autoComplete="off"
              disabled={submitting}
              required
            />
          </Field>

          <Field label="Email" required hint="Untuk verifikasi dan pemulihan akun.">
            <Input
              name="email"
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              disabled={submitting}
              required
            />
          </Field>

          <Field label="Password" required hint="Minimal 6 karakter.">
            <Input
              name="password"
              type="password"
              placeholder="••••••"
              autoComplete="new-password"
              disabled={submitting}
              minLength={6}
              required
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/masuk")}
              disabled={submitting}
            >
              Sudah punya akun?
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Mendaftarkan..." : "Daftar"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
