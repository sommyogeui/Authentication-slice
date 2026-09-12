import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/session";
import VerifyEmailPrompt from "@/components/verify-email-prompt";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server-authoritative session check
  const user = await getCurrentUser();

  // If no valid session exists, redirect to sign in
  if (!user) {
    redirect("/signin");
  }

  async function handleSignOut() {
    "use server";
    await destroySession();
    redirect("/signin");
  }

  // If email is not verified, show the inline verification prompt and
  // kick off a background verification-email send.
  if (!user.emailVerified) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <VerifyEmailPrompt email={user.email} />
          <form action={handleSignOut} className={styles.form}>
            <button type="submit" className={styles.signOutButton}>
              Sign Out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>
          <span>✓</span> Authenticated Session Active
        </div>

        <h1 className={styles.title}>
          Welcome, <span className={styles.userName}>{user.name}</span>
        </h1>

        <p className={styles.text}>
          You are securely signed in to the StudyFlow dashboard.
        </p>

        <form action={handleSignOut} className={styles.form}>
          <button type="submit" className={styles.signOutButton}>
            Sign Out
          </button>
        </form>
      </div>
    </main>
  );
}
