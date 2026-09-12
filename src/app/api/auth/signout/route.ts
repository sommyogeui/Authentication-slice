import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json(
      {
        success: true,
        message: "Signed out successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[Sign Out Error]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "An unexpected error occurred during sign out." },
      { status: 500 }
    );
  }
}
