import "server-only";
import * as nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error(
      "Pengiriman email belum dikonfigurasi. Isi SMTP_USER dan SMTP_PASS."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Kirim kode OTP 6-digit ke email.
 *
 * Mengembalikan true jika email benar-benar terkirim. Jika gagal, lempar
 * Error dengan pesan user-facing (AGENTS.md section 33).
 *
 * Catatan deliverability: dikirim PLAIN-TEXT saja, tanpa HTML. Email HTML
 * generik + kode 6-digit dari akun pengirim baru mudah ditandai sebagai
 * phishing oleh Gmail (terbukti masuk spam). Plain-text diperlakukan
 * sebagai email personal.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const user = process.env.SMTP_USER;
  if (!user) {
    throw new Error("Pengiriman email belum dikonfigurasi.");
  }

  const transport = getTransporter();

  await transport.sendMail({
    from: `"Servis Tracker" <${user}>`,
    to: email,
    subject: "Kode Servis Tracker",
    replyTo: user,
    text: [
      `Kode daftar Anda: ${code}`,
      "",
      "Berlaku 10 menit.",
      "Abaikan email ini jika Anda tidak mendaftar.",
    ].join("\n"),
  });
}
