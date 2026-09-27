import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function MasukPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
      <PageHeader
        title="Masuk"
        description="Akses dashboard dan riwayat perbaikan kendaraan Anda."
      />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
