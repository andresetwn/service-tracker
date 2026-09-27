import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export default function DaftarPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8">
      <PageHeader
        title="Daftar Akun"
        description="Buat akun untuk mulai mencatat riwayat perbaikan kendaraan."
      />
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
