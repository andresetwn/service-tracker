"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";

/**
 * Form masuk: nomor polisi + password.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = await loginAction(formData);

    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Masuk"
        subtitle="Gunakan nomor polisi dan password Anda."
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

          <Field label="Nomor Polisi" required>
            <Input
              name="police_number"
              placeholder="B 1234 XYZ"
              autoComplete="off"
              disabled={submitting}
              required
            />
          </Field>

          <Field label="Password" required>
            <Input
              name="password"
              type="password"
              placeholder="••••••"
              autoComplete="current-password"
              disabled={submitting}
              required
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/daftar")}
              disabled={submitting}
            >
              Belum punya akun?
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
