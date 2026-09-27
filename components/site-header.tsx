"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/", label: "Riwayat Servis" },
];

/**
 * Header aplikasi.
 *
 * `signedIn` false berarti belum login (halaman /masuk, /daftar,
 * /verifikasi) — navigasi disembunyikan.
 *
 * Email hanya untuk verifikasi OTP — bukan identitas akun. Login 100% memakai
 * nomor polisi, jadi setiap plat adalah akun terpisah yang berdiri sendiri.
 * perlu tahu kendaraan tujuan:
 *   - 0 kendaraan : tombol disembunyikan (belum punya kendaraan)
 *   - 1 kendaraan : langsung ke form riwayat kendaraan itu
 *   - >1 kendaraan : ke halaman pilih kendaraan
 */
export function SiteHeader({
  signedIn = true,
  vehicleIds,
}: {
  signedIn?: boolean;
  /** ID kendaraan milik user, untuk tombol "Tambah Riwayat". */
  vehicleIds?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!signedIn) {
    return (
      <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
          <span className="font-semibold">Servis Tracker</span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="hidden sm:inline">Servis Tracker</span>
        </Link>

        <nav className="flex items-center gap-4">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-slate-100 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {vehicleIds && vehicleIds.length > 0 ? (
            <Link
              href={`/kendaraan/${vehicleIds[0]}/riwayat/baru`}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-brand px-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Tambah Riwayat
            </Link>
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
              aria-label="Akun"
              aria-expanded={menuOpen}
            >
              <span>U</span>
            </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-line bg-surface p-1 shadow-lg">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await logoutAction();
                    router.push("/masuk");
                    router.refresh();
                  })
                }
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50 disabled:opacity-50"
              >
                {isPending ? "Keluar..." : "Keluar"}
              </button>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
