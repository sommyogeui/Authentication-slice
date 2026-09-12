import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/validation/auth";
import { hashPassword } from "@/lib/password";
import {
  generateVerificationCode,
  getExpiryDate,
  VERIFICATION_CODE_EXPIRY_MINUTES,
} from "@/lib/tokens";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_THRESHOLDS,
} from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // 1. Enforce Server-Side Rate Limiting
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(
      `signup:${ip}`,
      RATE_LIMIT_THRESHOLDS.SIGN_UP
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many signup attempts. Please try again later.",
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

    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // 3. Pre-check existing account
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Hash Password using bcrypt (never plaintext)
    const passwordHash = await hashPassword(password);

    // 5. Generate Verification Code & Expiry
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = getExpiryDate(VERIFICATION_CODE_EXPIRY_MINUTES);

    // 6. Persist User and Verification Code in Transaction
    // Database unique constraint on User.email acts as final protection against race conditions
    let newUser;
    try {
      newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            emailVerified: false,
          },
        });

        await tx.emailVerification.create({
          data: {
            userId: user.id,
            code: verificationCode,
            expiresAt: codeExpiresAt,
          },
        });

        return user;
      });
    } catch (dbError: unknown) {
      // Prisma P2002: Unique constraint violation on email
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      throw dbError;
    }

    // 7. Deliver Verification Code via Nodemailer
    await sendVerificationCodeEmail(newUser.email, verificationCode);

    // 8. Return Success (no secrets, no code, no password hash exposed)
    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. Please check your email for the verification code.",
        email: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[Signup Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during signup." },
      { status: 500 }
    );
  }
}
