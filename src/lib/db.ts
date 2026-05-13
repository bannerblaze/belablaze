import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// pg-connection-string warns when sslmode is 'prefer'|'require'|'verify-ca' because
// pg v9 will change their semantics. These are currently aliases for 'verify-full',
// so we normalise to the explicit value to silence the warning without any behaviour change.
function resolveConnectionString(): string {
  const raw = process.env.DATABASE_URL!;
  try {
    const u = new URL(raw);
    const mode = u.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      u.searchParams.set("sslmode", "verify-full");
      return u.toString();
    }
  } catch {
    // not a parseable URL — return as-is
  }
  return raw;
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
