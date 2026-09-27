"use server";

/**
 * Server actions untuk autentikasi.
 *
 * Alur (lihat diskusi):
 *   daftar    : nomor polisi + email + password -> OTP 6 digit ke email
 *   verifikasi: input OTP -> email_confirmed_at + user_profiles.verified_at
 *   masuk     : nomor polisi + password -> cari email, signInWithPassword
 *   keluar    : signOut
 *
 * Keamanan (AGENTS.md section 34):
 * - Password hanya diteruskan ke Supabase Auth, tidak pernah disimpan di
 *   tabel kita, tidak pernah di-log.
 * - Nomor polisi dinormalisasi sebelum dipakai sebagai identifier.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { sendOtpEmail } from "@/lib/email";
import { normalizePoliceNumber } from "@/lib/utils";

/**
 * Service-role admin client untuk menulis user_profiles (tabel tidak punya
 * RLS anon yang longgar, jadi tulis profil pakai service role).
 * Kunci tidak pernah diekspos ke klien (server-only).
 */
async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Konfigurasi server belum lengkap.");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// =============================================================================
// OTP 6-digit — dikelola sendiri di public.otp_codes (bukan email Supabase).
// Alasan: SMTP free tier membatasi ~3-4 email/jam dan sering tidak sampai.
//   dev  : kode tampil di log server + dilayar (NEXT_PUBLIC_OTP_DEV_MODE=1)
//   prod : kirim lewat Resend — tinggal isi sendOtp() (gratis 3.000/bulan)
// =============================================================================

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

/** Buat kode 6-digit kriptografis acak. */
function generateOtpCode(): string {
  return randomBytes(4).readUInt32BE().toString().padStart(6, "0").slice(0, 6);
}

async function sendOtp(email: string, code: string): Promise<void> {
  const devMode = process.env.NEXT_PUBLIC_OTP_DEV_MODE === "1";

  if (devMode) {
    // DEV: tampilkan di log server + kirim juga ke email kalau SMTP sudah
    // dikonfigurasi (supaya alur bisa diuji tanpa email sungguhan).
    console.log(`\n[OTP][DEV] email=${email} code=${code}\n`);
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendOtpEmail(email, code).catch((err) =>
        console.error("[OTP][DEV] kirim email gagal:", err.message)
      );
    }
    return;
  }

  // PROD: kirim via Gmail SMTP (lihat lib/email.ts cara setup).
  await sendOtpEmail(email, code);
}

/**
 * Buat dan kirim OTP baru untuk email+purpose.
 * Membatalkan semua kode sebelumnya untuk email+purpose yang sama.
 */
export async function issueOtp(
  email: string,
  purpose = "signup"
): Promise<{ code: string; expiresAt: string }> {
  const admin = await getSupabaseAdmin();
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  // Kedaluwarsakan kode lama yang belum dipakai.
  await admin
    .from("otp_codes")
    .update({ expires_at: new Date().toISOString() })
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const { error } = await admin.from("otp_codes").insert({
    email,
    code,
    purpose,
    expires_at: expiresAt,
  });
  if (error) throw error;

  await sendOtp(email, code);
  return { code, expiresAt };
}

/**
 * Validasi OTP. Mengonsumsi kode jika benar (sekali pakai).
 * @throws Error dengan pesan user-facing.
 */
export async function validateOtp(
  email: string,
  code: string,
  purpose = "signup"
): Promise<void> {
  const admin = await getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("otp_codes")
    .select("id, code, expires_at, consumed_at, attempts")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;

  const latest = rows?.[0];
  if (!latest) throw new Error("Kode verifikasi tidak ditemukan. Silakan kirim ulang.");
  if (latest.consumed_at) throw new Error("Kode sudah dipakai. Silakan kirim ulang.");
  if (new Date(latest.expires_at).getTime() < Date.now()) {
    throw new Error("Kode sudah kedaluwarsa. Silakan kirim ulang.");
  }
  if (latest.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("Terlalu banyak percobaan. Silakan kirim ulang kode.");
  }

  if (latest.code !== code.trim()) {
    // Catat percobaan gagal (anti brute-force).
    await admin
      .from("otp_codes")
      .update({ attempts: latest.attempts + 1 })
      .eq("id", latest.id);
    throw new Error("Kode verifikasi salah.");
  }

  // Kode benar → konsumsi.
  const { error: consumeError } = await admin
    .from("otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", latest.id);
  if (consumeError) throw consumeError;
}

export type AuthResult =
  | {
      error: string;
      userId?: never;
      needsOtp?: never;
      devCode?: never;
      policeNumber?: never;
    }
  | {
      error?: never;
      userId?: string;
      needsOtp: boolean;
      devCode?: string;
      policeNumber?: string;
    };

function mapError(err: unknown): string {
  if (!(err instanceof Error)) return "Terjadi kesalahan. Silakan coba lagi.";
  const message = err.message.toLowerCase();

  if (message.includes("user already registered")) {
    return "Email atau nomor polisi sudah terdaftar. Silakan masuk.";
  }
  if (message.includes("invalid login credentials")) {
    return "Nomor polisi atau password salah.";
  }
  if (message.includes("email not confirmed")) {
    return "Email belum diverifikasi. Periksa kotak masuk Anda.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
  }
  if (message.includes("otp") || message.includes("expired")) {
    return "Kode verifikasi tidak valid atau sudah kedaluwarsa.";
  }
  if (message.includes("password should be at least")) {
    return "Password minimal 6 karakter.";
  }
  return err.message;
}

/**
 * DAFTAR: buat user baru dan kirim OTP email.
 */
export async function registerAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawPolice = String(formData.get("police_number") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const policeNumber = normalizePoliceNumber(rawPolice);

    if (!policeNumber) {
      return { error: "Nomor polisi wajib diisi." };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Email tidak valid." };
    }
    if (password.length < 6) {
      return { error: "Password minimal 6 karakter." };
    }

    const admin = await getSupabaseAdmin();

    // Cek plat yang sudah dipakai.
    const { data: existing } = await admin
      .from("user_profiles")
      .select("id")
      .eq("police_number", policeNumber)
      .maybeSingle();

    if (existing) {
      return {
        error:
          "Nomor polisi sudah terdaftar. Silakan masuk dengan akun Anda.",
      };
    }

    // Email hanya untuk pengiriman OTP — bukan identitas akun. Akun Auth
    // memakai email sintetis unik per plat (plat@vehicles.servistracker.com)
    // supaya email asli bebas dipakai ulang untuk plat lain. Login 100%
    // memakai nomor polisi.
    const authEmail = `${policeNumber.toLowerCase()}@vehicles.servistracker.com`;

    // Signup. Service role dipakai di sini supaya row user_profiles bisa
    // dibuat sekaligus.
    let userId: string;
    const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: false,
    });

    if (signUpError) {
      // Kasus khusus: user Auth sudah ada tapi profilenya hilang (mis. dihapus
      // manual dari Supabase). Lanjutkan pendaftaran untuk user tersebut
      // alih-alih menolak, supaya data bisa diperbaiki.
      if (/already registered|already exists/i.test(signUpError.message)) {
        const { data: list } = await admin.auth.admin.listUsers();
        const orphan = (list?.users ?? []).find((u) => u.email === authEmail);
        if (!orphan) throw signUpError;
        userId = orphan.id;
      } else {
        throw signUpError;
      }
    } else if (!authData.user) {
      throw new Error("Pendaftaran gagal. Silakan coba lagi.");
    } else {
      userId = authData.user.id;
    }

    // Simpan profil (nomor polisi sebagai identifier login).
    const { error: profileError } = await admin.from("user_profiles").insert({
      id: userId,
      email,
      police_number: policeNumber,
      verified_at: null,
    });

    if (profileError) {
      // Profil sudah ada (upsert ulang) tidak masalah; error lain rollback.
      if (profileError.code !== "23505") {
        await admin.auth.admin.deleteUser(userId);
        throw new Error("Pendaftaran gagal. Silakan coba lagi.");
      }
    }

    // Buat kendaraan otomatis dari plat yang dipakai saat daftar, supaya
    // user langsung melihat kendaraannya setelah login (tidak perlu tambah
    // manual). Kalau sudah ada kendaraan dengan plat itu, jangan dibuat
    // ulang — biarkan yang ada.
    const { data: existingVehicle } = await admin
      .from("vehicles")
      .select("id")
      .eq("user_id", userId)
      .eq("police_number", policeNumber)
      .maybeSingle();

    if (!existingVehicle) {
      await admin.from("vehicles").insert({
        user_id: userId,
        name: "Kendaraan Saya",
        police_number: policeNumber,
        current_km: 0,
      });
    }

    // Kirim OTP 6-digit milik kita (tabel otp_codes). Tidak pakai email
    // bawaan Supabase karena SMTP free tier membatasi ~3-4 email/jam.
    const { code: otpCode } = await issueOtp(email, "signup");
    const devMode = process.env.NEXT_PUBLIC_OTP_DEV_MODE === "1";

    revalidatePath("/masuk");
    return {
      userId: userId,
      needsOtp: true,
      devCode: devMode ? otpCode : undefined,
      policeNumber,
    } as AuthResult;
  } catch (err) {
    return { error: mapError(err) };
  }
}

/**
 * VERIFIKASI OTP: konfirmasi email pendaftaran.
 *
 * Kode 6-digit divalidasi di public.otp_codes (milik kita). Setelah valid,
 * email ditandai confirmed di auth.users dan verified_at di user_profiles,
 * sehingga user bisa login.
 */
export async function verifyOtpAction(formData: FormData): Promise<AuthResult> {
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const token = String(formData.get("token") ?? "").trim();

    if (!email || !token) {
      return { error: "Email dan kode verifikasi wajib diisi." };
    }

    // 1. Validasi kode 6-digit milik kita (sekali pakai).
    await validateOtp(email, token, "signup");

    // 2. Tandai verifikasi untuk plat ini.
    const admin = await getSupabaseAdmin();
    const policeNumber = String(formData.get("police_number") ?? "").trim();

    // Ambil email asli dari profil (untuk OTP + update).
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id, email")
      .eq("police_number", policeNumber)
      .maybeSingle();

    if (profile) {
      // Tandai email_confirm di auth.users (email sintetis per plat).
      await admin.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
      });
      // Tandai profil plat ini terverifikasi.
      await admin
        .from("user_profiles")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", profile.id);
    }

    revalidatePath("/");
    return { userId: profile?.id ?? "", needsOtp: false };
  } catch (err) {
    return { error: mapError(err) };
  }
}

/**
 * MASUK: nomor polisi + password.
 *
 * Nomor polisi dipetakan ke email di user_profiles, lalu login pakai
 * email + password di Supabase Auth.
 */
export async function loginAction(formData: FormData): Promise<AuthResult> {
  try {
    const rawPolice = String(formData.get("police_number") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const policeNumber = normalizePoliceNumber(rawPolice);

    if (!policeNumber) return { error: "Nomor polisi wajib diisi." };
    if (!password) return { error: "Password wajib diisi." };

    const supabase = await getSupabaseAuth();

    // Cari akun berdasarkan nomor polisi (service role: lookup publik saat
    // pre-auth, anon RLS tidak boleh membaca profil user lain).
    // Email Auth bersifat sintetis per plat; email asli (untuk OTP) ada di
    // user_profiles.email.
    const admin = await getSupabaseAdmin();
    const { data: profile, error: lookupError } = await admin
      .from("user_profiles")
      .select("email, verified_at")
      .eq("police_number", policeNumber)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!profile) {
      return { error: "Nomor polisi atau password salah." };
    }
    if (!profile.verified_at) {
      return {
        error:
          "Email belum diverifikasi. Selesaikan verifikasi terlebih dahulu.",
      };
    }

    // Login memakai email sintetis per plat (bukan email asli), karena email
    // asli hanya untuk OTP dan boleh dipakai beberapa plat.
    const authEmail = `${policeNumber.toLowerCase()}@vehicles.servistracker.com`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (signInError) throw signInError;

    revalidatePath("/");
    return { userId: "", needsOtp: false };
  } catch (err) {
    return { error: mapError(err) };
  }
}

/**
 * KELUAR.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await getSupabaseAuth();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/masuk");
}

/**
 * Kirim ulang OTP email (6-digit, milik kita).
 */
export async function resendOtpAction(
  email: string
): Promise<{ error?: string }> {
  try {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { error: "Email wajib diisi." };
    await issueOtp(normalized, "signup");
    return {};
  } catch (err) {
    return { error: mapError(err) };
  }
}
