"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";
import { forgotPasswordSchema } from "@/validation/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlur = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (email.trim()) {
        delete next.email;
      } else {
        next.email = ["Email Address field Cannot Be Empty"];
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "Failed to process request.");
        }
        return;
      }

      setSuccessMessage(
        data.message ||
          "If an account exists with this email address, a password reset link has been sent."
      );
    } catch {
      setGeneralError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.brand}>StudyFlow</div>
        <h1 className={styles.title}>Forgot password</h1>
        <p className={styles.subtitle}>
          Enter your email to receive a password reset link
        </p>
      </div>

      {generalError && (
        <div className={styles.alertError} role="alert">
          {generalError}
        </div>
      )}

      {successMessage && (
        <div className={styles.alertSuccess} role="status">
          {successMessage}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`${styles.input} ${
              fieldErrors.email ? styles.inputError : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            disabled={isSubmitting}
          />
          {fieldErrors.email && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.email[0]}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending link..." : "Send Reset Link"}
        </button>
      </form>

      <div className={styles.links}>
        <span className={styles.subtitle}>
          Remember your password?{" "}
          <Link href="/signin" className={styles.link}>
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}
