"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { resetPasswordSchema } from "@/validation/auth";
import PasswordInput from "@/components/password-input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordCriteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!token) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brand}>StudyFlow</div>
          <h1 className={styles.title}>Invalid Link</h1>
          <p className={styles.subtitle}>
            This password reset link is missing a valid token.
          </p>
        </div>
        <div className={styles.links}>
          <Link href="/forgot-password" className={styles.link}>
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

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

    const validation = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "Password reset failed.");
        }
        return;
      }

      setSuccessMessage(
        "Password successfully reset! Redirecting to sign in..."
      );
      setTimeout(() => {
        router.push("/signin");
      }, 1500);
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
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>Choose a strong new password</p>
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
          <label className={styles.label} htmlFor="password">
            New Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={setPassword}
            onBlur={() => handleBlur("password", password, "New Password")}
            autoComplete="new-password"
            className={`${styles.input} ${
              fieldErrors.password ? styles.inputError : ""
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.password && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.password[0]}
            </span>
          )}

          {password.length > 0 &&
            passwordCriteria.some((c) => !c.met) && (
              <ul
                className={styles.passwordList}
                aria-label="Password requirements"
              >
                {passwordCriteria
                  .filter((c) => !c.met)
                  .map((c) => (
                    <li key={c.label} className={styles.requirementUnmet}>
                      • {c.label}
                    </li>
                  ))}
              </ul>
            )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            onBlur={() =>
              handleBlur(
                "confirmPassword",
                confirmPassword,
                "Confirm New Password"
              )
            }
            autoComplete="new-password"
            className={`${styles.input} ${
              fieldErrors.confirmPassword ? styles.inputError : ""
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.confirmPassword && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.confirmPassword[0]}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting password..." : "Reset Password"}
        </button>
      </form>

      <div className={styles.links}>
        <span className={styles.subtitle}>
          Back to{" "}
          <Link href="/signin" className={styles.link}>
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.card}>
          <p className={styles.subtitle}>Loading reset form...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
