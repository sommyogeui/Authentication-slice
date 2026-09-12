import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/validation/auth";
import { hashPassword } from "@/lib/password";
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
      `reset-password:${ip}`,
      RATE_LIMIT_THRESHOLDS.RESET_PASSWORD
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many password reset attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    // 2. Zod Validation (token, password rules, password confirmation match)
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // 2. Retrieve Token from PostgreSQL
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    // 3. Enforce Single-Use Token Invariant
    if (resetRecord.usedAt !== null) {
      return NextResponse.json(
        {
          error:
            "This password reset link has already been used. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 4. Enforce Server-Side Expiration
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            "This password reset link has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 5. Hash New Password with bcrypt (never plaintext)
    const newPasswordHash = await hashPassword(password);

    // 6. Execute Atomic State Transition:
    // Update password hash, mark token as used (single-use), and revoke existing sessions
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.session.deleteMany({
        where: { userId: resetRecord.userId },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your password has been successfully reset. You may now sign in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[Reset Password Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during password reset." },
      { status: 500 }
    );
  }
}
