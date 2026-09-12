import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { generateSecureToken } from "@/lib/tokens";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "studyflow_session";

// 7 days in seconds
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Creates a server-side session in PostgreSQL via Prisma.
 * Generates an opaque cryptographically random session identifier
 * and sets it as an HttpOnly, Secure, SameSite=Lax cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
  });

  return sessionId;
}

/**
 * Retrieves the currently authenticated user from the server-side session.
 * Checks cookie -> queries PostgreSQL -> verifies expiration.
 * Never returns sensitive fields like password hashes.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check expiration server-side
    if (session.expiresAt < new Date()) {
      // Session expired: purge record and clear cookie
      await prisma.session.deleteMany({ where: { id: sessionId } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

/**
 * Terminates the active session by removing it from PostgreSQL
 * and clearing the HttpOnly cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      await prisma.session.deleteMany({
        where: { id: sessionId },
      });
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch {
    // Ignore errors during destroy
  }
}


