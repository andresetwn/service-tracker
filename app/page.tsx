import Link from "next/link";
import { Suspense } from "react";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  PRIMARY_ACTION_CLASS,
  SECONDARY_ACTION_CLASS,
  Spinner,
} from "@/components/ui";
import {
  formatDateLong,
  formatKm,
  formatRupiah,
  vehicleLabel,
} from "@/lib/utils";
import { listRepairs, listVehicles } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import { RepairTimeline } from "@/components/repair-timeline";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-1 p-5">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </Card>
  );
}

async function ServiceHistoryContent() {
  const [vehicles, repairs] = await Promise.all([
    listVehicles(),
    listRepairs({ sort: "newest" }),
  ]);

  // Satu user satu kendaraan (dibuat saat daftar). Kalau belum ada, tampilkan
  // empty state dengan ajakan menambah riwayat.
  const vehicle = vehicles[0];
  const recent = repairs.slice(0, 8);

  if (!vehicle) {
    return (
      <Card>
        <EmptyState
          title="Belum ada riwayat servis."
          description="Daftarkan akun dengan nomor polisi kendaraan Anda untuk mulai mencatat riwayat servis."
          action={
            <Link href="/daftar" className={PRIMARY_ACTION_CLASS}>
              Daftar Kendaraan
            </Link>
          }
        />
      </Card>
    );
  }

  const latest = repairs[0];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Kendaraan" value={vehicleLabel(vehicle)} />
        <StatCard label="Total Riwayat" value={String(vehicle.repair_count)} />
        <StatCard
          label="Kilometer Terakhir"
          value={formatKm(vehicle.last_odometer)}
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(vehicle.total_spend)}
        />
      </dl>

      <Card>
        <CardHeader
          title="Riwayat Servis"
          subtitle="Terbaru → Terlama"
          actions={
            <Link
              href={`/kendaraan/${vehicle.id}/riwayat/baru`}
              className={SECONDARY_ACTION_CLASS}
            >
              Tambah Riwayat
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat servis."
            description="Tambahkan riwayat servis pertama untuk kendaraan ini."
            action={
              <Link
                href={`/kendaraan/${vehicle.id}/riwayat/baru`}
                className={PRIMARY_ACTION_CLASS}
              >
                Tambah Riwayat
              </Link>
            }
          />
        ) : (
          <RepairTimeline repairs={recent} />
        )}
      </Card>

      {latest ? (
        <Card>
          <CardHeader title="Servis Terakhir" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 sm:px-5">
            <div className="min-w-0">
              <p className="font-medium">{latest.repair_type}</p>
              <p className="truncate text-sm text-muted">
                {formatDateLong(latest.repair_date)} • {formatKm(latest.odometer)}
              </p>
            </div>
            <span className="shrink-0 font-medium">
              {formatRupiah(latest.total_cost)}
            </span>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function SetupNotice() {
  return (
    <Card>
      <CardHeader title="Supabase belum dikonfigurasi" />
      <div className="flex flex-col gap-4 p-5 text-sm">
        <p className="text-muted">
          Aplikasi ini membutuhkan Supabase untuk menyimpan data. Buat file{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
            .env.local
          </code>{" "}
          di root project dengan isi berikut:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-xs text-background">
          {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Buat project baru di supabase.com.</li>
          <li>
            Jalankan{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              sql/schema.sql
            </code>{" "}
            di Supabase SQL Editor.
          </li>
          <li>
            Masukkan URL dan service role key ke .env.local, lalu muat ulang
            halaman.
          </li>
        </ol>
        <p className="text-muted">
          Service role key hanya digunakan di server dan tidak pernah dikirim ke
          browser.
        </p>
      </div>
    </Card>
  );
}

export default function HomePage() {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat Servis"
        description="Catatan perawatan dan perbaikan kendaraan Anda."
      />
      <Suspense
        fallback={
          <Card>
            <Spinner label="Memuat data..." />
          </Card>
        }
      >
        <ServiceHistoryContent />
      </Suspense>
    </div>
  );
}
