/**
 * Middleware: proteksi route yang butuh login.
 *
 - /masuk, /daftar, /verifikasi  -> public
 - semua route lain              -> harus login & email terverifikasi
 *
 * Supabase Auth session disegarkan di sini (setAll) supaya cookie selalu
 * valid saat user membuka halaman.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = ["/masuk", "/daftar", "/verifikasi"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belum login & route protected -> ke halaman masuk
  if (!user && !isPublic) {
    const redirectUrl = new URL("/masuk", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Sudah login tapi belum verifikasi email -> paksa verifikasi
  if (user && !user.email_confirmed_at && !pathname.startsWith("/verifikasi")) {
    const redirectUrl = new URL("/verifikasi", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Sudah login & sudah verifikasi, jangan biarkan buka halaman auth lagi
  if (
    user &&
    user.email_confirmed_at &&
    (pathname.startsWith("/masuk") || pathname.startsWith("/daftar"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
