import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Typed as PrismaClient so model delegates (e.g. `gamePlayer`) always match the generated client. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
