"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { signInSchema, SignInInput } from "@/validation/auth";
import PasswordInput from "@/components/password-input";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignInInput>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlur = (
    field: keyof SignInInput,
    value: string,
    label: string
  ) => {
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

    // Client-side mirror validation
    const validation = signInSchema.safeParse(formData);
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification && data.email) {
          router.push(
            `/verify-email?email=${encodeURIComponent(data.email)}`
          );
          return;
        }

        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "Sign in failed.");
        }
        return;
      }

      // Success: browser now holds the HttpOnly session cookie
      router.push("/dashboard");
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
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Welcome back to your study space</p>
      </div>

      {generalError && (
        <div className={styles.alertError} role="alert">
          {generalError}
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
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            onBlur={() => handleBlur("email", formData.email, "Email Address")}
            disabled={isSubmitting}
          />
          {fieldErrors.email && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.email[0]}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className={styles.link} style={{ fontSize: "0.8125rem" }}>
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={(password) =>
              setFormData((prev) => ({ ...prev, password }))
            }
            onBlur={() => handleBlur("password", formData.password, "Password")}
            autoComplete="current-password"
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
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className={styles.links}>
        <span className={styles.subtitle}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={styles.link}>
            Create account
          </Link>
        </span>
      </div>
    </div>
  );
}
