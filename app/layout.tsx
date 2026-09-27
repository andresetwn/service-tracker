import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Servis Tracker by andrestwn",
  description: "Catat dan lihat riwayat perawatan serta perbaikan kendaraan Anda.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getSupabaseAuth } = await import("@/lib/supabase-auth");
  const supabase = await getSupabaseAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil ID kendaraan user untuk tombol "Tambah Riwayat" di header.
  // Satu email boleh punya beberapa kendaraan.
  let vehicleIds: string[] = [];
  if (user) {
    const { getSupabaseServer } = await import("@/lib/supabase");
    const server = getSupabaseServer();
    const { data } = await server
      .from("vehicles")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    vehicleIds = (data ?? []).map((v) => v.id);
  }

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader signedIn={Boolean(user)} vehicleIds={vehicleIds} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          Servis Tracker by andrestwn
        </footer>
      </body>
    </html>
  );
}
