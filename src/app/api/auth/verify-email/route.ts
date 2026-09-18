import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyEmailSchema } from "@/validation/auth";
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
      `verify-email:${ip}`,
      RATE_LIMIT_THRESHOLDS.VERIFY_EMAIL
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Payload using Zod
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;

    // 3. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or verification code." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. You can sign in.", alreadyVerified: true },
        { status: 200 }
      );
    }

    // 4. Find the Most Recent Verification Code for User
    const latestVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestVerification) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // 5. Server-Authoritative Expiry Check (Never trust client timer)
    const now = new Date();
    if (latestVerification.expiresAt < now) {
      return NextResponse.json(
        {
          error: "Verification code has expired. Please request a new code.",
          codeExpired: true,
        },
        { status: 400 }
      );
    }

    // 6. Verify Code Match
    if (latestVerification.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // 7. Update User as Verified in Database
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // 8. Establish Authenticated Session
    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Email successfully verified. You are now signed in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[Email Verification Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}
