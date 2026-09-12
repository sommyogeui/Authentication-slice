import nodemailer, { type Transporter } from "nodemailer";
import {
  VERIFICATION_CODE_EXPIRY_MINUTES,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from "@/lib/tokens";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || "StudyFlow <no-reply@studyflow.dev>";

let transporter: Transporter | null = null;

if (smtpHost) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    // Development SMTP servers (MailHog, smtp4dev) commonly use self-signed
    // certificates, which would otherwise raise an "unable to verify the
    // first certificate" error. Relax verification only outside production.
    tls:
      process.env.NODE_ENV !== "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

async function sendMail(
  to: string,
  subject: string,
  html: string,
  devLog: string
): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    console.info(`[Email Service (Dev)] ${devLog}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to deliver email";
    console.error("[Email Delivery Error]:", message);
    return { success: false, error: message };
  }
}

/**
 * Sends a verification code via Nodemailer.
 * Falls back safely to the server console in local development when no SMTP
 * host is configured.
 */
export async function sendVerificationCodeEmail(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const subject = "Your StudyFlow Verification Code";
  const html = `
    <div style="font-family: Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E6E0E9; border-radius: 12px; background-color: #FEF7FF;">
      <h2 style="color: #6750A4; margin-bottom: 16px;">Welcome to StudyFlow</h2>
      <p style="font-size: 16px; color: #1D1B20; line-height: 1.5;">Thank you for creating an account. Please use the following verification code to confirm your email address:</p>
      <div style="background-color: #EADDFF; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0; font-family: monospace; word-break: break-all;">
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #21005D;">${code}</span>
      </div>
      <p style="font-size: 14px; color: #49454F;">This code will expire in ${VERIFICATION_CODE_EXPIRY_MINUTES} minutes. If you did not request this account, please ignore this email.</p>
    </div>
  `;
  return sendMail(to, subject, html, `Verification code for ${to}: ${code}`);
}

/**
 * Sends a password reset link via Nodemailer.
 * Falls back safely to the server console in local development when no SMTP
 * host is configured.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const subject = "Reset Your StudyFlow Password";
  const html = `
    <div style="font-family: Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E6E0E9; border-radius: 12px; background-color: #FEF7FF;">
      <h2 style="color: #6750A4; margin-bottom: 16px;">StudyFlow Password Reset</h2>
      <p style="font-size: 16px; color: #1D1B20; line-height: 1.5;">We received a request to reset your password. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #6750A4; color: #FFFFFF; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: 500; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #49454F;">This link is single-use and will expire in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
      <p style="font-size: 14px; color: #79747E; word-break: break-all;">If the button above does not work, copy and paste this URL into your browser:<br/>${resetUrl}</p>
    </div>
  `;
  return sendMail(to, subject, html, `Reset link for ${to}: ${resetUrl}`);
}