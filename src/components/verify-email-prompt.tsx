"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import authStyles from "@/app/(auth)/auth.module.css";
import dashStyles from "@/app/dashboard/dashboard.module.css";
import { verifyEmailSchema } from "@/validation/auth";

export default function VerifyEmailPrompt({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Sending your verification code..."
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const didAutoSend = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = useCallback(async () => {
    setIsSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemaining && data.cooldownRemaining > 0) {
          setCooldown(data.cooldownRemaining);
        }
        setStatusMessage(null);
        setErrorMessage(data.error || "Failed to send the verification code.");
        return;
      }

      setStatusMessage(
        data.message || "A new verification code has been sent to your email."
      );
      setCooldown(60);
    } catch {
      setStatusMessage(null);
      setErrorMessage("Unable to reach the server. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [email]);

  // Background send: fires automatically as soon as the dashboard loads.
  useEffect(() => {
    if (didAutoSend.current) return;
    didAutoSend.current = true;
    sendCode();
  }, [sendCode]);

  const handleBlur = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (code.trim()) {
        delete next.code;
      } else {
        next.code = ["Verification Code field Cannot Be Empty"];
      }
      return next;
    });
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isVerifying) return;

    setFieldErrors({});
    setErrorMessage(null);

    const validation = verifyEmailSchema.safeParse({ email, code });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsVerifying(true);
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
          setErrorMessage(data.error || "Verification failed.");
        }
        return;
      }

      setStatusMessage("Email verified successfully!");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div>
      <div className={dashStyles.badge}>
        <span>✉</span> Email Verification Required
      </div>

      <h1 className={dashStyles.title}>Verify your email</h1>
      <p className={authStyles.subtitle}>
        We emailed a verification code to <strong>{email}</strong>. Enter the
        code below to activate your account.
      </p>

      {statusMessage && (
        <div className={authStyles.alertSuccess} role="status">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className={authStyles.alertError} role="alert">
          {errorMessage}
        </div>
      )}

      <form className={authStyles.form} onSubmit={handleVerify} noValidate>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="verify-code">
            Verification Code
          </label>
          <input
            id="verify-code"
            name="code"
            type="text"
            maxLength={64}
            placeholder="Paste your verification code"
            autoComplete="one-time-code"
            required
            className={`${authStyles.input} ${
              fieldErrors.code ? authStyles.inputError : ""
            }`}
            style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            onBlur={handleBlur}
            disabled={isVerifying}
          />
          {fieldErrors.code && (
            <span className={authStyles.errorText} role="alert">
              {fieldErrors.code[0]}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={authStyles.submitButton}
          disabled={isVerifying}
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
        </button>

        <button
          type="button"
          className={authStyles.secondaryButton}
          onClick={sendCode}
          disabled={cooldown > 0 || isSending}
        >
          {isSending
            ? "Sending..."
            : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend Verification Code"}
        </button>
      </form>
    </div>
  );
}