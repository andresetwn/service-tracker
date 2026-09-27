import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { VerifyForm } from "@/components/verify-form";

export const dynamic = "force-dynamic";

export default function VerifikasiPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
      <PageHeader
        title="Verifikasi Email"
        description="Konfirmasi email untuk mengaktifkan akun Anda."
      />
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
