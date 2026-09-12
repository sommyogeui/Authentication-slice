import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/validation/auth";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_THRESHOLDS,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 1. Server-Side Rate Limiting
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(
      `signin:${ip}`,
      RATE_LIMIT_THRESHOLDS.SIGN_IN
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many sign-in attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    // 2. Validate Payload with Zod
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = signInSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 3. Look up User in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Use generic error to avoid account enumeration
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Verify Password with bcrypt
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Check Email Verification Status
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Your email has not been verified yet. Please verify your email first.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // 6. Create Authenticated Session
    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Signed in successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[Sign In Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
