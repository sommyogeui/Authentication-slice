// Prisma client singleton for the StudyFlow authentication slice.
//
// A single PrismaClient instance is reused across the application to avoid
// exhausting database connections, especially in Next.js development where
// hot-reloading would otherwise create a new client on every module reload.
//
// The global variable ensures the singleton survives hot-reloads in development.
// In production, the module is loaded once and prisma is used directly.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
