import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/validation/auth";
import {
  generateSecureToken,
  getExpiryDate,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_THRESHOLDS,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(
      `forgot-password:${ip}`,
      RATE_LIMIT_THRESHOLDS.FORGOT_PASSWORD
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many password reset requests. Please try again later.",
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

    const validation = forgotPasswordSchema.safeParse(body);
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

    // 3. User Lookup
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return neutral response to prevent account enumeration
    const neutralResponse = {
      success: true,
      message:
        "If an account exists with this email address, a password reset link has been sent.",
    };

    if (!user) {
      return NextResponse.json(neutralResponse, { status: 200 });
    }

    // 4. Generate Reset Token & Persist Single-Use State
    const token = generateSecureToken();
    const expiresAt = getExpiryDate(PASSWORD_RESET_EXPIRY_MINUTES);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        usedAt: null,
      },
    });

    // 5. Construct Reset URL & Deliver via Nodemailer
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
    if (!emailResult.success) {
      // Log the failure server-side only. The neutral response is intentionally
      // preserved to prevent account enumeration — never disclose SMTP errors to the client.
      console.error(
        "[Forgot Password] SMTP delivery failed for userId:",
        user.id,
        "—",
        emailResult.error ?? "unknown error"
      );
    }

    return NextResponse.json(neutralResponse, { status: 200 });
  } catch (error) {
    console.error(
      "[Forgot Password Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred processing your request." },
      { status: 500 }
    );
  }
}
