import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resendVerificationSchema } from "@/validation/auth";
import {
  generateVerificationCode,
  getExpiryDate,
  VERIFICATION_CODE_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/tokens";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_THRESHOLDS,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 1. General Rate Limiting
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(
      `resend:${ip}`,
      RATE_LIMIT_THRESHOLDS.RESEND_VERIFICATION
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many resend attempts. Please try again later.",
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ),
        },
        { status: 429 }
      );
    }

    // 2. Validate Payload
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = resendVerificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 3. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found, don't disclose existence, respond with neutral success
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an unverified account exists with this email, a new code has been sent.",
        },
        { status: 200 }
      );
    }

    // Return a neutral response for already-verified accounts to avoid
    // confirming whether a specific email address belongs to a verified account.
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an unverified account exists with this email, a new code has been sent.",
        },
        { status: 200 }
      );
    }

    // 4. Server-Side Resend Cooldown Enforcement
    const latestVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    if (latestVerification) {
      const elapsedSeconds =
        (now.getTime() - latestVerification.createdAt.getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const remainingCooldown = Math.ceil(
          RESEND_COOLDOWN_SECONDS - elapsedSeconds
        );
        return NextResponse.json(
          {
            error: `Please wait ${remainingCooldown} seconds before requesting a new code.`,
            cooldownRemaining: remainingCooldown,
          },
          { status: 429 }
        );
      }
    }

    // 5. Generate New Code & Persist New State
    const newCode = generateVerificationCode();
    const expiresAt = getExpiryDate(VERIFICATION_CODE_EXPIRY_MINUTES);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: newCode,
        expiresAt,
      },
    });

    // 6. Deliver Code via Nodemailer
    const emailResult = await sendVerificationCodeEmail(user.email, newCode);
    if (!emailResult.success) {
      console.error(
        "[Resend Code] Verification email delivery failed for userId:",
        user.id,
        "—",
        emailResult.error ?? "unknown error"
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "A new verification code has been sent to your email.",
        // Return the server-authoritative cooldown so the client does not
        // need to hardcode a separate value that could drift from tokens.ts.
        cooldownRemaining: RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[Resend Code Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred while resending the code." },
      { status: 500 }
    );
  }
}
