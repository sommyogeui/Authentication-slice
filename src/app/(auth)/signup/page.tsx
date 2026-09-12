"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";
import { signUpSchema, SignUpInput } from "@/validation/auth";
import PasswordInput from "@/components/password-input";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpInput>({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [filledFields, setFilledFields] = useState<
    Partial<Record<keyof SignUpInput, boolean>>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation checklist
  const passwordCriteria = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
    { label: "One lowercase letter", met: /[a-z]/.test(formData.password) },
    { label: "One number", met: /[0-9]/.test(formData.password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const NAME_ONLY_LETTERS = /^[A-Za-z\s]+$/;
  const NAME_TWO_OR_MORE_WORDS = /^[A-Za-z]+(?:\s+[A-Za-z]+)+$/;

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        if (!NAME_ONLY_LETTERS.test(value)) {
          next.name = ["Full Name Must Use Only Letters"];
        } else if (!NAME_TWO_OR_MORE_WORDS.test(value.trim())) {
          next.name = ["Full Name Must Include A First And Last Name"];
        } else {
          delete next.name;
        }
      } else {
        delete next.name;
      }
      return next;
    });
  };

  const handleEmailChange = (value: string) => {
    setFormData((prev) => ({ ...prev, email: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value.length > 0 && !/@\S/.test(value)) {
        next.email = ["Enter A Valid Email Address"];
      } else {
        delete next.email;
      }
      return next;
    });
  };

  const clearFieldError = (
    prev: Record<string, string[]>,
    key: string
  ): Record<string, string[]> => {
    const next = { ...prev };
    delete next[key];
    return next;
  };

  const handleBlur = (
    field: keyof SignUpInput,
    value: string,
    label: string
  ) => {
    const trimmed = value.trimEnd();
    if (trimmed !== value) {
      setFormData((prev) => ({ ...prev, [field]: trimmed }));
    }

    let isValid = Boolean(trimmed);
    if (!trimmed) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: [`${label} field Cannot Be Empty`],
      }));
    } else if (field === "email") {
      isValid = /@\S/.test(trimmed);
      setFieldErrors((prev) =>
        isValid
          ? clearFieldError(prev, "email")
          : { ...prev, email: ["Enter A Valid Email Address"] }
      );
    } else if (field === "name") {
      if (!NAME_ONLY_LETTERS.test(trimmed)) {
        isValid = false;
        setFieldErrors((prev) => ({
          ...prev,
          name: ["Full Name Must Use Only Letters"],
        }));
      } else if (!NAME_TWO_OR_MORE_WORDS.test(trimmed)) {
        isValid = false;
        setFieldErrors((prev) => ({
          ...prev,
          name: ["Full Name Must Include A First And Last Name"],
        }));
      } else {
        setFieldErrors((prev) => clearFieldError(prev, "name"));
      }
    } else {
      setFieldErrors((prev) => clearFieldError(prev, field));
    }

    setFilledFields((prev) => ({ ...prev, [field]: isValid }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setGeneralError(null);

    // Client-side validation mirror
    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setGeneralError(data.error || "An error occurred during registration.");
        }
        return;
      }

      // Success: redirect to email verification page with prefilled email
      router.push(`/verify-email?email=${encodeURIComponent(validation.data.email)}`);
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
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start your focused learning journey</p>
      </div>

      {generalError && (
        <div className={styles.alertError} role="alert">
          {generalError}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className={`${styles.input} ${
              fieldErrors.name ? styles.inputError : ""
            } ${filledFields.name ? styles.inputFilled : ""}`}
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => handleBlur("name", formData.name, "Full Name")}
            disabled={isSubmitting}
          />
          {fieldErrors.name && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.name[0]}
            </span>
          )}
        </div>

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
            } ${filledFields.email ? styles.inputFilled : ""}`}
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
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
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={(password) =>
              setFormData((prev) => ({ ...prev, password }))
            }
            onBlur={() => handleBlur("password", formData.password, "Password")}
            autoComplete="new-password"
            className={`${styles.input} ${
              fieldErrors.password ? styles.inputError : ""
            } ${filledFields.password ? styles.inputFilled : ""}`}
            disabled={isSubmitting}
          />
          {fieldErrors.password && (
            <span className={styles.errorText} role="alert">
              {fieldErrors.password[0]}
            </span>
          )}

          {formData.password.length > 0 &&
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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className={styles.links}>
        <span className={styles.subtitle}>
          Already have an account?{" "}
          <Link href="/signin" className={styles.link}>
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}
