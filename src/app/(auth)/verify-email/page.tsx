"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { verifyEmailSchema } from "@/validation/auth";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Informational frontend countdown for resend cooldown (server remains authoritative)
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleBlur = (field: string, value: string, label: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        delete next[field];
      } else {
        next[field] = [`${label} field Cannot Be Empty`];
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

    const validation = verifyEmailSchema.safeParse({ email, code });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "Verification failed.");
        }
        return;
      }

      setSuccessMessage("Email verified! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setGeneralError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending || !email) return;

    setGeneralError(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
        setGeneralError(data.error || "Failed to resend verification code.");
        return;
      }

      setSuccessMessage(data.message || "A new code has been sent.");
      setCooldown(60);
    } catch {
      setGeneralError("Unable to connect to the server to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.brand}>StudyFlow</div>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.subtitle}>
          We sent a verification code to your email address
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
            required
            className={`${styles.input} ${
              fieldErrors.email ? styles.inputError : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email", email, "Email Address")}
            disabled={isSubmitting}
          />
          {fieldErrors.email && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.email[0]}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="code">
            Verification Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter your 6-digit code"
            autoComplete="one-time-code"
            required
            className={`${styles.input} ${
              fieldErrors.code ? styles.inputError : ""
            }`}
            style={{
              textAlign: "center",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.trim().replace(/[^\d]/g, ""))
            }
            onBlur={() => handleBlur("code", code, "Verification Code")}
            disabled={isSubmitting}
          />
          {fieldErrors.code && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.code[0]}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className={styles.secondaryButton}
          disabled={cooldown > 0 || isResending || !email}
        >
          {isResending
            ? "Sending..."
            : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend Verification Code"}
        </button>
      </form>

      <div className={styles.links}>
        <span className={styles.subtitle}>
          Already verified?{" "}
          <Link href="/signin" className={styles.link}>
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.card}>
          <p className={styles.subtitle}>Loading verification form...</p>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
