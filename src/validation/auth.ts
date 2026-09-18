// Zod validation schemas for the StudyFlow authentication slice.
//
// Single source of validation truth for all authentication inputs.
// Server-side endpoints validate against these schemas before executing logic.
// Client forms mirror these schemas to provide immediate inline feedback.

import { z } from "zod";

// Shared password schema enforcing assessment security rules
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// FR-01: Account creation
// Full name must contain at least two words (first name + last name).
// Accepts three or more words (first, middle, last) and collapses any
// internal whitespace runs to single spaces.
export const fullNameSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z]+(?:\s+[A-Za-z]+)+$/,
    "Full name must include at least a first and last name"
  )
  .max(100, "Name cannot exceed 100 characters")
  .transform((name) => name.replace(/\s+/g, " "));

export const signUpSchema = z.object({
  name: fullNameSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: passwordSchema,
});

// FR-06: Sign in
// Note: password is intentionally validated with only a non-empty check here.
// Applying the full passwordSchema (uppercase, number, special char rules) would
// incorrectly reject existing passwords that pre-date any future rule changes.
// The server uses bcrypt.compare against the stored hash — structural rules are
// irrelevant at the verification stage.
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// FR-05: Email verification code submission
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

// FR-05: Verification code resend request
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
});

// FR-08: Forgot password request (initiates the password-reset flow)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
});

// FR-08: Password reset submission
export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
