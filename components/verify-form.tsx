"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpAction, resendOtpAction } from "@/app/actions/auth";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";

/**
 * Form verifikasi OTP email (6 digit / magic link).
 *
 * Setelah verifikasi sukses, user diarahkan ke redirect asli atau ke
 * halaman utama.
 */
export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const redirect = searchParams.get("redirect") ?? "/";
  const devCode = searchParams.get("dev") ?? null;
  const plat = searchParams.get("plat") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = await verifyOtpAction(formData);

    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleResend() {
    setError(null);
    setResent(false);
    const result = await resendOtpAction(email);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResent(true);
  }

  return (
    <Card>
      <CardHeader
        title="Verifikasi Email"
        subtitle="Masukkan kode 6 digit yang dikirim ke email Anda."
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

          <p className="text-sm text-muted">
            Kode verifikasi dikirim ke{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>

          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="police_number" value={plat} />

          {devCode ? (
            <div className="rounded-lg border border-dashed border-line bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Mode Dev — Kode Verifikasi
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
                {devCode}
              </p>
              <p className="mt-1 text-xs text-muted">
                Hanya tampil di lingkungan pengembangan.
              </p>
            </div>
          ) : null}

          <Field label="Kode Verifikasi" required>
            <Input
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
              disabled={submitting}
              required
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={submitting || !email}
            >
              Kirim ulang kode
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </div>

          {resent ? (
            <p className="text-sm text-muted">
              Kode baru telah dikirim. Periksa kotak masuk Anda.
            </p>
          ) : null}
        </CardBody>
      </form>
    </Card>
  );
}
