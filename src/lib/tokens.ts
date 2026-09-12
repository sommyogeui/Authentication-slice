import crypto from "crypto";

// Expiration lifetimes
export const VERIFICATION_CODE_EXPIRY_MINUTES = 6;
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generates a cryptographically random 6-digit numeric email verification code.
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Generates an opaque, cryptographically random 256-bit (64 hex characters) token
 * for single-use password resets or session identifiers.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculates a future Date based on minutes from now.
 */
export function getExpiryDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
