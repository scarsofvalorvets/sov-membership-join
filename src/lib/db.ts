import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client with a driver adapter chosen from DATABASE_URL:
 *   file:./dev.db          -> SQLite via libSQL (local dev)
 *   postgres(ql)://...     -> Postgres via node-postgres (production)
 * The adapter must match `provider` in prisma/schema.prisma (see README).
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const adapter = /^postgres(ql)?:\/\//.test(url)
    ? new PrismaPg({ connectionString: url })
    : new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
